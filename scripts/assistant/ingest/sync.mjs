import { assertEmbeddingDimensions } from "../embeddings/index-config.mjs";
import { resolveEmbeddingConfig } from "../embeddings/embedding-config.mjs";
import { formatVectorLiteral } from "./vector-format.mjs";

/** @typedef {import("../retrieval/unit-schema.mjs").RetrievalUnit} RetrievalUnit */

/**
 * @typedef {object} IngestCounts
 * @property {number} inserted
 * @property {number} updated
 * @property {number} deleted
 * @property {number} skipped
 */

/**
 * @typedef {object} IngestSyncResult
 * @property {string} runId
 * @property {string} okfBundleSha256
 * @property {string} embeddingModel
 * @property {IngestCounts} counts
 */

/**
 * @param {RetrievalUnit} unit
 * @returns {Record<string, unknown>}
 */
function unitMetadataJson(unit) {
  return {
    ...unit.metadata,
    tags: unit.tags,
  };
}

/**
 * @param {RetrievalUnit} unit
 * @returns {string}
 */
function formatProvenanceLine(unit, embeddingModel) {
  const canonical =
    unit.sources[0]?.resource ?? unit.sources[0]?.id ?? unit.resource;
  return `${canonical} → ${unit.okf_concept_id} → ${unit.unit_id} → ${unit.content_hash} → ${embeddingModel}`;
}

/**
 * @param {import("pg").Pool | import("pg").PoolClient} db
 * @returns {Promise<Map<string, { content_hash: string, embedding_model: string }>>}
 */
export async function loadExistingUnitFingerprints(db) {
  const result = await db.query(
    `SELECT unit_id, content_hash, embedding_model FROM assistant_retrieval_units`,
  );
  /** @type {Map<string, { content_hash: string, embedding_model: string }>} */
  const map = new Map();
  for (const row of result.rows) {
    map.set(row.unit_id, {
      content_hash: row.content_hash,
      embedding_model: row.embedding_model,
    });
  }
  return map;
}

/**
 * @param {RetrievalUnit[]} units
 * @param {Map<string, { content_hash: string, embedding_model: string }>} existing
 * @param {string} embeddingModel
 */
