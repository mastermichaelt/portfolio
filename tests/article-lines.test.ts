import { describe, expect, it } from "vitest";

import { articleLines, articleSystems } from "@/content/article-lines";
import { articles } from "@/content/articles";
import {
  articleLineIndex,
  groupArticleLines,
  type ResolveSystem,
} from "@/lib/article-lines";

const resolveSystem: ResolveSystem = (slug) =>
  slug ? (articleSystems[slug] ?? null) : null;

describe("groupArticleLines", () => {
  it("groups the inventory into five ordered bands with one lead each", () => {
    const bands = groupArticleLines(articleLines, articles, resolveSystem);

    expect(bands.map((band) => band.id)).toEqual(
      articleLines.map((line) => line.id),
    );
    expect(bands.map((band) => band.ordinal)).toEqual([
      "01",
      "02",
      "03",
      "04",
      "05",
    ]);
    expect(bands.map((band) => band.count)).toEqual([3, 3, 4, 3, 2]);

    for (const band of bands) {
      expect(band.lead.article.lineLead).toBe(true);
      expect(band.lead.argument.trim().length).toBeGreaterThan(0);
      expect(band.reports).toHaveLength(band.count - 1);
      expect(band.reports.some((row) => row.article.lineLead)).toBe(false);
    }
  });

  it("resolves lead and row systems, leaving unpaired reports empty", () => {
    const bands = groupArticleLines(articleLines, articles, resolveSystem);

    const measurement = bands.find((band) => band.id === "measurement");
    expect(measurement?.lead.system?.href).toBe("/projects/codenames-ai");

    // Line 05 intentionally has no implementation attached.
    const portability = bands.find((band) => band.id === "portability");
    expect(portability?.lead.system).toBeNull();

    for (const band of bands) {
      for (const row of band.reports) {
        if (row.article.relatedProjectSlug) {
          expect(row.system).not.toBeNull();
        } else {
          expect(row.system).toBeNull();
        }
      }
    }
  });

  it("renders empty rather than throwing on an unresolved slug", () => {
    const nullResolver: ResolveSystem = () => null;
    const bands = groupArticleLines(articleLines, articles, nullResolver);

    for (const band of bands) {
      expect(band.lead.system).toBeNull();
      for (const row of band.reports) {
        expect(row.system).toBeNull();
      }
    }
  });

  it("keeps every related project slug resolvable to a known system", () => {
    for (const article of articles) {
      if (article.relatedProjectSlug) {
        expect(articleSystems[article.relatedProjectSlug]).toBeDefined();
      }
    }
  });

  it("derives one index cell per band", () => {
    const bands = groupArticleLines(articleLines, articles, resolveSystem);
    const index = articleLineIndex(bands);

    expect(index).toHaveLength(5);
    expect(index.map((cell) => cell.ordinal)).toEqual([
      "01",
      "02",
      "03",
      "04",
      "05",
    ]);
    expect(index.map((cell) => cell.count)).toEqual([3, 3, 4, 3, 2]);
    expect(index.map((cell) => cell.label)).toEqual(
      articleLines.map((line) => line.label),
    );
  });
});
