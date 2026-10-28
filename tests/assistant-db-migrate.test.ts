import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPool } from "@/scripts/assistant/db/client.mjs";
import { resolveAssistantIngestTestDatabaseUrl } from "@/scripts/assistant/db/integration-test-database.mjs";
import {
  assessLegacyBaselineEligibility,
  LegacyBaselineIneligibleError,
  selectLegacyBaselineMigration,
  seedLegacyBaselineJournal,
} from "@/scripts/assistant/db/legacy-baseline.mjs";
import {
  assistantDrizzleMigrationConfig,
  runMigrations,
} from "@/scripts/assistant/db/migrate.mjs";
import { LEGACY_ASSISTANT_MIGRATION_FILES } from "@/scripts/assistant/db/migration-meta.mjs";
import {
  applyLegacySqlMigrations,
  countDrizzleJournalRows,
  resetAssistantDatabaseForTests,
} from "@/scripts/assistant/db/test-database-reset.mjs";
import { verifyAssistantSchema } from "@/scripts/assistant/db/verify-schema.mjs";

let migrateTestDatabaseUrl: string | undefined;
try {
  migrateTestDatabaseUrl = resolveAssistantIngestTestDatabaseUrl();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  throw new Error(
    `Misconfigured ASSISTANT_TEST_DATABASE_URL for migrate integration tests: ${message}`,
  );
}
const hasMigrateTestDatabase = Boolean(migrateTestDatabaseUrl);

describe("legacy baseline eligibility (unit)", () => {
  it("requires pgvector, all assistant tables, and legacy schema_migrations rows", async () => {
    const tables = new Set([
      "assistant_retrieval_units",
      "assistant_ingestion_runs",
      "assistant_api_rate_limit_counters",
      "schema_migrations",
    ]);
    const legacyFiles = new Set([LEGACY_ASSISTANT_MIGRATION_FILES[0]!]);

    const db = {
      query: async (sql: string, params?: unknown[]) => {
        if (sql.includes("pg_extension") && sql.includes("vector")) {
          return { rows: [{ extname: "vector" }] };
        }
        if (sql.includes("information_schema.tables") && params?.[0]) {
          return { rows: [{ exists: tables.has(String(params[0])) }] };
        }
        if (sql.includes("FROM schema_migrations WHERE filename = ANY")) {
          return {
            rows: [...legacyFiles].map((filename) => ({ filename })),
          };
        }
        throw new Error(`unexpected query: ${sql}`);
      },
    };

    const result = await assessLegacyBaselineEligibility(
      db as unknown as import("pg").Pool,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reason).toContain(
        "20261008100000_assistant_ingestion_runs.sql",
      );
    }
  });

  it("selectLegacyBaselineMigration returns only the first journal migration", () => {
    const first = {
      hash: "a".repeat(64),
      folderMillis: 1,
      sql: [],
      bps: true,
    };
    const second = {
      hash: "b".repeat(64),
      folderMillis: 2,
      sql: [],
      bps: true,
    };

    expect(selectLegacyBaselineMigration([first, second])).toBe(first);
  });

  it("seedLegacyBaselineJournal inserts a single journal row when multiple migrations exist", async () => {
    const inserts: unknown[][] = [];
    const pool = {
      query: async (sql: string, params?: unknown[]) => {
        if (typeof sql === "string" && sql.includes("INSERT INTO drizzle")) {
          inserts.push(params ?? []);
        }
        return { rows: [] };
      },
    };

    const first = {
      hash: "a".repeat(64),
      folderMillis: 100,
      sql: [],
      bps: true,
    };
    const second = {
      hash: "b".repeat(64),
      folderMillis: 200,
      sql: [],
      bps: true,
    };

    await seedLegacyBaselineJournal(
      pool as unknown as import("pg").Pool,
      assistantDrizzleMigrationConfig,
      () => {},
      [first, second],
    );

    expect(inserts).toHaveLength(1);
    expect(inserts[0]).toEqual([first.hash, first.folderMillis]);
  });
});

describe.skipIf(!hasMigrateTestDatabase)(
  "assistant db migrate integration (ASSISTANT_TEST_DATABASE_URL)",
  () => {
    /** @type {import("pg").Pool} */
    let pool: import("pg").Pool;

    beforeAll(() => {
      pool = createPool(migrateTestDatabaseUrl!);
    });

    afterAll(async () => {
      await pool.end();
    });

    it("applies the initial Drizzle migration on a fresh empty database", async () => {
      await resetAssistantDatabaseForTests(pool);
      await runMigrations(pool, { log: () => {} });

      expect(await countDrizzleJournalRows(pool)).toBe(1);
      const checks = await verifyAssistantSchema(pool);
      expect(checks.every((check) => check.ok)).toBe(true);
    });

    it("baselines only the initial migration for a complete legacy schema", async () => {
      await resetAssistantDatabaseForTests(pool);
      await applyLegacySqlMigrations(pool);

      await runMigrations(pool, { log: () => {} });

      expect(await countDrizzleJournalRows(pool)).toBe(1);
      await expect(
        runMigrations(pool, { log: () => {} }),
      ).resolves.toBeUndefined();
    });

    it("refuses baseline when legacy schema is partial", async () => {
      await resetAssistantDatabaseForTests(pool);
      await applyLegacySqlMigrations(pool, [
        LEGACY_ASSISTANT_MIGRATION_FILES[0]!,
      ]);

      await expect(
        runMigrations(pool, { log: () => {} }),
      ).rejects.toBeInstanceOf(LegacyBaselineIneligibleError);
      expect(await countDrizzleJournalRows(pool)).toBe(0);
    });
  },
);
