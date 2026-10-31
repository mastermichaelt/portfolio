/**
 * The five reasoning lines the /articles page (direction 2a) is organized into.
 * Ids are the repo taxonomy; the approved public labels live on
 * `ArticleLineDefinition.label`. TEAM (taste, evals, authority, measurement)
 * covers four core disciplines; portability is a separate cross-cutting line.
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
 * Presentation model for one reasoning line — the ordered taxonomy the
 * `/articles` bands and line index render from. `label` is the approved
 * public-facing wording; `pairs` is the project-tier pairing shown in the
 * band head (internal metadata); `note` is the optional band note for lines
 * whose reports carry no single system.
 */
export interface ArticleLineDefinition {
  id: ArticleLine;
  label: string;
  pairs: string;
  note?: string;
}
