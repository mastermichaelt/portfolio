import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPool } from "@/scripts/assistant/db/client.mjs";
import { runMigrations } from "@/scripts/assistant/db/migrate.mjs";
import {
  summarizeSchemaChecks,
  verifyAssistantConnectivity,
  verifyAssistantSchema,
} from "@/scripts/assistant/db/verify-schema.mjs";

const databaseUrl = process.env.DATABASE_URL?.trim();
const hasDatabase = Boolean(databaseUrl);

describe("assistant db", () => {
  it("documents integration skip when DATABASE_URL is unset", () => {
    if (!hasDatabase) {
      console.info(
        "assistant db integration tests skipped: DATABASE_URL not set",
      );
    }
    expect(true).toBe(true);
  });

  describe.skipIf(!hasDatabase)("with DATABASE_URL", () => {
    /** @type {import("pg").Pool} */
    let pool: import("pg").Pool;

    beforeAll(async () => {
      pool = createPool(databaseUrl!);
      await runMigrations(pool, { log: () => {} });
    });

    afterAll(async () => {
      await pool.end();
    });

    it("passes shared schema verification checks", async () => {
      const connectivity = await verifyAssistantConnectivity(pool);
      const schemaChecks = await verifyAssistantSchema(pool);
      const summary = summarizeSchemaChecks([connectivity, ...schemaChecks]);

      expect(summary.ok).toBe(true);
      expect(summary.checks.map((check) => check.name)).toEqual([
        "connectivity",
        "vector_extension",
        "assistant_pgvector_migration",
        "assistant_retrieval_units_table",
        "embedding_vector_dimension",
        "no_ann_vector_index",
      ]);
    });
  });
});
