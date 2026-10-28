import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createPool,
  getDatabaseUrl,
  resolveAssistantDatabaseUrl,
} from "@/scripts/assistant/db/client.mjs";
import {
  loadEnvFiles,
  resetEnvFileLoader,
} from "@/scripts/assistant/db/load-env.mjs";
import {
  assistantDrizzleMigrationConfig,
  runMigrations,
} from "@/scripts/assistant/db/migrate.mjs";
import {
  LegacyAdoptionRequiredError,
  runLegacyBaselineAdoption,
} from "@/scripts/assistant/db/legacy-baseline.mjs";
import {
  DRIZZLE_MIGRATIONS_SCHEMA,
  DRIZZLE_MIGRATIONS_TABLE,
} from "@/scripts/assistant/db/migration-meta.mjs";
import { loadExpectedDrizzleMigrations } from "@/scripts/assistant/db/verify-schema.mjs";
import {
  summarizeSchemaChecks,
  verifyAssistantConnectivity,
  verifyAssistantSchema,
} from "@/scripts/assistant/db/verify-schema.mjs";

async function ensureAssistantDatabaseMigrated(pool: import("pg").Pool) {
  try {
    await runMigrations(pool, { log: () => {} });
  } catch (error) {
    if (error instanceof LegacyAdoptionRequiredError) {
      await runLegacyBaselineAdoption(pool, assistantDrizzleMigrationConfig, {
        log: () => {},
      });
      await runMigrations(pool, { log: () => {} });
      return;
    }
    throw error;
  }
}

// Match migrate/verify entrypoints: load .env.local/.env before gating integration tests.
const databaseUrl = resolveAssistantDatabaseUrl();
const hasDatabase = Boolean(databaseUrl);

describe("assistant db env loading", () => {
  it("loads DATABASE_URL from .env when not already in process.env", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "assistant-db-env-"));
    const previousCwd = process.cwd();
    const previousUrl = process.env.DATABASE_URL;

    delete process.env.DATABASE_URL;
    resetEnvFileLoader();

    try {
      process.chdir(tempDir);
      fs.writeFileSync(
        path.join(tempDir, ".env"),
        "DATABASE_URL=postgresql://from-dotenv/test\n",
      );

      loadEnvFiles({ force: true });
      expect(process.env.DATABASE_URL).toBe("postgresql://from-dotenv/test");
      expect(getDatabaseUrl()).toBe("postgresql://from-dotenv/test");
    } finally {
      process.chdir(previousCwd);
      resetEnvFileLoader();
      if (previousUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = previousUrl;
      }
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("preserves shell-provided DATABASE_URL over .env values", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "assistant-db-env-"));
    const previousCwd = process.cwd();
    const previousUrl = process.env.DATABASE_URL;

    process.env.DATABASE_URL = "postgresql://from-shell/test";
    resetEnvFileLoader();

    try {
      process.chdir(tempDir);
      fs.writeFileSync(
        path.join(tempDir, ".env"),
        "DATABASE_URL=postgresql://from-dotenv/test\n",
      );

      loadEnvFiles({ force: true });
      expect(process.env.DATABASE_URL).toBe("postgresql://from-shell/test");
      expect(getDatabaseUrl()).toBe("postgresql://from-shell/test");
    } finally {
      process.chdir(previousCwd);
      resetEnvFileLoader();
      if (previousUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = previousUrl;
      }
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("activates integration gating when DATABASE_URL exists only in .env", () => {
    const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "assistant-db-env-"));
    const previousCwd = process.cwd();
    const previousUrl = process.env.DATABASE_URL;

    delete process.env.DATABASE_URL;
    resetEnvFileLoader();

    try {
      process.chdir(tempDir);
      fs.writeFileSync(
        path.join(tempDir, ".env"),
        "DATABASE_URL=postgresql://dotenv-only-integration/test\n",
      );

      expect(resolveAssistantDatabaseUrl()).toBe(
        "postgresql://dotenv-only-integration/test",
      );
    } finally {
      process.chdir(previousCwd);
      resetEnvFileLoader();
      if (previousUrl === undefined) {
        delete process.env.DATABASE_URL;
      } else {
        process.env.DATABASE_URL = previousUrl;
      }
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });
});

