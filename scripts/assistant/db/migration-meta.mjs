/** Read-only legacy SQL filenames (historical audit trail under db/migrations/). */
export const LEGACY_ASSISTANT_MIGRATION_FILES = [
  "20261007100000_assistant_pgvector.sql",
  "20261008100000_assistant_ingestion_runs.sql",
  "20261016100000_assistant_api_rate_limits.sql",
];

export const LEGACY_BASELINE_DRIZZLE_TAG = "0000_assistant_initial";

export const DRIZZLE_MIGRATIONS_SCHEMA = "drizzle";

export const DRIZZLE_MIGRATIONS_TABLE = "__drizzle_migrations";

export const ASSISTANT_TABLES = [
  "assistant_retrieval_units",
  "assistant_ingestion_runs",
  "assistant_api_rate_limit_counters",
  "assistant_generation_evaluations",
];
