import { MarkerType, type Edge, type Node } from "@xyflow/react";

import type { Entity } from "@/domain/entities";
import type { Evidence } from "@/domain/evidence";
import type { WorkflowNode, WorkflowView } from "@/domain/workflow-view";

export type EcosystemNodeData = {
  label: string;
  subtitle?: string;
  kind: WorkflowNode["kind"];
  entityId?: string;
  relatedProjectSlug?: string;
};

export type EcosystemDetailModel = {
  nodeId: string;
  label: string;
  subtitle?: string;
  kind: WorkflowNode["kind"];
  summary?: string;
  relatedProjectSlug?: string;
  evidence: Evidence[];
  sourceViewId: string;
  sourceViewTitle: string;
};

export function toEcosystemFlowNodes(
  view: WorkflowView,
): Node<EcosystemNodeData>[] {
  return view.nodes.map((node) => ({
    id: node.id,
    type: "ecosystem",
    position: { ...node.position },
    data: {
      label: node.label,
      subtitle: node.subtitle,
      kind: node.kind,
      entityId: node.entityId,
      relatedProjectSlug: node.relatedProjectSlug,
    },
    draggable: false,
    connectable: false,
    deletable: false,
    focusable: true,
    ariaLabel: node.subtitle ? `${node.label}, ${node.subtitle}` : node.label,
  }));
}

export function toEcosystemFlowEdges(view: WorkflowView): Edge[] {
  return view.edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    label: edge.label,
    sourceHandle: edge.sourceHandle,
    targetHandle: edge.targetHandle,
    type: "smoothstep",
    deletable: false,
    markerEnd: {
      type: MarkerType.ArrowClosed,
      width: 16,
      height: 16,
      color: "var(--ecosystem-edge-stroke, #8a847c)",
    },
  }));
}

export function findWorkflowNode(
  views: WorkflowView[],
  viewId: string,
  nodeId: string,
): { view: WorkflowView; node: WorkflowNode } | null {
  const view = views.find((candidate) => candidate.id === viewId);
  if (!view) return null;
  const node = view.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) return null;
  return { view, node };
}

/** Resolve a canvas selection into detail-panel content (entity evidence when linked). */
export function resolveEcosystemDetail(input: {
  views: WorkflowView[];
  entitiesById: Map<string, Entity>;
  viewId: string;
  nodeId: string;
}): EcosystemDetailModel | null {
  const match = findWorkflowNode(input.views, input.viewId, input.nodeId);
  if (!match) return null;

  const { view, node } = match;
  const entity = node.entityId
    ? input.entitiesById.get(node.entityId)
    : undefined;

  return {
    nodeId: node.id,
    label: node.label,
    subtitle: node.subtitle,
    kind: node.kind,
    summary: entity?.summary,
    relatedProjectSlug: node.relatedProjectSlug ?? entity?.relatedProjectSlug,
    evidence: entity?.evidence ?? [],
    sourceViewId: view.id,
    sourceViewTitle: view.title,
  };
}

export type EcosystemSelection = {
  viewId: string;
  nodeId: string;
} | null;

/** Apply a canvas selection/clear without letting other canvases wipe active detail. */
export function nextEcosystemSelection(
  current: EcosystemSelection,
  viewId: string,
  nodeId: string | null,
): EcosystemSelection {
  if (!nodeId) {
    return current?.viewId === viewId ? null : current;
  }
  return { viewId, nodeId };
}
