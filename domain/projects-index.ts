import type { CaseFigure } from "@/domain/project-case";
import type { RichText } from "@/domain/rich-text";

/**
 * Projects index composition — the 1C "instrument index" of `/projects`.
 *
 * Tier is a presentation concern here: it is carried by row geometry and type
 * weight, and ordering is explicit. Hierarchy is NOT derived from
 * `Project.featured`. The two co-primary rows draw their two index figures from
 * the linked `ProjectCase` so index and detail can never drift.
 */

export interface ProjectsIndexHero {
  eyebrow: string;
  title: string;
  lead: string;
}

export interface ProjectsIndexKey {
  label: string;
  /** Three legend lines describing the tiers. */
  lines: string[];
}

export interface IndexCoPrimaryRow {
  channelLabel: string;
  title: string;
  org: string;
  dateRange: string;
  href: string;
  /** The thesis sentence — the row `<h2>`, largest type in the row. */
  contract: string;
  summary: string;
  /** One chip per detail block; previews depth without spending figures. */
  chips: string[];
  /** Single mono role-spine line. */
  roleSpine: string;
  /** Exactly two figures, derived from the linked case. */
  figures: CaseFigure[];
  /** Hairline-topped line naming deferred figures in words, not numerals. */
  deferral: RichText;
}

export interface IndexSupportingRow {
  title: string;
  summary: string;
  /** A count plus its surface, e.g. "15 reports published via workflow · DEV series". */
  proofSurface: string;
  href: string;
}

export interface IndexInfrastructureRow {
  title: string;
  summary: string;
  proofSurface: string;
}

export interface ProjectsIndexColumns {
  system: string;
  contract: string;
  evidence: string;
}

export interface ProjectsIndex {
  hero: ProjectsIndexHero;
  key: ProjectsIndexKey;
  columns: ProjectsIndexColumns;
  coPrimary: IndexCoPrimaryRow[];
  supporting: IndexSupportingRow[];
  infrastructure: IndexInfrastructureRow[];
  footer: RichText;
}
