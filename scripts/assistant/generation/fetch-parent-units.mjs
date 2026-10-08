/**
 * Postgres-backed parent expansion at OKF concept boundary (`okf_concept_id`).
 */

/**
 * @typedef {object} ParentRetrievalUnitRow
 * @property {string} unit_id
 * @property {string} okf_concept_id
 * @property {string} source_class
 * @property {string} type
 * @property {string} title
 * @property {string} resource
 * @property {string} retrieval_text
 * @property {string} content_hash
 * @property {unknown} sources
 * @property {Record<string, unknown>} metadata
 * @property {number | null} chunk_index
 */

/**
 * @param {Record<string, unknown>} row
 * @returns {ParentRetrievalUnitRow}
 */
export function normalizeParentUnitRow(row) {
  const metadata =
    row.metadata && typeof row.metadata === "object"
      ? /** @type {Record<string, unknown>} */ (row.metadata)
      : {};
  const rawChunkIndex = metadata.chunk_index;
  const chunkIndex =
    typeof rawChunkIndex === "number" && Number.isInteger(rawChunkIndex)
      ? rawChunkIndex
      : null;

  return {
    unit_id: String(row.unit_id),
    okf_concept_id: String(row.okf_concept_id),
    source_class: String(row.source_class),
    type: String(row.type),
    title: String(row.title),
    resource: String(row.resource),
    retrieval_text: String(row.retrieval_text),
    content_hash: String(row.content_hash),
    sources: row.sources,
    metadata,
    chunk_index: chunkIndex,
  };
}

/**
 * Fetch all indexed units for one OKF concept, ordered for reading (chunk order).
 *
 * @param {import("pg").Pool | import("pg").PoolClient} db
 * @param {string} okfConceptId
 * @returns {Promise<ParentRetrievalUnitRow[]>}
 */
export async function fetchParentUnitsForConcept(db, okfConceptId) {
  if (!okfConceptId) {
    throw new Error("okfConceptId is required");
  }

  const result = await db.query(
    `
    SELECT
      unit_id,
      okf_concept_id,
      source_class,
      type,
      title,
      resource,
      retrieval_text,
      content_hash,
      sources,
      metadata
    FROM assistant_retrieval_units
    WHERE okf_concept_id = $1
    ORDER BY
      COALESCE((metadata->>'chunk_index')::int, 0),
      unit_id
    `,
    [okfConceptId],
  );

  return result.rows.map((row) => normalizeParentUnitRow(row));
}
