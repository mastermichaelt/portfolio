import { describe, expect, it, vi } from "vitest";

vi.mock("@/content/profile", () => ({
  profile: {
    name: "Test Person",
    location: "Test City",
    email: "test@example.com",
    headline: "Engineer",
    bio: "Short bio.",
    links: {
      linkedin: "https://example.com/in/test",
      github: "https://example.com/test",
      blog: "https://example.com/blog",
    },
  },
}));

vi.mock("@/content/projects", () => ({
  projects: [
    {
      slug: "test-project",
      title: "Test project",
      summary: "Summary",
      tags: ["test"],
      sections: [],
    },
  ],
}));

vi.mock("@/content/articles", () => ({
  articles: [
    {
      slug: "test-article",
      title: "Test article",
      summary: "Summary",
      year: 2026,
      tags: ["test"],
      url: "https://example.com/article",
    },
  ],
}));

vi.mock("@/content/ecosystem", () => ({
  entities: [{ id: "entity-1", name: "Entity" }],
  relationships: [
    {
      id: "relationship-1",
      fromId: "entity-1",
      toId: "entity-1",
    },
  ],
}));

vi.mock("@/content/timeline", () => ({
  timelineEvents: [{ id: "event-1", title: "Event" }],
}));

import { articles } from "@/content/articles";
import { entities, relationships } from "@/content/ecosystem";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { timelineEvents } from "@/content/timeline";
import { StaticPortfolioRepository } from "@/repositories/static-portfolio-repository";

describe("StaticPortfolioRepository", () => {
  const repository = new StaticPortfolioRepository();

  it("returns the static profile", async () => {
    await expect(repository.getProfile()).resolves.toEqual(profile);
  });

  it("lists projects from the static content module", async () => {
    await expect(repository.listProjects()).resolves.toEqual(projects);
  });

  it("returns a project when the slug matches", async () => {
    await expect(repository.getProject("test-project")).resolves.toEqual({
      slug: "test-project",
      title: "Test project",
      summary: "Summary",
      tags: ["test"],
      sections: [],
    });
  });

  it("returns null for an unknown project slug", async () => {
    await expect(repository.getProject("missing")).resolves.toBeNull();
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
