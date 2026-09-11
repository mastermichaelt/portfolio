/**
 * Homepage presentation model — not a fifth project, not career inventory.
 * Copy is transcribed from sibling `resumes/` facts and roles; figures keep
 * value, name, and scope together. Source ids are for review, not rendered.
 */

export interface HomepageFigureSource {
  /** Sibling resumes inventory path. */
  inventory: string;
  factId: string;
  metricId?: string;
}

export interface HomepageFigure {
  value: string;
  name: string;
  scope: string;
  source: HomepageFigureSource;
}

export interface HomepageSpine {
  uncertain: string;
  checkable: string;
  contract: string;
}

export interface HomepageChannel {
  id: string;
  channelLabel: string;
  title: string;
  /** Hero anchor label (may include a live/org qualifier). */
  anchorLabel: string;
  href: string;
  dateRange: string;
  thesis: string;
  spine: HomepageSpine;
  figures: HomepageFigure[];
}

export interface HomepageLedgerRow {
  id: string;
  dateRange: string;
  role: string;
  org?: string;
  detail: string;
  current?: boolean;
}

export interface HomepageSupportingItem {
  id: string;
  title: string;
  summary: string;
  href: string;
}

/** Points at `content/articles.ts` by slug; `argument` is homepage-only compression. */
export interface HomepageWritingRef {
  slug: string;
  argument: string;
}

export interface HomepageHero {
  title: string;
  lead: string;
  /** Visual-contract thesis (like the H1) — not a metric. */
  leadEmphasis: string;
}

export interface Homepage {
  hero: HomepageHero;
  channels: HomepageChannel[];
  ledger: HomepageLedgerRow[];
  supporting: HomepageSupportingItem[];
  writing: HomepageWritingRef[];
}
