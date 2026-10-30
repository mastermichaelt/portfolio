import { describe, expect, it } from "vitest";
import { spawnSync } from "node:child_process";
import path from "node:path";

import { articles } from "@/content/articles";
import { articleLines } from "@/content/article-lines";
import {
  EM_DASH,
  EDITORIAL_COMPOUND_ALLOWLIST,
  collectArticlesEditorialCopyEntries,
  extractHyphenatedCompounds,
  validateArticlesEditorialCopy,
} from "@/scripts/lib/articles-editorial-copy-validation.mjs";

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

  it("allows em dashes in band pairs (structured pairing labels)", () => {
    const sampleLines = [
      {
        id: "measurement" as const,
        label: "Measurement",
        pairs: `Codenames AI ${EM_DASH} co-primary`,
      },
    ];
    const result = validateArticlesEditorialCopy([], sampleLines, {
      fixturesDir: FIXTURES_DIR,
    });
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

  it("verify CLI exits 0 when live inventory passes", () => {
    const result = spawnSync("npm", ["run", "verify:articles-editorial-copy"], {
      cwd: process.cwd(),
      encoding: "utf8",
    });
    expect(result.status, result.stderr || result.stdout).toBe(0);
  });

  it("verify CLI exits 1 when validation fails (strict CI enforcement)", () => {
    const fixturesDir = FIXTURES_DIR.replaceAll("\\", "/");
    const result = spawnSync(
      process.execPath,
      [
        "--input-type=module",
        "-e",
        `import { validateArticlesEditorialCopy } from "./scripts/lib/articles-editorial-copy-validation.mjs";
const { ok, errors } = validateArticlesEditorialCopy(
  [{
    slug: "probe",
    title: "t",
    summary: "invented architecture-significant shorthand",
    year: 2026,
    tags: ["ai"],
    url: "https://dev.to/x",
    line: "critique",
  }],
  [],
  { fixturesDir: ${JSON.stringify(fixturesDir)} },
);
if (!ok) {
  for (const e of errors) console.error(e);
}
process.exit(ok ? 0 : 1);`,
      ],
      { cwd: process.cwd(), encoding: "utf8" },
    );
    expect(result.status).toBe(1);
    expect(result.stderr || result.stdout).toMatch(/architecture-significant/);
  });
});
