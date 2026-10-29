import { readMigrationFiles } from "drizzle-orm/migrator";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPool } from "@/scripts/assistant/db/client.mjs";
import { resolveAssistantIngestTestDatabaseUrl } from "@/scripts/assistant/db/integration-test-database.mjs";
import {
  assessLegacyBaselineEligibility,
  LegacyAdoptionRequiredError,
  LegacyBaselineAlreadyAdoptedError,
  LegacyBaselineIneligibleError,
  resolveLegacyBaselineMigration,
  runLegacyBaselineAdoption,
  seedLegacyBaselineJournal,
} from "@/scripts/assistant/db/legacy-baseline.mjs";
import {
  assistantDrizzleMigrationConfig,
  runMigrations,
} from "@/scripts/assistant/db/migrate.mjs";
import { LEGACY_ASSISTANT_MIGRATION_FILES } from "@/scripts/assistant/db/migration-meta.mjs";
import {
  applyLegacySqlMigrations,
  resetAssistantDatabaseForTests,
} from "@/scripts/assistant/db/test-database-reset.mjs";
import { countDrizzleJournalRows } from "@/scripts/assistant/db/drizzle-journal.mjs";
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

describe("destructive assistant test database gate", () => {
  it("refuses reset on non-_test database names", async () => {
    const pool = createPool(
      "postgresql://portfolio:portfolio_dev@127.0.0.1:5433/portfolio_assistant",
    );
    await expect(resetAssistantDatabaseForTests(pool)).rejects.toThrow(
      /Unsafe assistant test database reset refused/,
    );
    await pool.end();
  });

  it("refuses reset when test URL equals DATABASE_URL", async () => {
    const url =
      "postgresql://portfolio:portfolio_dev@127.0.0.1:5433/portfolio_assistant_test";
    const previousDev = process.env.DATABASE_URL;
    process.env.DATABASE_URL = url;
    try {
      const pool = createPool(url);
      await expect(resetAssistantDatabaseForTests(pool)).rejects.toThrow(
        /must not equal DATABASE_URL/,
      );
      await pool.end();
    } finally {
      if (previousDev === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = previousDev;
      }
    }
  });
});

