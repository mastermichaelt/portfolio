#!/usr/bin/env node
/**
 * Delete assistant generation evaluation rows older than the retention window.
 * Schedule via operator cron / Vercel Cron — not invoked from the API route.
 */
import { createPool, getDatabaseUrl } from "../db/client.mjs";
import { resolveEvaluationObservabilityConfig } from "@/lib/assistant/evaluation/config.ts";
import { deleteExpiredGenerationEvaluations } from "@/lib/assistant/evaluation/persist.ts";

async function main() {
  const { retentionDays } = resolveEvaluationObservabilityConfig();
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
