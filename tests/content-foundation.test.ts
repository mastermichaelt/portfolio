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

  it("loads two evidence-backed case studies via the repository", async () => {
    const listed = await repository.listProjects();
    expect(listed).toHaveLength(2);
    expect(listed.map((project) => project.slug).sort()).toEqual([
      "codenames-ai",
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
        expect(item.url).toMatch(/^https:\/\//);
      }
    }

    const renovate = await repository.getProject("renovate-governance");
    expect(renovate).not.toBeNull();
    expect(
      renovate!.sections.some((section) => section.kind === "outcomes"),
    ).toBe(false);
  });

  it("loads 4–6 external articles with DEV URLs", async () => {
    const listed = await repository.listArticles();
    expect(listed.length).toBeGreaterThanOrEqual(4);
    expect(listed.length).toBeLessThanOrEqual(6);
    expect(listed).toEqual(articles);

    for (const article of listed) {
      expect(article.url).toMatch(/^https:\/\/dev\.to\//);
      expect(article.year).toBeGreaterThanOrEqual(2026);
      expect(article.summary.trim().length).toBeGreaterThan(0);
    }
  });
});
