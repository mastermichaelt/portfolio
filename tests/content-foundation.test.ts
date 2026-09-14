import { describe, expect, it } from "vitest";

import { about } from "@/content/about";
import { articles } from "@/content/articles";
import { homepage } from "@/content/homepage";
import { profile } from "@/content/profile";
import type { CaseFigure } from "@/domain/project-case";
import type { ProjectSectionKind } from "@/domain/project";
import { StaticPortfolioRepository } from "@/repositories/static-portfolio-repository";

const REQUIRED_KIND_GROUPS: ProjectSectionKind[][] = [
  ["context", "system"],
  ["role"],
  ["evidence"],
];

function homepageText(): string {
  return JSON.stringify(homepage);
}

describe("content-foundation inventory", () => {
  const repository = new StaticPortfolioRepository();

  it("exposes identity-scale profile contact details", async () => {
    const loaded = await repository.getProfile();
    expect(loaded).toEqual(profile);
    expect(profile.name).toBe("Michael Truong");
    expect(profile.email).toBe("michael@multipliers.dev");
    expect(profile.links.linkedin).toMatch(/^https:\/\//);
    expect(profile.links.github).toMatch(/^https:\/\//);
    expect(profile.links.blog).toBe("https://dev.to/michaeltruong");
    expect(profile.bio.length).toBeLessThan(500);
  });

  it("loads the generic evidence-backed project inventory", async () => {
    const listed = await repository.listProjects();
    // Co-primary case studies (experiment-measurement, codenames-ai) live in
    // content/project-cases.ts, not this generic inventory. Hierarchy is no
    // longer derived from a `featured` flag.
    expect(listed.map((project) => project.slug)).toEqual([
      "editorial-workflow",
      "resume-generator",
      "renovate-governance",
    ]);

    for (const project of listed) {
      const kinds = new Set(project.sections.map((section) => section.kind));
      for (const group of REQUIRED_KIND_GROUPS) {
        expect(
          group.some((kind) => kinds.has(kind)),
          `${project.slug} missing required kind from [${group.join(", ")}]`,
        ).toBe(true);
      }
      expect(project.sections.every((section) => section.body.trim())).toBe(
        true,
      );
      expect(project.evidence?.length ?? 0).toBeGreaterThan(0);
      for (const item of project.evidence ?? []) {
        expect(item.label.trim().length).toBeGreaterThan(0);
        if (item.url !== undefined) {
          expect(item.url).toMatch(/^https:\/\//);
          // Private sibling repo — readers cannot open source/docs links.
          expect(item.url).not.toMatch(
            /github\.com\/mastermichaelt\/codenames-ai-guesser/i,
          );
        }
      }
      for (const link of project.relatedLinks ?? []) {
        expect(link.url).toMatch(/^https:\/\//);
        expect(link.url).not.toMatch(
          /github\.com\/mastermichaelt\/codenames-ai-guesser/i,
        );
      }
    }

    const renovate = await repository.getProject("renovate-governance");
    expect(renovate).not.toBeNull();
    expect(
      renovate!.sections.some((section) => section.kind === "outcomes"),
    ).toBe(false);
  });

  it("loads the full article inventory with valid fields and project refs", async () => {
    const listed = await repository.listArticles();
    expect(listed.length).toBeGreaterThan(0);
    expect(listed).toEqual(articles);

    // Valid project routes are the generic inventory plus the co-primary cases.
    const [projectList, caseList] = await Promise.all([
      repository.listProjects(),
      repository.listProjectCases(),
    ]);
    const projectSlugs = new Set([
      ...projectList.map((project) => project.slug),
      ...caseList.map((entry) => entry.slug),
    ]);
    const slugs = listed.map((article) => article.slug);
    expect(new Set(slugs).size).toBe(slugs.length);

    const urls = listed.map((article) => article.url);
    expect(new Set(urls).size).toBe(urls.length);

    for (const article of listed) {
      expect(article.title.trim().length).toBeGreaterThan(0);
      expect(article.summary.trim().length).toBeGreaterThan(0);
      expect(article.url).toMatch(/^https:\/\/dev\.to\//);
      expect(article.year).toBeGreaterThanOrEqual(2020);
      expect(article.tags.length).toBeGreaterThan(0);
      if (article.relatedProjectSlug !== undefined) {
        expect(projectSlugs.has(article.relatedProjectSlug)).toBe(true);
      }
    }

    const featured = listed.filter((article) => article.featured);
    const homepageWritingSlugs = homepage.writing.map((item) => item.slug);
    expect(new Set(featured.map((article) => article.slug))).toEqual(
      new Set(homepageWritingSlugs),
    );
    expect(featured.length).toBe(3);
    expect(featured.length).toBeLessThan(listed.length);
    expect(
      new Set(featured.map((article) => article.relatedProjectSlug)).size,
    ).toBe(featured.length);
  });

  it("organizes every article into one of the five reasoning lines", async () => {
    const listed = await repository.listArticles();
    const lineDefs = await repository.listArticleLines();
    const lineIds = lineDefs.map((line) => line.id);

    // Five lines, in fixed order, ids unique, each with label + pairing copy.
    expect(lineIds).toEqual([
      "measurement",
      "authority",
      "critique",
      "readiness",
      "portability",
    ]);
    expect(new Set(lineIds).size).toBe(lineIds.length);
    for (const def of lineDefs) {
      expect(def.label.trim().length).toBeGreaterThan(0);
      expect(def.pairs.trim().length).toBeGreaterThan(0);
    }

    // Every article names a line that exists in article-lines.ts.
    for (const article of listed) {
      expect(lineIds).toContain(article.line);
    }

    // Membership counts are 3 / 3 / 4 / 3 / 2, and total 15.
    const counts = Object.fromEntries(lineIds.map((id) => [id, 0]));
    for (const article of listed) {
      counts[article.line] += 1;
    }
    expect(counts).toEqual({
      measurement: 3,
      authority: 3,
      critique: 4,
      readiness: 3,
      portability: 2,
    });
    expect(listed.length).toBe(15);

    // Exactly one lead per line, each with a non-empty argument.
    for (const id of lineIds) {
      const members = listed.filter((article) => article.line === id);
      const leads = members.filter((article) => article.lineLead);
      expect(leads).toHaveLength(1);
      expect((leads[0]?.argument ?? "").trim().length).toBeGreaterThan(0);
    }

    // Non-lead reports never carry an argument — guards against drift back to
    // fifteen authored argument lines.
    for (const article of listed) {
      if (!article.lineLead) {
        expect(article.argument).toBeUndefined();
      }
    }
  });

  it("carries the About standing record as one continuous practice", async () => {
    const loaded = await repository.getAbout();
    expect(loaded).toEqual(about);

    // Five eras, newest first, exactly one current.
    expect(about.arc).toHaveLength(5);
    expect(about.arc[0]?.dateRange.startsWith("2026")).toBe(true);
    expect(about.arc.filter((era) => era.current).length).toBe(1);
    expect(about.arc[0]?.current).toBe(true);

    // Exactly four qualified figures across the page, each fully qualified and
    // traceable to a resumes/facts inventory file.
    const figures: CaseFigure[] = [
      about.arcEvidence.figure,
      ...about.management.figures,
      ...about.current.figures,
    ];
    expect(figures).toHaveLength(4);
    for (const figure of figures) {
      expect(figure.value.trim().length).toBeGreaterThan(0);
      expect(figure.name.trim().length).toBeGreaterThan(0);
      expect(figure.scope.trim().length).toBeGreaterThan(0);
      expect(figure.source.inventory).toMatch(/^resumes\/facts\/.+\.yml$/);
    }

    // The rendered copy (review-aid `source` stripped) must respect the voice
    // constraints and the evidence guardrails.
    const copyText = JSON.stringify(about, (key, value) =>
      key === "source" ? undefined : value,
    );
    expect(copyText).not.toMatch(
      /retraining|career pivot|return to IC|side project/i,
    );
    // Never publish the exact 175 MAU snapshot — only the 175+ durable floor.
    expect(copyText.replace(/175\+/g, "")).not.toContain("175");
    // Fact-id / inventory-path review aids never leak into copy.
    expect(copyText).not.toContain(".yml");
  });

  it("loads an evidence-backed homepage presentation without a fifth project", async () => {
    const loaded = await repository.getHomepage();
    expect(loaded).toEqual(homepage);

    expect(homepage.channels.map((channel) => channel.id)).toEqual([
      "ch-01",
      "ch-02",
    ]);
    expect(homepage.channels[0]?.href).toBe("/projects/codenames-ai");
    expect(homepage.channels[1]?.title).toBe("Experiment measurement");
    expect(homepage.channels[1]?.href).toBe("#experiment-measurement");
    expect(homepage.channels[1]?.dateRange).toBe("2020 – 2025");

    const figures = homepage.channels.flatMap((channel) => channel.figures);
    expect(figures).toHaveLength(4);
    for (const figure of figures) {
      expect(figure.value.trim().length).toBeGreaterThan(0);
      expect(figure.name.trim().length).toBeGreaterThan(0);
      expect(figure.scope.trim().length).toBeGreaterThan(0);
      expect(figure.source.inventory).toMatch(/^resumes\/facts\/.+\.yml$/);
      expect(figure.source.factId.trim().length).toBeGreaterThan(0);
    }

    expect(figures.map((figure) => figure.value)).toEqual([
      "175+",
      "#1",
      ">10%",
      "9%–41%",
    ]);
    expect(figures[0]?.scope).toMatch(/durable floor/i);
    expect(figures[1]?.scope).toMatch(/last 28 days/i);
    expect(figures[2]?.scope).toMatch(/Cross Flow/i);
    expect(figures[3]?.scope).toMatch(/Statsig/i);

    expect(homepage.ledger).toHaveLength(7);
    expect(homepage.ledger[0]?.current).toBe(true);
    expect(homepage.ledger.map((row) => row.id)).toEqual([
      "independent-2026",
      "atlassian-sse-2024",
      "aim-program-lead",
      "atlassian-em-2020",
      "atlassian-sse-2019",
      "atlassian-swe-2015",
      "atlassian-graduate-2014",
    ]);
    expect(homepage.ledger[1]?.detail).toMatch(/10×/);
    expect(homepage.ledger[1]?.detail).toMatch(/associated business OKR/i);
    expect(homepage.ledger[2]?.detail).toMatch(/3,552/);
    expect(homepage.ledger[2]?.detail).toMatch(/approximately 20%/i);
    expect(homepage.ledger[3]?.detail).toMatch(/8–10/);

    expect(homepage.supporting.map((item) => item.id)).toEqual([
      "renovate-governance",
      "editorial-workflow",
      "agent-native",
    ]);
    expect(homepage.supporting.map((item) => item.id)).not.toContain(
      "resume-generator",
    );

    const articleSlugs = new Set(articles.map((article) => article.slug));
    expect(homepage.writing.map((item) => item.slug)).toEqual([
      "active-players-which-sessions-counted",
      "agent-plans-authority-handoffs",
      "ai-reviewer-kinds-of-reasoning",
    ]);
    for (const item of homepage.writing) {
      expect(articleSlugs.has(item.slug)).toBe(true);
      expect(item.argument.trim().length).toBeGreaterThan(0);
    }

    expect(homepageText()).not.toMatch(/game_started/i);
    expect(
      homepage.channels.some((channel) =>
        channel.href.includes("editorial-workflow"),
      ),
    ).toBe(false);
  });
});
