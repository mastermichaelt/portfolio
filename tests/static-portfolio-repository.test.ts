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
  entities: [
    {
      id: "entity-1",
      name: "Entity",
      kind: "project",
      summary: "Entity summary",
    },
  ],
  relationships: [
    {
      id: "relationship-1",
      fromId: "entity-1",
      toId: "entity-1",
      type: "uses",
    },
  ],
  workflowViews: [
    {
      id: "system-overview",
      title: "System overview",
      summary: "Light spine",
      nodes: [
        {
          id: "layer-projects",
          label: "Projects",
          kind: "project",
          position: { x: 0, y: 0 },
        },
      ],
      edges: [],
    },
    {
      id: "workflow-renovate",
      title: "Renovate governance ladder",
      summary: "Classify and merge",
      nodes: [],
      edges: [],
    },
  ],
}));

vi.mock("@/content/timeline", () => ({
  timelineEvents: [{ id: "event-1", title: "Event" }],
}));

vi.mock("@/content/homepage", () => ({
  homepage: {
    hero: {
      title: "Test title.",
      lead: "Test lead.",
      leadEmphasis: "Test emphasis.",
    },
    channels: [],
    ledger: [],
    supporting: [],
    writing: [],
  },
}));

import { articles } from "@/content/articles";
import { entities, relationships, workflowViews } from "@/content/ecosystem";
import { homepage } from "@/content/homepage";
import { profile } from "@/content/profile";
import { projects } from "@/content/projects";
import { timelineEvents } from "@/content/timeline";
import { StaticPortfolioRepository } from "@/repositories/static-portfolio-repository";

describe("StaticPortfolioRepository", () => {
  const repository = new StaticPortfolioRepository();

  it("returns the static profile", async () => {
    await expect(repository.getProfile()).resolves.toEqual(profile);
  });

  it("returns the static homepage presentation", async () => {
    await expect(repository.getHomepage()).resolves.toEqual(homepage);
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

  it("lists workflow views from the static content module", async () => {
    await expect(repository.listWorkflowViews()).resolves.toEqual(
      workflowViews,
    );
  });

  it("returns a workflow view when the id matches", async () => {
    await expect(
      repository.getWorkflowView("system-overview"),
    ).resolves.toEqual(workflowViews[0]);
  });

  it("returns null for an unknown workflow view id", async () => {
    await expect(repository.getWorkflowView("missing")).resolves.toBeNull();
  });

  it("lists timeline events from the static content module", async () => {
    await expect(repository.listTimelineEvents()).resolves.toEqual(
      timelineEvents,
    );
  });
});
