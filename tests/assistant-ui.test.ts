import { describe, expect, it } from "vitest";

import { parseAssistantGenerateSuccessBody } from "@/lib/assistant/client/post-generate";
import { resolveCitationHref } from "@/lib/assistant/ui/citation-href";
import {
  buildUsageFooterParts,
  formatModelDisplayName,
  formatUsageFooterLine,
} from "@/lib/assistant/ui/format-usage-footer";
import { extractHttpUrlsFromText } from "@/lib/assistant/ui/extract-http-urls";
import { toVisitorHref } from "@/lib/assistant/ui/visitor-href";

describe("extractHttpUrlsFromText", () => {
  it("dedupes normalized URLs", () => {
    expect(
      extractHttpUrlsFromText(
        "See https://michaeltruong.ai/projects/savepoints and https://michaeltruong.ai/projects/savepoints/.",
      ),
    ).toEqual(["https://michaeltruong.ai/projects/savepoints"]);
  });
});

describe("resolveCitationHref", () => {
  it("returns null until the public API exposes authoritative citation URLs", () => {
    expect(
      resolveCitationHref({
        evidence_id: "E1",
        unit_id: "unit/portfolio/savepoints-architecture-b02",
      }),
    ).toBeNull();
  });
});

describe("toVisitorHref", () => {
  it("strips origin for michaeltruong.ai links", () => {
    expect(toVisitorHref("https://michaeltruong.ai/articles")).toBe(
      "/articles",
    );
  });
});

describe("parseAssistantGenerateSuccessBody", () => {
  const valid = {
    answer: {
      claims: [
        {
          text: "Grounded claim.",
          attribution: "evidence_supported",
          citations: [{ evidence_id: "E1", unit_id: "unit/a" }],
        },
      ],
      answer_text: "Grounded claim.",
      citations: [{ evidence_id: "E1", unit_id: "unit/a" }],
      support_level: "full",
      abstained: false,
    },
    usage: { model: "gpt-4o-mini", prompt_tokens: 1, completion_tokens: 2 },
  };

  it("accepts a minimal valid success body", () => {
    expect(parseAssistantGenerateSuccessBody(valid)).toEqual(valid);
  });

  it("rejects missing claims", () => {
    expect(
      parseAssistantGenerateSuccessBody({
        answer: { ...valid.answer, claims: [] },
      }),
    ).toBeNull();
  });

  it("rejects malformed JSON shapes", () => {
    expect(parseAssistantGenerateSuccessBody(null)).toBeNull();
    expect(parseAssistantGenerateSuccessBody("{")).toBeNull();
  });
});

describe("format usage footer", () => {
  it("formats model display names", () => {
    expect(formatModelDisplayName("gpt-4o-mini")).toBe("GPT-4o mini");
  });

  it("omits footer when usage is empty", () => {
    expect(buildUsageFooterParts(undefined)).toBeUndefined();
    expect(buildUsageFooterParts({})).toBeUndefined();
  });

  it("never zero-fills missing token fields", () => {
    const parts = buildUsageFooterParts({
      model: "gpt-4o-mini",
      prompt_tokens: 1842,
    });
    expect(parts?.promptTokens).toBe(1842);
    expect(parts?.completionTokens).toBeUndefined();
    expect(formatUsageFooterLine(parts!)).toBe(
      "GPT-4o mini · 1,842 input tokens",
    );
  });
});
