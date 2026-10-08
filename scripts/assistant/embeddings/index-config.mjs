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
 * @param {unknown} value
 * @param {string} context
 * @param {number} position
 * @returns {number}
 */
function assertFiniteEmbeddingComponent(value, context, position) {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(
      `${context}: embedding[${position}] must be a finite number`,
    );
  }
  return value;
}

/**
 * @param {unknown[]} embedding
 * @param {string} [context]
 * @returns {number[]}
 */
export function parseEmbeddingVector(embedding, context = "embedding") {
  if (!Array.isArray(embedding)) {
    throw new Error(`${context}: missing embedding array`);
  }
  if (embedding.length !== EXPECTED_EMBEDDING_DIMENSIONS) {
    throw new Error(
      `${context}: expected ${EXPECTED_EMBEDDING_DIMENSIONS} dimensions, received ${embedding.length}. The configured index is ${SUPPORTED_EMBEDDING_MODEL} @ ${EXPECTED_EMBEDDING_DIMENSIONS}.`,
    );
  }
  const vector = [];
  for (let i = 0; i < embedding.length; i++) {
    vector.push(assertFiniteEmbeddingComponent(embedding[i], context, i));
  }
  return vector;
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
  for (let i = 0; i < vector.length; i++) {
    assertFiniteEmbeddingComponent(vector[i], context, i);
  }
  return vector;
}
