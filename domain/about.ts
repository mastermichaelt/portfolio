import type { CaseFigure } from "@/domain/project-case";

/**
 * The About "Standing Record" (2a) presentation model — a numbered practice
 * record beside a persistent identity rail. A distinct presentation concern
 * from `Profile` (which drives the rail's identity and contact) and from the
 * generic role inventory: About signals continuity across eras; Projects
 * proves.
 *
 * Copy is transcribed from the sibling `resumes/` inventory and the locked
 * design handoff. Figures reuse `CaseFigure` so `scope` is non-optional and are
 * rendered through the shared `QualifiedFigure` component; as there,
 * `CaseFigure.source` is a review aid for verifying figures against the
 * inventory and is never rendered. No figure appears here that is not backed by
 * the inventory.
 */

/** A document or gutter link; outbound links render through `ExternalLink`. */
export interface AboutLink {
  label: string;
  href: string;
  external?: boolean;
}

/**
 * One era in the §02 practice arc, newest first. `role`/`org` render as the
 * bold lead-in inside the paragraph (not a heading — it would pollute the
 * outline). `carry` is the carry-forward clause; the origin era omits it by
 * decision. Exactly one era is `current`.
 */
export interface AboutEra {
  id: string;
  dateRange: string;
  role: string;
  org?: string;
  body: string;
  /** Carry-forward clause: `label` is the opener ("In force now" / "Carried forward"). */
  carry?: { label: string; text: string };
  current?: boolean;
}

/** The §02 evidence gutter: the measurement-era figure and the ledger cross-link. */
export interface AboutArcEvidence {
  label: string;
  figure: CaseFigure;
  ledgerNote: { lead: string; link: AboutLink };
}

/** The §03 management band: a declarative statement, prose, and two figures. */
export interface AboutManagement {
  statement: string;
  body: string[];
  figures: CaseFigure[];
}

/** One §04 then/now row. The `→` glyph lives inside `now` so it survives copy. */
export interface AboutMapRow {
  then: string;
  now: string;
}

/** The §04 current-practice band: prose, the then/now mapping, a figure, links. */
export interface AboutCurrent {
  body: string;
  mapLabel: string;
  map: AboutMapRow[];
  figures: CaseFigure[];
  links: AboutLink[];
}

/** One §05 surface row. `href` absent = a stated, non-navigable surface. */
export interface AboutSurface {
  name: string;
  href?: string;
  description: string;
  /** The current page — rendered at full `--fg`, never linked. */
  self?: boolean;
}

/** The closing block: the availability line and the mailto call to action. */
export interface AboutNext {
  label: string;
  statement: string;
  note: string;
}

export interface AboutPage {
  eyebrow: string;
  /** Document statement (h2). A career claim — never re-synced with the homepage hero. */
  statement: string;
  /** Lead paragraph; `emphasis` is the closing clause rendered in full `--fg`. */
  lead: { text: string; emphasis: string };
  /** §01: two paragraphs; the second is the two-sentence turn, in `--fg`. */
  throughLine: string[];
  /** §02: five eras, newest first, exactly one `current: true`. */
  arc: AboutEra[];
  arcEvidence: AboutArcEvidence;
  /** §03: always visible — not collapsed. */
  management: AboutManagement;
  /** §04. */
  current: AboutCurrent;
  /** §05: five surfaces (this page + Home, Projects, Articles, Résumé). */
  surfaces: AboutSurface[];
  next: AboutNext;
}
