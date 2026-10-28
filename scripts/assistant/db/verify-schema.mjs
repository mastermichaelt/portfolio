import path from "node:path";
import { fileURLToPath } from "node:url";

import { readMigrationFiles } from "drizzle-orm/migrator";

import {
  ASSISTANT_TABLES,
  DRIZZLE_MIGRATIONS_TABLE,
} from "./migration-meta.mjs";

/** @typedef {{ name: string, ok: boolean, detail: string }} SchemaCheck */

export const EXPECTED_EMBEDDING_DIMENSIONS = 1536;

const migrationsFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../drizzle",
);

/**
 * @returns {import("drizzle-orm/migrator").MigrationMeta[]}
 */
export function loadExpectedDrizzleMigrations() {
  return readMigrationFiles({
    migrationsFolder,
    migrationsTable: DRIZZLE_MIGRATIONS_TABLE,
  });
}

/**
 * @param {import("pg").Pool | import("pg").PoolClient} db
 * @param {string} tableName
 * @returns {Promise<boolean>}
 */
async function publicTableExists(db, tableName) {
  const result = await db.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = $1
    ) AS exists
  `,
    [tableName],
  );
  return result.rows[0]?.exists === true;
}

/**
 * @param {import("pg").Pool | import("pg").PoolClient} db
 * @returns {Promise<SchemaCheck>}
 */
async function verifyDrizzleMigrationJournal(db) {
  const expected = loadExpectedDrizzleMigrations();
  const tableExists = await publicTableExists(db, DRIZZLE_MIGRATIONS_TABLE);

  if (!tableExists) {
    return {
      name: "drizzle_migration_journal",
      ok: false,
      detail: `${DRIZZLE_MIGRATIONS_TABLE} is missing; run npm run assistant:db:migrate`,
    };
  }

  const result = await db.query(
    `SELECT hash FROM ${DRIZZLE_MIGRATIONS_TABLE} ORDER BY created_at ASC`,
  );
  const appliedHashes = result.rows.map((row) => row.hash);
  const expectedHashes = expected.map((migration) => migration.hash);
  const matches =
    appliedHashes.length === expectedHashes.length &&
    expectedHashes.every((hash, index) => appliedHashes[index] === hash);

  return {
    name: "drizzle_migration_journal",
    ok: matches,
    detail: matches
      ? `${DRIZZLE_MIGRATIONS_TABLE} records ${appliedHashes.length} migration(s)`
      : `expected Drizzle journal hashes ${expectedHashes.join(", ")}, found ${appliedHashes.join(", ") || "(empty)"}`,
  };
}

/**
 * @param {import("pg").Pool | import("pg").PoolClient} db
 * @returns {Promise<SchemaCheck[]>}
 */
export async function verifyAssistantSchema(db) {
  const checks = [];

  const extensionResult = await db.query(
    "SELECT extname FROM pg_extension WHERE extname = 'vector'",
  );
  checks.push({
    name: "vector_extension",
    ok: extensionResult.rows.length === 1,
    detail:
      extensionResult.rows.length === 1
        ? "pgvector extension is enabled"
        : "pgvector extension is missing",
  });

  checks.push(await verifyDrizzleMigrationJournal(db));

  for (const tableName of ASSISTANT_TABLES) {
    const tableExists = await publicTableExists(db, tableName);
    checks.push({
      name: `${tableName}_table`,
      ok: tableExists,
      detail: tableExists
        ? `${tableName} table exists`
        : `${tableName} table is missing`,
    });
  }

  const retrievalTableExists = await publicTableExists(
    db,
    "assistant_retrieval_units",
  );

  if (retrievalTableExists) {
    const embeddingTypeResult = await db.query(
      `
      SELECT format_type(a.atttypid, a.atttypmod) AS embedding_type
      FROM pg_attribute a
      JOIN pg_class c ON a.attrelid = c.oid
      JOIN pg_namespace n ON c.relnamespace = n.oid
      WHERE n.nspname = 'public'
        AND c.relname = 'assistant_retrieval_units'
        AND a.attname = 'embedding'
        AND NOT a.attisdropped
    `,
    );
    const embeddingType =
      embeddingTypeResult.rows[0]?.embedding_type ?? "missing";
    const expectedType = `vector(${EXPECTED_EMBEDDING_DIMENSIONS})`;
    checks.push({
      name: "embedding_vector_dimension",
      ok: embeddingType === expectedType,
      detail:
        embeddingType === expectedType
          ? `embedding column is ${expectedType}`
          : `expected embedding column ${expectedType}, found ${embeddingType}`,
    });

    const indexResult = await db.query(
      `
      SELECT indexdef
      FROM pg_indexes
      WHERE tablename = 'assistant_retrieval_units'
    `,
    );
    const hasAnnIndex = indexResult.rows.some((row) =>
      /hnsw|ivfflat/i.test(row.indexdef),
    );
    checks.push({
      name: "no_ann_vector_index",
      ok: !hasAnnIndex,
      detail: hasAnnIndex
        ? "ANN vector index detected; experiment uses exact search only"
        : "no ANN vector index on assistant_retrieval_units",
    });
  }

  return checks;
}

/**
 * @param {import("pg").Pool | import("pg").PoolClient} db
 * @returns {Promise<SchemaCheck>}
 */
export async function verifyAssistantConnectivity(db) {
  const result = await db.query("SELECT 1 AS ok");
  const connected = result.rows[0]?.ok === 1;
  return {
    name: "connectivity",
    ok: connected,
    detail: connected
      ? "database connection succeeded"
      : "database connection check failed",
  };
}

/**
 * @param {SchemaCheck[]} checks
 * @returns {{ ok: boolean, checks: SchemaCheck[] }}
 */
export function summarizeSchemaChecks(checks) {
  return {
    ok: checks.every((check) => check.ok),
    checks,
  };
}
