import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import type { EvidencePacket } from "@/scripts/assistant/generation/evidence-packet.mjs";
import {
  compareAssemblyModePackets,
  evaluateGenerationCase,
  evaluateGenerationResponse,
  formatGenerationEvalFailureMessage,
  GENERATION_EVAL_ASSEMBLY_MODES,
  scoreAttributionAccuracy,
  scoreCitationSupport,
  scoreGenerationSemantics,
} from "@/scripts/assistant/generation/eval.mjs";
import { runRagGeneration } from "@/scripts/assistant/generation/run-generation.mjs";
import { validateGenerationResponse } from "@/scripts/assistant/generation/validate-response.mjs";

type EvalCase = {
  id: string;
  question: string;
  category: string;
  packet_fixture: string;
  mock_model_response: {
    claims: Array<{
      text: string;
      attribution: string;
      citations?: Array<{ evidence_id: string; unit_id: string }>;
    }>;
    support_level: string;
    abstained: boolean;
    abstention_reason?: string;
  };
  expectations: Record<string, unknown>;
  expect_integrity_pass?: boolean;
  expect_semantic_pass?: boolean;
};

type EvalFixture = {
  cases: EvalCase[];
  assembly_comparison: {
    id: string;
    question: string;
    packet_fixtures: Record<string, string>;
  };
};

const fixtureRoot = path.join(
  process.cwd(),
  "tests/fixtures/assistant-generation",
);
const evalCasesPath = path.join(fixtureRoot, "eval-cases.json");

function loadEvalFixture(): EvalFixture {
  return JSON.parse(fs.readFileSync(evalCasesPath, "utf8")) as EvalFixture;
}

function loadPacket(fixtureFile: string): EvidencePacket {
  const packetPath = path.join(fixtureRoot, "packets", fixtureFile);
  return JSON.parse(fs.readFileSync(packetPath, "utf8")) as EvidencePacket;
}

describe("assistant generation eval scorers", () => {
  it("citation support fails when required substring is absent from cited evidence", () => {
    const packet = loadPacket("savepoints-top-k-only.json");
    const model = {
      claims: [
        {
          text: "Uses a fictional database.",
          attribution: "evidence_supported" as const,
          citations: [
            {
              evidence_id: "E1",
              unit_id: "unit/portfolio/savepoints-architecture-b02-capture",
            },
          ],
        },
      ],
      support_level: "full" as const,
      abstained: false,
    };

    const integrity = validateGenerationResponse(model, packet);
    expect(integrity.valid).toBe(true);

    const support = scoreCitationSupport(model, packet, [
      {
        claim_index: 0,
        required_evidence_substrings: ["fictional database"],
      },
    ]);
    expect(support.pass).toBe(false);
  });

  it("attribution accuracy flags personal facts labeled general_knowledge", () => {
    const model = {
      claims: [
        {
          text: "Michael led the experimentation platform in 2022.",
          attribution: "general_knowledge" as const,
        },
      ],
      support_level: "none" as const,
      abstained: false,
    };

    const result = scoreAttributionAccuracy(model, [
      {
        claim_index: 0,
        personal_markers: ["Michael", "experimentation platform"],
      },
    ]);
    expect(result.pass).toBe(false);
    expect(result.failure_modes[0]).toContain(
      "attribution_personal_as_general_knowledge",
    );
  });
});

describe("assistant generation eval fixture cases", () => {
  const cases = loadEvalFixture().cases;

  for (const case_ of cases) {
    it(`scores case ${case_.id}`, () => {
      const packet = loadPacket(case_.packet_fixture);
      const outcome = evaluateGenerationCase(
        {
          ...case_,
          mock_model_response:
            case_.mock_model_response as EvalCase["mock_model_response"] &
              import("@/scripts/assistant/generation/response-schema.mjs").AssistantModelGenerationResponse,
        },
        packet,
      );

      const integrity = validateGenerationResponse(
        case_.mock_model_response as import("@/scripts/assistant/generation/response-schema.mjs").AssistantModelGenerationResponse,
        packet,
      );

      if (case_.expect_integrity_pass !== undefined) {
        expect(integrity.valid).toBe(case_.expect_integrity_pass);
      }

      const semantics = scoreGenerationSemantics(
        case_.mock_model_response as import("@/scripts/assistant/generation/response-schema.mjs").AssistantModelGenerationResponse,
        packet,
        case_.expectations as import("@/scripts/assistant/generation/eval.mjs").GenerationEvalSemanticExpectations,
      );

      if (case_.expect_semantic_pass !== undefined) {
        expect(semantics.pass).toBe(case_.expect_semantic_pass);
        return;
      }

      if (!outcome.pass) {
        throw new Error(formatGenerationEvalFailureMessage(outcome));
      }
      expect(outcome.pass).toBe(true);
    });
  }
});

