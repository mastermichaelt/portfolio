#!/usr/bin/env node
/**
 * Delete assistant generation evaluation rows older than an explicit age window.
 * Operator-initiated only — not scheduled from the API or deployment.
 */
import { createPool, getDatabaseUrl } from "../db/client.mjs";
import { resolveEvaluationCleanupRetentionDaysForRun } from "@/lib/assistant/evaluation/config.ts";
import { deleteExpiredGenerationEvaluations } from "@/lib/assistant/evaluation/persist.ts";

const HELP = `Usage: npm run assistant:evaluation:cleanup -- [--days <n>]

Deletes evaluation rows with created_at older than the given window.

Retention days (required — no automatic policy default):
  --days <n>                         Explicit age window for this run (positive integer)
  ASSISTANT_EVALUATION_RETENTION_DAYS  Used when --days is omitted

Invalid --days values fail immediately and do not fall back to the environment variable.

Requires DATABASE_URL. Does not run on a schedule unless an operator configures one externally.
`;

async function main() {
  const argv = process.argv.slice(2);
  if (argv.includes("--help") || argv.includes("-h")) {
    process.stdout.write(HELP);
    return;
  }

  const resolved = resolveEvaluationCleanupRetentionDaysForRun(argv);
  if ("error" in resolved) {
    console.error(resolved.error);
    process.exitCode = 1;
    return;
  }

  const { days: retentionDays } = resolved;

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