describe("legacy baseline eligibility (unit)", () => {
  it("requires pgvector, all assistant tables, and legacy schema_migrations rows", async () => {
    const tables = new Set([
      "assistant_retrieval_units",
      "assistant_ingestion_runs",
      "assistant_api_rate_limit_counters",
      "assistant_generation_evaluations",
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

  it("resolveLegacyBaselineMigration matches journal tag by SQL hash, not file list order", () => {
    const migrations = readMigrationFiles(assistantDrizzleMigrationConfig);
    const baseline = resolveLegacyBaselineMigration(
      assistantDrizzleMigrationConfig,
    );
    expect(baseline.hash).toBe(migrations[0]?.hash);

    const decoy = {
      hash: "f".repeat(64),
      folderMillis: 999_999,
      sql: [],
      bps: true,
    };
    const fromWrongOrder = resolveLegacyBaselineMigration(
      assistantDrizzleMigrationConfig,
      [decoy, baseline],
    );
    expect(fromWrongOrder.hash).toBe(baseline.hash);
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
      connect: async () => ({
        query: async (sql: string, params?: unknown[]) => {
          if (typeof sql === "string" && sql.startsWith("BEGIN")) {
            return { rows: [] };
          }
          if (typeof sql === "string" && sql.startsWith("COMMIT")) {
            return { rows: [] };
          }
          if (typeof sql === "string" && sql.startsWith("ROLLBACK")) {
            return { rows: [] };
          }
          if (typeof sql === "string" && sql.includes("INSERT INTO drizzle")) {
            inserts.push(params ?? []);
          }
          if (
            typeof sql === "string" &&
            sql.includes("COUNT(*)") &&
            sql.includes("__drizzle_migrations")
          ) {
            return { rows: [{ count: 0 }] };
          }
          return { rows: [] };
        },
        release: () => {},
      }),
    };

    const real = resolveLegacyBaselineMigration(
      assistantDrizzleMigrationConfig,
    );
    const decoy = {
      hash: "c".repeat(64),
      folderMillis: 999,
      sql: [],
      bps: true,
    };

    await seedLegacyBaselineJournal(
      pool as unknown as import("pg").Pool,
      assistantDrizzleMigrationConfig,
      () => {},
      [decoy, real],
    );

    expect(inserts).toHaveLength(1);
    expect(inserts[0]).toEqual([real.hash, real.folderMillis]);
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

    it("1 — fresh database: normal Drizzle migrate succeeds", async () => {
      await resetAssistantDatabaseForTests(pool);
      await runMigrations(pool, { log: () => {} });

      expect(await countDrizzleJournalRows(pool)).toBe(1);
      const checks = await verifyAssistantSchema(pool);
      expect(checks.every((check) => check.ok)).toBe(true);
    });

    it("2 — complete legacy database: migrate refuses adoption without journal writes", async () => {
      await resetAssistantDatabaseForTests(pool);
      await applyLegacySqlMigrations(pool);

      await expect(
        runMigrations(pool, { log: () => {} }),
      ).rejects.toBeInstanceOf(LegacyAdoptionRequiredError);
      expect(await countDrizzleJournalRows(pool)).toBe(0);
    });

    it("3 — complete legacy database: explicit baseline succeeds", async () => {
      await resetAssistantDatabaseForTests(pool);
      await applyLegacySqlMigrations(pool);

      await runLegacyBaselineAdoption(pool, assistantDrizzleMigrationConfig, {
        log: () => {},
      });

      expect(await countDrizzleJournalRows(pool)).toBe(1);
      const checks = await verifyAssistantSchema(pool);
      expect(checks.every((check) => check.ok)).toBe(true);
    });

    it("4 — baselined database: normal migrate succeeds repeatedly", async () => {
      await resetAssistantDatabaseForTests(pool);
      await applyLegacySqlMigrations(pool);
      await runLegacyBaselineAdoption(pool, assistantDrizzleMigrationConfig, {
        log: () => {},
      });

      await expect(
        runMigrations(pool, { log: () => {} }),
      ).resolves.toBeUndefined();
      await expect(
        runMigrations(pool, { log: () => {} }),
      ).resolves.toBeUndefined();
      expect(await countDrizzleJournalRows(pool)).toBe(1);
    });

    it("5 — partial legacy database: baseline rejects without journal writes", async () => {
      await resetAssistantDatabaseForTests(pool);
      await applyLegacySqlMigrations(pool, [
        LEGACY_ASSISTANT_MIGRATION_FILES[0]!,
      ]);

      await expect(
        runLegacyBaselineAdoption(pool, assistantDrizzleMigrationConfig, {
          log: () => {},
        }),
      ).rejects.toBeInstanceOf(LegacyBaselineIneligibleError);
      expect(await countDrizzleJournalRows(pool)).toBe(0);
    });

    it("6 — already Drizzle-managed database: baseline rejects", async () => {
      await resetAssistantDatabaseForTests(pool);
      await runMigrations(pool, { log: () => {} });

      await expect(
        runLegacyBaselineAdoption(pool, assistantDrizzleMigrationConfig, {
          log: () => {},
        }),
      ).rejects.toBeInstanceOf(LegacyBaselineAlreadyAdoptedError);
    });

    it("7 — multiple migration metadata: baseline registers only the initial tag", async () => {
      await resetAssistantDatabaseForTests(pool);
      await applyLegacySqlMigrations(pool);

      const initial = resolveLegacyBaselineMigration(
        assistantDrizzleMigrationConfig,
      );
      const pending = {
        hash: "d".repeat(64),
        folderMillis: initial.folderMillis + 1,
        sql: [],
        bps: true,
      };

      await seedLegacyBaselineJournal(
        pool,
        assistantDrizzleMigrationConfig,
        () => {},
        [pending, initial],
      );

      expect(await countDrizzleJournalRows(pool)).toBe(1);
      const journal = await pool.query(
        "SELECT hash, created_at FROM drizzle.__drizzle_migrations",
      );
      expect(journal.rows[0]?.hash).toBe(initial.hash);
      expect(Number(journal.rows[0]?.created_at)).toBe(initial.folderMillis);
    });
  },
);
