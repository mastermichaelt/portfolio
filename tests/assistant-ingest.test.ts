import fs from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { createPool } from "@/scripts/assistant/db/client.mjs";
import { resolveAssistantIngestTestDatabaseUrl } from "@/scripts/assistant/db/integration-test-database.mjs";
import { runMigrations } from "@/scripts/assistant/db/migrate.mjs";
import { EXPECTED_EMBEDDING_DIMENSIONS } from "@/scripts/assistant/embeddings/index-config.mjs";
import { readOkfBundleSha256 } from "@/scripts/assistant/ingest/manifest.mjs";
import {
  loadExistingUnitFingerprints,
  planIngestActions,
  runIngestSync,
} from "@/scripts/assistant/ingest/sync.mjs";
import { formatVectorLiteral } from "@/scripts/assistant/ingest/vector-format.mjs";
import { sha256String } from "@/scripts/assistant/okf/manifest.mjs";

let ingestTestDatabaseUrl: string | undefined;
try {
  ingestTestDatabaseUrl = resolveAssistantIngestTestDatabaseUrl();
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  throw new Error(
    `Misconfigured ASSISTANT_TEST_DATABASE_URL for ingest integration tests: ${message}`,
  );
}
const hasIngestTestDatabase = Boolean(ingestTestDatabaseUrl);

const TEST_PREFIX = "test-ingest";
const TEST_UNIT_IDS = [`unit/${TEST_PREFIX}/alpha`, `unit/${TEST_PREFIX}/beta`];

function fakeVector(seed = 0) {
  return Array.from({ length: EXPECTED_EMBEDDING_DIMENSIONS }, (_, i) =>
    Number((seed + i * 0.0001).toFixed(6)),
  );
}

function makeTestUnit(
  slug: string,
  text: string,
): import("@/scripts/assistant/retrieval/unit-schema.mjs").RetrievalUnit {
  const okfConceptId = `${TEST_PREFIX}/${slug}`;
  return {
    unit_id: `unit/${okfConceptId}`,
    okf_concept_id: okfConceptId,
    okf_version: "0.2-test",
    source_class: "about",
    type: "test",
    title: `Test ${slug}`,
    resource: "https://example.test/ingest",
    sources: [
      {
        id: "test-source",
        title: "Test source",
        resource: "https://example.test/source",
      },
    ],
    tags: ["test-ingest"],
    text,
    content_hash: sha256String(text),
    metadata: { generated: { by: "test" } },
  };
}

