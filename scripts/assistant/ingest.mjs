#!/usr/bin/env node

import { execSync } from "node:child_process";
import process from "node:process";
import { pathToFileURL } from "node:url";

import { createPool, getDatabaseUrl } from "./db/client.mjs";
import { embedTexts } from "./embeddings/openai-embeddings.mjs";
import { readOkfBundleSha256 } from "./ingest/manifest.mjs";
import { runIngestSync } from "./ingest/sync.mjs";
import { deriveRetrievalUnits } from "./retrieval/derive-units.mjs";

function parseArgs(argv) {
  const options = { skipOkfBuild: false, help: false };
  for (const arg of argv) {
    if (arg === "--skip-okf-build") {
      options.skipOkfBuild = true;
      continue;
    }
    if (arg === "--help" || arg === "-h") {
      options.help = true;
    }
  }
  return options;
}

export function printHelp() {
  console.log(`Usage: npm run assistant:ingest [--skip-okf-build]

Build OKF corpus, derive retrieval units, embed via OpenAI, and sync to Postgres.

Requires DATABASE_URL (assistant retrieval) and OPENAI_API_KEY (portfolio-assistant project).

Options:
  --skip-okf-build  Use existing generated/okf/ output (dev only)
  -h, --help        Show this help
`);
}

/**
 * @param {{ skipOkfBuild?: boolean, log?: (message: string) => void }} [options]
 */
export async function runAssistantIngest(options = {}) {
  const log = options.log ?? console.log;

  if (!options.skipOkfBuild) {
    log("Running OKF build…");
    execSync("npm run okf:build", { stdio: "inherit" });
  }

  const okfBundleSha256 = readOkfBundleSha256();
  const units = deriveRetrievalUnits();
  log(`Derived ${units.length} retrieval units (bundle ${okfBundleSha256})`);

  const pool = createPool(getDatabaseUrl());
  try {
    return await runIngestSync(pool, units, {
      okfBundleSha256,
      embedTexts,
      log,
    });
  } finally {
    await pool.end();
  }
}

export async function main(argv = process.argv.slice(2)) {
  const options = parseArgs(argv);
  if (options.help) {
    printHelp();
    return;
  }

  await runAssistantIngest({ skipOkfBuild: options.skipOkfBuild });
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
