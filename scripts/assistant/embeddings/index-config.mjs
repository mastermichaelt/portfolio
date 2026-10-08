/** Fixed assistant retrieval index representation (matches `vector(1536)` migration). */

export const SUPPORTED_EMBEDDING_MODEL = "text-embedding-3-small";

export const EXPECTED_EMBEDDING_DIMENSIONS = 1536;

/** @type {readonly string[]} */
export const SUPPORTED_EMBEDDING_MODELS = [SUPPORTED_EMBEDDING_MODEL];

export const DEFAULT_EMBEDDING_BATCH_SIZE = 64;

export const OPENAI_EMBEDDINGS_URL = "https://api.openai.com/v1/embeddings";

/**
 * @param {string} model
 * @returns {void}
 */
export function validateEmbeddingModel(model) {
  const trimmed = model?.trim();
  if (!trimmed) {
    throw new Error(
      "ASSISTANT_EMBEDDING_MODEL is empty; supported model for this index is text-embedding-3-small",
    );
  }
  if (!SUPPORTED_EMBEDDING_MODELS.includes(trimmed)) {
    throw new Error(
      `Unsupported ASSISTANT_EMBEDDING_MODEL "${trimmed}"; this index only supports ${SUPPORTED_EMBEDDING_MODEL} (${EXPECTED_EMBEDDING_DIMENSIONS} dimensions). Changing model requires a schema migration and full re-embed.`,
    );
  }
}

/**
 * @param {number[]} vector
 * @param {string} [context]
 * @returns {number[]}
 */
export function assertEmbeddingDimensions(vector, context = "embedding") {
  if (!Array.isArray(vector)) {
    throw new Error(`${context}: expected an array of numbers`);
  }
  if (vector.length !== EXPECTED_EMBEDDING_DIMENSIONS) {
    throw new Error(
      `${context}: expected ${EXPECTED_EMBEDDING_DIMENSIONS} dimensions, received ${vector.length}. The configured index is ${SUPPORTED_EMBEDDING_MODEL} @ ${EXPECTED_EMBEDDING_DIMENSIONS}.`,
    );
  }
  return vector;
}
