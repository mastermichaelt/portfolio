import { notInArray, sql } from "drizzle-orm";

import type { AssistantDb } from "@/db/client";
import { assistantIngestionRuns, assistantRetrievalUnits } from "@/db/schema";
import { assertEmbeddingDimensions } from "@/scripts/assistant/embeddings/index-config.mjs";
import { resolveEmbeddingConfig } from "@/scripts/assistant/embeddings/embedding-config.mjs";
import { formatVectorLiteral } from "@/scripts/assistant/ingest/vector-format.mjs";
import type { RetrievalUnit } from "@/scripts/assistant/retrieval/unit-schema.mjs";

type AssistantDbTx = Parameters<Parameters<AssistantDb["transaction"]>[0]>[0];

export type IngestCounts = {
  inserted: number;
  updated: number;
  deleted: number;
  skipped: number;
};

export type IngestSyncResult = {
  runId: string;
  okfBundleSha256: string;
  embeddingModel: string;
  counts: IngestCounts;
};

function unitMetadataJson(unit: RetrievalUnit): Record<string, unknown> {
  return {
    ...unit.metadata,
    tags: unit.tags,
  };
}

function formatProvenanceLine(unit: RetrievalUnit, embeddingModel: string) {
  const canonical =
    unit.sources[0]?.resource ?? unit.sources[0]?.id ?? unit.resource;
  return `${canonical} → ${unit.okf_concept_id} → ${unit.unit_id} → ${unit.content_hash} → ${embeddingModel}`;
}

export async function loadExistingUnitFingerprints(
  db: AssistantDb,
): Promise<Map<string, { content_hash: string; embedding_model: string }>> {
  const rows = await db
    .select({
      unit_id: assistantRetrievalUnits.unitId,
      content_hash: assistantRetrievalUnits.contentHash,
      embedding_model: assistantRetrievalUnits.embeddingModel,
    })
    .from(assistantRetrievalUnits);

  const map = new Map<
    string,
    { content_hash: string; embedding_model: string }
  >();
  for (const row of rows) {
    map.set(row.unit_id, {
      content_hash: row.content_hash,
      embedding_model: row.embedding_model,
    });
  }
  return map;
}

export function planIngestActions(
  units: RetrievalUnit[],
  existing: Map<string, { content_hash: string; embedding_model: string }>,
  embeddingModel: string,
) {
  const toEmbed: RetrievalUnit[] = [];
  let skipped = 0;

  for (const unit of units) {
    const row = existing.get(unit.unit_id);
    if (
      row &&
      row.content_hash === unit.content_hash &&
      row.embedding_model === embeddingModel
    ) {
      skipped += 1;
      continue;
    }
    toEmbed.push(unit);
  }

  const derivedIds = new Set(units.map((unit) => unit.unit_id));
  let deleted = 0;
  for (const unitId of existing.keys()) {
    if (!derivedIds.has(unitId)) {
      deleted += 1;
    }
  }

  return { toEmbed, skipped, deleted };
}

async function upsertUnit(
  tx: AssistantDbTx,
  unit: RetrievalUnit,
  embedding: number[],
  embeddingModel: string,
  existedBefore: boolean,
): Promise<"inserted" | "updated"> {
  const metadata = unitMetadataJson(unit);
  const vectorLiteral = formatVectorLiteral(embedding);
  const now = new Date();

  await tx
    .insert(assistantRetrievalUnits)
    .values({
      unitId: unit.unit_id,
      okfConceptId: unit.okf_concept_id,
      okfVersion: unit.okf_version,
      sourceClass: unit.source_class,
      type: unit.type,
      title: unit.title,
      resource: unit.resource,
      retrievalText: unit.text,
      contentHash: unit.content_hash,
      embeddingModel,
      embedding: sql`${vectorLiteral}::vector`,
      sources: unit.sources,
      metadata,
      embeddedAt: now,
      createdAt: now,
      updatedAt: now,
    })
    .onConflictDoUpdate({
      target: assistantRetrievalUnits.unitId,
      set: {
        okfConceptId: unit.okf_concept_id,
        okfVersion: unit.okf_version,
        sourceClass: unit.source_class,
        type: unit.type,
        title: unit.title,
        resource: unit.resource,
        retrievalText: unit.text,
        contentHash: unit.content_hash,
        embeddingModel,
        embedding: sql`${vectorLiteral}::vector`,
        sources: unit.sources,
        metadata,
        embeddedAt: now,
        updatedAt: now,
      },
    });

  return existedBefore ? "updated" : "inserted";
}

async function deleteStaleUnits(
  tx: AssistantDbTx,
  keepUnitIds: string[],
): Promise<number> {
  if (keepUnitIds.length === 0) {
    const deleted = await tx.delete(assistantRetrievalUnits);
    return deleted.rowCount ?? 0;
  }

  const deleted = await tx
    .delete(assistantRetrievalUnits)
    .where(notInArray(assistantRetrievalUnits.unitId, keepUnitIds));
  return deleted.rowCount ?? 0;
}

