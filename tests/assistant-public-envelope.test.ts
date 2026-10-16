import { describe, expect, it } from "vitest";

import {
  buildPublicAnswer,
  buildPublicUsageFromDiagnostics,
} from "@/lib/assistant/api/public-envelope";
import { deriveCitationsFromClaims } from "@/scripts/assistant/generation/response-schema.mjs";
import type { AssistantGenerationResponse } from "@/scripts/assistant/generation/response-schema.mjs";

function pollutedResponse(
  overrides: Partial<AssistantGenerationResponse> = {},
): AssistantGenerationResponse {
  const base = {
    claims: [
      {
        text: "Michael builds AI products.",
        attribution: "evidence_supported",
        sneaky_claim_field: "drop me",
        citations: [
          {
            evidence_id: "ev-portfolio-about",
            unit_id: "unit-about-1",
            url: "https://evil.example/phish",
            title: "not approved",
          },
        ],
      },
      {
        text: "He writes about agent workflows.",
        attribution: "general_knowledge",
        internal_score: 0.99,
      },
    ],
    answer_text:
      "Michael builds AI products.\n\nHe writes about agent workflows.",
    citations: [
      {
        evidence_id: "ev-portfolio-about",
        unit_id: "unit-about-1",
        url: "https://evil.example/top-level",
      },
    ],
    support_level: "partial",
    abstained: false,
    ...overrides,
  } as AssistantGenerationResponse;

  return base;
}

describe("buildPublicAnswer", () => {
  it("strips extra properties from claims and nested citations", () => {
    const answer = buildPublicAnswer(pollutedResponse());

    expect(answer.claims).toHaveLength(2);
    expect(answer.claims[0]).toEqual({
      text: "Michael builds AI products.",
      attribution: "evidence_supported",
      citations: [
        {
          evidence_id: "ev-portfolio-about",
          unit_id: "unit-about-1",
        },
      ],
    });
    expect(answer.claims[1]).toEqual({
      text: "He writes about agent workflows.",
      attribution: "general_knowledge",
    });
    expect(Object.keys(answer.claims[0])).toEqual([
      "text",
      "attribution",
      "citations",
    ]);
    expect(Object.keys(answer.claims[0].citations![0])).toEqual([
      "evidence_id",
      "unit_id",
    ]);
  });

  it("strips fabricated urls from top-level citations", () => {
    const answer = buildPublicAnswer(pollutedResponse());

    expect(answer.citations).toEqual([
      {
        evidence_id: "ev-portfolio-about",
        unit_id: "unit-about-1",
      },
    ]);
    expect(JSON.stringify(answer)).not.toContain("evil.example");
  });

  it("keeps nested and top-level citations consistent with derived citations", () => {
    const answer = buildPublicAnswer(pollutedResponse());

    expect(deriveCitationsFromClaims(answer.claims)).toEqual(answer.citations);
  });

  it("preserves claim order and optional citations omission", () => {
    const answer = buildPublicAnswer(pollutedResponse());

    expect(answer.claims.map((c) => c.text)).toEqual([
      "Michael builds AI products.",
      "He writes about agent workflows.",
    ]);
    expect(answer.claims[1].citations).toBeUndefined();
  });

  it("preserves abstention fields without extra model properties", () => {
    const answer = buildPublicAnswer(
      pollutedResponse({
        abstained: true,
        abstention_reason: "unsupported_personal_claim",
        claims: [
          {
            text: "Cannot verify.",
            attribution: "uncertain",
            prompt_injection: true,
          } as AssistantGenerationResponse["claims"][number],
        ],
        answer_text: "Cannot verify.",
        citations: [],
        support_level: "none",
      }),
    );

    expect(answer.abstained).toBe(true);
    expect(answer.abstention_reason).toBe("unsupported_personal_claim");
    expect(answer.claims[0]).toEqual({
      text: "Cannot verify.",
      attribution: "uncertain",
    });
  });
});

describe("buildPublicUsageFromDiagnostics", () => {
  it("is unchanged by public answer projection work", () => {
    const diagnosticsWithInternalFields = {
      model: "gpt-4o-mini",
      prompt_tokens: 10,
      completion_tokens: 5,
      total_tokens: 15,
      generation_latency_ms: 999,
    };
    expect(
      buildPublicUsageFromDiagnostics(
        diagnosticsWithInternalFields as Parameters<
          typeof buildPublicUsageFromDiagnostics
        >[0],
      ),
    ).toEqual({
      model: "gpt-4o-mini",
      prompt_tokens: 10,
      completion_tokens: 5,
      total_tokens: 15,
    });
  });
});
