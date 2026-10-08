import fs from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { OKF_CONTENT_SOURCES } from "@/scripts/assistant/okf/content-source-registry.mjs";
import { sha256File } from "@/scripts/assistant/okf/manifest.mjs";
import {
  assertPublishedArticleFixtureCoverage,
  PUBLISHED_ARTICLE_HUB_FILES,
} from "@/scripts/assistant/okf/published-articles.mjs";
import { articles } from "@/content/articles";

describe("OKF content coverage", () => {
  it("pins sha256 for each in-repo content module consumed by producers", () => {
    for (const entry of OKF_CONTENT_SOURCES) {
      const absolutePath = path.join(process.cwd(), entry.path);
      expect(fs.existsSync(absolutePath)).toBe(true);
      const current = sha256File(absolutePath);
      expect(
        current,
        `${entry.path} changed — update ${entry.producer} and content-source-registry.mjs`,
      ).toBe(entry.sha256);
    }
  });

  it("requires a published-body fixture for every articles.ts row", () => {
    assertPublishedArticleFixtureCoverage();
    expect(Object.keys(PUBLISHED_ARTICLE_HUB_FILES).sort()).toEqual(
      articles.map((row) => row.slug).sort(),
    );
  });
});
