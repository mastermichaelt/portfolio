import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import { createPool, getDatabaseUrl } from "./client.mjs";
import {
  assessLegacyBaselineEligibility,
  hasAnyAssistantTable,
  LegacyBaselineIneligibleError,
  seedLegacyBaselineJournal,
} from "./legacy-baseline.mjs";
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
 * Strategy A: Drizzle Kit is the sole migration authority (`npm run assistant:db:migrate`).
 *
 * @param {import("pg").Pool} pool
 * @param {{ log?: (message: string) => void }} [options]
 */
export async function runMigrations(pool, options = {}) {
  const log = options.log ?? console.log;
  const drizzleCount = await drizzleMigrationRowCount(pool);

  if (drizzleCount > 0) {
    const db = drizzle(pool);
    await migrate(db, assistantDrizzleMigrationConfig);
    log("drizzle migrate complete");
    return;
  }

  const eligibility = await assessLegacyBaselineEligibility(pool);
  if (eligibility.ok) {
    log(
      "detected complete legacy assistant schema without Drizzle journal — baselining initial migration only",
    );
    await seedLegacyBaselineJournal(pool, assistantDrizzleMigrationConfig, log);
    return;
  }

  if (await hasAnyAssistantTable(pool)) {
    throw new LegacyBaselineIneligibleError(eligibility.reason);
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
