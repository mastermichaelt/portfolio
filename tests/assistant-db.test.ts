import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPool, getDatabaseUrl } from "@/scripts/assistant/db/client.mjs";
import {
  loadEnvFiles,
  resetEnvFileLoader,
} from "@/scripts/assistant/db/load-env.mjs";
import { runMigrations } from "@/scripts/assistant/db/migrate.mjs";
import {
  ASSISTANT_PGVECTOR_MIGRATION,
  summarizeSchemaChecks,
  verifyAssistantConnectivity,
  verifyAssistantSchema,
} from "@/scripts/assistant/db/verify-schema.mjs";

const databaseUrl = process.env.DATABASE_URL?.trim();
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
      "schema_migrations_table",
      "assistant_pgvector_migration",
      "assistant_retrieval_units_table",
    ]);
    expect(
      checks.find((check) => check.name === "schema_migrations_table"),
    ).toEqual({
      name: "schema_migrations_table",
      ok: false,
      detail:
        "schema_migrations table is missing; run npm run assistant:db:migrate",
    });
    expect(
      checks.find((check) => check.name === "assistant_pgvector_migration"),
    ).toMatchObject({
      ok: false,
      detail: `${ASSISTANT_PGVECTOR_MIGRATION} cannot be verified until schema_migrations exists`,
    });
    expect(
      queries.some((sql) =>
        sql.includes("FROM schema_migrations WHERE filename"),
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
        "schema_migrations_table",
        "assistant_pgvector_migration",
        "assistant_retrieval_units_table",
        "embedding_vector_dimension",
        "no_ann_vector_index",
      ]);
    });
  });
});
