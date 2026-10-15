import { describe, expect, it, vi } from "vitest";

import {
  type HandleAssistantGenerateDeps,
  handleAssistantGeneratePost,
} from "@/lib/assistant/api/handle-generate-post";
import {
  assertNoDisallowedPublicKeys,
  buildPublicUsageFromDiagnostics,
} from "@/lib/assistant/api/public-envelope";

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
}): HandleAssistantGenerateDeps {
  const pool = { end: vi.fn(async () => {}) };
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
  } as unknown as HandleAssistantGenerateDeps;
}

describe("assistant generation API handler", () => {
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
    });
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

  it("maps validation errors to safe client messages without usage", async () => {
    const deps = createDeps({
      runRagGeneration: vi.fn(async () => {
        const { QueryValidationError } =
          await import("@/scripts/assistant/generation/errors.mjs");
        throw new QueryValidationError("question must be non-empty");
      }),
    });

    const response = await handleAssistantGeneratePost(
      new Request("http://localhost/api/assistant/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: "   " }),
      }),
      deps,
    );

    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.message).not.toContain("non-empty");
    expect(body.usage).toBeUndefined();
  });

  it("rejects oversized bodies", async () => {
    const deps = {
      ...createDeps({}),
      resolveConfig: () => ({
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

  it("imports runRagGeneration from the shared service module", async () => {
    const mod = await import("@/lib/assistant/api/handle-generate-post");
    expect(mod.handleAssistantGeneratePost).toBeDefined();
    const service =
      await import("@/scripts/assistant/generation/run-generation.mjs");
    expect(service.runRagGeneration).toBeTypeOf("function");
  });
});
