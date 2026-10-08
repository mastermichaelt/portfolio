import { assertEmbeddingDimensions } from "../embeddings/index-config.mjs";
import { formatVectorLiteral } from "../ingest/vector-format.mjs";

/**
 * pgvector cosine distance operator (`<=>`).
 * Lower values are more similar. For unit-normalized vectors (OpenAI embeddings),
 * distance is in [0, 2]. Diagnostic similarity is `1 - cosine_distance`.
 */
export const PGVECTOR_COSINE_DISTANCE_OPERATOR = "<=>";

/**
 * @param {number} cosineDistance
 * @returns {number}
 */
export function similarityFromCosineDistance(cosineDistance) {
  if (!Number.isFinite(cosineDistance)) {
    throw new Error("cosine_distance must be a finite number");
  }
  return 1 - cosineDistance;
}

/**
 * @param {Record<string, unknown>[]} rows
 * @returns {Array<Record<string, unknown>>}
 */
export function rankRetrievalRows(rows) {
  return rows.map((row, index) => {
    const cosineDistance = Number(row.cosine_distance);
    return {
      rank: index + 1,
      cosine_distance: cosineDistance,
      similarity: similarityFromCosineDistance(cosineDistance),
      unit_id: row.unit_id,
      okf_concept_id: row.okf_concept_id,
      source_class: row.source_class,
      type: row.type,
      title: row.title,
      resource: row.resource,
      retrieval_text: row.retrieval_text,
      sources: row.sources,
      metadata: row.metadata,
    };
  });
}

/**
 * @typedef {object} SearchRetrievalUnitsOptions
 * @property {number[]} queryEmbedding
 * @property {number} [topK]
 * @property {string} [sourceClass] When set, filter `source_class` exactly.
 */

/**
 * Exact cosine search over `assistant_retrieval_units` (no ANN index).
 *
 * @param {import("pg").Pool | import("pg").PoolClient} db
 * @param {SearchRetrievalUnitsOptions} options
 * @returns {Promise<ReturnType<typeof rankRetrievalRows>>}
 */
export async function searchRetrievalUnits(db, options) {
  const { queryEmbedding, topK = 5, sourceClass } = options;

  assertEmbeddingDimensions(queryEmbedding);
  if (!Number.isInteger(topK) || topK < 1) {
    throw new Error(`topK must be a positive integer, received ${topK}`);
  }

  const vectorLiteral = formatVectorLiteral(queryEmbedding);

  const params = [vectorLiteral, topK];
  let whereClause = "";
  if (sourceClass !== undefined && sourceClass !== "") {
    whereClause = "WHERE source_class = $3";
    params.push(sourceClass);
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
      sources,
      metadata,
      (embedding ${PGVECTOR_COSINE_DISTANCE_OPERATOR} $1::vector) AS cosine_distance
    FROM assistant_retrieval_units
    ${whereClause}
    ORDER BY embedding ${PGVECTOR_COSINE_DISTANCE_OPERATOR} $1::vector
    LIMIT $2
    `,
    params,
  );

  return rankRetrievalRows(result.rows);
}
