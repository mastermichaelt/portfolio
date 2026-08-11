/** Directed edge between entities (inventory / future synthesis — not a v1 mega-graph). */
export type RelationshipType = "feeds" | "governs" | "produces" | "uses";

export interface Relationship {
  id: string;
  fromId: string;
  toId: string;
  type: RelationshipType;
  label?: string;
}