describe("assistant ingest helpers", () => {
  it("formats pgvector literals", () => {
    expect(formatVectorLiteral([1, 2, 3])).toBe("[1,2,3]");
  });

  it("reads bundle_sha256 from manifest.json", () => {
    const tempDir = fs.mkdtempSync(
      path.join(os.tmpdir(), "assistant-ingest-manifest-"),
    );
    try {
      fs.writeFileSync(
        path.join(tempDir, "manifest.json"),
        JSON.stringify({
          outputs: { bundle_sha256: "abc123" },
        }),
      );
      expect(readOkfBundleSha256(tempDir)).toBe("abc123");
    } finally {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  it("plans skip, embed, and delete actions", () => {
    const units = [
      makeTestUnit("a", "alpha body"),
      makeTestUnit("b", "beta body"),
    ];
    const existing = new Map([
      [
        units[0].unit_id,
        {
          content_hash: units[0].content_hash,
          embedding_model: "text-embedding-3-small",
        },
      ],
      [
        "unit/orphan/stale",
        {
          content_hash: "deadbeef",
          embedding_model: "text-embedding-3-small",
        },
      ],
    ]);

    const plan = planIngestActions(units, existing, "text-embedding-3-small");

    expect(plan.skipped).toBe(1);
    expect(plan.toEmbed.map((unit) => unit.unit_id)).toEqual([
      units[1].unit_id,
    ]);
    expect(plan.deleted).toBe(1);
  });

  it("rejects zero derived units before any database access", async () => {
    const pool = { query: vi.fn() };
    const embedTexts = vi.fn(async () => []);

    await expect(
      runIngestSync(pool as unknown as import("pg").Pool, [], {
        okfBundleSha256: "test-empty",
        embeddingModel: "text-embedding-3-small",
        embedTexts,
      }),
    ).rejects.toThrow(
      "Ingestion aborted: zero retrieval units derived. Refusing to delete the index.",
    );

    expect(pool.query).not.toHaveBeenCalled();
    expect(embedTexts).not.toHaveBeenCalled();
  });
});

describe("assistant ingest sync", () => {
  it("documents integration skip when ASSISTANT_TEST_DATABASE_URL is unset", () => {
    if (!hasIngestTestDatabase) {
      console.info(
        "assistant ingest integration tests skipped: ASSISTANT_TEST_DATABASE_URL not set (use a dedicated *_test database — never DATABASE_URL)",
      );
    }
    expect(true).toBe(true);
  });

  describe.skipIf(!hasIngestTestDatabase)(
    "with ASSISTANT_TEST_DATABASE_URL",
    () => {
      /** @type {import("pg").Pool} */
      let pool: import("pg").Pool;

      beforeAll(async () => {
        pool = createPool(ingestTestDatabaseUrl!);
        await runMigrations(pool, { log: () => {} });
        await pool.query(
          `DELETE FROM assistant_retrieval_units WHERE unit_id = ANY($1::text[])`,
          [TEST_UNIT_IDS],
        );
      });

      afterAll(async () => {
        await pool.query(
          `DELETE FROM assistant_retrieval_units WHERE unit_id = ANY($1::text[])`,
          [TEST_UNIT_IDS],
        );
        await pool.end();
      });

      it("inserts, skips unchanged, updates on hash change, and deletes stale units", async () => {
        const alpha = makeTestUnit("alpha", "alpha v1");
        const beta = makeTestUnit("beta", "beta v1");
        const stale = makeTestUnit("stale", "stale v1");

        const embedCalls: string[][] = [];
        const embedTexts = async (texts: string[]) => {
          embedCalls.push(texts);
          return texts.map((_, index) => fakeVector(index + 1));
        };

        await runIngestSync(pool, [alpha, beta, stale], {
          okfBundleSha256: "test-bundle-1",
          embeddingModel: "text-embedding-3-small",
          embedTexts,
          log: () => {},
        });

        expect(embedCalls).toHaveLength(1);
        expect(embedCalls[0]).toHaveLength(3);

        const afterFirst = await loadExistingUnitFingerprints(pool);
        expect(afterFirst.has(alpha.unit_id)).toBe(true);
        expect(afterFirst.has(stale.unit_id)).toBe(true);

        embedCalls.length = 0;
        const second = await runIngestSync(pool, [alpha, beta], {
          okfBundleSha256: "test-bundle-2",
          embeddingModel: "text-embedding-3-small",
          embedTexts,
          log: () => {},
        });

        expect(second.counts.skipped).toBe(2);
        expect(second.counts.deleted).toBe(1);
        expect(embedCalls).toHaveLength(0);

        const alphaChanged = makeTestUnit("alpha", "alpha v2");
        embedCalls.length = 0;
        const third = await runIngestSync(pool, [alphaChanged, beta], {
          okfBundleSha256: "test-bundle-3",
          embeddingModel: "text-embedding-3-small",
          embedTexts,
          log: () => {},
        });

        expect(third.counts.skipped).toBe(1);
        expect(third.counts.updated).toBe(1);
        expect(embedCalls).toHaveLength(1);
        expect(embedCalls[0]).toEqual([alphaChanged.text]);

        const row = await pool.query(
          `SELECT content_hash FROM assistant_retrieval_units WHERE unit_id = $1`,
          [alphaChanged.unit_id],
        );
        expect(row.rows[0]?.content_hash).toBe(alphaChanged.content_hash);
      });

      it("rejects an empty derived unit list without wiping existing rows", async () => {
        const seed = makeTestUnit("seed-empty-guard", "seed body");
        const embedTexts = async (texts: string[]) =>
          texts.map((_, index) => fakeVector(index + 10));

        await runIngestSync(pool, [seed], {
          okfBundleSha256: "test-empty-guard-seed",
          embeddingModel: "text-embedding-3-small",
          embedTexts,
          log: () => {},
        });

        const before = await loadExistingUnitFingerprints(pool);
        expect(before.has(seed.unit_id)).toBe(true);

        await expect(
          runIngestSync(pool, [], {
            okfBundleSha256: "test-empty-guard",
            embeddingModel: "text-embedding-3-small",
            embedTexts,
            log: () => {},
          }),
        ).rejects.toThrow(/zero retrieval units derived/);

        const after = await loadExistingUnitFingerprints(pool);
        expect(after.has(seed.unit_id)).toBe(true);
        expect(after.size).toBe(before.size);

        await pool.query(
          `DELETE FROM assistant_retrieval_units WHERE unit_id = $1`,
          [seed.unit_id],
        );
      });
    },
  );
});
