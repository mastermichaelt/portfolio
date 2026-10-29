import { eq, sql } from "drizzle-orm";

import { assistantRetrievalUnits } from "@/db/schema";
import type { AssistantDb } from "@/db/client";
import { assertEmbeddingDimensions } from "@/scripts/assistant/embeddings/index-config.mjs";
import { formatVectorLiteral } from "@/scripts/assistant/ingest/vector-format.mjs";

import {
  PGVECTOR_COSINE_DISTANCE_OPERATOR,
  similarityFromCosineDistance,
} from "@/lib/assistant/db/pgvector";

export { PGVECTOR_COSINE_DISTANCE_OPERATOR, similarityFromCosineDistance };

export type RankedRetrievalHit = {
  rank: number;
  cosine_distance: number;
  similarity: number;
  unit_id: string;
  okf_concept_id: string;
  source_class: string;
  type: string;
  title: string;
  resource: string;
  retrieval_text: string;
  sources: unknown;
  metadata: unknown;
};

export function rankRetrievalRows(
  rows: Array<Record<string, unknown>>,
): RankedRetrievalHit[] {
  return rows.map((row, index) => {
    const cosineDistance = Number(row.cosine_distance);
    return {
      rank: index + 1,
      cosine_distance: cosineDistance,
      similarity: similarityFromCosineDistance(cosineDistance),
      unit_id: String(row.unit_id),
      okf_concept_id: String(row.okf_concept_id),
      source_class: String(row.source_class),
      type: String(row.type),
      title: String(row.title),
      resource: String(row.resource),
      retrieval_text: String(row.retrieval_text),
      sources: row.sources,
      metadata: row.metadata,
    };
  });
}

export type SearchRetrievalUnitsOptions = {
  queryEmbedding: number[];
  topK?: number;
  /** When set, filter `source_class` exactly. */
  sourceClass?: string;
};

/**
 * Exact cosine search over `assistant_retrieval_units` (no ANN index).
 */
export async function searchRetrievalUnits(
  db: AssistantDb,
  options: SearchRetrievalUnitsOptions,
): Promise<RankedRetrievalHit[]> {
  const { queryEmbedding, topK = 5, sourceClass } = options;

  assertEmbeddingDimensions(queryEmbedding);
  if (!Number.isInteger(topK) || topK < 1) {
    throw new Error(`topK must be a positive integer, received ${topK}`);
  }

  const vectorLiteral = formatVectorLiteral(queryEmbedding);
  const distanceExpr = sql<number>`(${assistantRetrievalUnits.embedding} <=> ${vectorLiteral}::vector)`;

  const selectShape = {
    unit_id: assistantRetrievalUnits.unitId,
    okf_concept_id: assistantRetrievalUnits.okfConceptId,
    source_class: assistantRetrievalUnits.sourceClass,
    type: assistantRetrievalUnits.type,
    title: assistantRetrievalUnits.title,
    resource: assistantRetrievalUnits.resource,
    retrieval_text: assistantRetrievalUnits.retrievalText,
    sources: assistantRetrievalUnits.sources,
    metadata: assistantRetrievalUnits.metadata,
    cosine_distance: distanceExpr,
  };

  const rows =
    sourceClass !== undefined && sourceClass !== ""
      ? await db
          .select(selectShape)
          .from(assistantRetrievalUnits)
          .where(eq(assistantRetrievalUnits.sourceClass, sourceClass))
          .orderBy(distanceExpr)
          .limit(topK)
      : await db
          .select(selectShape)
          .from(assistantRetrievalUnits)
          .orderBy(distanceExpr)
          .limit(topK);

  return rankRetrievalRows(rows as Array<Record<string, unknown>>);
}
