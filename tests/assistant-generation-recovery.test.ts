import { describe, expect, it, vi } from "vitest";

import { assembleEvidencePacket } from "@/scripts/assistant/generation/evidence-packet.mjs";
import { classifyGenerationFailure } from "@/scripts/assistant/generation/classify-generation-failure.mjs";
import {
  GenerationParseError,
  GenerationValidationError,
} from "@/scripts/assistant/generation/errors.mjs";
import {
  buildSafeAbstentionModel,
  normalizeCitationsForPacket,
  resolveValidatedModelResponse,
  stripHttpUrlsFromClaimText,
  tryDeterministicRecovery,
  tryGracefulDegradation,
} from "@/scripts/assistant/generation/recover-generation-response.mjs";
import { parseAssistantModelGenerationResponse } from "@/scripts/assistant/generation/response-schema.mjs";
import {
  accumulateChatCompletionUsage,
  runRagGeneration,
} from "@/scripts/assistant/generation/run-generation.mjs";
import { validateGenerationResponse } from "@/scripts/assistant/generation/validate-response.mjs";
import {
  categorizeValidationError,
  inferValidationStage,
} from "@/scripts/assistant/generation/validation-issues.mjs";
import { buildPublicUsageFromDiagnostics } from "@/lib/assistant/api/public-envelope";
import { checkApproximatePromptTokenBudget } from "@/scripts/assistant/generation/generation-config.mjs";
import {
  ASSISTANT_GENERATION_SYSTEM_INSTRUCTIONS,
  buildGenerationMessages,
  buildGenerationRetryUserMessage,
  buildGenerationRetryUserMessageWithinBudget,
} from "@/scripts/assistant/generation/prompt-templates.mjs";

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

type MockChatCompletion = {
  content: string;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
};

