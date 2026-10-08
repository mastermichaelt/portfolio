import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createPool } from "@/scripts/assistant/db/client.mjs";
import { resolveAssistantIngestTestDatabaseUrl } from "@/scripts/assistant/db/integration-test-database.mjs";
import { runMigrations } from "@/scripts/assistant/db/migrate.mjs";
import { EXPECTED_EMBEDDING_DIMENSIONS } from "@/scripts/assistant/embeddings/index-config.mjs";
import { formatVectorLiteral } from "@/scripts/assistant/ingest/vector-format.mjs";
import {
  formatResultsTable,
  parseRetrieveArgs,
  runAssistantRetrieve,
} from "@/scripts/assistant/retrieve.mjs";
import {
  PGVECTOR_COSINE_DISTANCE_OPERATOR,
  rankRetrievalRows,
  searchRetrievalUnits,
  similarityFromCosineDistance,
} from "@/scripts/assistant/retrieve/search.mjs";

let retrieveTestDatabaseUrl: string | undefined;
try {
  retrieveTestDatabaseUrl = resolveAssistantIngestTestDatabaseUrl();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  throw new Error(
    `Misconfigured ASSISTANT_TEST_DATABASE_URL for retrieve integration tests: ${message}`,
  );
}
const hasRetrieveTestDatabase = Boolean(retrieveTestDatabaseUrl);

const TEST_PREFIX = "test-retrieve";
const TEST_UNIT_IDS = [
  `unit/${TEST_PREFIX}/axis-0`,
  `unit/${TEST_PREFIX}/axis-1`,
  `unit/${TEST_PREFIX}/portfolio-only`,
];

function axisVector(axis: number, magnitude = 1) {
  const values = Array.from({ length: EXPECTED_EMBEDDING_DIMENSIONS }, () => 0);
  values[axis] = magnitude;
  return values;
}

async function upsertTestUnit(
  pool: import("pg").Pool,
  unitId: string,
  sourceClass: string,
  embedding: number[],
) {
  const now = new Date();
  await pool.query(
    `
    INSERT INTO assistant_retrieval_units (
      unit_id,
      okf_concept_id,
      okf_version,
      source_class,
      type,
      title,
      resource,
      retrieval_text,
      content_hash,
      embedding_model,
      embedding,
      sources,
      metadata,
      embedded_at,
      created_at,
      updated_at
    ) VALUES (
      $1, $2, '0.2-test', $3, 'test', $4, 'https://example.test/retrieve',
      $5, 'hash-test', 'text-embedding-3-small', $6::vector, '[]'::jsonb,
      '{}'::jsonb, $7, $7, $7
    )
    ON CONFLICT (unit_id) DO UPDATE SET
      source_class = EXCLUDED.source_class,
      embedding = EXCLUDED.embedding,
      updated_at = EXCLUDED.updated_at
    `,
    [
      unitId,
      unitId.replace(/^unit\//, ""),
      sourceClass,
      `Title ${unitId}`,
      `Body for ${unitId}`,
      formatVectorLiteral(embedding),
      now,
    ],
  );
}

describe("assistant retrieve helpers", () => {
  it("documents pgvector cosine distance semantics", () => {
    expect(PGVECTOR_COSINE_DISTANCE_OPERATOR).toBe("<=>");
    expect(similarityFromCosineDistance(0)).toBe(1);
    expect(similarityFromCosineDistance(0.25)).toBe(0.75);
  });

  it("parses CLI flags and query text", () => {
    const parsed = parseRetrieveArgs([
      "what",
      "is",
      "OKF?",
      "--top-k",
      "3",
      "--filter-source-class",
      "portfolio",
      "--json",
    ]);
    expect(parsed.query.join(" ")).toBe("what is OKF?");
    expect(parsed.topK).toBe(3);
    expect(parsed.sourceClass).toBe("portfolio");
    expect(parsed.json).toBe(true);
  });

  it("ranks rows with monotonic rank and similarity fields", () => {
    const ranked = rankRetrievalRows([
      { unit_id: "a", cosine_distance: "0.1", title: "A" },
      { unit_id: "b", cosine_distance: "0.5", title: "B" },
    ]);
    expect(ranked[0].rank).toBe(1);
    expect(ranked[0].cosine_distance).toBe(0.1);
    expect(ranked[0].similarity).toBeCloseTo(0.9);
    expect(ranked[1].rank).toBe(2);
  });

  it("formats a readable table for inspection", () => {
    const table = formatResultsTable(
      rankRetrievalRows([
        {
          unit_id: "unit/test/x",
          okf_concept_id: "test/x",
          source_class: "about",
          cosine_distance: 0,
          title: "Example",
        },
      ]),
    );
    expect(table).toContain("distance=0.000000");
    expect(table).toContain("unit/test/x");
  });
});

describe("assistant retrieve search", () => {
  it("documents integration skip when ASSISTANT_TEST_DATABASE_URL is unset", () => {
    if (!hasRetrieveTestDatabase) {
      console.info(
        "assistant retrieve integration tests skipped: ASSISTANT_TEST_DATABASE_URL not set",
      );
    }
    expect(true).toBe(true);
  });

  describe.skipIf(!hasRetrieveTestDatabase)(
    "with ASSISTANT_TEST_DATABASE_URL",
    () => {
      /** @type {import("pg").Pool} */
      let pool: import("pg").Pool;

      beforeAll(async () => {
        pool = createPool(retrieveTestDatabaseUrl!);
        await runMigrations(pool, { log: () => {} });

        await upsertTestUnit(pool, TEST_UNIT_IDS[0], "about", axisVector(0));
        await upsertTestUnit(pool, TEST_UNIT_IDS[1], "about", axisVector(1));
        await upsertTestUnit(
          pool,
          TEST_UNIT_IDS[2],
          "portfolio",
          axisVector(2),
        );
      });

      afterAll(async () => {
        await pool.query(
          `DELETE FROM assistant_retrieval_units WHERE unit_id = ANY($1::text[])`,
          [TEST_UNIT_IDS],
        );
        await pool.end();
      });

      it("orders hits by cosine distance for a fixed query embedding", async () => {
        const results = await searchRetrievalUnits(pool, {
          queryEmbedding: axisVector(1),
          topK: 3,
        });

        expect(results[0].unit_id).toBe(TEST_UNIT_IDS[1]);
        expect(results[0].cosine_distance).toBeCloseTo(0, 5);
        expect(results[0].rank).toBe(1);
        expect(results[0].similarity).toBeCloseTo(1, 5);
        expect(results.map((row) => row.unit_id)).toContain(TEST_UNIT_IDS[0]);
      });

      it("filters by source_class when requested", async () => {
        const results = await searchRetrievalUnits(pool, {
          queryEmbedding: axisVector(2),
          topK: 5,
          sourceClass: "portfolio",
        });

        expect(results).toHaveLength(1);
        expect(results[0].unit_id).toBe(TEST_UNIT_IDS[2]);
        expect(results[0].source_class).toBe("portfolio");
      });

      it("runs retrieve end-to-end with injected embeddings", async () => {
        const payload = await runAssistantRetrieve({
          query: "portfolio axis probe",
          topK: 2,
          json: true,
          pool,
          embedTexts: async () => [axisVector(0)],
          log: () => {},
        });

        expect(payload.distance_operator).toBe("<=>");
        expect(payload.results[0].unit_id).toBe(TEST_UNIT_IDS[0]);
      });
    },
  );
});
