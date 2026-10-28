import {
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";

/** Fixed index: text-embedding-3-small @ 1536 dimensions (exact search; no ANN). */
export const ASSISTANT_EMBEDDING_DIMENSIONS = 1536;

export const assistantRetrievalUnits = pgTable(
  "assistant_retrieval_units",
  {
    unitId: text("unit_id").primaryKey(),
    okfConceptId: text("okf_concept_id").notNull(),
    okfVersion: text("okf_version").notNull(),
    sourceClass: text("source_class").notNull(),
    type: text("type").notNull(),
    title: text("title").notNull(),
    resource: text("resource").notNull(),
    retrievalText: text("retrieval_text").notNull(),
    contentHash: text("content_hash").notNull(),
    embeddingModel: text("embedding_model").notNull(),
    embedding: vector("embedding", {
      dimensions: ASSISTANT_EMBEDDING_DIMENSIONS,
    }).notNull(),
    sources: jsonb("sources").notNull().default([]),
    metadata: jsonb("metadata").notNull().default({}),
    embeddedAt: timestamp("embedded_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("assistant_retrieval_units_source_class_idx").on(table.sourceClass),
    index("assistant_retrieval_units_okf_concept_id_idx").on(
      table.okfConceptId,
    ),
  ],
);

export const assistantIngestionRuns = pgTable(
  "assistant_ingestion_runs",
  {
    runId: uuid("run_id").primaryKey().defaultRandom(),
    okfBundleSha256: text("okf_bundle_sha256").notNull(),
    embeddingModel: text("embedding_model").notNull(),
    insertedCount: integer("inserted_count").notNull().default(0),
    updatedCount: integer("updated_count").notNull().default(0),
    deletedCount: integer("deleted_count").notNull().default(0),
    skippedCount: integer("skipped_count").notNull().default(0),
    startedAt: timestamp("started_at", { withTimezone: true }).notNull(),
    finishedAt: timestamp("finished_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("assistant_ingestion_runs_finished_at_idx").on(
      table.finishedAt.desc(),
    ),
  ],
);

export const assistantApiRateLimitCounters = pgTable(
  "assistant_api_rate_limit_counters",
  {
    bucketKey: text("bucket_key").primaryKey(),
    count: integer("count").notNull().default(1),
    windowEndsAt: timestamp("window_ends_at", {
      withTimezone: true,
    }).notNull(),
  },
  (table) => [
    index("assistant_api_rate_limit_counters_window_ends_at_idx").on(
      table.windowEndsAt,
    ),
  ],
);
