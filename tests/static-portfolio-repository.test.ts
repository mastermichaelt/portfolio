import { describe, expect, it } from "vitest";
import { articles } from "@/content/articles";
import { entities, relationships } from "@/content/ecosystem";
import { projects } from "@/content/projects";
import { timelineEvents } from "@/content/timeline";
import { StaticPortfolioRepository } from "@/repositories/static-portfolio-repository";

describe("StaticPortfolioRepository", () => {
  const repository = new StaticPortfolioRepository();

  it("lists projects from the static content module", async () => {
    await expect(repository.listProjects()).resolves.toEqual(projects);
  });

  it("returns null for an unknown project slug", async () => {
    await expect(repository.getProject("missing")).resolves.toBeNull();
  });

  it("returns a project when the slug matches", async () => {
    const match = projects[0];
    if (!match) {
      await expect(repository.getProject("any")).resolves.toBeNull();
      return;
    }

    await expect(repository.getProject(match.slug)).resolves.toEqual(match);
  });

  it("lists articles from the static content module", async () => {
    await expect(repository.listArticles()).resolves.toEqual(articles);
  });

  it("lists entities and relationships from the static content modules", async () => {
    await expect(repository.listEntities()).resolves.toEqual(entities);
    await expect(repository.listRelationships()).resolves.toEqual(
      relationships,
    );
  });

  it("lists timeline events from the static content module", async () => {
    await expect(repository.listTimelineEvents()).resolves.toEqual(
      timelineEvents,
    );
  });
});
