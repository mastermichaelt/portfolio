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
    // content/project-cases.ts, and the supporting-tier cases (editorial-workflow,
    // renovate-governance) live in content/supporting-cases.ts — neither is in
    // this generic inventory. Hierarchy is not derived from a `featured` flag.
    expect(listed.map((project) => project.slug)).toEqual([]);

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

    // Resume generator is withheld from the public portfolio pending redesign.
    expect(await repository.getProject("resume-generator")).toBeNull();

    // The two migrated systems are no longer generic projects.
    expect(await repository.getProject("editorial-workflow")).toBeNull();
    expect(await repository.getProject("renovate-governance")).toBeNull();
    expect(
      await repository.getSupportingCase("editorial-workflow"),
    ).not.toBeNull();
    expect(
      await repository.getSupportingCase("renovate-governance"),
    ).not.toBeNull();
  });

  it("loads the full article inventory with valid fields and project refs", async () => {
    const listed = await repository.listArticles();
    expect(listed.length).toBeGreaterThan(0);
    expect(listed).toEqual(articles);

    // Valid project routes are the generic inventory, the co-primary cases and
    // the supporting-tier cases.
    const [projectList, caseList, supportingList] = await Promise.all([
      repository.listProjects(),
      repository.listProjectCases(),
      repository.listSupportingCases(),
    ]);
    const projectSlugs = new Set([
      ...projectList.map((project) => project.slug),
      ...caseList.map((entry) => entry.slug),
      ...supportingList.map((entry) => entry.slug),
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

    // The `featured` flag is now independent of the homepage: Homepage 2 routes
    // to the Articles surface rather than reproducing a selected-writing list.
    const featured = listed.filter((article) => article.featured);
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

  it("carries the About career record as a résumé-shaped document", async () => {
    const loaded = await repository.getAbout();
    expect(loaded).toEqual(about);

    // Five Atlassian roles, newest first; independent projects follow.
    expect(about.experience.entries).toHaveLength(5);
    expect(about.experience.entries[0]?.dateRange).toMatch(/May 2024/);
    expect(about.experience.entries[4]?.dateRange).toMatch(/Apr 2015/);
    expect(about.independent.entries).toHaveLength(3);
    expect(
      about.independent.entries.filter((entry) => entry.current).length,
    ).toBe(1);
    expect(about.independent.entries[0]?.current).toBe(true);

    // Qualified figures attach to the producing roles/projects, each traceable
    // to a resumes/facts inventory file.
    const figures: CaseFigure[] = [
      ...about.experience.entries.flatMap((entry) => entry.figures ?? []),
      ...about.independent.entries.flatMap((entry) => entry.figures ?? []),
    ];
    expect(figures.length).toBeGreaterThanOrEqual(4);
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
      /retraining|career pivot|return to IC|side project|one engineering practice|carried forward|through-line/i,
    );
    expect(copyText).not.toMatch(/Savepoints/i);
    // Never publish the exact 175 MAU snapshot — only the 175+ durable floor.
    expect(copyText.replace(/175\+/g, "")).not.toContain("175");
    // Fact-id / inventory-path review aids never leak into copy.
    expect(copyText).not.toContain(".yml");
    // Privacy: no phone number from the résumé.
    expect(copyText).not.toMatch(/\+61|401\s*217|tel:/i);
  });

  it("loads the Homepage 2 method model as two projections of one system", async () => {
    const loaded = await repository.getHomepage();
    expect(loaded).toEqual(homepage);

    // Two channels, read across (wide) or in sequence (narrow).
    expect(homepage.channels.map((channel) => channel.id)).toEqual([
      "ch-01",
      "ch-02",
    ]);
    expect(homepage.channels[0]?.href).toBe("/projects/codenames-ai");
    expect(homepage.channels[1]?.title).toBe("Experiment measurement");
    // CH 02 routes to its case study, not a homepage anchor.
    expect(homepage.channels[1]?.href).toBe("/projects/experiment-measurement");
    for (const channel of homepage.channels) {
      expect(channel.caseStudyLabel).toMatch(/case study →$/);
      expect(channel.spine.requirement.trim().length).toBeGreaterThan(0);
      expect(channel.spine.depth.trim().length).toBeGreaterThan(0);
      expect(channel.spine.contract.trim().length).toBeGreaterThan(0);
    }

    // The shared method schema: four dimensions, in order, each binding to the
    // channel content that answers it.
    expect(homepage.method.map((dimension) => dimension.ordinal)).toEqual([
      "01",
      "02",
      "03",
      "04",
    ]);
    expect(homepage.method.map((dimension) => dimension.key)).toEqual([
      "requirement",
      "depth",
      "contract",
      "evidence",
    ]);
    for (const dimension of homepage.method) {
      expect(dimension.label.trim().length).toBeGreaterThan(0);
      expect(dimension.gloss.trim().length).toBeGreaterThan(0);
    }

    // Home carries exactly one qualified figure per channel — value + name +
    // scope, each traceable to the inventory.
    const figures = homepage.channels.map((channel) => channel.figure);
    expect(figures.map((figure) => figure.value)).toEqual(["175+", "9%–41%"]);
    for (const figure of figures) {
      expect(figure.name.trim().length).toBeGreaterThan(0);
      expect(figure.scope.trim().length).toBeGreaterThan(0);
      expect(figure.source.inventory).toMatch(/^resumes\/facts\/.+\.yml$/);
      expect(figure.source.factId.trim().length).toBeGreaterThan(0);
    }
    expect(figures[0]?.scope).toMatch(/durable floor/i);
    // 9%–41% keeps its source meaning: the range across attribution windows is
    // the measurement-reliability finding, not a delivery/run-time outcome.
    expect(figures[1]?.scope).toMatch(/Statsig/i);
    expect(figures[1]?.scope).toMatch(/the range is the finding/i);

    // Compressed continuity — one supporting figure (8–10) routing to the full
    // record on About, not a career ledger reproduced on Home.
    expect(homepage.continuity.figure.value).toBe("8–10");
    expect(homepage.continuity.figure.source.inventory).toMatch(
      /^resumes\/facts\/.+\.yml$/,
    );
    expect(homepage.continuity.link.href).toBe("/about");
    expect(homepage.continuity.claim).toMatch(/2014–2025/);

    // Routes into the four deeper destination surfaces.
    expect(homepage.routes.map((route) => route.href)).toEqual([
      "/projects",
      "/articles",
      "/about",
      "/ecosystem",
    ]);
    for (const route of homepage.routes) {
      expect(route.role.trim().length).toBeGreaterThan(0);
      expect(route.name.trim().length).toBeGreaterThan(0);
      expect(route.summary.trim().length).toBeGreaterThan(0);
    }

    // Home no longer reproduces the ledger, supporting summaries or the article
    // catalogue — those belong to their dedicated surfaces.
    expect("ledger" in homepage).toBe(false);
    expect("supporting" in homepage).toBe(false);
    expect("writing" in homepage).toBe(false);

    expect(homepageText()).not.toMatch(/game_started/i);
    expect(homepageText()).not.toMatch(
      /editorial-workflow|renovate-governance|resume-generator/,
    );
  });
});
