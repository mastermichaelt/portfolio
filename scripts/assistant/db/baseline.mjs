import { pathToFileURL } from "node:url";

import { createPool, getDatabaseUrl } from "./client.mjs";
import { runLegacyBaselineAdoption } from "./legacy-baseline.mjs";
import { assistantDrizzleMigrationConfig } from "./migrate.mjs";

function printHelp() {
  console.log(`Usage: npm run assistant:db:baseline

One-time adoption of an existing legacy-runner assistant database into Drizzle
journal authority (Strategy A). Does not replay CREATE DDL or modify assistant tables.

Requires operator approval before running against hosted Neon.

Prerequisites on the target database:
  - pgvector extension enabled
  - assistant_retrieval_units, assistant_ingestion_runs, assistant_api_rate_limit_counters
  - schema_migrations records for all db/migrations/*.sql legacy files
  - empty drizzle.__drizzle_migrations journal

After baseline succeeds, run npm run assistant:db:verify then npm run assistant:db:migrate.
`);
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printHelp();
    return;
  }

  const pool = createPool(getDatabaseUrl());

  try {
    await runLegacyBaselineAdoption(pool, assistantDrizzleMigrationConfig);
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
