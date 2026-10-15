import { requireOpenAIApiKey } from "../embeddings/embedding-config.mjs";
import { GenerationParseError } from "./errors.mjs";
import { resolveGenerationConfig } from "./generation-config.mjs";

export const OPENAI_CHAT_COMPLETIONS_URL =
  "https://api.openai.com/v1/chat/completions";

/** @typedef {typeof fetch} FetchFn */

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

/**
 * @param {Response} response
 * @returns {Promise<string>}
 */
async function readErrorBody(response) {
  try {
    const json = await response.json();
    if (json && typeof json.error?.message === "string") {
      return json.error.message;
    }
    return JSON.stringify(json);
  } catch {
    try {
      return await response.text();
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

  let attempt = 0;
  while (true) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), requestTimeoutMs);

    let response;
    try {
      response = await fetchFn(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
        },
        body,
        signal: controller.signal,
      });
    } catch (error) {
      clearTimeout(timeout);
      if (error instanceof Error && error.name === "AbortError") {
        throw new Error(
          `OpenAI chat request timed out after ${requestTimeoutMs}ms`,
        );
      }
      throw error;
    } finally {
      clearTimeout(timeout);
    }

    if (response.ok) {
      const payload = await response.json();
      const parsed = parseChatCompletionResponse(payload);

      if (parsed.finishReason === "length") {
        throw new GenerationParseError(
          "Model output exceeded max_output_tokens (finish_reason=length)",
          { finish_reason: parsed.finishReason },
        );
      }

      if (parsed.content.length > maxModelResponseJsonChars) {
        throw new GenerationParseError(
          `Model JSON response exceeds max size (${parsed.content.length} > ${maxModelResponseJsonChars} chars)`,
          { length: parsed.content.length, max: maxModelResponseJsonChars },
        );
      }

      return {
        content: parsed.content,
        usage: parsed.usage,
        finishReason: parsed.finishReason,
        model,
      };
    }

    const detail = await readErrorBody(response);
    const retryable = RETRYABLE_STATUS.has(response.status);
    if (!retryable || attempt >= maxRetries) {
      throw new Error(
        `OpenAI chat request failed (${response.status}): ${detail}`,
      );
    }

    const delayMs = baseRetryDelayMs * 2 ** attempt;
    await new Promise((resolve) => setTimeout(resolve, delayMs));
    attempt += 1;
  }
}
