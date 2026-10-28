import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import {
  ASSISTANT_TABLES,
  LEGACY_ASSISTANT_MIGRATION_FILES,
} from "./migration-meta.mjs";

const legacyMigrationsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../db/migrations",
);

/**
 * @param {import("pg").Pool} pool
 */
export async function resetAssistantDatabaseForTests(pool) {
  await pool.query("DROP SCHEMA IF EXISTS drizzle CASCADE");
  await pool.query("DROP TABLE IF EXISTS public.__drizzle_migrations CASCADE");

  for (const tableName of [...ASSISTANT_TABLES, "schema_migrations"]) {
    await pool.query(`DROP TABLE IF EXISTS public.${tableName} CASCADE`);
  }

  await pool.query("DROP EXTENSION IF EXISTS vector CASCADE");
}

/**
 * @param {import("pg").Pool} pool
 * @param {string[]} [filenames]
 */
export async function applyLegacySqlMigrations(pool, filenames) {
  const files = filenames ?? LEGACY_ASSISTANT_MIGRATION_FILES;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(legacyMigrationsDir, file), "utf8");
    const client = await pool.connect();
    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (filename) VALUES ($1)",
        [file],
      );
      await client.query("COMMIT");
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
}
