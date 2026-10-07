import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPool } from "@/scripts/assistant/db/client.mjs";
import { runMigrations } from "@/scripts/assistant/db/migrate.mjs";

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

    it("has the vector extension enabled", async () => {
      const result = await pool.query(
        "SELECT extname FROM pg_extension WHERE extname = 'vector'",
      );
      expect(result.rows).toHaveLength(1);
    });

    it("creates assistant_retrieval_units with vector(1536) embedding column", async () => {
      const tableResult = await pool.query(
        `
        SELECT column_name, udt_name
        FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'assistant_retrieval_units'
        ORDER BY ordinal_position
      `,
      );

      const columns = new Map<string, string>(
        tableResult.rows.map(
          (row: { column_name: string; udt_name: string }) => [
            row.column_name,
            row.udt_name,
          ],
        ),
      );

      expect(columns.get("unit_id")).toBe("text");
      expect(columns.get("embedding")).toBe("vector");
      expect(columns.get("sources")).toBe("jsonb");
      expect(columns.get("metadata")).toBe("jsonb");
    });

    it("records applied migrations", async () => {
      const result = await pool.query(
        "SELECT filename FROM schema_migrations WHERE filename = $1",
        ["20261007100000_assistant_pgvector.sql"],
      );
      expect(result.rows).toHaveLength(1);
    });

    it("creates btree filter indexes without an ANN vector index", async () => {
      const result = await pool.query(
        `
        SELECT indexname, indexdef
        FROM pg_indexes
        WHERE tablename = 'assistant_retrieval_units'
        ORDER BY indexname
      `,
      );

      const indexNames = result.rows.map(
        (row: { indexname: string }) => row.indexname,
      );
      expect(indexNames).toContain(
        "assistant_retrieval_units_source_class_idx",
      );
      expect(indexNames).toContain(
        "assistant_retrieval_units_okf_concept_id_idx",
      );

      const hasAnnIndex = result.rows.some((row: { indexdef: string }) =>
        /hnsw|ivfflat/i.test(row.indexdef),
      );
      expect(hasAnnIndex).toBe(false);
    });
  });
});
