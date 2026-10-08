import fs from "node:fs";
import path from "node:path";

import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  createPool,
  resolveAssistantDatabaseUrl,
} from "@/scripts/assistant/db/client.mjs";
import { loadEnvFiles } from "@/scripts/assistant/db/load-env.mjs";
import { embedTexts } from "@/scripts/assistant/embeddings/openai-embeddings.mjs";
import {
  evaluateRetrievalCase,
  formatEvalDiagnostics,
  formatEvalFailureMessage,
  hitMatchesSections,
  matchesUnitPattern,
} from "@/scripts/assistant/retrieve/eval.mjs";
import { searchRetrievalUnits } from "@/scripts/assistant/retrieve/search.mjs";

type EvalCase = {
  id: string;
  question: string;
  kind: "positive" | "negative_inspection" | "corpus_gap";
  top_k: number;
  expected_parent_concepts?: string[];
  expected_unit_any_of?: string[];
  expected_sections?: string[];
  min_parent_rank?: number;
  min_unit_rank?: number;
  require_specificity?: boolean;
};

type EvalHit = {
  rank: number;
  cosine_distance: number;
  similarity: number;
  unit_id: string;
  okf_concept_id: string;
  source_class: string;
  type: string;
  title: string;
  resource: string;
  retrieval_text: string;
  sources: unknown;
  metadata: unknown;
  section_heading?: string | null;
};

loadEnvFiles();

const evalDatabaseUrl = resolveAssistantDatabaseUrl();
const hasOpenAiKey = Boolean(process.env.OPENAI_API_KEY?.trim());
const hasEvalIntegration = Boolean(evalDatabaseUrl && hasOpenAiKey);

const fixturePath = path.join(
  process.cwd(),
  "tests/fixtures/assistant-retrieval/eval-cases.json",
);

const BASELINE_POSITIVE_IDS = [
  "experimentation-infrastructure",
  "managed-engineers",
  "return-to-ic",
  "attribution-experience",
  "ai-built",
  "developer-infrastructure",
] as const;

function loadEvalFixture(): {
  cases: EvalCase[];
  baseline_positive_ids?: string[];
} {
  return JSON.parse(fs.readFileSync(fixturePath, "utf8")) as {
    cases: EvalCase[];
    baseline_positive_ids?: string[];
  };
}

function loadEvalCases(): EvalCase[] {
  return loadEvalFixture().cases;
}

/** Fixture `baseline_positive_ids` is documentation only — must match the immutable constant. */
function assertFixtureBaselineMatchesConstant() {
  const fromFixture = loadEvalFixture().baseline_positive_ids;
  expect(fromFixture).toEqual([...BASELINE_POSITIVE_IDS]);
}

