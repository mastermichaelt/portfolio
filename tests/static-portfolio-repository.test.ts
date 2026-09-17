import { describe, expect, it, vi } from "vitest";

vi.mock("@/content/profile", () => ({
  profile: {
    name: "Test Person",
    location: "Test City",
    email: "test@example.com",
    headline: "Engineer",
    bio: "Short bio.",
    status: "Open to test roles.",
    links: {
      linkedin: "https://example.com/in/test",
      github: "https://example.com/test",
      blog: "https://example.com/blog",
    },
  },
}));

vi.mock("@/content/about", () => ({
  about: {
    eyebrow: "About · practice record",
    statement: "One practice.",
    lead: { text: "Lead.", emphasis: "Emphasis." },
    throughLine: ["Para one.", "Para two."],
    arc: [
      {
        id: "arc-2026",
        dateRange: "2026 —",
        role: "Independent",
        body: "Body.",
        carry: { label: "In force now", text: "Mechanism." },
        current: true,
      },
    ],
    arcEvidence: {
      label: "From the measurement era",
      figure: {
        value: ">10%",
        name: "figure",
        scope: "scope",
        source: { inventory: "resumes/facts/test.yml", factId: "id" },
      },
      ledgerNote: { lead: "Lead — ", link: { label: "link →", href: "/#x" } },
    },
    management: { statement: "Statement.", body: ["Body."], figures: [] },
    current: {
      body: "Body.",
      mapLabel: "Same mechanism, current form",
      map: [{ then: "Then", now: "→ now" }],
      figures: [],
      links: [{ label: "Link →", href: "/projects" }],
    },
    surfaces: [{ name: "This page", self: true, description: "Description." }],
    next: { label: "Next step", statement: "Statement.", note: "Note." },
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
      line: "measurement",
      lineLead: true,
      argument: "Test argument.",
    },
  ],
}));

vi.mock("@/content/article-lines", () => ({
  articleLines: [
    {
      id: "measurement",
      label: "Measurement & Telemetry",
      pairs: "Test pairing",
    },
  ],
  articleSystems: {},
}));

vi.mock("@/content/project-workflows", () => ({
  projectWorkflowViewsBySlug: {
    "editorial-workflow": {
      id: "workflow-editorial",
      title: "Editorial field-report pipeline",
      summary: "Capture through publish",
      nodes: [],
      edges: [],
    },
  },
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
  ],
}));

vi.mock("@/content/project-cases", () => ({
  projectCases: [
    {
      slug: "test-case",
      name: "Test case",
      channelLabel: "CH 09",
      metaLines: ["Org", "2026 – present"],
      title: "Contract sentence.",
      lead: "Lead paragraph.",
      aside: { label: "Scope", lines: ["Line"], note: "Note." },
      blocks: [],
      elsewhere: [],
      artifacts: { label: "Artifacts", rows: [], closing: [] },
    },
  ],
}));

vi.mock("@/content/supporting-cases", () => ({
  supportingCases: [
    {
      slug: "test-supporting",
      name: "Test supporting",
      header: { tier: "Supporting", lines: ["Line"] },
      title: "Test supporting",
      lead: "Lead paragraph.",
      aside: { label: "Aside", lines: ["Line"], note: "Note." },
      blocks: [],
      elsewhere: [],
      artifacts: { label: "Artifacts", rows: [], closing: [] },
    },
  ],
  supportingCaseSourceProse: {},
}));

vi.mock("@/content/projects-index", () => ({
  projectsIndex: {
    hero: { eyebrow: "Eyebrow", title: "Title", lead: "Lead" },
    key: { label: "Index key", lines: ["Line"] },
    columns: { system: "System", contract: "Contract", evidence: "Evidence" },
    coPrimary: [],
    supporting: [],
    infrastructure: [],
    footer: [],
  },
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

import { about } from "@/content/about";
import { articleLines } from "@/content/article-lines";
import { articles } from "@/content/articles";
import { entities, relationships, workflowViews } from "@/content/ecosystem";
import { projectWorkflowViewsBySlug } from "@/content/project-workflows";
import { homepage } from "@/content/homepage";
import { profile } from "@/content/profile";
import { productionLine } from "@/content/production-line";
import { projectCases } from "@/content/project-cases";
import { projects } from "@/content/projects";
import { supportingCases } from "@/content/supporting-cases";
import { projectsIndex } from "@/content/projects-index";
import { timelineEvents } from "@/content/timeline";
import { StaticPortfolioRepository } from "@/repositories/static-portfolio-repository";

describe("StaticPortfolioRepository", () => {
  const repository = new StaticPortfolioRepository();

  it("returns the static profile", async () => {
    await expect(repository.getProfile()).resolves.toEqual(profile);
  });

  it("returns the static About page", async () => {
    await expect(repository.getAbout()).resolves.toEqual(about);
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

  it("returns the projects index composition", async () => {
    await expect(repository.getProjectsIndex()).resolves.toEqual(projectsIndex);
  });

  it("lists project cases from the static content module", async () => {
    await expect(repository.listProjectCases()).resolves.toEqual(projectCases);
  });

  it("returns a project case when the slug matches", async () => {
    await expect(repository.getProjectCase("test-case")).resolves.toEqual(
      projectCases[0],
    );
  });

  it("returns null for an unknown project case slug", async () => {
    await expect(repository.getProjectCase("missing")).resolves.toBeNull();
  });

  it("lists supporting cases from the static content module", async () => {
    await expect(repository.listSupportingCases()).resolves.toEqual(
      supportingCases,
    );
  });

  it("returns a supporting case when the slug matches", async () => {
    await expect(
      repository.getSupportingCase("test-supporting"),
    ).resolves.toEqual(supportingCases[0]);
  });

  it("returns null for an unknown supporting case slug", async () => {
    await expect(repository.getSupportingCase("missing")).resolves.toBeNull();
  });

  it("lists articles from the static content module", async () => {
    await expect(repository.listArticles()).resolves.toEqual(articles);
  });

  it("lists article reasoning lines from the static content module", async () => {
    await expect(repository.listArticleLines()).resolves.toEqual(articleLines);
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

  it("returns a project workflow view when the slug matches", async () => {
    await expect(
      repository.getProjectWorkflowView("editorial-workflow"),
    ).resolves.toEqual(projectWorkflowViewsBySlug["editorial-workflow"]);
  });

  it("returns null for an unknown project workflow slug", async () => {
    await expect(
      repository.getProjectWorkflowView("missing"),
    ).resolves.toBeNull();
  });

  it("returns the production line from the static content module", async () => {
    await expect(repository.getProductionLine()).resolves.toEqual(
      productionLine,
    );
  });

  it("lists timeline events from the static content module", async () => {
    await expect(repository.listTimelineEvents()).resolves.toEqual(
      timelineEvents,
    );
  });
});
