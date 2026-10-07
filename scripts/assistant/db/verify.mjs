import { pathToFileURL } from "node:url";

import { createPool, getDatabaseUrl } from "./client.mjs";
import {
  summarizeSchemaChecks,
  verifyAssistantConnectivity,
  verifyAssistantSchema,
} from "./verify-schema.mjs";

function printHelp() {
  console.log(`Usage: npm run assistant:db:verify

Verify assistant retrieval database schema against DATABASE_URL.

Checks:
  - connectivity
  - pgvector extension enabled
  - schema_migrations table present
  - assistant pgvector migration recorded
  - assistant_retrieval_units table present
  - embedding column is vector(1536)
  - no ANN vector index (exact-search baseline)

Works against any Postgres target reachable via DATABASE_URL:
  - local Docker Postgres (default dev path)
  - hosted Neon assistant retrieval database (neon-deployment slice)

Site PortfolioRepository persistence is a separate concern with its own
future connection configuration and migration lifecycle.
`);
}

/**
 * @param {import("pg").Pool} pool
 * @param {{ json?: boolean }} [options]
 */
export async function verifyAssistantDatabase(pool, options = {}) {
  const connectivity = await verifyAssistantConnectivity(pool);
  const schemaChecks = await verifyAssistantSchema(pool);
  const summary = summarizeSchemaChecks([connectivity, ...schemaChecks]);

  if (options.json) {
    return summary;
  }

  for (const check of summary.checks) {
    const status = check.ok ? "ok" : "fail";
    console.log(`${status}\t${check.name}\t${check.detail}`);
  }

  return summary;
}

async function main() {
  if (process.argv.includes("--help") || process.argv.includes("-h")) {
    printHelp();
    return;
  }

  const json = process.argv.includes("--json");
  const pool = createPool(getDatabaseUrl());

  try {
    const summary = await verifyAssistantDatabase(pool, { json });

    if (json) {
      process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    }

    if (!summary.ok) {
      process.exitCode = 1;
    }
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
