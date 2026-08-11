import type { Evidence } from "@/domain/evidence";

/** Coarse kind for inventory grouping and future canvas chrome. */
export type EntityKind =
  | "project"
  | "workflow"
  | "agent"
  | "skill"
  | "governance"
  | "knowledge"
  | "output"
  | "integration";

/**
 * Knowledge-model node. Evidence and summaries only — no interview talk tracks.
 * Presentation narration belongs on WorkflowView.
 */
export interface Entity {
  id: string;
  name: string;
  kind: EntityKind;
  summary: string;
  relatedProjectSlug?: string;
  evidence?: Evidence[];
}
