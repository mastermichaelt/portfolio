import { asc, eq, sql } from "drizzle-orm";

import type { AssistantDb } from "@/db/client";
import { assistantRetrievalUnits } from "@/db/schema";

export type ParentRetrievalUnitRow = {
  unit_id: string;
  okf_concept_id: string;
  source_class: string;
  type: string;
  title: string;
  resource: string;
  retrieval_text: string;
  content_hash: string;
  sources: unknown;
  metadata: Record<string, unknown>;
  chunk_index: number | null;
};

export function normalizeParentUnitRow(
  row: Record<string, unknown>,
): ParentRetrievalUnitRow {
  const metadata =
    row.metadata && typeof row.metadata === "object"
      ? (row.metadata as Record<string, unknown>)
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
 */
export async function fetchParentUnitsForConcept(
  db: AssistantDb,
  okfConceptId: string,
): Promise<ParentRetrievalUnitRow[]> {
  if (!okfConceptId) {
    throw new Error("okfConceptId is required");
  }

  const rows = await db
    .select({
      unit_id: assistantRetrievalUnits.unitId,
      okf_concept_id: assistantRetrievalUnits.okfConceptId,
      source_class: assistantRetrievalUnits.sourceClass,
      type: assistantRetrievalUnits.type,
      title: assistantRetrievalUnits.title,
      resource: assistantRetrievalUnits.resource,
      retrieval_text: assistantRetrievalUnits.retrievalText,
      content_hash: assistantRetrievalUnits.contentHash,
      sources: assistantRetrievalUnits.sources,
      metadata: assistantRetrievalUnits.metadata,
    })
    .from(assistantRetrievalUnits)
    .where(eq(assistantRetrievalUnits.okfConceptId, okfConceptId))
    .orderBy(
      sql`COALESCE((${assistantRetrievalUnits.metadata}->>'chunk_index')::int, 0)`,
      asc(assistantRetrievalUnits.unitId),
    );

  return rows.map((row) =>
    normalizeParentUnitRow(row as Record<string, unknown>),
  );
}
