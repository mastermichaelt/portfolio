import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";

import { createPool, getDatabaseUrl } from "./client.mjs";
import { countDrizzleJournalRows } from "./drizzle-journal.mjs";
import {
  hasAnyAssistantTable,
  LegacyAdoptionRequiredError,
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
 * Strategy A: Drizzle Kit is the sole forward migration authority (`npm run assistant:db:migrate`).
 * Legacy adoption is explicit via `npm run assistant:db:baseline`.
 *
 * @param {import("pg").Pool} pool
 * @param {{ log?: (message: string) => void }} [options]
 */
export async function runMigrations(pool, options = {}) {
  const log = options.log ?? console.log;
  const journalRows = await countDrizzleJournalRows(pool);
  const hasTables = await hasAnyAssistantTable(pool);

  if (hasTables && journalRows === 0) {
    throw new LegacyAdoptionRequiredError(
      "Assistant tables exist without a Drizzle journal baseline. Run npm run assistant:db:baseline once with operator approval, then npm run assistant:db:migrate.",
    );
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
