#!/usr/bin/env node
/**
 * Developer-only review of assistant generation evaluation rows.
 */
import { createPool, getDatabaseUrl } from "../db/client.mjs";
import {
  countEvaluationsBySupportLevel,
  getEvaluationById,
  listEvaluationsByStatus,
  listRecentEvaluations,
  listWeaklySupportedEvaluations,
} from "@/lib/assistant/evaluation/review-queries.ts";

const HELP = `Usage: npm run assistant:evaluation:review -- <command> [args]

Commands:
  recent [limit]           Latest evaluation rows (default 20)
  abstained [limit]        Rows with status abstained
  failed [limit]           Rows with status failed
  weak [limit]             Completed rows with support partial/none
  by-support               Count grouped by support_level
  show <uuid>              Full row (question, answer, evidence ids)

Requires DATABASE_URL. Rows are never exposed via public HTTP routes.
`;

function parseLimit(arg) {
  const n = Number(arg ?? 20);
  return Number.isFinite(n) && n > 0 ? Math.min(Math.floor(n), 200) : 20;
}

async function main() {
  const [command, arg] = process.argv.slice(2);
  if (!command || command === "help" || command === "--help") {
    process.stdout.write(HELP);
    return;
  }

  getDatabaseUrl();
  const pool = createPool();
  try {
    switch (command) {
      case "recent": {
        const rows = await listRecentEvaluations(pool, parseLimit(arg));
        console.log(JSON.stringify(rows, null, 2));
        break;
      }
      case "abstained": {
        const rows = await listEvaluationsByStatus(
          pool,
          "abstained",
          parseLimit(arg),
        );
        console.log(JSON.stringify(rows, null, 2));
        break;
      }
      case "failed": {
        const rows = await listEvaluationsByStatus(
          pool,
          "failed",
          parseLimit(arg),
        );
        console.log(JSON.stringify(rows, null, 2));
        break;
      }
      case "weak": {
        const rows = await listWeaklySupportedEvaluations(
          pool,
          parseLimit(arg),
        );
        console.log(JSON.stringify(rows, null, 2));
        break;
      }
      case "by-support": {
        const rows = await countEvaluationsBySupportLevel(pool);
        console.log(JSON.stringify(rows, null, 2));
        break;
      }
      case "show": {
        if (!arg) {
          console.error("show requires evaluation id (uuid)");
          process.exitCode = 1;
          break;
        }
        const row = await getEvaluationById(pool, arg);
        if (!row) {
          console.error("Not found");
          process.exitCode = 1;
          break;
        }
        console.log(JSON.stringify(row, null, 2));
        break;
      }
      default:
        console.error(`Unknown command: ${command}\n`);
        process.stdout.write(HELP);
        process.exitCode = 1;
    }
  } finally {
    await pool.end();
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
