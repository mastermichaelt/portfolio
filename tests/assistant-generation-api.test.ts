import { describe, expect, it, vi } from "vitest";

import { resolveClientKeyFromHeaders } from "@/lib/assistant/api/client-key";
import {
  type HandleAssistantGenerateDeps,
  handleAssistantGeneratePost,
} from "@/lib/assistant/api/handle-generate-post";
import * as publicEnvelope from "@/lib/assistant/api/public-envelope";
import {
  assertNoDisallowedPublicKeys,
  buildPublicUsageFromDiagnostics,
} from "@/lib/assistant/api/public-envelope";
import { persistGenerationEvaluationSafely } from "@/lib/assistant/evaluation/persist";

const sampleResponse = {
  claims: [
    {
      text: "Michael builds AI products.",
      attribution: "general_knowledge" as const,
    },
  ],
  support_level: "none" as const,
  abstained: false,
  answer_text: "Michael builds AI products.",
  citations: [],
};

function createDeps(overrides: {
  runRagGeneration?: ReturnType<typeof vi.fn>;
  checkRateLimit?: ReturnType<typeof vi.fn>;
  persistGenerationEvaluation?: ReturnType<typeof vi.fn>;
  pool?: { end: ReturnType<typeof vi.fn> };
}): HandleAssistantGenerateDeps & {
  pool: { end: ReturnType<typeof vi.fn> };
} {
  const pool = overrides.pool ?? { end: vi.fn(async () => {}) };
  return {
    runRagGeneration:
      overrides.runRagGeneration ??
      vi.fn(async () => ({
        response: sampleResponse,
        packet: { entries: [], matched_hits: [] },
        diagnostics: {
          model: "gpt-4o-mini",
          prompt_tokens: 100,
          completion_tokens: 25,
          total_tokens: 125,
        },
        flushTelemetry: vi.fn(async () => {}),
      })),
    createPool: vi.fn(() => pool),
    resolveConfig: () => ({
      publicEnabled: true,
      maxBodyBytes: 16_384,
      rateLimitEnabled: true,
      perClientPerMinute: 8,
      perClientPerHour: 40,
      perClientPerDay: 120,
      globalPerDay: 2_000,
    }),
    checkRateLimit:
      overrides.checkRateLimit ??
      vi.fn(async () => ({ allowed: true as const })),
    persistGenerationEvaluation:
      overrides.persistGenerationEvaluation ?? vi.fn(async () => {}),
    pool,
  } as unknown as HandleAssistantGenerateDeps & {
    pool: { end: ReturnType<typeof vi.fn> };
  };
}

