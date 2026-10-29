import { describe, expect, it } from "vitest";

import {
  resolveCitationHref,
  toVisitorHref,
} from "@/lib/assistant/ui/citation-href";
import {
  buildUsageFooterParts,
  formatModelDisplayName,
  formatUsageFooterLine,
} from "@/lib/assistant/ui/format-usage-footer";
import { extractHttpUrlsFromText } from "@/lib/assistant/ui/extract-http-urls";

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
  it("prefers inline URLs from claim text", () => {
    const href = resolveCitationHref(
      "unit/portfolio/savepoints-architecture-b02",
      "Details at https://michaeltruong.ai/projects/codenames-ai.",
      0,
    );
    expect(href).toBe("/projects/codenames-ai");
  });

  it("falls back to portfolio slug heuristics from unit_id", () => {
    expect(
      resolveCitationHref(
        "unit/portfolio/codenames-ai-case-overview",
        "Codenames AI is a production game.",
        0,
      ),
    ).toBe("/projects/codenames-ai");
  });

  it("maps about concepts to /about", () => {
    expect(
      resolveCitationHref(
        "unit/about/summary",
        "Michael is based in Sydney.",
        0,
      ),
    ).toBe("/about");
  });
});

describe("toVisitorHref", () => {
  it("strips origin for michaeltruong.ai links", () => {
    expect(toVisitorHref("https://michaeltruong.ai/articles")).toBe(
      "/articles",
    );
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