async function recordIngestionRun(
  tx: AssistantDbTx,
  record: {
    okfBundleSha256: string;
    embeddingModel: string;
    counts: IngestCounts;
    startedAt: Date;
  },
): Promise<string> {
  const [row] = await tx
    .insert(assistantIngestionRuns)
    .values({
      okfBundleSha256: record.okfBundleSha256,
      embeddingModel: record.embeddingModel,
      insertedCount: record.counts.inserted,
      updatedCount: record.counts.updated,
      deletedCount: record.counts.deleted,
      skippedCount: record.counts.skipped,
      startedAt: record.startedAt,
    })
    .returning({ run_id: assistantIngestionRuns.runId });

  return row.run_id;
}

/**
 * Idempotent sync: embed changed units, upsert, delete stale rows, record run metadata.
 */
export async function runIngestSync(
  db: AssistantDb,
  units: RetrievalUnit[],
  options: {
    okfBundleSha256: string;
    embeddingModel?: string;
    embedTexts?: (texts: string[]) => Promise<number[][]>;
    log?: (message: string) => void;
  },
): Promise<IngestSyncResult> {
  if (!Array.isArray(units) || units.length === 0) {
    throw new Error(
      "Ingestion aborted: zero retrieval units derived. Refusing to delete the index.",
    );
  }

  const log = options.log ?? console.log;
  const embeddingModel =
    options.embeddingModel ?? resolveEmbeddingConfig().model;
  const embedTexts = options.embedTexts;
  if (!embedTexts) {
    throw new Error("runIngestSync requires options.embedTexts");
  }

  const startedAt = new Date();
  const existing = await loadExistingUnitFingerprints(db);
  const plan = planIngestActions(units, existing, embeddingModel);

  log(
    `Ingest plan: ${units.length} derived units, ${plan.toEmbed.length} to embed, ${plan.skipped} unchanged, ${plan.deleted} stale to delete`,
  );

  const vectorsByUnitId = new Map<string, number[]>();

  if (plan.toEmbed.length > 0) {
    const texts = plan.toEmbed.map((unit) => unit.text);
    let vectors: number[][];
    try {
      vectors = await embedTexts(texts);
    } catch (error) {
      const unitId = plan.toEmbed[0]?.unit_id ?? "unknown";
      const message = error instanceof Error ? error.message : String(error);
      throw new Error(
        `Embedding failed for unit ${unitId} (and ${plan.toEmbed.length} pending): ${message}`,
      );
    }

    if (vectors.length !== plan.toEmbed.length) {
      throw new Error(
        `Embedding count mismatch: expected ${plan.toEmbed.length}, received ${vectors.length}`,
      );
    }

    for (let index = 0; index < plan.toEmbed.length; index += 1) {
      const unit = plan.toEmbed[index];
      const vector = vectors[index];
      try {
        assertEmbeddingDimensions(vector);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Embedding invalid for ${unit.unit_id}: ${message}`);
      }
      vectorsByUnitId.set(unit.unit_id, vector);
    }
  }

  const counts: IngestCounts = {
    inserted: 0,
    updated: 0,
    deleted: 0,
    skipped: plan.skipped,
  };

  const result = await db.transaction(async (tx) => {
    const provenanceLog: string[] = [];

    for (const unit of plan.toEmbed) {
      const vector = vectorsByUnitId.get(unit.unit_id);
      if (!vector) {
        throw new Error(`Missing embedding vector for ${unit.unit_id}`);
      }
      const existedBefore = existing.has(unit.unit_id);
      const action = await upsertUnit(
        tx,
        unit,
        vector,
        embeddingModel,
        existedBefore,
      );
      if (action === "inserted") {
        counts.inserted += 1;
      } else {
        counts.updated += 1;
      }
      provenanceLog.push(formatProvenanceLine(unit, embeddingModel));
    }

    for (const unit of units) {
      if (vectorsByUnitId.has(unit.unit_id)) {
        continue;
      }
      if (existing.has(unit.unit_id)) {
        provenanceLog.push(
          `skip unchanged ${formatProvenanceLine(unit, embeddingModel)}`,
        );
      }
    }

    counts.deleted = await deleteStaleUnits(
      tx,
      units.map((unit) => unit.unit_id),
    );

    const runId = await recordIngestionRun(tx, {
      okfBundleSha256: options.okfBundleSha256,
      embeddingModel,
      counts,
      startedAt,
    });

    return {
      runId,
      okfBundleSha256: options.okfBundleSha256,
      embeddingModel,
      counts,
      provenanceLog,
    };
  });

  for (const line of result.provenanceLog) {
    log(line);
  }

  log(
    `Ingest complete: inserted=${result.counts.inserted} updated=${result.counts.updated} deleted=${result.counts.deleted} skipped=${result.counts.skipped} run_id=${result.runId}`,
  );

  return {
    runId: result.runId,
    okfBundleSha256: result.okfBundleSha256,
    embeddingModel: result.embeddingModel,
    counts: result.counts,
  };
}
