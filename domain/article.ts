/**
 * The five reasoning lines the /articles page (direction 2a) is organized into.
 * Render order is a conceptual engineering lifecycle: Taste → Evals &
 * Verification → Authority → Measurement, then Portability (TEAM Portability).
 */
export type ArticleLine =
  "taste" | "evals" | "authority" | "measurement" | "portability";

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
 * Presentation model for one lifecycle stage — the ordered taxonomy the
 * `/articles` bands and line index render from. `label` is the stage name;
 * `lifecycleQuestion` is the primary engineering question that stage answers;
 * `pairs` is internal project-tier metadata; `note` is optional curator copy.
 */
export interface ArticleLineDefinition {
  id: ArticleLine;
  label: string;
  /** Primary engineering question this lifecycle stage answers (rendered on `/articles`). */
  lifecycleQuestion: string;
  pairs: string;
  note?: string;
}
