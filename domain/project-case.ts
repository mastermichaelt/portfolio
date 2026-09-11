import type { RichText } from "@/domain/rich-text";

/**
 * Co-primary case-study presentation model — the Projects 1C "instrument index"
 * detail experience. A distinct presentation concern from the generic `Project`
 * inventory (mirrors `domain/homepage.ts`): a numbered evidence-block document
 * whose figures keep value + name + scope together.
 *
 * Copy is transcribed from the sibling `resumes/` inventory and the design
 * handoff evidence inventory. `CaseFigure.source` is a review aid for verifying
 * figures against that inventory — it is never rendered. No figure appears on
 * these surfaces that is not backed by the inventory.
 */

export interface CaseFigureSource {
  /** Sibling resumes inventory path. */
  inventory: string;
  factId: string;
  metricId?: string;
}

export interface CaseFigure {
  value: string;
  name: string;
  scope: string;
  /** Marks the (exactly two per case) figures that also appear on the index. */
  onIndex?: boolean;
  source: CaseFigureSource;
}

/**
 * The figure-absent gutter state: a `--surface` note listing guardrails or the
 * complementary jobs, closing with an explicit line. A block without a number
 * is a normal state in this system, not a gap to fill.
 */
export interface CaseNote {
  label: string;
  lines: string[];
  closing: string;
}

export interface CaseBlock {
  /** Anchor id, e.g. `b01`. */
  id: string;
  /** Structural numeral, e.g. `01`. */
  ordinal: string;
  /** Uppercase category beside the numeral, e.g. `Attribution`. */
  category: string;
  /** Contents-rail label, e.g. `Attribution audit`. */
  navLabel: string;
  /** Sentence stating what was uncertain — not a topic label. */
  heading: string;
  /** One or two narrative paragraphs. */
  body: string[];
  /** The block's contract line (rendered after a "Contract:" prefix). */
  contract: string;
  /** Only what the block can defend; omitted entirely when there is none. */
  figures?: CaseFigure[];
  /** Present instead of `figures` for the figure-absent state. */
  note?: CaseNote;
}

/**
 * The header's third column: the Atlassian role spine, or the Codenames scope
 * stack. Same geometry, different content class.
 */
export interface CaseAside {
  label: string;
  lines: string[];
  note: string;
}

/** A single "Elsewhere" cross-link in the rail. */
export interface CaseElsewhereLink {
  label: string;
  href: string;
}

/**
 * One artifacts row. A row is either an actionable link (`href` → "Open →"), a
 * stated absence (`affordance` "Private"/"Adjacent", no row link), or both a
 * label and an inline-linked description (the adjacent field-report case).
 */
export interface CaseArtifactRow {
  id: string;
  label: string;
  /** Stated-absence labels render in `--fg-2` rather than `--fg`. */
  labelMuted?: boolean;
  description?: RichText;
  /** Whole-row affordance link. */
  href?: string;
  /** Right-aligned non-link affordance ("Private", "Adjacent"). */
  affordance?: string;
}

export interface CaseArtifacts {
  label: string;
  rows: CaseArtifactRow[];
  closing: RichText;
}

export interface ProjectCase {
  slug: string;
  /** Short name for chrome (breadcrumb, metadata, index row). */
  name: string;
  channelLabel: string;
  /** Header column-1 lines (org / era / team). */
  metaLines: string[];
  /** The contract sentence — the page `<h1>`. */
  title: string;
  lead: string;
  aside: CaseAside;
  blocks: CaseBlock[];
  elsewhere: CaseElsewhereLink[];
  artifacts: CaseArtifacts;
}
