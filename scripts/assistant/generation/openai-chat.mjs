import { requireOpenAIApiKey } from "../embeddings/embedding-config.mjs";
import { GenerationParseError } from "./errors.mjs";
import { resolveGenerationConfig } from "./generation-config.mjs";

export const OPENAI_CHAT_COMPLETIONS_URL =
  "https://api.openai.com/v1/chat/completions";

/** @typedef {typeof fetch} FetchFn */

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

/**
 * @template T
 * @param {Promise<T>} promise
 * @param {number} budgetMs
 * @param {number} requestTimeoutMs
 * @param {() => void} [onTimeout]
 * @returns {Promise<T>}
 */
function raceWithReadDeadline(promise, budgetMs, requestTimeoutMs, onTimeout) {
  return new Promise((resolve, reject) => {
    const timeoutId = setTimeout(() => {
      onTimeout?.();
      reject(
        new Error(`OpenAI chat request timed out after ${requestTimeoutMs}ms`),
      );
    }, budgetMs);

    promise.then(
      (value) => {
        clearTimeout(timeoutId);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeoutId);
        reject(error);
      },
    );
  });
}

/**
 * @param {Response} response
 */
function cancelResponseBody(response) {
  if (!response?.body || response.bodyUsed) {
    return;
  }
  try {
    const cancelResult = response.body.cancel();
    if (cancelResult && typeof cancelResult.then === "function") {
      cancelResult.catch(() => {
        // Body may already be locked by an in-flight reader.
      });
    }
  } catch {
    // Best-effort — body may already be consumed or locked.
  }
}

/**
 * End-to-end budget for one chat completion call (all attempts, retries, and body reads).
 *
 * @param {number} requestTimeoutMs
 */
export function createChatRequestDeadline(requestTimeoutMs) {
  const startedAt = Date.now();

  const remainingMs = () =>
    Math.max(0, requestTimeoutMs - (Date.now() - startedAt));

  const assertRemaining = () => {
    if (remainingMs() <= 0) {
      throw new Error(
        `OpenAI chat request timed out after ${requestTimeoutMs}ms`,
      );
    }
  };

  /** @type {AbortController | null} */
  let attemptController = null;
  /** @type {ReturnType<typeof setTimeout> | null} */
  let attemptAbortTimer = null;
  /** @type {Response | null} */
  let attemptResponse = null;

  const clearAttemptAbort = () => {
    if (attemptAbortTimer) {
      clearTimeout(attemptAbortTimer);
    }
    attemptAbortTimer = null;
    attemptController = null;
    attemptResponse = null;
  };

  const abortActiveAttempt = (response) => {
    attemptController?.abort();
    cancelResponseBody(response ?? attemptResponse);
  };

  const armAttemptAbort = () => {
    clearAttemptAbort();
    attemptController = new AbortController();
    const budgetMs = remainingMs();
    if (budgetMs <= 0) {
      attemptController.abort();
      return attemptController;
    }
    attemptAbortTimer = setTimeout(() => {
      abortActiveAttempt();
    }, budgetMs);
    return attemptController;
  };

  const finishAttempt = () => {
    if (attemptAbortTimer) {
      clearTimeout(attemptAbortTimer);
    }
    attemptAbortTimer = null;
    attemptController = null;
    attemptResponse = null;
  };

  const timeoutError = () =>
    new Error(`OpenAI chat request timed out after ${requestTimeoutMs}ms`);

  return {
    remainingMs,
    assertRemaining,
    /**
     * @param {number} ms
     */
    async sleep(ms) {
      assertRemaining();
      const waitMs = Math.min(ms, remainingMs());
      await new Promise((resolve) => setTimeout(resolve, waitMs));
      assertRemaining();
    },
    /**
     * @param {FetchFn} fetchFn
     * @param {string} url
     * @param {RequestInit} init
     */
    async fetch(fetchFn, url, init) {
      assertRemaining();
      const controller = armAttemptAbort();
      try {
        const response = await fetchFn(url, {
          ...init,
          signal: controller.signal,
        });
        attemptResponse = response;
        return response;
      } catch (error) {
        finishAttempt();
        if (error instanceof Error && error.name === "AbortError") {
          throw timeoutError();
        }
        throw error;
      }
    },
    /**
     * @param {Response} response
     */
    async readJson(response) {
      assertRemaining();
      const budgetMs = remainingMs();
      try {
        const payload = await raceWithReadDeadline(
          response.json(),
          budgetMs,
          requestTimeoutMs,
          () => abortActiveAttempt(response),
        );
        assertRemaining();
        return payload;
      } catch (error) {
        abortActiveAttempt(response);
        if (error instanceof Error && error.name === "AbortError") {
          throw timeoutError();
        }
        throw error;
      } finally {
        finishAttempt();
      }
    },
    /**
     * @param {Response} response
     */
    async readText(response) {
      assertRemaining();
      const budgetMs = remainingMs();
      try {
        const text = await raceWithReadDeadline(
          response.text(),
          budgetMs,
          requestTimeoutMs,
          () => abortActiveAttempt(response),
        );
        assertRemaining();
        return text;
      } catch (error) {
        abortActiveAttempt(response);
        if (error instanceof Error && error.name === "AbortError") {
          throw timeoutError();
        }
        throw error;
      } finally {
        finishAttempt();
      }
    },
  };
}