describe("assistant generation API handler", () => {
  it("returns 503 without opening a pool when public generation is disabled", async () => {
    const deps = createDeps({});
    deps.resolveConfig = () => ({
      publicEnabled: false,
      maxBodyBytes: 16_384,
      rateLimitEnabled: true,
      perClientPerMinute: 8,
      perClientPerHour: 40,
      perClientPerDay: 120,
      globalPerDay: 2_000,
    });

    const response = await handleAssistantGeneratePost(
      new Request("http://localhost/api/assistant/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "Who is Michael?" }),
      }),
      deps,
    );

    expect(response.status).toBe(503);
    expect(response.headers.get("Retry-After")).toBe("3600");
    const body = await response.json();
    expect(body.error.code).toBe("service_unavailable");
    expect(deps.createPool).not.toHaveBeenCalled();
    expect(deps.runRagGeneration).not.toHaveBeenCalled();
  });

  it("rejects non-POST methods", async () => {
    const response = await handleAssistantGeneratePost(
      new Request("http://localhost/api/assistant/generate", { method: "GET" }),
      createDeps({}),
    );
    expect(response.status).toBe(405);
  });

  it("returns public answer and allowlisted usage on success", async () => {
    const deps = createDeps({});
    const response = await handleAssistantGeneratePost(
      new Request("http://localhost/api/assistant/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-forwarded-for": "203.0.113.10",
        },
        body: JSON.stringify({ question: "Who is Michael?" }),
      }),
      deps,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.answer.claims).toHaveLength(1);
    expect(body.answer.answer_text).toBe(sampleResponse.answer_text);
    expect(body.usage).toEqual({
      model: "gpt-4o-mini",
      prompt_tokens: 100,
      completion_tokens: 25,
      total_tokens: 125,
    });
    expect(assertNoDisallowedPublicKeys(body)).toEqual([]);
    expect(deps.runRagGeneration).toHaveBeenCalledWith({
      question: "Who is Michael?",
      executionContext: "api",
      pool: deps.pool,
    });
    expect(deps.createPool).toHaveBeenCalledTimes(1);
    expect(deps.pool.end).toHaveBeenCalledTimes(1);
  });

  it("passes the same pool to rate limiting and generation", async () => {
    const deps = createDeps({});

    await handleAssistantGeneratePost(
      new Request("http://localhost/api/assistant/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "Pool reuse?" }),
      }),
      deps,
    );

    expect(deps.createPool).toHaveBeenCalledTimes(1);
    const checkCallPool = vi.mocked(deps.checkRateLimit).mock.calls[0]?.[0];
    const generationCallPool = vi.mocked(deps.runRagGeneration).mock
      .calls[0]?.[0]?.pool;
    expect(checkCallPool).toBe(deps.pool);
    expect(generationCallPool).toBe(deps.pool);
  });

  it("closes the pool once when rate limited before generation", async () => {
    const deps = createDeps({
      checkRateLimit: vi.fn(async () => ({
        allowed: false,
        retryAfterSeconds: 60,
        window: "minute",
      })),
    });

    await handleAssistantGeneratePost(
      new Request("http://localhost/api/assistant/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "Hi" }),
      }),
      deps,
    );

    expect(deps.createPool).toHaveBeenCalledTimes(1);
    expect(deps.runRagGeneration).not.toHaveBeenCalled();
    expect(deps.pool.end).toHaveBeenCalledTimes(1);
  });

  it("closes the pool once when generation throws", async () => {
    const deps = createDeps({
      runRagGeneration: vi.fn(async () => {
        const { GenerationValidationError } =
          await import("@/scripts/assistant/generation/errors.mjs");
        throw new GenerationValidationError("Model response failed validation");
      }),
    });

    await handleAssistantGeneratePost(
      new Request("http://localhost/api/assistant/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "Trigger error" }),
      }),
      deps,
    );

    expect(deps.createPool).toHaveBeenCalledTimes(1);
    expect(deps.pool.end).toHaveBeenCalledTimes(1);
  });

  it("omits usage when OpenAI token counts are unavailable", async () => {
    const deps = createDeps({
      runRagGeneration: vi.fn(async () => ({
        response: sampleResponse,
        packet: { entries: [] },
        diagnostics: { model: "gpt-4o-mini" },
        flushTelemetry: vi.fn(async () => {}),
      })),
    });

    const response = await handleAssistantGeneratePost(
      new Request("http://localhost/api/assistant/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "Hello" }),
      }),
      deps,
    );

    const body = await response.json();
    expect(body.usage).toBeUndefined();
    expect(
      buildPublicUsageFromDiagnostics({ model: "gpt-4o-mini" }),
    ).toBeUndefined();
  });

  it("does not include diagnostics or evidence packet fields in success JSON", async () => {
    const deps = createDeps({});
    const response = await handleAssistantGeneratePost(
      new Request("http://localhost/api/assistant/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "Test" }),
      }),
      deps,
    );
    const text = await response.text();
    expect(text).not.toContain("diagnostics");
    expect(text).not.toContain("matched_hits");
    expect(text).not.toContain("evidence_entry_count");
  });

  it("returns 429 when rate limited", async () => {
    const deps = createDeps({
      checkRateLimit: vi.fn(async () => ({
        allowed: false,
        retryAfterSeconds: 30,
        window: "minute",
      })),
    });

    const response = await handleAssistantGeneratePost(
      new Request("http://localhost/api/assistant/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "Hi" }),
      }),
      deps,
    );

    expect(response.status).toBe(429);
    expect(response.headers.get("Retry-After")).toBe("30");
    const body = await response.json();
    expect(body.error.code).toBe("rate_limited");
    expect(body.usage).toBeUndefined();
    expect(deps.runRagGeneration).not.toHaveBeenCalled();
  });

  describe("question validation before durable rate limits", () => {
    async function postQuestion(
      deps: ReturnType<typeof createDeps>,
      question: string,
    ) {
      return handleAssistantGeneratePost(
        new Request("http://localhost/api/assistant/generate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question }),
        }),
        deps,
      );
    }

    it.each([
      ["empty", ""],
      ["whitespace-only", "   "],
      ["overlong", "x".repeat(4_001)],
      ["null-byte", "hello\u0000world"],
    ])(
      "returns 400 for %s questions without rate limiting or pool",
      async (_label, question) => {
        const deps = createDeps({});
        const response = await postQuestion(deps, question);

        expect(response.status).toBe(400);
        const body = await response.json();
        expect(body.error.code).toBe("invalid_request");
        expect(body.error.message).not.toMatch(
          /non-empty|max length|null bytes/i,
        );
        expect(deps.checkRateLimit).not.toHaveBeenCalled();
        expect(deps.createPool).not.toHaveBeenCalled();
        expect(deps.runRagGeneration).not.toHaveBeenCalled();
      },
    );

    it("applies rate limits and generation for valid questions", async () => {
      const deps = createDeps({});
      const response = await postQuestion(deps, "  Who is Michael?  ");

      expect(response.status).toBe(200);
      expect(deps.checkRateLimit).toHaveBeenCalledTimes(1);
      expect(deps.createPool).toHaveBeenCalledTimes(1);
      expect(deps.runRagGeneration).toHaveBeenCalledWith({
        question: "Who is Michael?",
        executionContext: "api",
        pool: deps.pool,
      });
    });

    it("returns 429 for valid questions when rate limited without generation", async () => {
      const deps = createDeps({
        checkRateLimit: vi.fn(async () => ({
          allowed: false,
          retryAfterSeconds: 30,
          window: "minute",
        })),
      });

      const response = await postQuestion(deps, "Valid question?");

      expect(response.status).toBe(429);
      expect(deps.checkRateLimit).toHaveBeenCalledTimes(1);
      expect(deps.runRagGeneration).not.toHaveBeenCalled();
      expect(deps.pool.end).toHaveBeenCalledTimes(1);
    });
  });

  it("rejects oversized bodies", async () => {
    const deps = {
      ...createDeps({}),
      resolveConfig: () => ({
        publicEnabled: true,
        maxBodyBytes: 32,
        rateLimitEnabled: false,
        perClientPerMinute: 8,
        perClientPerHour: 40,
        perClientPerDay: 120,
        globalPerDay: 2_000,
      }),
    };

    const response = await handleAssistantGeneratePost(
      new Request("http://localhost/api/assistant/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "x".repeat(40) }),
      }),
      deps,
    );

    expect(response.status).toBe(413);
  });

  it("returns 503 when pool creation fails without leaking config details", async () => {
    const deps = createDeps({});
    deps.createPool = vi.fn(() => {
      throw new Error(
        "DATABASE_URL is required for assistant retrieval tooling (see .env.example)",
      );
    });

    const response = await handleAssistantGeneratePost(
      new Request("http://localhost/api/assistant/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "Hi" }),
      }),
      deps,
    );

    expect(response.status).toBe(503);
    const body = await response.json();
    expect(body.error.code).toBe("service_unavailable");
    expect(JSON.stringify(body)).not.toContain("DATABASE_URL");
  });

  it("rejects chunked oversized bodies without Content-Length", async () => {
    const deps = {
      ...createDeps({}),
      resolveConfig: () => ({
        publicEnabled: true,
        maxBodyBytes: 24,
        rateLimitEnabled: false,
        perClientPerMinute: 8,
        perClientPerHour: 40,
        perClientPerDay: 120,
        globalPerDay: 2_000,
      }),
    };

    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(new TextEncoder().encode('{"question":"'));
        controller.enqueue(new TextEncoder().encode("abcdefghijklmnop"));
        controller.enqueue(new TextEncoder().encode('"}'));
        controller.close();
      },
    });

    const response = await handleAssistantGeneratePost(
      new Request("http://localhost/api/assistant/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: stream,
        duplex: "half",
      } as RequestInit),
      deps,
    );

    expect(response.status).toBe(413);
  });

  it("enriches public citations from the evidence packet, not claim prose URLs", async () => {
    const savepointsEntry = {
      evidence_id: "E1",
      unit_id: "unit/portfolio/savepoints-architecture-b02-capture",
      okf_concept_id: "portfolio/savepoints-architecture",
      title: "Savepoints durable capture",
      resource: "https://michaeltruong.ai/projects/savepoints",
      retrieval_text: "Savepoints captures durable learnings.",
      content_hash: "hash-savepoints-b02",
      matched_retrieval: true,
    };

    const deps = createDeps({
      runRagGeneration: vi.fn(async () => ({
        response: {
          claims: [
            {
              text: "Savepoints captures learnings. Visit https://codenames-ai.com.",
              attribution: "evidence_supported",
              citations: [
                {
                  evidence_id: "E1",
                  unit_id: savepointsEntry.unit_id,
                },
              ],
            },
          ],
          answer_text:
            "Savepoints captures learnings. Visit https://codenames-ai.com.",
          citations: [{ evidence_id: "E1", unit_id: savepointsEntry.unit_id }],
          support_level: "full",
          abstained: false,
        },
        packet: { entries: [savepointsEntry], matched_hits: [] },
        diagnostics: {
          model: "gpt-4o-mini",
          prompt_tokens: 10,
          completion_tokens: 5,
          total_tokens: 15,
        },
        flushTelemetry: vi.fn(async () => {}),
      })),
    });

    const response = await handleAssistantGeneratePost(
      new Request("http://localhost/api/assistant/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "How does Savepoints capture?" }),
      }),
      deps,
    );

    expect(response.status).toBe(200);
    const body = await response.json();
    expect(body.answer.claims[0].citations[0]).toEqual({
      evidence_id: "E1",
      unit_id: savepointsEntry.unit_id,
      source_label: "Savepoints durable capture",
      source_url: "https://michaeltruong.ai/projects/savepoints",
    });
    expect(assertNoDisallowedPublicKeys(body)).toEqual([]);
  });

  it("uses the first x-forwarded-for entry as the rate-limit client key", () => {
    const headers = new Headers({
      "x-forwarded-for": "203.0.113.44, 198.51.100.1",
    });
    expect(resolveClientKeyFromHeaders(headers)).toBe("ip:203.0.113.44");
  });

  it("imports runRagGeneration from the shared service module", async () => {
    const mod = await import("@/lib/assistant/api/handle-generate-post");
    expect(mod.handleAssistantGeneratePost).toBeDefined();
    const service =
      await import("@/scripts/assistant/generation/run-generation.mjs");
    expect(service.runRagGeneration).toBeTypeOf("function");
  });

  it("persists evaluation on successful generation", async () => {
    const persistGenerationEvaluation = vi.fn(async () => {});
    const deps = createDeps({ persistGenerationEvaluation });

    await handleAssistantGeneratePost(
      new Request("http://localhost/api/assistant/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "Who is Michael?" }),
      }),
      deps,
    );

    expect(persistGenerationEvaluation).toHaveBeenCalledTimes(1);
    expect(persistGenerationEvaluation).toHaveBeenCalledWith(
      deps.pool,
      expect.objectContaining({
        status: "completed",
        question: "Who is Michael?",
      }),
    );
  });

  it("does not persist evaluation when rate limited", async () => {
    const persistGenerationEvaluation = vi.fn(async () => {});
    const deps = createDeps({
      checkRateLimit: vi.fn(async () => ({
        allowed: false,
        retryAfterSeconds: 30,
        window: "minute",
      })),
      persistGenerationEvaluation,
    });

    await handleAssistantGeneratePost(
      new Request("http://localhost/api/assistant/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "Hi" }),
      }),
      deps,
    );

    expect(persistGenerationEvaluation).not.toHaveBeenCalled();
  });

  it("persists failed evaluation when generation throws", async () => {
    const persistGenerationEvaluation = vi.fn(async () => null);
    const deps = createDeps({
      runRagGeneration: vi.fn(async () => {
        throw new Error("boom");
      }),
      persistGenerationEvaluation,
    });

    await handleAssistantGeneratePost(
      new Request("http://localhost/api/assistant/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "Fail?" }),
      }),
      deps,
    );

    expect(persistGenerationEvaluation).toHaveBeenCalledTimes(1);
    expect(persistGenerationEvaluation).toHaveBeenCalledWith(
      deps.pool,
      expect.objectContaining({
        status: "failed",
        question: "Fail?",
      }),
    );
  });

  it("persists one abstained evaluation row", async () => {
    const persistGenerationEvaluation = vi.fn(async () => null);
    const deps = createDeps({
      runRagGeneration: vi.fn(async () => ({
        response: {
          claims: [
            {
              text: "I cannot answer that.",
              attribution: "uncertain",
            },
          ],
          support_level: "none" as const,
          abstained: true,
          abstention_reason: "unsupported_personal_claim",
          answer_text: "I cannot answer that.",
          citations: [],
        },
        packet: { entries: [], matched_hits: [] },
        diagnostics: { evidence_entry_count: 0 },
        flushTelemetry: vi.fn(async () => {}),
      })),
      persistGenerationEvaluation,
    });

    const response = await handleAssistantGeneratePost(
      new Request("http://localhost/api/assistant/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "Personal?" }),
      }),
      deps,
    );

    expect(response.status).toBe(200);
    expect(persistGenerationEvaluation).toHaveBeenCalledTimes(1);
    expect(persistGenerationEvaluation).toHaveBeenCalledWith(
      deps.pool,
      expect.objectContaining({ status: "abstained" }),
    );
  });

  it("persists one failed row when public envelope validation fails", async () => {
    const persistGenerationEvaluation = vi.fn(async () => null);
    const envelopeSpy = vi
      .spyOn(publicEnvelope, "assertNoDisallowedPublicKeys")
      .mockReturnValue(["secret_field"]);

    const deps = createDeps({ persistGenerationEvaluation });

    const response = await handleAssistantGeneratePost(
      new Request("http://localhost/api/assistant/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "Who is Michael?" }),
      }),
      deps,
    );

    expect(response.status).toBe(500);
    expect(persistGenerationEvaluation).toHaveBeenCalledTimes(1);
    expect(persistGenerationEvaluation).toHaveBeenCalledWith(
      deps.pool,
      expect.objectContaining({
        status: "failed",
        failureCategory: "public_envelope_validation",
      }),
    );

    envelopeSpy.mockRestore();
  });

  it("persists one failed row when public answer construction throws", async () => {
    const persistGenerationEvaluation = vi.fn(async () => null);
    const buildSpy = vi
      .spyOn(publicEnvelope, "buildPublicAnswer")
      .mockImplementation(() => {
        throw new Error("public_answer_construction");
      });

    const deps = createDeps({ persistGenerationEvaluation });

    const response = await handleAssistantGeneratePost(
      new Request("http://localhost/api/assistant/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "Who is Michael?" }),
      }),
      deps,
    );

    expect(response.status).toBe(500);
    expect(persistGenerationEvaluation).toHaveBeenCalledTimes(1);
    expect(persistGenerationEvaluation).toHaveBeenCalledWith(
      deps.pool,
      expect.objectContaining({
        status: "failed",
        evidenceUnitIds: [],
      }),
    );

    buildSpy.mockRestore();
  });

  it("returns 200 when evaluation persistence fails (fail-open)", async () => {
    const persistGenerationEvaluation = vi.fn(
      (pool: import("pg").Pool, record: unknown) =>
        persistGenerationEvaluationSafely(pool, record as never, {
          insert: async () => {
            throw new Error("db down");
          },
        }),
    );
    const deps = createDeps({ persistGenerationEvaluation });

    const response = await handleAssistantGeneratePost(
      new Request("http://localhost/api/assistant/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "Who is Michael?" }),
      }),
      deps,
    );

    expect(response.status).toBe(200);
  });

  it("does not persist evaluation when question validation fails", async () => {
    const persistGenerationEvaluation = vi.fn(async () => null);
    const deps = createDeps({ persistGenerationEvaluation });

    await handleAssistantGeneratePost(
      new Request("http://localhost/api/assistant/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "" }),
      }),
      deps,
    );

    expect(persistGenerationEvaluation).not.toHaveBeenCalled();
  });

  it("classifies empty generation responses in failed evaluation rows", async () => {
    const persistGenerationEvaluation = vi.fn(async () => null);
    const deps = createDeps({
      runRagGeneration: vi.fn(async () => ({
        response: undefined,
        packet: { entries: [{ unit_id: "u1", evidence_id: "E1" }] },
        diagnostics: { evidence_entry_count: 1 },
        flushTelemetry: vi.fn(async () => {}),
      })),
      persistGenerationEvaluation,
    });

    await handleAssistantGeneratePost(
      new Request("http://localhost/api/assistant/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "Empty?" }),
      }),
      deps,
    );

    expect(persistGenerationEvaluation).toHaveBeenCalledWith(
      deps.pool,
      expect.objectContaining({
        status: "failed",
        failureCategory: "generation_empty_response",
        evidenceUnitIds: ["u1"],
      }),
    );
  });
});
