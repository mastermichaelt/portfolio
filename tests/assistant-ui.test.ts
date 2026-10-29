import { describe, expect, it } from "vitest";

import {
  buildCitationNumbering,
  citationIdentityKey,
  numbersForClaimCitations,
} from "@/lib/assistant/ui/citation-numbering";
import {
  appendLoadingTurn,
  resolveTurn,
} from "@/lib/assistant/ui/transcript-turns";
import { parseAssistantGenerateSuccessBody } from "@/lib/assistant/client/post-generate";
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
          citations: [
            {
              evidence_id: "E1",
              unit_id: "unit/a",
              source_label: "Savepoints durable capture",
              source_url: "https://michaeltruong.ai/projects/savepoints",
            },
          ],
        },
      ],
      answer_text: "Grounded claim.",
      citations: [
        {
          evidence_id: "E1",
          unit_id: "unit/a",
          source_label: "Savepoints durable capture",
          source_url: "https://michaeltruong.ai/projects/savepoints",
        },
      ],
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

  it("rejects citations with disallowed extra keys", () => {
    expect(
      parseAssistantGenerateSuccessBody({
        answer: {
          ...valid.answer,
          citations: [
            {
              evidence_id: "E1",
              unit_id: "unit/a",
              packet: "leak",
            },
          ],
        },
      }),
    ).toBeNull();
  });

  it("rejects claims with disallowed extra keys", () => {
    expect(
      parseAssistantGenerateSuccessBody({
        answer: {
          ...valid.answer,
          claims: [
            {
              ...valid.answer.claims[0],
              internal_reasoning: "leak",
            },
          ],
        },
      }),
    ).toBeNull();
  });

  it("accepts claims without citations", () => {
    expect(
      parseAssistantGenerateSuccessBody({
        answer: {
          ...valid.answer,
          claims: [
            {
              text: "General knowledge claim.",
              attribution: "general_knowledge",
            },
          ],
        },
      }),
    ).not.toBeNull();
  });

  it("rejects non-http source_url values", () => {
    expect(
      parseAssistantGenerateSuccessBody({
        answer: {
          ...valid.answer,
          citations: [
            {
              evidence_id: "E1",
              unit_id: "unit/a",
              source_url: "javascript:alert(1)",
            },
          ],
        },
      }),
    ).toBeNull();
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

describe("citation numbering", () => {
  const claims = [
    {
      text: "First claim.",
      attribution: "evidence_supported" as const,
      citations: [
        {
          evidence_id: "E1",
          unit_id: "u1",
          source_label: "A",
        },
        {
          evidence_id: "E2",
          unit_id: "u2",
          source_label: "B",
        },
      ],
    },
    {
      text: "Second claim.",
      attribution: "evidence_supported" as const,
      citations: [
        {
          evidence_id: "E1",
          unit_id: "u1",
          source_label: "A",
        },
      ],
    },
  ];

  it("dedupes citations across claims for stable inline numbers", () => {
    const numbering = buildCitationNumbering(claims);
    expect(numbering.ordered).toHaveLength(2);
    expect(
      numbering.keyToNumber.get(citationIdentityKey(claims[0].citations![0])),
    ).toBe(1);
    expect(
      numbersForClaimCitations(claims[1].citations, numbering.keyToNumber),
    ).toEqual([1]);
  });
});

describe("transcript turns", () => {
  it("appends loading then resolves success", () => {
    const body = parseAssistantGenerateSuccessBody({
      answer: {
        claims: [
          {
            text: "Grounded claim.",
            attribution: "evidence_supported",
          },
        ],
        answer_text: "Grounded claim.",
        citations: [],
        support_level: "full",
        abstained: false,
      },
    });
    expect(body).not.toBeNull();

    const withLoading = appendLoadingTurn([], "Hello?", "t1");
    expect(withLoading).toHaveLength(1);
    expect(withLoading[0]?.status).toBe("loading");

    const done = resolveTurn(withLoading, "t1", {
      status: "success",
      answer: body!.answer,
    });
    expect(done[0]?.status).toBe("success");
    expect(done[0]?.answer?.claims[0]?.text).toBe("Grounded claim.");
  });
});
