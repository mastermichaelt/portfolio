import { afterAll, beforeAll, describe, expect, it } from "vitest";

import { createAssistantDb } from "@/db/client";
import { fetchParentUnitsForConcept } from "@/lib/assistant/db/fetch-parent-units";
import { createPool } from "@/scripts/assistant/db/client.mjs";
import { resolveAssistantIngestTestDatabaseUrl } from "@/scripts/assistant/db/integration-test-database.mjs";
import { prepareAssistantIntegrationTestDatabase } from "@/scripts/assistant/db/prepare-integration-test-database.mjs";
import { EXPECTED_EMBEDDING_DIMENSIONS } from "@/scripts/assistant/embeddings/index-config.mjs";
import { formatVectorLiteral } from "@/scripts/assistant/ingest/vector-format.mjs";

let testDatabaseUrl: string | undefined;
try {
  testDatabaseUrl = resolveAssistantIngestTestDatabaseUrl();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  throw new Error(
    `Misconfigured ASSISTANT_TEST_DATABASE_URL for parent-fetch integration tests: ${message}`,
  );
}
const hasTestDatabase = Boolean(testDatabaseUrl);

const CONCEPT_ID = "test-parent-fetch/concept-a";
const UNIT_IDS = [
  "unit/test-parent-fetch/chunk-2",
  "unit/test-parent-fetch/chunk-0",
  "unit/test-parent-fetch/chunk-1",
];

function unitVector(seed: number) {
  const values = Array.from({ length: EXPECTED_EMBEDDING_DIMENSIONS }, () => 0);
  values[seed] = 1;
  return values;
}

async function insertParentTestUnit(
  pool: import("pg").Pool,
  unitId: string,
  chunkIndex: number,
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
      $1, $2, '0.2-test', 'test', 'test', $3, 'https://example.test/parent',
      $4, $5, 'text-embedding-3-small', $6::vector, '[]'::jsonb,
      $7::jsonb, $8, $8, $8
    )
    ON CONFLICT (unit_id) DO UPDATE SET
      metadata = EXCLUDED.metadata,
      updated_at = EXCLUDED.updated_at
    `,
    [
      unitId,
      CONCEPT_ID,
      `Chunk ${chunkIndex}`,
      `Retrieval text chunk ${chunkIndex}`,
      `hash-${unitId}`,
      formatVectorLiteral(unitVector(chunkIndex)),
      JSON.stringify({ chunk_index: chunkIndex }),
      now,
    ],
  );
}

describe("assistant fetch parent units", () => {
  it("documents integration skip when ASSISTANT_TEST_DATABASE_URL is unset", () => {
    if (!hasTestDatabase) {
      console.info(
        "assistant parent-fetch integration tests skipped: ASSISTANT_TEST_DATABASE_URL not set",
      );
    }
    expect(true).toBe(true);
  });

  describe.skipIf(!hasTestDatabase)("with ASSISTANT_TEST_DATABASE_URL", () => {
    let pool: import("pg").Pool;
    let db: ReturnType<typeof createAssistantDb>;

    beforeAll(async () => {
      pool = createPool(testDatabaseUrl!);
      db = createAssistantDb(pool);
      await prepareAssistantIntegrationTestDatabase(pool, { log: () => {} });
      await pool.query(
        `DELETE FROM assistant_retrieval_units WHERE unit_id = ANY($1::text[])`,
        [UNIT_IDS],
      );

      await insertParentTestUnit(pool, UNIT_IDS[0], 2);
      await insertParentTestUnit(pool, UNIT_IDS[1], 0);
      await insertParentTestUnit(pool, UNIT_IDS[2], 1);
    });

    afterAll(async () => {
      await pool.query(
        `DELETE FROM assistant_retrieval_units WHERE unit_id = ANY($1::text[])`,
        [UNIT_IDS],
      );
      await pool.end();
    });

    it("orders units by metadata chunk_index then unit_id", async () => {
      const rows = await fetchParentUnitsForConcept(db, CONCEPT_ID);

      expect(rows.map((row) => row.unit_id)).toEqual([
        UNIT_IDS[1],
        UNIT_IDS[2],
        UNIT_IDS[0],
      ]);
      expect(rows.map((row) => row.chunk_index)).toEqual([0, 1, 2]);
    });
  });
});