describe("assistant retrieval eval helpers", () => {
  it("fixture baseline_positive_ids matches immutable regression set", () => {
    assertFixtureBaselineMatchesConstant();
  });

  it("matches unit_id prefix globs and exact ids", () => {
    expect(
      matchesUnitPattern(
        "unit/portfolio/renovate-governance-b01-system",
        "unit/portfolio/renovate-governance*",
      ),
    ).toBe(true);
    expect(
      matchesUnitPattern(
        "unit/portfolio/experiment-measurement-b01-attribution",
        "unit/portfolio/experiment-measurement-b01-attribution",
      ),
    ).toBe(true);
    expect(
      matchesUnitPattern("unit/about/summary", "unit/about/atlassian-em-2020"),
    ).toBe(false);
  });

  it("evaluates positive parent and section expectations on mock hits", () => {
    const result = evaluateRetrievalCase(
      {
        id: "mock-attribution",
        question: "attribution?",
        kind: "positive",
        top_k: 3,
        expected_parent_concepts: [
          "portfolio/experiment-measurement-b01-attribution",
        ],
        expected_sections: ["Attribution"],
        min_parent_rank: 2,
      },
      [
        {
          rank: 1,
          cosine_distance: 0.2,
          similarity: 0.8,
          unit_id: "unit/other",
          okf_concept_id: "about/summary",
          source_class: "about",
          type: "t",
          title: "Summary",
          resource: "https://example.test",
          retrieval_text: "other",
          sources: [],
          metadata: {},
        },
        {
          rank: 2,
          cosine_distance: 0.25,
          similarity: 0.75,
          unit_id: "unit/portfolio/experiment-measurement-b01-attribution",
          okf_concept_id: "portfolio/experiment-measurement-b01-attribution",
          source_class: "portfolio",
          type: "t",
          title: "Attribution block",
          resource: "https://example.test",
          retrieval_text: "Attribution measurement work",
          sources: [],
          metadata: { section_heading: "Attribution" },
        },
      ],
    );

    expect(result.pass).toBe(true);
    expect(result.failureModes).toHaveLength(0);
  });

  it("records section mismatch as wrong_section", () => {
    const result = evaluateRetrievalCase(
      {
        id: "mock-section-miss",
        question: "attribution?",
        kind: "positive",
        top_k: 2,
        expected_parent_concepts: [
          "portfolio/experiment-measurement-b01-attribution",
        ],
        expected_sections: ["Attribution"],
        require_specificity: true,
      },
      [
        {
          rank: 1,
          cosine_distance: 0.1,
          similarity: 0.9,
          unit_id: "unit/portfolio/experiment-measurement-b01-attribution",
          okf_concept_id: "portfolio/experiment-measurement-b01-attribution",
          source_class: "portfolio",
          type: "t",
          title: "Pipeline",
          resource: "https://example.test",
          retrieval_text: "pipeline only",
          sources: [],
          metadata: {},
        },
      ],
    );

    expect(result.pass).toBe(false);
    expect(result.failureModes).toContain("wrong_section");
  });

  it("marks corpus_gap and negative_inspection as diagnostic (not scored pass)", () => {
    const corpusGap = evaluateRetrievalCase(
      {
        id: "gap",
        question: "agent memory?",
        kind: "corpus_gap",
        top_k: 3,
      },
      [],
    );
    expect(corpusGap.pass).toBeNull();
    expect(corpusGap.status).toBe("diagnostic");
    expect(corpusGap.diagnostics.eval_mode).toBe("diagnostic");

    const negative = evaluateRetrievalCase(
      {
        id: "neg",
        question: "nuclear?",
        kind: "negative_inspection",
        top_k: 3,
      },
      [
        {
          rank: 1,
          cosine_distance: 0.5,
          similarity: 0.5,
          unit_id: "unit/about/summary",
          okf_concept_id: "about/summary",
          source_class: "about",
          type: "t",
          title: "Summary",
          resource: "https://example.test",
          retrieval_text: "career",
          sources: [],
          metadata: {},
        },
      ],
    );
    expect(negative.pass).toBeNull();
    expect(negative.status).toBe("diagnostic");
  });

  it("reports missing parent in top-K with full diagnostic fields", () => {
    const outcome = evaluateRetrievalCase(
      {
        id: "parent-miss",
        question: "missing?",
        kind: "positive",
        top_k: 2,
        expected_parent_concepts: ["about/missing"],
      },
      [
        {
          rank: 1,
          cosine_distance: 0.1,
          similarity: 0.9,
          unit_id: "unit/about/summary",
          okf_concept_id: "about/summary",
          source_class: "about",
          type: "t",
          title: "Summary",
          resource: "https://example.test",
          retrieval_text: "x",
          sources: [],
          metadata: {},
        },
      ],
    );
    expect(outcome.pass).toBe(false);
    expect(outcome.status).toBe("fail");
    expect(outcome.failureModes).toContain("missing_parent_context");
    expect(outcome.diagnostics.failure_modes).toEqual([
      "missing_parent_context",
    ]);
    expect(outcome.diagnostics.blocking_failure_modes).toEqual([
      "missing_parent_context",
    ]);
  });

  it("formatEvalFailureMessage survives missing diagnostics", () => {
    expect(
      formatEvalFailureMessage({ pass: false, failureModes: ["x"] }),
    ).toContain("blocking_failure_modes=x");
    expect(formatEvalFailureMessage(null)).toContain(
      "blocking_failure_modes=(none reported)",
    );
    expect(formatEvalFailureMessage(null)).toContain("missing diagnostics");
  });

  it("matches section needles against retrieval_text when metadata lacks heading", () => {
    expect(
      hitMatchesSections(
        {
          rank: 1,
          cosine_distance: 0,
          similarity: 1,
          unit_id: "unit/x",
          okf_concept_id: "x",
          source_class: "portfolio",
          type: "t",
          title: "Block",
          resource: "https://example.test",
          retrieval_text: "Attribution models and holdouts",
          sources: [],
          metadata: {},
        },
        ["Attribution"],
      ),
    ).toBe(true);
  });
});