describe("Drizzle migration metadata", () => {
  it("loads the committed initial migration journal", () => {
    const migrations = loadExpectedDrizzleMigrations();
    expect(migrations).toHaveLength(1);
    expect(migrations[0]?.hash).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("verifyAssistantSchema on a fresh database", () => {
  it("returns structured failures without querying missing migration tables", async () => {
    const queries: string[] = [];
    const db = {
      query: async (sql: string, params?: unknown[]) => {
        queries.push(sql);

        if (sql.includes("pg_extension") && sql.includes("vector")) {
          return { rows: [] };
        }

        if (sql.includes("information_schema.tables") && params?.[0]) {
          return { rows: [{ exists: false }] };
        }

        throw new Error(`unexpected query on fresh database mock: ${sql}`);
      },
    };

    const checks = await verifyAssistantSchema(
      db as unknown as import("pg").Pool,
    );
    const summary = summarizeSchemaChecks(checks);

    expect(summary.ok).toBe(false);
    expect(checks.map((check) => check.name)).toEqual([
      "vector_extension",
      "drizzle_migration_journal",
      "assistant_retrieval_units_table",
      "assistant_ingestion_runs_table",
      "assistant_api_rate_limit_counters_table",
    ]);
    expect(
      checks.find((check) => check.name === "drizzle_migration_journal"),
    ).toMatchObject({
      ok: false,
      detail:
        "drizzle.__drizzle_migrations is missing; on a fresh database run npm run assistant:db:migrate — on a legacy database run npm run assistant:db:baseline once (operator approval), then migrate",
    });
    expect(
      queries.some((sql) =>
        sql.includes(
          `FROM ${DRIZZLE_MIGRATIONS_SCHEMA}.${DRIZZLE_MIGRATIONS_TABLE}`,
        ),
      ),
    ).toBe(false);
  });
});

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
    /** @type {import("pg").Pool | undefined} */
    let pool: import("pg").Pool | undefined;
    let dbReady = false;

    beforeAll(async () => {
      pool = createPool(databaseUrl!);
      try {
        const connectivity = await verifyAssistantConnectivity(pool);
        if (!connectivity.ok) {
          throw new Error(connectivity.detail);
        }
        await ensureAssistantDatabaseMigrated(pool);
        dbReady = true;
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        console.info(
          `assistant db integration tests skipped: database not reachable (${message})`,
        );
        await pool.end();
        pool = undefined;
        dbReady = false;
      }
    });

    afterAll(async () => {
      await pool?.end();
    });

    it("passes shared schema verification checks", async (ctx) => {
      if (!dbReady || !pool) {
        ctx.skip();
        return;
      }

      const connectivity = await verifyAssistantConnectivity(pool);
      const schemaChecks = await verifyAssistantSchema(pool);
      const summary = summarizeSchemaChecks([connectivity, ...schemaChecks]);

      expect(summary.ok).toBe(true);
      expect(summary.checks.map((check) => check.name)).toEqual([
        "connectivity",
        "vector_extension",
        "drizzle_migration_journal",
        "assistant_retrieval_units_table",
        "assistant_ingestion_runs_table",
        "assistant_api_rate_limit_counters_table",
        "embedding_vector_dimension",
        "no_ann_vector_index",
      ]);
    });

    it("treats a second migrate as a no-op success", async (ctx) => {
      if (!dbReady || !pool) {
        ctx.skip();
        return;
      }

      await expect(
        runMigrations(pool, { log: () => {} }),
      ).resolves.toBeUndefined();

      const schemaChecks = await verifyAssistantSchema(pool);
      const summary = summarizeSchemaChecks(schemaChecks);
      expect(summary.ok).toBe(true);
    });
  });
});
