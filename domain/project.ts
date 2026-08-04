import type { Evidence } from "@/domain/evidence";

/** Flexible section kinds — include only those backed by evidence. */
export type ProjectSectionKind =
  | "context"
  | "problem"
  | "role"
  | "system"
  | "decisions"
  | "constraints"
  | "operation"
  | "outcomes"
  | "lessons"
  | "evidence";

export interface ProjectSection {
  id: string;
  kind: ProjectSectionKind;
  title: string;
  body: string;
}

export interface Project {
  slug: string;
  title: string;
  summary: string;
  tags: string[];
  /** Short label for index/case-study chrome (e.g. "Product case study"). */
  eyebrow?: string;
  /** Optional coarse kind for filtering later (e.g. "product", "governance"). */
  kind?: string;
  /**
   * Homepage flagship candidates. `listProjects()` returns the full inventory;
   * surfaces filter on this field (e.g. Codenames + editorial).
   */
  featured?: boolean;
  sections: ProjectSection[];
  relatedLinks?: Evidence[];
  evidence?: Evidence[];
}
