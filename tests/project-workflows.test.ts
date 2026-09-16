import { describe, expect, it } from "vitest";

import { projectWorkflowViewsBySlug } from "@/content/project-workflows";
import { StaticPortfolioRepository } from "@/repositories/static-portfolio-repository";

describe("project workflow views", () => {
  const repository = new StaticPortfolioRepository();

  it("maps editorial and renovate slugs to their workflow canvases", () => {
    expect(Object.keys(projectWorkflowViewsBySlug).sort()).toEqual([
      "editorial-workflow",
      "renovate-governance",
    ]);

    const editorial = projectWorkflowViewsBySlug["editorial-workflow"];
    expect(editorial.id).toBe("workflow-editorial");
    expect(editorial.nodes).toHaveLength(9);
    expect(editorial.edges).toHaveLength(10);

    const renovate = projectWorkflowViewsBySlug["renovate-governance"];
    expect(renovate.id).toBe("workflow-renovate");
    expect(renovate.nodes).toHaveLength(5);
    expect(renovate.edges).toHaveLength(5);
  });

  it("resolves project workflow views through the repository", async () => {
    await expect(
      repository.getProjectWorkflowView("editorial-workflow"),
    ).resolves.toEqual(projectWorkflowViewsBySlug["editorial-workflow"]);
    await expect(
      repository.getProjectWorkflowView("renovate-governance"),
    ).resolves.toEqual(projectWorkflowViewsBySlug["renovate-governance"]);
    await expect(
      repository.getProjectWorkflowView("codenames-ai"),
    ).resolves.toBeNull();
    await expect(
      repository.getProjectWorkflowView("missing"),
    ).resolves.toBeNull();
  });

  it("keeps talk tracks on migrated views", () => {
    for (const view of Object.values(projectWorkflowViewsBySlug)) {
      expect(view.talkTrack?.trim().length).toBeGreaterThan(0);
    }
  });
});
