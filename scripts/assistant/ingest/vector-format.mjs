/**
 * Format a float vector for pgvector text input (`[1,2,3]`).
 *
 * @param {number[]} values
 * @returns {string}
 */
export function formatVectorLiteral(values) {
  if (!Array.isArray(values) || values.length === 0) {
    throw new Error("formatVectorLiteral expects a non-empty number array");
  }
  return `[${values.join(",")}]`;
}