function mockChatFetchWithCompletions(
  completions: MockChatCompletion[],
  finishReason = "stop",
): typeof fetch {
  const queue = [...completions];
  return vi.fn(async () => {
    const next = queue.shift() ?? completions[completions.length - 1];
    const payload: Record<string, unknown> = {
      choices: [
        {
          message: { content: next.content },
          finish_reason: finishReason,
        },
      ],
    };
    if (next.usage !== undefined) {
      payload.usage = next.usage;
    }
    return new Response(JSON.stringify(payload), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  }) as typeof fetch;
}

function goodEvidenceModelJson(): string {
  return JSON.stringify({
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
}

async function testEvidencePacket() {
  return assembleEvidencePacket({
    matchedHits: [hit(1, "unit/a#intro", "a", "Alpha body")],
    assemblyMode: "top_k_only",
    characterBudget: 10_000,
  });
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
  it("preserves abstention when the model explicitly abstained with invalid claims", async () => {
    const packet = await assembleEvidencePacket({
      matchedHits: [hit(1, "unit/a#intro", "a", "Alpha body")],
      assemblyMode: "top_k_only",
      characterBudget: 10_000,
    });

    const model = {
      claims: [
        {
          text: "I cannot verify private compensation from the evidence.",
          attribution: "uncertain" as const,
        },
        {
          text: "Fabricated corpus claim.",
          attribution: "evidence_supported" as const,
          citations: [{ evidence_id: "E99", unit_id: "unit/a#intro" }],
        },
      ],
      support_level: "none" as const,
      abstained: true,
      abstention_reason: "unsupported_personal_claim" as const,
    };

    const degraded = tryGracefulDegradation(model, packet);
    expect(degraded.recovered).toBe(true);
    expect(degraded.model?.abstained).toBe(true);
    expect(degraded.model?.abstention_reason).toBe(
      "unsupported_personal_claim",
    );
    expect(degraded.model?.support_level).toBe("none");
    expect(validateGenerationResponse(degraded.model!, packet).valid).toBe(
      true,
    );
  });

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
    expect(result.diagnostics.prompt_tokens).toBe(200);
    expect(result.diagnostics.completion_tokens).toBe(100);
    expect(result.diagnostics.total_tokens).toBe(300);
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

function createCapturingTelemetry() {
  const events: Array<{
    event: string;
    properties: Record<string, string | number | boolean>;
  }> = [];
  const telemetry = {
    capture(
      event: string,
      properties: Record<string, string | number | boolean | undefined>,
    ) {
      const sanitized = Object.fromEntries(
        Object.entries(properties).filter(([, value]) => value !== undefined),
      ) as Record<string, string | number | boolean>;
      events.push({ event, properties: sanitized });
    },
    async flush() {},
  };
  return { telemetry, events };
}

describe("accumulateChatCompletionUsage", () => {
  it("adds total-only retry usage to initial component usage", () => {
    expect(
      accumulateChatCompletionUsage(
        { prompt_tokens: 10, completion_tokens: 5 },
        { total_tokens: 100 },
      ),
    ).toEqual({
      prompt_tokens: 10,
      completion_tokens: 5,
      total_tokens: 115,
    });
  });

  it("adds total-only initial usage to retry component usage", () => {
    expect(
      accumulateChatCompletionUsage(
        { total_tokens: 100 },
        { prompt_tokens: 10, completion_tokens: 5 },
      ),
    ).toEqual({
      prompt_tokens: 10,
      completion_tokens: 5,
      total_tokens: 115,
    });
  });

  it("aligns cumulative total with components when every pass reports both", () => {
    expect(
      accumulateChatCompletionUsage(
        { prompt_tokens: 11, completion_tokens: 4, total_tokens: 99 },
        { prompt_tokens: 22, completion_tokens: 6, total_tokens: 99 },
      ),
    ).toEqual({
      prompt_tokens: 33,
      completion_tokens: 10,
      total_tokens: 43,
    });
  });

  it("prefers component sums for contradictory totals on the same pass", () => {
    expect(
      accumulateChatCompletionUsage(
        { total_tokens: 20, prompt_tokens: 10, completion_tokens: 5 },
        { total_tokens: 28, prompt_tokens: 22, completion_tokens: 6 },
      ),
    ).toEqual({
      prompt_tokens: 32,
      completion_tokens: 11,
      total_tokens: 43,
    });
  });
});

describe("cumulative token usage on model retry", () => {
  const runConfig = {
    evidenceCharacterBudget: 10_000,
    approximatePromptTokenBudget: 50_000,
  };

  it("sums usage when initial and retry completions both report tokens", async () => {
    const packet = await testEvidencePacket();
    const result = await runRagGeneration({
      question: "What is Alpha?",
      evidencePacket: packet,
      config: runConfig,
      fetch: mockChatFetchWithCompletions([
        {
          content: "not-json",
          usage: { prompt_tokens: 11, completion_tokens: 4, total_tokens: 15 },
        },
        {
          content: goodEvidenceModelJson(),
          usage: { prompt_tokens: 22, completion_tokens: 6, total_tokens: 28 },
        },
      ]),
      apiKey: TEST_OPENAI_API_KEY,
    });

    expect(result.diagnostics.recovery_model_retry_succeeded).toBe(true);
    expect(result.diagnostics.prompt_tokens).toBe(33);
    expect(result.diagnostics.completion_tokens).toBe(10);
    expect(result.diagnostics.total_tokens).toBe(43);
    expect(buildPublicUsageFromDiagnostics(result.diagnostics)).toEqual({
      model: result.diagnostics.model,
      prompt_tokens: 33,
      completion_tokens: 10,
      total_tokens: 43,
    });
  });

  it("keeps initial usage when retry omits usage metadata", async () => {
    const packet = await testEvidencePacket();
    const result = await runRagGeneration({
      question: "What is Alpha?",
      evidencePacket: packet,
      config: runConfig,
      fetch: mockChatFetchWithCompletions([
        {
          content: "not-json",
          usage: { prompt_tokens: 40, completion_tokens: 10, total_tokens: 50 },
        },
        { content: goodEvidenceModelJson() },
      ]),
      apiKey: TEST_OPENAI_API_KEY,
    });

    expect(result.diagnostics.prompt_tokens).toBe(40);
    expect(result.diagnostics.completion_tokens).toBe(10);
    expect(result.diagnostics.total_tokens).toBe(50);
  });

  it("keeps retry usage when initial completion omits usage metadata", async () => {
    const packet = await testEvidencePacket();
    const result = await runRagGeneration({
      question: "What is Alpha?",
      evidencePacket: packet,
      config: runConfig,
      fetch: mockChatFetchWithCompletions([
        { content: "not-json" },
        {
          content: goodEvidenceModelJson(),
          usage: { prompt_tokens: 7, completion_tokens: 3, total_tokens: 10 },
        },
      ]),
      apiKey: TEST_OPENAI_API_KEY,
    });

    expect(result.diagnostics.prompt_tokens).toBe(7);
    expect(result.diagnostics.completion_tokens).toBe(3);
    expect(result.diagnostics.total_tokens).toBe(10);
  });

  it("omits token fields when neither completion reports usage", async () => {
    const packet = await testEvidencePacket();
    const result = await runRagGeneration({
      question: "What is Alpha?",
      evidencePacket: packet,
      config: runConfig,
      fetch: mockChatFetchWithCompletions([
        { content: "not-json" },
        { content: goodEvidenceModelJson() },
      ]),
      apiKey: TEST_OPENAI_API_KEY,
    });

    expect(result.diagnostics.prompt_tokens).toBeUndefined();
    expect(result.diagnostics.completion_tokens).toBeUndefined();
    expect(result.diagnostics.total_tokens).toBeUndefined();
    expect(buildPublicUsageFromDiagnostics(result.diagnostics)).toBeUndefined();
  });

  it("does not accumulate usage when the first completion succeeds without retry", async () => {
    const packet = await testEvidencePacket();
    const result = await runRagGeneration({
      question: "What is Alpha?",
      evidencePacket: packet,
      config: runConfig,
      fetch: mockChatFetchWithCompletions([
        {
          content: goodEvidenceModelJson(),
          usage: { prompt_tokens: 9, completion_tokens: 2, total_tokens: 11 },
        },
      ]),
      apiKey: TEST_OPENAI_API_KEY,
    });

    expect(result.diagnostics.recovery_model_retry_attempted).toBeFalsy();
    expect(result.diagnostics.prompt_tokens).toBe(9);
    expect(result.diagnostics.completion_tokens).toBe(2);
    expect(result.diagnostics.total_tokens).toBe(11);
  });

  it("does not accumulate usage for deterministic recovery without model retry", async () => {
    const packet = await testEvidencePacket();
    const result = await runRagGeneration({
      question: "What is Alpha?",
      evidencePacket: packet,
      config: runConfig,
      fetch: mockChatFetchWithCompletions([
        {
          content: JSON.stringify({
            claims: [
              {
                text: "See https://evil.test/phish for details.",
                attribution: "general_knowledge",
              },
            ],
            support_level: "none",
            abstained: false,
          }),
          usage: { prompt_tokens: 5, completion_tokens: 1, total_tokens: 6 },
        },
      ]),
      apiKey: TEST_OPENAI_API_KEY,
    });

    expect(result.diagnostics.recovery_deterministic_repair_applied).toBe(true);
    expect(result.diagnostics.recovery_model_retry_attempted).toBeFalsy();
    expect(result.diagnostics.prompt_tokens).toBe(5);
    expect(result.diagnostics.completion_tokens).toBe(1);
    expect(result.diagnostics.total_tokens).toBe(6);
  });

  it("uses final completion output for utilization after a successful retry", async () => {
    const packet = await testEvidencePacket();
    const { telemetry, events } = createCapturingTelemetry();
    await runRagGeneration({
      question: "What is Alpha?",
      evidencePacket: packet,
      config: {
        ...runConfig,
        maxOutputTokens: 512,
      },
      fetch: mockChatFetchWithCompletions([
        {
          content: "not-json",
          usage: {
            prompt_tokens: 10,
            completion_tokens: 400,
            total_tokens: 410,
          },
        },
        {
          content: goodEvidenceModelJson(),
          usage: {
            prompt_tokens: 12,
            completion_tokens: 256,
            total_tokens: 268,
          },
        },
      ]),
      apiKey: TEST_OPENAI_API_KEY,
      telemetry,
    });

    const completed = events.find(
      (event) => event.event === "assistant_generation_completed",
    );
    expect(completed?.properties.completion_tokens).toBe(656);
    expect(completed?.properties.output_token_utilization).toBeCloseTo(
      256 / 512,
      3,
    );
    expect(completed?.properties.output_token_utilization).toBeLessThanOrEqual(
      1,
    );
  });

  it("accumulates mixed total-only and component usage on retry success", async () => {
    const packet = await testEvidencePacket();
    const result = await runRagGeneration({
      question: "What is Alpha?",
      evidencePacket: packet,
      config: runConfig,
      fetch: mockChatFetchWithCompletions([
        {
          content: "not-json",
          usage: { prompt_tokens: 10, completion_tokens: 5 },
        },
        {
          content: goodEvidenceModelJson(),
          usage: { total_tokens: 100 },
        },
      ]),
      apiKey: TEST_OPENAI_API_KEY,
    });

    expect(result.diagnostics.prompt_tokens).toBe(10);
    expect(result.diagnostics.completion_tokens).toBe(5);
    expect(result.diagnostics.total_tokens).toBe(115);
    expect(buildPublicUsageFromDiagnostics(result.diagnostics)).toEqual({
      model: result.diagnostics.model,
      prompt_tokens: 10,
      completion_tokens: 5,
      total_tokens: 115,
    });
  });
});

describe("shared generation timeout budget", () => {
  const runConfig = {
    evidenceCharacterBudget: 10_000,
    approximatePromptTokenBudget: 50_000,
  };

  it("applies one timeout budget across initial and corrective completions", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      const packet = await testEvidencePacket();
      let calls = 0;
      const fetch: typeof globalThis.fetch = vi.fn(async () => {
        calls += 1;
        if (calls === 1) {
          return new Response(
            JSON.stringify({
              choices: [
                {
                  message: { content: "not-json" },
                  finish_reason: "stop",
                },
              ],
              usage: {
                prompt_tokens: 1,
                completion_tokens: 1,
                total_tokens: 2,
              },
            }),
            { status: 200, headers: { "Content-Type": "application/json" } },
          );
        }
        await new Promise((resolve) => {
          setTimeout(resolve, 500);
        });
        return new Response(
          JSON.stringify({
            choices: [
              {
                message: { content: goodEvidenceModelJson() },
                finish_reason: "stop",
              },
            ],
            usage: {
              prompt_tokens: 1,
              completion_tokens: 1,
              total_tokens: 2,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }) as typeof globalThis.fetch;

      const promise = runRagGeneration({
        question: "What is Alpha?",
        evidencePacket: packet,
        config: { ...runConfig, requestTimeoutMs: 400 },
        fetch,
        apiKey: TEST_OPENAI_API_KEY,
      });

      const rejection = expect(promise).rejects.toThrow(
        /timed out after 400ms/,
      );
      await vi.advanceTimersByTimeAsync(500);
      await rejection;
      expect(calls).toBe(2);
    } finally {
      vi.useRealTimers();
    }
  });

  it("does not start a corrective retry after the shared budget is exhausted", async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    try {
      let calls = 0;
      const fetch: typeof globalThis.fetch = vi.fn(async () => {
        calls += 1;
        await new Promise((resolve) => {
          setTimeout(resolve, 450);
        });
        return new Response(
          JSON.stringify({
            choices: [
              { message: { content: "not-json" }, finish_reason: "stop" },
            ],
            usage: {
              prompt_tokens: 1,
              completion_tokens: 1,
              total_tokens: 2,
            },
          }),
          { status: 200, headers: { "Content-Type": "application/json" } },
        );
      }) as typeof globalThis.fetch;

      const promise = runRagGeneration({
        question: "What is Alpha?",
        noRetrieval: true,
        config: { ...runConfig, requestTimeoutMs: 400 },
        fetch,
        apiKey: TEST_OPENAI_API_KEY,
      });

      const rejection = expect(promise).rejects.toThrow(
        /timed out after 400ms/,
      );
      await vi.advanceTimersByTimeAsync(500);
      await rejection;
      expect(calls).toBe(1);
    } finally {
      vi.useRealTimers();
    }
  });
});

describe("corrective retry failure classification", () => {
  const runConfig = {
    evidenceCharacterBudget: 10_000,
    approximatePromptTokenBudget: 50_000,
  };

  it("reports structural validation when retry JSON is valid but fails recovery", async () => {
    const packet = await testEvidencePacket();
    const invalidSchema = JSON.stringify({
      claims: [{ text: "Bad lead", attribution: "not_a_valid_attribution" }],
      support_level: "full",
      abstained: false,
    });

    try {
      await runRagGeneration({
        question: "What is Alpha?",
        evidencePacket: packet,
        config: runConfig,
        fetch: mockChatFetchWithCompletions([
          { content: "not-json" },
          { content: invalidSchema },
        ]),
        apiKey: TEST_OPENAI_API_KEY,
      });
      expect.unreachable("expected generation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(GenerationValidationError);
      expect(classifyGenerationFailure(error).failure_category).toBe(
        "structural_validation",
      );
    }
  });

  it("reports malformed JSON when the retry response is not JSON", async () => {
    const packet = await testEvidencePacket();
    const invalidSchema = JSON.stringify({
      claims: [{ text: "Bad lead", attribution: "not_a_valid_attribution" }],
      support_level: "full",
      abstained: false,
    });

    try {
      await runRagGeneration({
        question: "What is Alpha?",
        evidencePacket: packet,
        config: runConfig,
        fetch: mockChatFetchWithCompletions([
          { content: invalidSchema },
          { content: "still-not-json" },
        ]),
        apiKey: TEST_OPENAI_API_KEY,
      });
      expect.unreachable("expected generation to fail");
    } catch (error) {
      expect(error).toBeInstanceOf(GenerationParseError);
      expect(classifyGenerationFailure(error).failure_category).toBe(
        "malformed_json",
      );
    }
  });
});

describe("corrective retry prompt budget", () => {
  it("truncates validation feedback before exceeding the approximate token budget", () => {
    const baseUser = `Question:\n${"x".repeat(120)}\n\nEvidence packet:\n(no evidence entries)`;
    const errors = Array.from(
      { length: 12 },
      (_, index) => `validation issue ${index}: ${"detail ".repeat(30)}`,
    );

    const result = buildGenerationRetryUserMessageWithinBudget(
      ASSISTANT_GENERATION_SYSTEM_INSTRUCTIONS,
      baseUser,
      errors,
      900,
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(
        checkApproximatePromptTokenBudget(
          ASSISTANT_GENERATION_SYSTEM_INSTRUCTIONS,
          result.user,
          900,
        ).ok,
      ).toBe(true);
      expect(result.user.length).toBeLessThan(
        buildGenerationRetryUserMessage(baseUser, errors).length,
      );
    }
  });

  it("returns ok false when the base retry prompt alone exceeds the budget", () => {
    const baseUser = `Question:\n${"z".repeat(40_000)}`;
    const result = buildGenerationRetryUserMessageWithinBudget(
      ASSISTANT_GENERATION_SYSTEM_INSTRUCTIONS,
      baseUser,
      ["claims[0].text must be a non-empty string"],
      100,
    );
    expect(result.ok).toBe(false);
  });

  it("throws when corrective retry prompt exceeds the configured budget", async () => {
    const packet = await testEvidencePacket();
    const { system, user } = buildGenerationMessages("What is Alpha?", packet);
    const errors = Array.from(
      { length: 12 },
      (_, index) => `claims[${index}] validation detail ${"x".repeat(180)}`,
    );

    let tightBudget = 0;
    for (let budget = 500; budget <= 50_000; budget += 25) {
      const initialFits = checkApproximatePromptTokenBudget(
        system,
        user,
        budget,
      ).ok;
      const retryFits = buildGenerationRetryUserMessageWithinBudget(
        system,
        user,
        errors,
        budget,
      ).ok;
      if (initialFits && !retryFits) {
        tightBudget = budget;
        break;
      }
    }
    expect(tightBudget).toBeGreaterThan(0);

    await expect(
      runRagGeneration({
        question: "What is Alpha?",
        evidencePacket: packet,
        config: {
          evidenceCharacterBudget: 10_000,
          approximatePromptTokenBudget: tightBudget,
        },
        fetch: mockChatFetchWithCompletions([{ content: "not-json" }]),
        apiKey: TEST_OPENAI_API_KEY,
      }),
    ).rejects.toSatisfy((error: unknown) => {
      return (
        error instanceof GenerationValidationError &&
        classifyGenerationFailure(error).failure_category ===
          "prompt_budget_exceeded"
      );
    });
  });
});
