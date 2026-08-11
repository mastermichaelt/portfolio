import { describe, expect, it } from "vitest";

import { entities, workflowViews } from "@/content/ecosystem";
import {
  findWorkflowNode,
  partitionWorkflowViews,
  resolveEcosystemDetail,
  toEcosystemFlowEdges,
  toEcosystemFlowNodes,
} from "@/lib/ecosystem-canvas";

describe("ecosystem canvas helpers", () => {
  const entitiesById = new Map(
    entities.map((entity) => [entity.id, entity] as const),
  );

  it("maps workflow views into React Flow nodes and edges", () => {
    const renovate = workflowViews.find(
      (view) => view.id === "workflow-renovate",
    );
    expect(renovate).toBeDefined();

    const nodes = toEcosystemFlowNodes(renovate!);
    const edges = toEcosystemFlowEdges(renovate!);

    expect(nodes).toHaveLength(renovate!.nodes.length);
    expect(edges).toHaveLength(renovate!.edges.length);
    expect(nodes.every((node) => node.type === "ecosystem")).toBe(true);
    expect(nodes.every((node) => node.draggable === false)).toBe(true);
    expect(nodes.every((node) => node.connectable === false)).toBe(true);
    expect(nodes.every((node) => node.deletable === false)).toBe(true);
    expect(nodes[0]).toMatchObject({
      id: "node-classify",
      position: { x: 0, y: 120 },
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
      type: "smoothstep",
      deletable: false,
    });
    expect(edges.every((edge) => edge.markerEnd)).toBeTruthy();
  });

  it("partitions overview spine from operational workflows", () => {
    const { overview, operational } = partitionWorkflowViews(workflowViews);
    expect(overview?.id).toBe("system-overview");
    expect(overview?.nodes).toHaveLength(4);
    expect(operational.map((view) => view.id)).toEqual([
      "workflow-renovate",
      "workflow-editorial",
      "workflow-product-loop",
    ]);
    expect(operational.every((view) => view.id !== "system-overview")).toBe(
      true,
    );
  });

  it("resolves selection detail from entity-linked nodes", () => {
    const detail = resolveEcosystemDetail({
      views: workflowViews,
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
      findWorkflowNode(workflowViews, "workflow-editorial", "node-publish"),
    ).toMatchObject({
      view: { id: "workflow-editorial" },
      node: { id: "node-publish", label: "Publish" },
    });
  });
});
