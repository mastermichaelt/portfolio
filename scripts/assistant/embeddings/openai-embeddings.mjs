import {
  DEFAULT_EMBEDDING_BATCH_SIZE,
  EXPECTED_EMBEDDING_DIMENSIONS,
  OPENAI_EMBEDDINGS_URL,
  assertEmbeddingDimensions,
  validateEmbeddingModel,
} from "./index-config.mjs";
import {
  requireOpenAIApiKey,
  resolveEmbeddingConfig,
} from "./embedding-config.mjs";

/** @typedef {typeof fetch} FetchFn */

/** @typedef {(ms: number) => Promise<void>} SleepFn */

const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);

/**
 * @param {string[]} texts
 * @param {number} size
 * @returns {string[][]}
 */
export function chunkTexts(texts, size) {
  if (size < 1) {
    throw new Error(`batch size must be at least 1, received ${size}`);
  }
  const batches = [];
  for (let i = 0; i < texts.length; i += size) {
    batches.push(texts.slice(i, i + size));
  }
  return batches;
}

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
 * @param {number} expectedCount
 * @returns {number[][]}
 */
export function parseEmbeddingsResponse(payload, expectedCount) {
  if (!payload || typeof payload !== "object") {
    throw new Error("OpenAI embeddings response was not an object");
  }
  const data = /** @type {{ data?: unknown }} */ (payload).data;
  if (!Array.isArray(data)) {
    throw new Error("OpenAI embeddings response missing data array");
  }
  if (data.length !== expectedCount) {
    throw new Error(
      `OpenAI embeddings response returned ${data.length} vectors, expected ${expectedCount}`,
    );
  }

  const sorted = [...data].sort((a, b) => {
    const ai = Number(a?.index ?? 0);
    const bi = Number(b?.index ?? 0);
    return ai - bi;
  });

  return sorted.map((item, index) => {
    const embedding = item?.embedding;
    if (!Array.isArray(embedding)) {
      throw new Error(
        `OpenAI embeddings response item ${index} missing embedding array`,
      );
    }
    return assertEmbeddingDimensions(
      embedding.map((value) => Number(value)),
      `OpenAI embeddings response item ${index}`,
    );
  });
}

/**
 * @param {{
 *   input: string[],
 *   model: string,
 *   apiKey: string,
 *   fetch: FetchFn,
 *   url?: string,
 *   maxRetries?: number,
 *   baseRetryDelayMs?: number,
 *   sleep?: SleepFn,
 * }} options
 * @returns {Promise<number[][]>}
 */
export async function requestEmbeddingsBatch(options) {
  const {
    input,
    model,
    apiKey,
    fetch: fetchFn,
    url = OPENAI_EMBEDDINGS_URL,
    maxRetries = 3,
    baseRetryDelayMs = 200,
    sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  } = options;

  validateEmbeddingModel(model);

  const body = JSON.stringify({
    input,
    model,
    dimensions: EXPECTED_EMBEDDING_DIMENSIONS,
  });

  let attempt = 0;
  while (true) {
    const response = await fetchFn(url, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body,
    });

    if (response.ok) {
      const payload = await response.json();
      return parseEmbeddingsResponse(payload, input.length);
    }

    const detail = await readErrorBody(response);
    const retryable = RETRYABLE_STATUS.has(response.status);
    if (!retryable || attempt >= maxRetries) {
      throw new Error(
        `OpenAI embeddings request failed (${response.status}): ${detail}`,
      );
    }

    const delayMs = baseRetryDelayMs * 2 ** attempt;
    await sleep(delayMs);
    attempt += 1;
  }
}

/**
 * Embed texts via the OpenAI API with batching and transient retries.
 *
 * @param {string[]} texts
 * @param {{
 *   apiKey?: string,
 *   model?: string,
 *   batchSize?: number,
 *   fetch?: FetchFn,
 *   url?: string,
 *   maxRetries?: number,
 *   baseRetryDelayMs?: number,
 *   sleep?: SleepFn,
 * }} [options]
 * @returns {Promise<number[][]>}
 */
export async function embedTexts(texts, options = {}) {
  if (!Array.isArray(texts)) {
    throw new Error("embedTexts expects an array of strings");
  }
  if (texts.length === 0) {
    return [];
  }

  const resolved = resolveEmbeddingConfig();
  const apiKey = options.apiKey ?? requireOpenAIApiKey();
  const model = options.model ?? resolved.model;
  const batchSize = options.batchSize ?? DEFAULT_EMBEDDING_BATCH_SIZE;
  const fetchFn = options.fetch ?? globalThis.fetch;

  if (typeof fetchFn !== "function") {
    throw new Error("fetch is not available; pass options.fetch");
  }

  validateEmbeddingModel(model);

  const batches = chunkTexts(texts, batchSize);
  const vectors = [];

  for (const batch of batches) {
    const batchVectors = await requestEmbeddingsBatch({
      input: batch,
      model,
      apiKey,
      fetch: fetchFn,
      url: options.url,
      maxRetries: options.maxRetries,
      baseRetryDelayMs: options.baseRetryDelayMs,
      sleep: options.sleep,
    });
    vectors.push(...batchVectors);
  }

  return vectors;
}

export {
  DEFAULT_EMBEDDING_BATCH_SIZE,
  EXPECTED_EMBEDDING_DIMENSIONS,
  SUPPORTED_EMBEDDING_MODEL,
} from "./index-config.mjs";
