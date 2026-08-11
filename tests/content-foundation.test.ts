import { describe, expect, it } from "vitest";

import { articles } from "@/content/articles";
import { profile } from "@/content/profile";
import type { ProjectSectionKind } from "@/domain/project";
import { StaticPortfolioRepository } from "@/repositories/static-portfolio-repository";

const REQUIRED_KIND_GROUPS: ProjectSectionKind[][] = [
  ["context", "system"],
  ["role"],
  ["evidence"],
];

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

  it("loads four evidence-backed projects with two homepage flagships", async () => {
    const listed = await repository.listProjects();
    expect(listed.map((project) => project.slug)).toEqual([
      "codenames-ai",
      "editorial-workflow",
      "resume-generator",
      "renovate-governance",
    ]);

    const featured = listed.filter((project) => project.featured);
    expect(featured.map((project) => project.slug)).toEqual([
      "codenames-ai",
      "editorial-workflow",
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

    const projectSlugs = new Set(
      (await repository.listProjects()).map((project) => project.slug),
    );
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
    expect(featured.length).toBeGreaterThan(0);
    expect(featured.length).toBeLessThanOrEqual(3);
    expect(featured.length).toBeLessThan(listed.length);
    expect(
      new Set(featured.map((article) => article.relatedProjectSlug)).size,
    ).toBe(featured.length);
  });
});
