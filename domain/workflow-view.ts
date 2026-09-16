import type { EntityKind } from "@/domain/entities";

export interface WorkflowNodePosition {
  x: number;
  y: number;
}

/** Layout node for a curated canvas; may optionally resolve to an Entity. */
export interface WorkflowNode {
  id: string;
  label: string;
  subtitle?: string;
  kind: EntityKind;
  position: WorkflowNodePosition;
  entityId?: string;
  relatedProjectSlug?: string;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
  /** Optional React Flow handle ids when edges must leave/enter non-default sides. */
  sourceHandle?: string;
  targetHandle?: string;
}

/**
 * Composition/layout view for ecosystem and project-page workflow canvases.
 * Optional talkTrack is view-level interview presentation — not Entity fields.
 */
export interface WorkflowView {
  id: string;
  title: string;
  summary: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  talkTrack?: string;
}