/**
 * @param {Response} response
 * @param {ReturnType<typeof createChatRequestDeadline>} deadline
 * @returns {Promise<string>}
 */
async function readErrorBody(response, deadline) {
  try {
    const json = await deadline.readJson(response);
    if (json && typeof json.error?.message === "string") {
      return json.error.message;
    }
    return JSON.stringify(json);
  } catch {
    try {
      return await deadline.readText(response);
    } catch {
      return response.statusText || "Unknown error";
    }
  }
}

/**
 * @param {unknown} payload
 * @returns {{ content: string, finishReason: string | null, usage: { prompt_tokens?: number, completion_tokens?: number, total_tokens?: number } }}
 */
export function parseChatCompletionResponse(payload) {
  if (!payload || typeof payload !== "object") {
    throw new GenerationParseError("OpenAI chat response was not an object");
  }

  const choices = /** @type {{ choices?: unknown }} */ (payload).choices;
  if (!Array.isArray(choices) || choices.length === 0) {
    throw new GenerationParseError("OpenAI chat response missing choices");
  }

  const first = choices[0];
  const message = first?.message;
  const content =
    message && typeof message.content === "string" ? message.content : "";
  const finishReason =
    typeof first?.finish_reason === "string" ? first.finish_reason : null;

  const usageRaw = /** @type {{ usage?: Record<string, unknown> }} */ (payload)
    .usage;
  const usage = {
    prompt_tokens:
      typeof usageRaw?.prompt_tokens === "number"
        ? usageRaw.prompt_tokens
        : undefined,
    completion_tokens:
      typeof usageRaw?.completion_tokens === "number"
        ? usageRaw.completion_tokens
        : undefined,
    total_tokens:
      typeof usageRaw?.total_tokens === "number"
        ? usageRaw.total_tokens
        : undefined,
  };

  return { content, finishReason, usage };
}

/**
 * @param {{
 *   system: string,
 *   user: string,
 *   model?: string,
 *   maxOutputTokens?: number,
 *   requestTimeoutMs?: number,
 *   maxModelResponseJsonChars?: number,
 *   apiKey?: string,
 *   fetch?: FetchFn,
 *   url?: string,
 *   maxRetries?: number,
 *   baseRetryDelayMs?: number,
 * }} options
 * @returns {Promise<{ content: string, usage: ReturnType<typeof parseChatCompletionResponse>['usage'], finishReason: string | null, model: string }>}
 */
export async function requestChatCompletionJson(options) {
  const resolved = resolveGenerationConfig();
  const apiKey = options.apiKey ?? requireOpenAIApiKey();
  const model = options.model ?? resolved.model;
  const maxOutputTokens = options.maxOutputTokens ?? resolved.maxOutputTokens;
  const requestTimeoutMs =
    options.requestTimeoutMs ?? resolved.requestTimeoutMs;
  const maxModelResponseJsonChars =
    options.maxModelResponseJsonChars ?? resolved.maxModelResponseJsonChars;
  const fetchFn = options.fetch ?? globalThis.fetch;

  if (typeof fetchFn !== "function") {
    throw new Error("fetch is not available; pass options.fetch");
  }

  const body = JSON.stringify({
    model,
    messages: [
      { role: "system", content: options.system },
      { role: "user", content: options.user },
    ],
    response_format: { type: "json_object" },
    max_tokens: maxOutputTokens,
    temperature: 0.2,
  });

  const url = options.url ?? OPENAI_CHAT_COMPLETIONS_URL;
  const maxRetries = options.maxRetries ?? 3;
  const baseRetryDelayMs = options.baseRetryDelayMs ?? 200;

  const deadline = createChatRequestDeadline(requestTimeoutMs);

  let attempt = 0;
  while (true) {
    const response = await deadline.fetch(fetchFn, url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body,
    });

    if (response.ok) {
      const payload = await deadline.readJson(response);
      const parsed = parseChatCompletionResponse(payload);

      if (parsed.finishReason === "length") {
        throw new GenerationParseError(
          "Model output exceeded max_output_tokens (finish_reason=length)",
          {
            failure_category: "output_truncated",
            finish_reason: parsed.finishReason,
            max_output_tokens: maxOutputTokens,
            completion_tokens: parsed.usage.completion_tokens,
          },
        );
      }

      if (parsed.content.length > maxModelResponseJsonChars) {
        throw new GenerationParseError(
          `Model JSON response exceeds max size (${parsed.content.length} > ${maxModelResponseJsonChars} chars)`,
          {
            failure_category: "output_too_large",
            length: parsed.content.length,
            max: maxModelResponseJsonChars,
            max_output_tokens: maxOutputTokens,
          },
        );
      }

      return {
        content: parsed.content,
        usage: parsed.usage,
        finishReason: parsed.finishReason,
        model,
      };
    }

    const detail = await readErrorBody(response, deadline);
    const retryable = RETRYABLE_STATUS.has(response.status);
    if (!retryable || attempt >= maxRetries) {
      throw new Error(
        `OpenAI chat request failed (${response.status}): ${detail}`,
      );
    }

    const delayMs = baseRetryDelayMs * 2 ** attempt;
    await deadline.sleep(delayMs);
    attempt += 1;
  }
}
