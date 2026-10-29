import { describe, expect, it, vi } from "vitest";

import { assembleEvidencePacket } from "@/scripts/assistant/generation/evidence-packet.mjs";
import { GenerationParseError } from "@/scripts/assistant/generation/errors.mjs";
import {
  buildSafeAbstentionModel,
  normalizeCitationsForPacket,
  resolveValidatedModelResponse,
  stripHttpUrlsFromClaimText,
  tryDeterministicRecovery,
  tryGracefulDegradation,
} from "@/scripts/assistant/generation/recover-generation-response.mjs";
import { parseAssistantModelGenerationResponse } from "@/scripts/assistant/generation/response-schema.mjs";
import { runRagGeneration } from "@/scripts/assistant/generation/run-generation.mjs";
import { validateGenerationResponse } from "@/scripts/assistant/generation/validate-response.mjs";
import {
  categorizeValidationError,
  inferValidationStage,
} from "@/scripts/assistant/generation/validation-issues.mjs";

function hit(rank: number, unitId: string, conceptId: string, text: string) {
  return {
    rank,
    cosine_distance: 0.1 * rank,
    similarity: 1 - 0.1 * rank,
    unit_id: unitId,
    okf_concept_id: conceptId,
    source_class: "portfolio",
    type: "test",
    title: `Title ${unitId}`,
    resource: `https://example.test/${conceptId}`,
    retrieval_text: text,
    content_hash: `hash-${unitId}`,
  };
}

const TEST_OPENAI_API_KEY = "test-openai-api-key";

