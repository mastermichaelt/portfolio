export interface Article {
  slug: string;
  title: string;
  summary: string;
  year: number;
  tags: string[];
  /** Canonical external URL (DEV.to for MVP). */
  url: string;
  relatedProjectSlug?: string;
}
