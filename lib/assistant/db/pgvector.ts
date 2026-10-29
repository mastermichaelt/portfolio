/** pgvector cosine distance operator (`<=>`). Lower values are more similar. */
export const PGVECTOR_COSINE_DISTANCE_OPERATOR = "<=>";

/**
 * Diagnostic similarity for unit-normalized embeddings: `1 - cosine_distance`.
 */
export function similarityFromCosineDistance(cosineDistance: number): number {
  if (!Number.isFinite(cosineDistance)) {
    throw new Error("cosine_distance must be a finite number");
  }
  return 1 - cosineDistance;
}