function mockChatFetch(
  content: string | string[],
  finishReason = "stop",
): typeof fetch {
  const queue = Array.isArray(content) ? [...content] : [content];
  return vi.fn(async () => {
    const next = queue.shift() ?? queue[0] ?? content;
    return new Response(
      JSON.stringify({
        choices: [
          {
            message: { content: next },
            finish_reason: finishReason,
          },
        ],
        usage: {
          prompt_tokens: 100,
          completion_tokens: 50,
          total_tokens: 150,
        },
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  }) as typeof fetch;
}

describe("validation issue taxonomy", () => {
  it("separates schema, recoverable citation, and integrity failures", () => {
    expect(categorizeValidationError("claims must be a non-empty array")).toBe(
      "schema",
    );
    expect(
      categorizeValidationError(
        "claims[0].citations[0] unit_id u2 does not match evidence packet entry u1 for E1",
      ),
    ).toBe("citation_recoverable");
    expect(
      categorizeValidationError(
        "claims[0].citations[0] references unknown evidence_id E99",
      ),
    ).toBe("citation_integrity");
    expect(
      categorizeValidationError(
        "claims[0] references URL not in evidence packet: https://evil.test",
      ),
    ).toBe("url_integrity");
    expect(inferValidationStage(["claims must be a non-empty array"])).toBe(
      "schema_parse",
    );
  });
});

describe("deterministic recovery", () => {
  it("fixes mismatched unit_id when evidence_id is valid", async () => {
    const packet = await assembleEvidencePacket({
      matchedHits: [hit(1, "unit/a#intro", "a", "Alpha body")],
      assemblyMode: "top_k_only",
      characterBudget: 10_000,
    });

    const model = {
      claims: [
        {
          text: "Alpha body from corpus.",
          attribution: "evidence_supported" as const,
          citations: [{ evidence_id: "E1", unit_id: "wrong-unit" }],
        },
      ],
      support_level: "full" as const,
      abstained: false,
    };

    const before = validateGenerationResponse(model, packet);
    expect(before.valid).toBe(false);

    const recovered = tryDeterministicRecovery(model, packet);
    expect(recovered.recovered).toBe(true);
    expect(recovered.model?.claims[0].citations?.[0].unit_id).toBe(
      "unit/a#intro",
    );
    expect(validateGenerationResponse(recovered.model!, packet).valid).toBe(
      true,
    );
  });

  it("strips presentation URLs from general_knowledge claims", () => {
    expect(
      stripHttpUrlsFromClaimText("See https://evil.test/x for more."),
    ).toBe("See for more.");
  });

  it("normalizes duplicate citations for the same evidence_id", async () => {
    const packet = await assembleEvidencePacket({
      matchedHits: [hit(1, "unit/a#intro", "a", "Alpha body")],
      assemblyMode: "top_k_only",
      characterBudget: 10_000,
    });

    const normalized = normalizeCitationsForPacket(
      [
        { evidence_id: "E1", unit_id: "unit/a#intro" },
        { evidence_id: "E1", unit_id: "unit/a#intro" },
      ],
      packet,
    );
    expect(normalized.citations).toHaveLength(1);
  });
});

describe("graceful degradation", () => {
  it("drops unsupported evidence claims and keeps supported ones", async () => {
    const packet = await assembleEvidencePacket({
      matchedHits: [hit(1, "unit/a#intro", "a", "Alpha body")],
      assemblyMode: "top_k_only",
      characterBudget: 10_000,
    });

    const model = {
      claims: [
        {
          text: "Fabricated corpus claim.",
          attribution: "evidence_supported" as const,
          citations: [{ evidence_id: "E99", unit_id: "unit/a#intro" }],
        },
        {
          text: "HTTP is stateless.",
          attribution: "general_knowledge" as const,
        },
      ],
      support_level: "full" as const,
      abstained: false,
    };

    const degraded = tryGracefulDegradation(model, packet);
    expect(degraded.recovered).toBe(true);
    expect(degraded.model?.claims).toHaveLength(1);
    expect(degraded.model?.claims[0].attribution).toBe("general_knowledge");
    expect(validateGenerationResponse(degraded.model!, packet).valid).toBe(
      true,
    );
  });

  it("returns a safe abstention when no claims survive filtering", async () => {
    const packet = await assembleEvidencePacket({
      matchedHits: [hit(1, "unit/a#intro", "a", "Alpha body")],
      assemblyMode: "top_k_only",
      characterBudget: 10_000,
    });

    const model = {
      claims: [
        {
          text: "Fabricated.",
          attribution: "evidence_supported" as const,
          citations: [{ evidence_id: "E99", unit_id: "unit/a#intro" }],
        },
      ],
      support_level: "full" as const,
      abstained: false,
    };

    const degraded = tryGracefulDegradation(model, packet);
    expect(degraded.recovered).toBe(true);
    expect(degraded.model?.abstained).toBe(true);
    expect(validateGenerationResponse(degraded.model!, packet).valid).toBe(
      true,
    );
    expect(buildSafeAbstentionModel().abstained).toBe(true);
  });
});

describe("resolveValidatedModelResponse", () => {
  it("recovers from invalid citation IDs without a model retry", async () => {
    const packet = await assembleEvidencePacket({
      matchedHits: [hit(1, "unit/a#intro", "a", "Alpha body")],
      assemblyMode: "top_k_only",
      characterBudget: 10_000,
    });

    const resolved = resolveValidatedModelResponse(
      {
        claims: [
          {
            text: "Fabricated.",
            attribution: "evidence_supported",
            citations: [{ evidence_id: "E99", unit_id: "unit/a#intro" }],
          },
        ],
        support_level: "full",
        abstained: false,
      },
      packet,
    );

    expect(resolved.ok).toBe(true);
    if (resolved.ok) {
      expect(resolved.recovery.graceful_degradation_applied).toBe(true);
      expect(resolved.model.abstained).toBe(true);
    }
  });
});

describe("runRagGeneration recovery integration", () => {
  it("recovers fabricated citations into a safe abstention response", async () => {
    const packet = await assembleEvidencePacket({
      matchedHits: [hit(1, "unit/a#intro", "a", "Alpha body")],
      assemblyMode: "top_k_only",
      characterBudget: 10_000,
    });

    const result = await runRagGeneration({
      question: "What is Alpha?",
      evidencePacket: packet,
      config: {
        evidenceCharacterBudget: 10_000,
        approximatePromptTokenBudget: 50_000,
      },
      fetch: mockChatFetch(
        JSON.stringify({
          claims: [
            {
              text: "Fabricated.",
              attribution: "evidence_supported",
              citations: [{ evidence_id: "E99", unit_id: "unit/a#intro" }],
            },
          ],
          support_level: "full",
          abstained: false,
        }),
      ),
      apiKey: TEST_OPENAI_API_KEY,
    });

    expect(result.response?.abstained).toBe(true);
    expect(result.diagnostics.recovery_graceful_degradation_applied).toBe(true);
    expect(result.response?.citations).toEqual([]);
  });

  it("retries once on malformed JSON then succeeds", async () => {
    const packet = await assembleEvidencePacket({
      matchedHits: [hit(1, "unit/a#intro", "a", "Alpha body")],
      assemblyMode: "top_k_only",
      characterBudget: 10_000,
    });

    const good = JSON.stringify({
      claims: [
        {
          text: "Alpha body from corpus.",
          attribution: "evidence_supported",
          citations: [{ evidence_id: "E1", unit_id: "unit/a#intro" }],
        },
      ],
      support_level: "full",
      abstained: false,
    });

    const result = await runRagGeneration({
      question: "What is Alpha?",
      evidencePacket: packet,
      config: {
        evidenceCharacterBudget: 10_000,
        approximatePromptTokenBudget: 50_000,
      },
      fetch: mockChatFetch(["not-json", good]),
      apiKey: TEST_OPENAI_API_KEY,
    });

    expect(result.response?.claims[0].text).toContain("Alpha body");
    expect(result.diagnostics.recovery_model_retry_attempted).toBe(true);
    expect(result.diagnostics.recovery_model_retry_succeeded).toBe(true);
  });

  it("throws after retry exhaustion on persistent malformed JSON", async () => {
    await expect(
      runRagGeneration({
        question: "Hello?",
        noRetrieval: true,
        config: {
          evidenceCharacterBudget: 10_000,
          approximatePromptTokenBudget: 50_000,
        },
        fetch: mockChatFetch(["not-json", "still-not-json"]),
        apiKey: TEST_OPENAI_API_KEY,
      }),
    ).rejects.toBeInstanceOf(GenerationParseError);
  });

  it("recovers presentation URL violations on general_knowledge claims", async () => {
    const packet = await assembleEvidencePacket({
      matchedHits: [hit(1, "unit/a#intro", "a", "Alpha body")],
      assemblyMode: "top_k_only",
      characterBudget: 10_000,
    });

    const result = await runRagGeneration({
      question: "What is Alpha?",
      evidencePacket: packet,
      config: {
        evidenceCharacterBudget: 10_000,
        approximatePromptTokenBudget: 50_000,
      },
      fetch: mockChatFetch(
        JSON.stringify({
          claims: [
            {
              text: "See https://evil.test/phish for details.",
              attribution: "general_knowledge",
            },
          ],
          support_level: "none",
          abstained: false,
        }),
      ),
      apiKey: TEST_OPENAI_API_KEY,
    });

    expect(result.response?.claims[0].text).not.toContain("https://");
    expect(result.diagnostics.recovery_deterministic_repair_applied).toBe(true);
    const parsed = parseAssistantModelGenerationResponse(result.response);
    expect(parsed.ok).toBe(true);
  });
});
