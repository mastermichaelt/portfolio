import { describe, expect, it } from "vitest";

import { articles } from "@/content/articles";
import { articleLines } from "@/content/article-lines";
import {
  EM_DASH,
  EDITORIAL_COMPOUND_ALLOWLIST,
  collectArticlesEditorialCopyEntries,
  extractHyphenatedCompounds,
  validateArticlesEditorialCopy,
} from "@/scripts/lib/articles-editorial-copy-validation.mjs";
import path from "node:path";

const FIXTURES_DIR = path.join(
  process.cwd(),
  "tests/fixtures/assistant-okf/published",
);

describe("articles editorial copy validation", () => {
  it("collects summaries, arguments, and band fields", () => {
    const entries = collectArticlesEditorialCopyEntries(articles, articleLines);
    expect(entries.some((e) => e.field === "summary" && e.slug)).toBe(true);
    expect(entries.some((e) => e.field === "argument" && e.slug)).toBe(true);
    expect(entries.some((e) => e.field === "note" && e.lineId)).toBe(true);
    expect(entries.some((e) => e.field === "pairs" && e.lineId)).toBe(true);
  });

  it("extracts hyphenated compounds", () => {
    expect(extractHyphenatedCompounds("score-first critique")).toEqual([
      "score-first",
    ]);
    expect(extractHyphenatedCompounds("no compounds here")).toEqual([]);
  });

  it("passes on live inventory and OKF fixtures", () => {
    const result = validateArticlesEditorialCopy(articles, articleLines, {
      fixturesDir: FIXTURES_DIR,
    });
    expect(result.errors, result.errors.join("\n")).toEqual([]);
    expect(result.ok).toBe(true);
  });

  it("rejects em dashes in scoped copy", () => {
    const sample = [
      {
        slug: "sample",
        title: "t",
        summary: `bad${EM_DASH}dash`,
        year: 2026,
        tags: ["ai"],
        url: "https://dev.to/x",
        line: "critique" as const,
      },
    ];
    const result = validateArticlesEditorialCopy(sample, [], {
      fixturesDir: FIXTURES_DIR,
    });
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/em dash/);
  });

  it("rejects suspicious compounds not in corpus or allowlist", () => {
    const sample = [
      {
        slug: "cloud-agent-felt-like-hiring",
        title: "t",
        summary: "invented architecture-significant shorthand here",
        year: 2026,
        tags: ["ai"],
        url: "https://dev.to/x",
        line: "portability" as const,
      },
    ];
    const result = validateArticlesEditorialCopy(sample, [], {
      fixturesDir: FIXTURES_DIR,
    });
    expect(result.ok).toBe(false);
    expect(result.errors[0]).toMatch(/architecture-significant/);
  });

  it("allows established allowlist compounds", () => {
    for (const term of EDITORIAL_COMPOUND_ALLOWLIST) {
      expect(term.includes("-")).toBe(true);
    }
  });
});
