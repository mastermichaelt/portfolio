import { describe, expect, it } from "vitest";

import { entities, workflowViews } from "@/content/ecosystem";
import {
  availableEcosystemEntityKinds,
  ecosystemViewIdFromHash,
  filterEntitiesByKind,
  findWorkflowNode,
  nextEcosystemSelection,
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
    expect(nodes.every((node) => node.focusable === true)).toBe(true);
    expect(nodes[0]).toMatchObject({
      id: "node-classify",
      position: { x: 0, y: 120 },
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

    const editorial = workflowViews.find(
      (view) => view.id === "workflow-editorial",
    );
    expect(editorial?.nodes.map((node) => node.id)).toEqual([
      "node-inbox",
      "node-triage",
      "node-schedule",
      "node-context",
      "node-draft",
      "node-critique",
      "node-sync",
      "node-publish",
    ]);
    expect(
      editorial?.edges.find((edge) => edge.id === "e-edit-8"),
    ).toMatchObject({
      source: "node-sync",
      target: "node-publish",
      label: "Human",
    });
  });

  it("filters entity inventory kinds for the kind tab UI", () => {
    expect(availableEcosystemEntityKinds(entities)).toEqual([
      "project",
      "workflow",
      "agent",
      "skill",
      "governance",
      "knowledge",
      "output",
      "integration",
    ]);
    const projects = filterEntitiesByKind(entities, "project");
    expect(projects.length).toBeGreaterThan(0);
    expect(projects.every((entity) => entity.kind === "project")).toBe(true);
    expect(
      filterEntitiesByKind(entities, "skill").every(
        (entity) => entity.kind === "skill",
      ),
    ).toBe(true);
  });

  it("keeps active selection when another canvas emits a clear", () => {
    const current = {
      viewId: "workflow-editorial",
      nodeId: "node-inbox",
    };
    expect(nextEcosystemSelection(current, "workflow-renovate", null)).toEqual(
      current,
    );
    expect(
      nextEcosystemSelection(current, "workflow-editorial", null),
    ).toBeNull();
    expect(
      nextEcosystemSelection(current, "workflow-product-loop", "node-product"),
    ).toEqual({
      viewId: "workflow-product-loop",
      nodeId: "node-product",
    });
  });

  it("resolves deep-link hashes to known workflow view ids", () => {
    const ids = workflowViews.map((view) => view.id);
    expect(ecosystemViewIdFromHash("#workflow-renovate", ids)).toBe(
      "workflow-renovate",
    );
    expect(ecosystemViewIdFromHash("system-overview", ids)).toBe(
      "system-overview",
    );
    expect(ecosystemViewIdFromHash("#missing", ids)).toBeNull();
    expect(ecosystemViewIdFromHash("#", ids)).toBeNull();
    expect(ecosystemViewIdFromHash("", ids)).toBeNull();
  });
});