export function planIngestActions(units, existing, embeddingModel) {
  /** @type {RetrievalUnit[]} */
  const toEmbed = [];
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

/**
 * @param {import("pg").PoolClient} client
 * @param {RetrievalUnit} unit
 * @param {number[]} embedding
 * @param {string} embeddingModel
 * @param {boolean} existedBefore
 */
async function upsertUnit(
  client,
  unit,
  embedding,
  embeddingModel,
  existedBefore,
) {
  const metadata = unitMetadataJson(unit);
  const vectorLiteral = formatVectorLiteral(embedding);
  const now = new Date();

  await client.query(
    `
    INSERT INTO assistant_retrieval_units (
      unit_id,
      okf_concept_id,
      okf_version,
      source_class,
      type,
      title,
      resource,
      retrieval_text,
      content_hash,
      embedding_model,
      embedding,
      sources,
      metadata,
      embedded_at,
      created_at,
      updated_at
    ) VALUES (
      $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
      $11::vector,
      $12::jsonb,
      $13::jsonb,
      $14,
      $14,
      $14
    )
    ON CONFLICT (unit_id) DO UPDATE SET
      okf_concept_id = EXCLUDED.okf_concept_id,
      okf_version = EXCLUDED.okf_version,
      source_class = EXCLUDED.source_class,
      type = EXCLUDED.type,
      title = EXCLUDED.title,
      resource = EXCLUDED.resource,
      retrieval_text = EXCLUDED.retrieval_text,
      content_hash = EXCLUDED.content_hash,
      embedding_model = EXCLUDED.embedding_model,
      embedding = EXCLUDED.embedding,
      sources = EXCLUDED.sources,
      metadata = EXCLUDED.metadata,
      embedded_at = EXCLUDED.embedded_at,
      updated_at = EXCLUDED.updated_at
    `,
    [
      unit.unit_id,
      unit.okf_concept_id,
      unit.okf_version,
      unit.source_class,
      unit.type,
      unit.title,
      unit.resource,
      unit.text,
      unit.content_hash,
      embeddingModel,
      vectorLiteral,
      JSON.stringify(unit.sources),
      JSON.stringify(metadata),
      now,
    ],
  );

  return existedBefore ? "updated" : "inserted";
}

/**
 * @param {import("pg").PoolClient} client
 * @param {string[]} keepUnitIds
 * @returns {Promise<number>}
 */
async function deleteStaleUnits(client, keepUnitIds) {
  if (keepUnitIds.length === 0) {
    const result = await client.query(`DELETE FROM assistant_retrieval_units`);
    return result.rowCount ?? 0;
  }

  const result = await client.query(
    `
    DELETE FROM assistant_retrieval_units
    WHERE NOT (unit_id = ANY($1::text[]))
    `,
    [keepUnitIds],
  );
  return result.rowCount ?? 0;
}

/**
 * @param {import("pg").PoolClient} client
 * @param {{
 *   okfBundleSha256: string,
 *   embeddingModel: string,
 *   counts: IngestCounts,
 *   startedAt: Date,
 * }} record
 * @returns {Promise<string>}
 */
async function recordIngestionRun(client, record) {
  const result = await client.query(
    `
    INSERT INTO assistant_ingestion_runs (
      okf_bundle_sha256,
      embedding_model,
      inserted_count,
      updated_count,
      deleted_count,
      skipped_count,
      started_at,
      finished_at
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, now())
    RETURNING run_id::text
    `,
    [
      record.okfBundleSha256,
      record.embeddingModel,
      record.counts.inserted,
      record.counts.updated,
      record.counts.deleted,
      record.counts.skipped,
      record.startedAt,
    ],
  );
  return result.rows[0].run_id;
}

/**
 * Idempotent sync: embed changed units, upsert, delete stale rows, record run metadata.
 *
 * @param {import("pg").Pool} pool
 * @param {RetrievalUnit[]} units
 * @param {{
 *   okfBundleSha256: string,
 *   embeddingModel?: string,
 *   embedTexts?: (texts: string[]) => Promise<number[][]>,
 *   log?: (message: string) => void,
 * }} options
 * @returns {Promise<IngestSyncResult>}
 */
export async function runIngestSync(pool, units, options) {
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
  const existing = await loadExistingUnitFingerprints(pool);
  const plan = planIngestActions(units, existing, embeddingModel);

  log(
    `Ingest plan: ${units.length} derived units, ${plan.toEmbed.length} to embed, ${plan.skipped} unchanged, ${plan.deleted} stale to delete`,
  );

  /** @type {Map<string, number[]>} */
  const vectorsByUnitId = new Map();

  if (plan.toEmbed.length > 0) {
    const texts = plan.toEmbed.map((unit) => unit.text);
    let vectors;
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

  const counts = {
    inserted: 0,
    updated: 0,
    deleted: 0,
    skipped: plan.skipped,
  };

  const client = await pool.connect();
  try {
    await client.query("BEGIN");

    for (const unit of plan.toEmbed) {
      const vector = vectorsByUnitId.get(unit.unit_id);
      if (!vector) {
        throw new Error(`Missing embedding vector for ${unit.unit_id}`);
      }
      const existedBefore = existing.has(unit.unit_id);
      const action = await upsertUnit(
        client,
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
      log(formatProvenanceLine(unit, embeddingModel));
    }

    for (const unit of units) {
      if (vectorsByUnitId.has(unit.unit_id)) {
        continue;
      }
      if (existing.has(unit.unit_id)) {
        log(`skip unchanged ${formatProvenanceLine(unit, embeddingModel)}`);
      }
    }

    counts.deleted = await deleteStaleUnits(
      client,
      units.map((unit) => unit.unit_id),
    );

    const runId = await recordIngestionRun(client, {
      okfBundleSha256: options.okfBundleSha256,
      embeddingModel,
      counts,
      startedAt,
    });

    await client.query("COMMIT");

    log(
      `Ingest complete: inserted=${counts.inserted} updated=${counts.updated} deleted=${counts.deleted} skipped=${counts.skipped} run_id=${runId}`,
    );

    return {
      runId,
      okfBundleSha256: options.okfBundleSha256,
      embeddingModel,
      counts,
    };
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}