describe("assistant generation assembly mode comparison", () => {
  it("compares no_retrieval, top_k_only, and full_parent frozen packets", () => {
    const comparison = loadEvalFixture().assembly_comparison;
    /** @type {Record<import("@/scripts/assistant/generation/eval.mjs").GenerationEvalAssemblyMode, EvidencePacket>} */
    const packetsByMode = {} as Record<
      (typeof GENERATION_EVAL_ASSEMBLY_MODES)[number],
      EvidencePacket
    >;

    for (const mode of GENERATION_EVAL_ASSEMBLY_MODES) {
      const file = comparison.packet_fixtures[mode];
      expect(file, `missing packet fixture for ${mode}`).toBeTruthy();
      packetsByMode[mode] = loadPacket(file);
    }

    const report = compareAssemblyModePackets(packetsByMode);
    expect(report.summary.no_retrieval.entry_count).toBe(0);
    expect(report.summary.top_k_only.entry_count).toBe(1);
    expect(report.summary.full_parent.entry_count).toBe(2);
    expect(report.retrieval_contribution.full_parent_expands_vs_top_k).toBe(
      true,
    );
    expect(
      report.retrieval_contribution.top_k_has_evidence_when_no_retrieval_empty,
    ).toBe(true);
  });

  it("full_parent packet enables broader citation support than top_k_only for shared claim", () => {
    const topK = loadPacket("savepoints-top-k-only.json");
    const fullParent = loadPacket("savepoints-full-parent.json");

    const topKModel = {
      claims: [
        {
          text: "Savepoints addresses ephemeral agent VMs forgetting useful learnings.",
          attribution: "evidence_inferred" as const,
          citations: [
            {
              evidence_id: "E1",
              unit_id: "unit/portfolio/savepoints-architecture-b02-capture",
            },
          ],
        },
      ],
      support_level: "partial" as const,
      abstained: false,
    };

    const fullParentModel = {
      claims: [
        {
          text: "Savepoints addresses ephemeral agent VMs forgetting useful learnings.",
          attribution: "evidence_inferred" as const,
          citations: [
            {
              evidence_id: "E1",
              unit_id: "unit/portfolio/savepoints-architecture-b01-problem",
            },
          ],
        },
      ],
      support_level: "partial" as const,
      abstained: false,
    };

    expect(validateGenerationResponse(topKModel, topK).valid).toBe(true);
    expect(validateGenerationResponse(fullParentModel, fullParent).valid).toBe(
      true,
    );

    const topKOutcome = evaluateGenerationResponse(topKModel, topK, {
      citation_support: [
        {
          claim_index: 0,
          required_evidence_substrings: ["ephemeral"],
        },
      ],
    });
    expect(topKOutcome.pass).toBe(false);

    const fullParentOutcome = evaluateGenerationResponse(
      fullParentModel,
      fullParent,
      {
        citation_support: [
          {
            claim_index: 0,
            required_evidence_substrings: ["ephemeral"],
          },
        ],
      },
    );
    expect(fullParentOutcome.pass).toBe(true);
  });
});

const hasLiveIntegration = Boolean(
  process.env.DATABASE_URL?.trim() && process.env.OPENAI_API_KEY?.trim(),
);

describe.skipIf(!hasLiveIntegration)(
  "assistant generation eval live integration",
  () => {
    it("runs frozen-packet generation without retrieval when secrets are set", async () => {
      const packet = loadPacket("savepoints-top-k-only.json");
      const mockContent = JSON.stringify({
        claims: [
          {
            text: "Savepoints uses a five-check rubric for durable capture.",
            attribution: "evidence_supported",
            citations: [
              {
                evidence_id: "E1",
                unit_id: "unit/portfolio/savepoints-architecture-b02-capture",
              },
            ],
          },
        ],
        support_level: "full",
        abstained: false,
      });

      const fetch = async () =>
        new Response(
          JSON.stringify({
            choices: [
              { message: { content: mockContent }, finish_reason: "stop" },
            ],
            usage: {
              prompt_tokens: 10,
              completion_tokens: 5,
              total_tokens: 15,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );

      const result = await runRagGeneration({
        question: "How does Savepoints capture learnings?",
        evidencePacket: packet,
        fetch: fetch as typeof globalThis.fetch,
        apiKey: process.env.OPENAI_API_KEY,
      });

      expect(result.response?.claims.length).toBeGreaterThan(0);
      expect(result.packet.entries.length).toBe(1);
    });
  },
);
