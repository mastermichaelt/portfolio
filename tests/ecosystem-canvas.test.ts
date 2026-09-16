import { describe, expect, it } from "vitest";

import { entities, workflowViews } from "@/content/ecosystem";
import { projectWorkflowViewsBySlug } from "@/content/project-workflows";
import {
  findWorkflowNode,
  nextEcosystemSelection,
  resolveEcosystemDetail,
  toEcosystemFlowEdges,
  toEcosystemFlowNodes,
} from "@/lib/ecosystem-canvas";

describe("ecosystem canvas helpers", () => {
  const entitiesById = new Map(
    entities.map((entity) => [entity.id, entity] as const),
  );

  it("maps workflow views into React Flow nodes and edges", () => {
    const renovate = projectWorkflowViewsBySlug["renovate-governance"];
    expect(renovate).toBeDefined();

    const nodes = toEcosystemFlowNodes(renovate!);
    const edges = toEcosystemFlowEdges(renovate!);

    expect(nodes).toHaveLength(renovate!.nodes.length);
    expect(edges).toHaveLength(renovate!.edges.length);
    expect(nodes.every((node) => node.type === "ecosystem")).toBe(true);
    expect(nodes.every((node) => node.draggable === false)).toBe(true);
    expect(nodes.every((node) => node.connectable === false)).toBe(true);
    expect(nodes.every((node) => node.deletable === false)).toBe(true);
    expect(nodes.every((node) => node.focusable === true)).toBe(true);
    expect(nodes[0]).toMatchObject({
      id: "node-classify",
      position: { x: 0, y: 160 },
      ariaLabel: "Classify, One active PR → packet",
      data: {
        label: "Classify",
        kind: "agent",
        entityId: "agent-renovate-classifier",
      },
    });
    expect(edges.find((edge) => edge.id === "e-reno-2")).toMatchObject({
      source: "node-route",
      target: "node-investigate",
      label: "Investigate",
      sourceHandle: "out-top",
      targetHandle: "in",
      type: "smoothstep",
      deletable: false,
    });
    expect(edges.find((edge) => edge.id === "e-reno-4")).toMatchObject({
      source: "node-investigate",
      target: "node-maintainer",
      label: "After audit",
      sourceHandle: "out-bottom",
      targetHandle: "in-top",
    });
    expect(edges.every((edge) => edge.markerEnd)).toBeTruthy();

    const product = workflowViews.find(
      (view) => view.id === "workflow-product-loop",
    );
    expect(
      toEcosystemFlowEdges(product!).find((edge) => edge.id === "e-prod-5"),
    ).toMatchObject({
      source: "node-decisions",
      target: "node-product",
      label: "Ship",
      sourceHandle: "out-bottom",
      targetHandle: "in-bottom",
    });
  });

  it("resolves selection detail from entity-linked nodes", () => {
    const projectViews = Object.values(projectWorkflowViewsBySlug);
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
    expect(detail?.evidence.length).toBeGreaterThanOrEqual(0);

    expect(
      resolveEcosystemDetail({
        views: workflowViews,
        entitiesById,
        viewId: "missing-view",
        nodeId: "node-classify",
      }),
    ).toBeNull();

    expect(
      findWorkflowNode(projectViews, "workflow-editorial", "node-publish"),
    ).toMatchObject({
      view: { id: "workflow-editorial" },
      node: { id: "node-publish", label: "Publish" },
    });

    const editorial = projectWorkflowViewsBySlug["editorial-workflow"];
    expect(editorial?.nodes.map((node) => node.id)).toEqual([
      "node-refresh",
      "node-capture",
      "node-triage",
      "node-schedule",
      "node-context",
      "node-draft",
      "node-critique",
      "node-sync",
      "node-publish",
    ]);
    expect(
      editorial?.edges.find((edge) => edge.id === "e-edit-10"),
    ).toMatchObject({
      source: "node-sync",
      target: "node-publish",
      label: "Human",
    });
    expect(
      editorial?.edges.find((edge) => edge.id === "e-edit-5"),
    ).toMatchObject({
      source: "node-schedule",
      target: "node-context",
      label: "Skip",
      sourceHandle: "out",
      targetHandle: "in",
    });
    expect(
      editorial?.edges.find((edge) => edge.id === "e-edit-8"),
    ).toMatchObject({
      source: "node-critique",
      target: "node-draft",
      label: "Revise",
      sourceHandle: "out-bottom",
      targetHandle: "in-bottom",
    });

    const edges = toEcosystemFlowEdges(editorial!);
    expect(edges.find((edge) => edge.id === "e-edit-3")).toMatchObject({
      sourceHandle: "out-top",
      targetHandle: "in-bottom",
    });
  });

  it("keeps active selection when another canvas emits a clear", () => {
    const current = {
      viewId: "workflow-product-loop",
      nodeId: "node-product",
    };
    expect(nextEcosystemSelection(current, "workflow-editorial", null)).toEqual(
      current,
    );
    expect(
      nextEcosystemSelection(current, "workflow-product-loop", null),
    ).toBeNull();
    expect(
      nextEcosystemSelection(current, "system-overview", "layer-projects"),
    ).toEqual({
      viewId: "system-overview",
      nodeId: "layer-projects",
    });
  });
});
