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
    // A node shows evidence only where its own entity carries it — never the
    // project-level evidence. (Handoff evidence constraint 06.)
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
