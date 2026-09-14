import { describe, expect, it } from "vitest";

import {
  articleLines,
  articleSystems,
  resolveArticleSystem,
} from "@/content/article-lines";
import { articles } from "@/content/articles";
import type {
  Article,
  ArticleLine,
  ArticleLineDefinition,
} from "@/domain/article";
import { groupArticleLines } from "@/lib/article-lines";

function makeArticle(
  slug: string,
  line: ArticleLine,
  extra: Partial<Article> = {},
): Article {
  return {
    slug,
    title: `Title ${slug}`,
    summary: "Summary.",
    year: 2026,
    tags: ["ai"],
    url: `https://dev.to/michaeltruong/${slug}`,
    line,
    ...extra,
  };
}

describe("groupArticleLines", () => {
  it("groups the inventory into five ordered bands with one lead each", () => {
    const bands = groupArticleLines(
      articleLines,
      articles,
      resolveArticleSystem,
    );

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

  it("carries the label and count each line-index cell needs", () => {
    const bands = groupArticleLines(
      articleLines,
      articles,
      resolveArticleSystem,
    );

    expect(bands.map((band) => band.label)).toEqual(
      articleLines.map((line) => line.label),
    );
  });

  it("resolves lead and row systems, leaving unpaired reports empty", () => {
    const bands = groupArticleLines(
      articleLines,
      articles,
      resolveArticleSystem,
    );

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
    const nullResolver = () => null;
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
});

describe("groupArticleLines structural guards", () => {
  const oneLine: ArticleLineDefinition[] = [
    { id: "measurement", label: "Measurement", pairs: "Pairing" },
  ];

  it("throws when a line has no reports", () => {
    expect(() => groupArticleLines(oneLine, [], resolveArticleSystem)).toThrow(
      /no reports/,
    );
  });

  it("throws when a line has no lead", () => {
    const members = [
      makeArticle("a", "measurement"),
      makeArticle("b", "measurement"),
    ];
    expect(() =>
      groupArticleLines(oneLine, members, resolveArticleSystem),
    ).toThrow(/exactly one lead report, found 0/);
  });

  it("throws when a line has multiple leads", () => {
    const members = [
      makeArticle("a", "measurement", { lineLead: true, argument: "First." }),
      makeArticle("b", "measurement", { lineLead: true, argument: "Second." }),
    ];
    expect(() =>
      groupArticleLines(oneLine, members, resolveArticleSystem),
    ).toThrow(/exactly one lead report, found 2/);
  });

  it("throws when the lead has no argument", () => {
    const members = [makeArticle("a", "measurement", { lineLead: true })];
    expect(() =>
      groupArticleLines(oneLine, members, resolveArticleSystem),
    ).toThrow(/has no argument/);
  });
});
