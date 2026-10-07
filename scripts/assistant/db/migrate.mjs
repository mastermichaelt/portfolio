import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { createPool, getDatabaseUrl } from "./client.mjs";

const migrationsDir = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../../db/migrations",
);

/**
 * @param {import("pg").Pool} pool
 */
async function ensureMigrationsTable(pool) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename text PRIMARY KEY,
      applied_at timestamptz NOT NULL DEFAULT now()
    )
  `);
}

/**
 * @param {import("pg").Pool} pool
 * @returns {Promise<Set<string>>}
 */
async function getAppliedMigrations(pool) {
  const result = await pool.query(
    "SELECT filename FROM schema_migrations ORDER BY filename",
  );
  return new Set(result.rows.map((row) => row.filename));
}

/**
 * @param {import("pg").Pool} pool
 * @param {{ log?: (message: string) => void }} [options]
 */
export async function runMigrations(pool, options = {}) {
  const log = options.log ?? console.log;

  await ensureMigrationsTable(pool);
  const applied = await getAppliedMigrations(pool);

  const files = fs
    .readdirSync(migrationsDir)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  for (const file of files) {
    if (applied.has(file)) {
      log(`skip ${file} (already applied)`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    const client = await pool.connect();

    try {
      await client.query("BEGIN");
      await client.query(sql);
      await client.query(
        "INSERT INTO schema_migrations (filename) VALUES ($1)",
        [file],
      );
      await client.query("COMMIT");
      log(`applied ${file}`);
    } catch (error) {
      await client.query("ROLLBACK");
      throw error;
    } finally {
      client.release();
    }
  }
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
