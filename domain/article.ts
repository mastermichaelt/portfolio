/**
 * The five reasoning lines the /articles page (direction 2a) is organized into.
 * Ids are the repo taxonomy; the approved public labels live on
 * `ArticleLineDefinition.label`. Membership and pairings come from
 * `docs/content-evidence-migration.md` §5.I.
 */
export type ArticleLine =
  "measurement" | "authority" | "critique" | "readiness" | "portability";

export interface Article {
  slug: string;
  title: string;
  summary: string;
  year: number;
  tags: string[];
  /** Canonical external URL (DEV.to for MVP). */
  url: string;
  relatedProjectSlug?: string;
  /**
   * Optional homepage / featured-writing flag.
   * `listArticles()` returns the full inventory; surfaces filter on this field.
   * Distinct from `lineLead`: `featured` mirrors the homepage `writing[]` set,
   * lead selection is per reasoning line — the two diverge on lines 04 and 05.
   */
  featured?: boolean;
  /** Reasoning line this report belongs to. Required for /articles. */
  line: ArticleLine;
  /** One-line claim the report arrives at. Required on line leads only. */
  argument?: string;
  /** Marks the one report that opens its line. Exactly one per line. */
  lineLead?: boolean;
}

/**
 * Presentation model for one reasoning line — the ordered taxonomy the
 * `/articles` bands and line index render from. `label` is the approved
 * public-facing wording (handoff §3.2); `pairs` is the project-tier pairing
 * shown in the band head, verbatim from `docs/content-evidence-migration.md`
 * §5.I; `note` is the optional band note for lines whose reports carry no
 * system (handoff §4).
 */
export interface ArticleLineDefinition {
  id: ArticleLine;
  label: string;
  pairs: string;
  note?: string;
}
