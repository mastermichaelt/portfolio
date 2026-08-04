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
   */
  featured?: boolean;
}
