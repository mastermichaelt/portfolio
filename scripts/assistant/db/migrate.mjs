import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { drizzle } from "drizzle-orm/node-postgres";
import { readMigrationFiles } from "drizzle-orm/migrator";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import { createPool, getDatabaseUrl } from "./client.mjs";
import {
  DRIZZLE_MIGRATIONS_SCHEMA,
  DRIZZLE_MIGRATIONS_TABLE,
} from "./migration-meta.mjs";

const migrationsFolder = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../drizzle",
);

/** @type {import("drizzle-orm/migrator").MigrationConfig} */
export const assistantDrizzleMigrationConfig = {
  migrationsFolder,
  migrationsTable: DRIZZLE_MIGRATIONS_TABLE,
  migrationsSchema: DRIZZLE_MIGRATIONS_SCHEMA,
};

/**
 * @param {import("pg").Pool} pool
 * @returns {Promise<boolean>}
 */
async function publicTableExists(pool, tableName) {
  const result = await pool.query(
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
 * @param {import("pg").Pool} pool
 * @returns {Promise<number>}
 */
async function drizzleMigrationRowCount(pool) {
  const tableExists = await pool.query(
    `
    SELECT EXISTS (
      SELECT 1
      FROM information_schema.tables
      WHERE table_schema = $1
        AND table_name = $2
    ) AS exists
  `,
    [DRIZZLE_MIGRATIONS_SCHEMA, DRIZZLE_MIGRATIONS_TABLE],
  );

  if (tableExists.rows[0]?.exists !== true) {
    return 0;
  }

  const result = await pool.query(
    `SELECT COUNT(*)::int AS count FROM ${DRIZZLE_MIGRATIONS_SCHEMA}.${DRIZZLE_MIGRATIONS_TABLE}`,
  );
  return result.rows[0]?.count ?? 0;
}

/**
 * Existing Neon/local databases migrated with the legacy runner already have
 * assistant tables but no Drizzle journal. Seed journal rows without replaying DDL.
 *
 * @param {import("pg").Pool} pool
 * @param {(message: string) => void} log
 */
async function baselineDrizzleJournalForLegacyDatabase(pool, log) {
  const migrations = readMigrationFiles(assistantDrizzleMigrationConfig);
  if (migrations.length === 0) {
    throw new Error("No Drizzle migration files found to baseline");
  }

  await pool.query(`CREATE SCHEMA IF NOT EXISTS ${DRIZZLE_MIGRATIONS_SCHEMA}`);
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ${DRIZZLE_MIGRATIONS_SCHEMA}.${DRIZZLE_MIGRATIONS_TABLE} (
      id SERIAL PRIMARY KEY,
      hash text NOT NULL,
      created_at bigint
    )
  `);

  for (const migration of migrations) {
    await pool.query(
      `INSERT INTO ${DRIZZLE_MIGRATIONS_SCHEMA}.${DRIZZLE_MIGRATIONS_TABLE} (hash, created_at) VALUES ($1, $2)`,
      [migration.hash, migration.folderMillis],
    );
    log(
      `baselined ${DRIZZLE_MIGRATIONS_SCHEMA}.${DRIZZLE_MIGRATIONS_TABLE} hash=${migration.hash.slice(0, 12)}…`,
    );
  }
}

/**
 * Strategy A: Drizzle Kit is the sole migration authority (`npm run assistant:db:migrate`).
 *
 * @param {import("pg").Pool} pool
 * @param {{ log?: (message: string) => void }} [options]
 */
export async function runMigrations(pool, options = {}) {
  const log = options.log ?? console.log;
  const existingSchema = await publicTableExists(
    pool,
    "assistant_retrieval_units",
  );
  const drizzleCount = await drizzleMigrationRowCount(pool);

  if (existingSchema && drizzleCount === 0) {
    log(
      "detected legacy assistant schema without Drizzle journal — baselining only",
    );
    await baselineDrizzleJournalForLegacyDatabase(pool, log);
    return;
  }

  const db = drizzle(pool);
  await migrate(db, assistantDrizzleMigrationConfig);
  log("drizzle migrate complete");
}

async function main() {
  const pool = createPool(getDatabaseUrl());

  try {
    await runMigrations(pool);
  } finally {
    await pool.end();
  }
}

if (
  process.argv[1] &&
  import.meta.url === pathToFileURL(process.argv[1]).href
) {
  main().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
