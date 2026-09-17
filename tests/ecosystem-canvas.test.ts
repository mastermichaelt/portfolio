import { describe, expect, it } from "vitest";

import { entities, workflowViews } from "@/content/ecosystem";
import { projectWorkflowViewsBySlug } from "@/content/project-workflows";
import {
  findWorkflowNode,
  resolveEcosystemDetail,
} from "@/lib/ecosystem-canvas";

describe("workflow detail resolver", () => {
  const entitiesById = new Map(
    entities.map((entity) => [entity.id, entity] as const),
  );
  const projectViews = Object.values(projectWorkflowViewsBySlug);

  it("resolves selection detail from entity-linked nodes", () => {
    const detail = resolveEcosystemDetail({
      views: projectViews,
      entitiesById,
      viewId: "workflow-renovate",
      nodeId: "node-classify",
    });

    expect(detail).toMatchObject({
      nodeId: "node-classify",
      label: "Classify",
      kind: "agent",
      relatedProjectSlug: "renovate-governance",
      sourceViewId: "workflow-renovate",
      sourceViewTitle: "Renovate governance ladder",
    });
    expect(detail?.summary).toMatch(/Classifies one active/i);
  });

  it("returns null for an unknown view", () => {
    expect(
      resolveEcosystemDetail({
        views: workflowViews,
        entitiesById,
        viewId: "missing-view",
        nodeId: "node-classify",
      }),
    ).toBeNull();
  });

  it("finds a workflow node by view and id", () => {
    expect(
      findWorkflowNode(projectViews, "workflow-editorial", "node-publish"),
    ).toMatchObject({
      view: { id: "workflow-editorial" },
      node: { id: "node-publish", label: "Publish" },
    });
  });

  // Handoff evidence constraint 06 + the Design fidelity correction: a node
  // shows evidence only where its own entity carries it. Editorial's Publish
  // output owns evidence; no Renovate node does — including Merge gates.
  it("surfaces node evidence only where the entity owns it", () => {
    const publish = resolveEcosystemDetail({
      views: projectViews,
      entitiesById,
      viewId: "workflow-editorial",
      nodeId: "node-publish",
    });
    expect(publish?.evidence.map((item) => item.url)).toEqual([
      "https://dev.to/michaeltruong",
    ]);

    for (const nodeId of [
      "node-classify",
      "node-route",
      "node-investigate",
      "node-maintainer",
      "node-merge-gates",
    ]) {
      const detail = resolveEcosystemDetail({
        views: projectViews,
        entitiesById,
        viewId: "workflow-renovate",
        nodeId,
      });
      expect(detail?.evidence, `${nodeId} carries no node evidence`).toEqual(
        [],
      );
    }

    // Every editorial skill node is also evidence-free — only the output is not.
    for (const node of projectWorkflowViewsBySlug["editorial-workflow"]!
      .nodes) {
      const detail = resolveEcosystemDetail({
        views: projectViews,
        entitiesById,
        viewId: "workflow-editorial",
        nodeId: node.id,
      });
      if (node.id === "node-publish") {
        expect(detail?.evidence.length).toBe(1);
      } else {
        expect(detail?.evidence).toEqual([]);
      }
    }
  });
});