describe("assistant retrieval eval integration", () => {
  it("documents skip when DATABASE_URL or OPENAI_API_KEY is unset", () => {
    if (!hasEvalIntegration) {
      console.info(
        "assistant retrieval eval integration skipped: set DATABASE_URL and OPENAI_API_KEY (structure-aware corpus ingested)",
      );
    }
    expect(true).toBe(true);
  });

  describe.skipIf(!hasEvalIntegration)(
    "against ingested structure-aware index",
    () => {
      /** @type {import("pg").Pool} */
      let pool: import("pg").Pool;
      const cases = loadEvalCases();

      beforeAll(() => {
        pool = createPool(evalDatabaseUrl!);
      });

      afterAll(async () => {
        await pool.end();
      });

      it("has retrieval units in the assistant index", async () => {
        const result = await pool.query(
          `SELECT COUNT(*)::int AS count FROM assistant_retrieval_units`,
        );
        expect(result.rows[0]?.count).toBeGreaterThan(0);
      });

      it("regression: six baseline positive cases pass on expanded index", async () => {
        assertFixtureBaselineMatchesConstant();
        const baselineIds = new Set<string>(BASELINE_POSITIVE_IDS);
        const baselineCases = cases.filter((case_) =>
          baselineIds.has(case_.id),
        );
        expect(baselineCases).toHaveLength(BASELINE_POSITIVE_IDS.length);

        const failures: string[] = [];
        for (const case_ of baselineCases) {
          const [queryEmbedding] = await embedTexts([case_.question]);
          const hits = await searchRetrievalUnits(pool, {
            queryEmbedding,
            topK: case_.top_k,
          });
          const outcome = evaluateRetrievalCase(case_, hits as EvalHit[]);
          if (!outcome.pass) {
            failures.push(`${case_.id}: ${formatEvalFailureMessage(outcome)}`);
          }
        }
        expect(failures, failures.join("\n\n")).toHaveLength(0);
      });

      for (const case_ of cases) {
        it(`eval case: ${case_.id}`, async () => {
          const [queryEmbedding] = await embedTexts([case_.question]);
          expect(queryEmbedding).toBeTruthy();

          const hits = await searchRetrievalUnits(pool, {
            queryEmbedding,
            topK: case_.top_k,
          });

          const outcome = evaluateRetrievalCase(case_, hits as EvalHit[]);

          if (
            case_.kind === "corpus_gap" ||
            case_.kind === "negative_inspection"
          ) {
            console.info(formatEvalDiagnostics(outcome));
            expect(outcome.status).toBe("diagnostic");
            expect(outcome.pass).toBeNull();
            expect(outcome.diagnostics.eval_mode).toBe("diagnostic");
            if (case_.kind === "negative_inspection") {
              expect(outcome.diagnostics.hits).toHaveLength(
                Math.min(case_.top_k, hits.length),
              );
            }
            return;
          }

          if (
            outcome.failureModes.some((mode) => mode.startsWith("optional_"))
          ) {
            console.info(formatEvalDiagnostics(outcome));
          }

          expect(outcome.pass, formatEvalFailureMessage(outcome)).toBe(true);
        });
      }

      it("logs negative vs positive distance comparison (diagnostic only)", async () => {
        const positive = cases.find((c) => c.id === "managed-engineers");
        const negative = cases.find(
          (c) => c.id === "nuclear-reactor-negative-inspection",
        );
        expect(positive).toBeTruthy();
        expect(negative).toBeTruthy();

        const [positiveEmbedding] = await embedTexts([positive!.question]);
        const [negativeEmbedding] = await embedTexts([negative!.question]);

        const positiveHits = await searchRetrievalUnits(pool, {
          queryEmbedding: positiveEmbedding,
          topK: positive!.top_k,
        });
        const negativeHits = await searchRetrievalUnits(pool, {
          queryEmbedding: negativeEmbedding,
          topK: negative!.top_k,
        });

        const positiveBest = Number(positiveHits[0]?.cosine_distance ?? 2);
        const negativeBest = Number(negativeHits[0]?.cosine_distance ?? 0);

        console.info(
          JSON.stringify(
            {
              positive_case: positive!.id,
              positive_best_distance: positiveBest,
              negative_case: negative!.id,
              negative_best_distance: negativeBest,
              note: "Diagnostic only — compare distances manually; abstention thresholds are out of scope for this retrieval experiment.",
            },
            null,
            2,
          ),
        );

        expect(Number.isFinite(positiveBest)).toBe(true);
        expect(Number.isFinite(negativeBest)).toBe(true);
      });
    },
  );
});
