#!/usr/bin/env node
/**
 * Delete assistant generation evaluation rows older than an explicit age window.
 * Operator-initiated only — not scheduled from the API or deployment.
 */
import { createPool, getDatabaseUrl } from "../db/client.mjs";
import {
  parseEvaluationCleanupRetentionDays,
  resolveEvaluationCleanupRetentionDays,
} from "@/lib/assistant/evaluation/config.ts";
import { deleteExpiredGenerationEvaluations } from "@/lib/assistant/evaluation/persist.ts";

const HELP = `Usage: npm run assistant:evaluation:cleanup -- [--days <n>]

Deletes evaluation rows with created_at older than the given window.

Retention days (required — no automatic policy default):
  --days <n>                         Explicit age window for this run
  ASSISTANT_EVALUATION_RETENTION_DAYS  Used when --days is omitted

Requires DATABASE_URL. Does not run on a schedule unless an operator configures one externally.
`;

function resolveRetentionDaysFromArgv(argv) {
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === "--days" && argv[i + 1]) {
      return parseEvaluationCleanupRetentionDays(argv[i + 1]);
    }
    if (arg.startsWith("--days=")) {
      return parseEvaluationCleanupRetentionDays(arg.slice("--days=".length));
    }
  }
  return null;
}

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(HELP);
    return;
  }

  const retentionDays =
    resolveRetentionDaysFromArgv(argv) ??
    resolveEvaluationCleanupRetentionDays();

  if (retentionDays === null) {
    console.error(
      "Evaluation cleanup requires an explicit age window: pass --days <n> or set ASSISTANT_EVALUATION_RETENTION_DAYS.",
    );
    process.exitCode = 1;
    return;
  }

  getDatabaseUrl();
  const pool = createPool();
  try {
    const deleted = await deleteExpiredGenerationEvaluations(
      pool,
      retentionDays,
    );
    console.log(
      `Deleted ${deleted} evaluation row(s) older than ${retentionDays} day(s).`,
    );
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
