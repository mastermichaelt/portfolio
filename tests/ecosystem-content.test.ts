import { describe, expect, it } from "vitest";

import { entities, relationships, workflowViews } from "@/content/ecosystem";
import { StaticPortfolioRepository } from "@/repositories/static-portfolio-repository";

const REQUIRED_WORKFLOW_VIEW_IDS = [
  "system-overview",
  "workflow-renovate",
  "workflow-editorial",
  "workflow-product-loop",
] as const;

describe("ecosystem content inventory", () => {
  const repository = new StaticPortfolioRepository();

  it("seeds entities without talk-track fields", async () => {
    const listed = await repository.listEntities();
    expect(listed.length).toBeGreaterThan(0);
    expect(listed).toEqual(entities);

    const ids = listed.map((entity) => entity.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const entity of listed) {
      expect(entity.name.trim().length).toBeGreaterThan(0);
      expect(entity.summary.trim().length).toBeGreaterThan(0);
      expect(entity.kind).toBeTruthy();
      expect(Object.prototype.hasOwnProperty.call(entity, "talkTrack")).toBe(
        false,
      );
      expect(
        Object.prototype.hasOwnProperty.call(entity, "talkingPoints"),
      ).toBe(false);
      for (const item of entity.evidence ?? []) {
        expect(item.label.trim().length).toBeGreaterThan(0);
        if (item.url !== undefined) {
          expect(item.url).toMatch(/^https:\/\//);
        }
      }
    }
  });

  it("seeds relationships that reference known entities", async () => {
    const listed = await repository.listRelationships();
    expect(listed.length).toBeGreaterThan(0);
    expect(listed).toEqual(relationships);

    const entityIds = new Set(entities.map((entity) => entity.id));
    for (const relationship of listed) {
      expect(entityIds.has(relationship.fromId)).toBe(true);
      expect(entityIds.has(relationship.toId)).toBe(true);
      expect(relationship.type).toBeTruthy();
    }

    // Editorial publishes field reports; analytics/product loops only feed them.
    const toFieldReports = listed.filter(
      (relationship) => relationship.toId === "output-dev-field-reports",
    );
    expect(
      toFieldReports
        .filter((relationship) => relationship.type === "produces")
        .map((relationship) => relationship.fromId),
    ).toEqual(["workflow-editorial-pipeline"]);
    expect(
      toFieldReports
        .filter(
          (relationship) =>
            relationship.fromId !== "workflow-editorial-pipeline",
        )
        .every((relationship) => relationship.type === "feeds"),
    ).toBe(true);
  });

  it("seeds four workflow views including a light system-overview spine", async () => {
    const listed = await repository.listWorkflowViews();
    expect(listed.map((view) => view.id)).toEqual([
      ...REQUIRED_WORKFLOW_VIEW_IDS,
    ]);
    expect(listed).toEqual(workflowViews);

    const overview = await repository.getWorkflowView("system-overview");
    expect(overview).not.toBeNull();
    expect(overview!.nodes.length).toBe(4);
    expect(overview!.nodes.length).toBeLessThan(8);

    for (const view of listed) {
      expect(view.title.trim().length).toBeGreaterThan(0);
      expect(view.summary.trim().length).toBeGreaterThan(0);
      expect(view.nodes.length).toBeGreaterThan(0);
      for (const node of view.nodes) {
        expect(typeof node.position.x).toBe("number");
        expect(typeof node.position.y).toBe("number");
      }
      const nodeIds = new Set(view.nodes.map((node) => node.id));
      for (const edge of view.edges) {
        expect(nodeIds.has(edge.source)).toBe(true);
        expect(nodeIds.has(edge.target)).toBe(true);
      }
      // talkTrack may be absent until the interview-polish slice
      if (view.talkTrack !== undefined) {
        expect(view.talkTrack.trim().length).toBeGreaterThan(0);
      }
    }

    await expect(repository.getWorkflowView("missing")).resolves.toBeNull();
  });
});
