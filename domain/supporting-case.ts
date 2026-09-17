import type {
  CaseArtifacts,
  CaseAside,
  CaseElsewhereLink,
  CaseNote,
} from "@/domain/project-case";

/**
 * Supporting-tier case-study presentation model. A distinct presentation
 * concern from the co-primary `ProjectCase` (which always carries a heading
 * sentence, a contract and figures) and from the generic `Project` inventory:
 * a numbered evidence-block document whose blocks split existing project prose
 * into lead / body / optional contract, and whose System block is followed by a
 * static architecture figure that owns the migrated /ecosystem canvas.
 *
 * Narrative copy is the existing `content/projects.ts` prose, verbatim; the
 * split into lead, body and contract is placement only. Neither supporting case
 * carries a qualified figure.
 */

/** A numbered prose block: category, an opening lead, body, optional contract, optional gutter note. */
export interface SupportingProseBlock {
  type: "prose";
  /** Anchor id, e.g. `b01`. */
  id: string;
  /** Structural numeral, e.g. `01`. */
  ordinal: string;
  /** Uppercase category beside the numeral, e.g. `System`. */
  category: string;
  /** Contents-rail label. */
  navLabel: string;
  /** The block's opening line at lead scale (56ch). */
  lead: string;
  /** Zero or more narrative paragraphs at body scale (62ch). */
  body: string[];
  /**
   * The block's contract line, present only where the source copy already
   * states a rule. Rendered after a `Contract:` prefix, in full `--fg`.
   */
  contract?: string;
  /** The figure-absent gutter note, or omitted for an empty gutter. */
  note?: CaseNote;
}

/**
 * The architecture block: full content column (no narrative/gutter split), a
 * static wide figure of the project's migrated workflow view, a local detail
 * strip, a legend and a return row. It sits immediately after System.
 */
export interface SupportingArchitectureBlock {
  type: "architecture";
  id: string;
  ordinal: string;
  category: string;
  navLabel: string;
  /** Figure-head provenance, e.g. `migrated from /ecosystem`. */
  provenance: string;
  /** Detail-strip census shown when no node is selected. */
  defaultSub: string;
  defaultSummary: string;
  /** The legend line naming this diagram's kinds. */
  legendKinds: string;
}

export type SupportingBlock =
  SupportingProseBlock | SupportingArchitectureBlock;

/** Header column-1 tier word (always `Supporting`) plus the mono metadata lines. */
export interface SupportingHeaderMeta {
  tier: string;
  lines: string[];
}

export interface SupportingCase {
  slug: string;
  /** Short name for chrome (breadcrumb, metadata). */
  name: string;
  header: SupportingHeaderMeta;
  /** The page `<h1>` — the project title, verbatim. */
  title: string;
  /** The header lead — the project summary, verbatim. */
  lead: string;
  aside: CaseAside;
  blocks: SupportingBlock[];
  elsewhere: CaseElsewhereLink[];
  artifacts: CaseArtifacts;
}
