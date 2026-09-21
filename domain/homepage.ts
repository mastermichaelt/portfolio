/**
 * Homepage 2 presentation model — one information model, two responsive
 * projections. Not a fifth project, not the career inventory. Copy is
 * transcribed from the sibling `resumes/` facts and roles.
 *
 * The model is four method dimensions read across two channels. Wide renders it
 * as a matrix (comparison across); narrow renders the same schema declared once
 * and instantiated per channel (comparison through recognition). Both
 * projections read from this single model — the redundancy lives in the markup,
 * never in the data.
 *
 * Home owns identity, the thesis, the two-channel framing, the contracts, one
 * qualified figure per channel, compressed career continuity, and the routes to
 * the deeper surfaces. It no longer reproduces the full career ledger, the
 * supporting-project summaries, or the article catalogue — those live on their
 * dedicated surfaces.
 *
 * Figures keep value + name + scope together and are never separated; `source`
 * is a review aid for verifying figures against the inventory and is never
 * rendered.
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

/**
 * The shared method schema — the four questions asked of every channel, in
 * order. `key` binds a dimension to the channel content that answers it:
 * `uncertain` / `checkable` / `contract` read the matching `HomepageSpine`
 * field; `evidence` renders the channel's qualified figure.
 */
export type HomepageMethodKey =
  "uncertain" | "checkable" | "contract" | "evidence";

export interface HomepageMethodDimension {
  /** Two-digit ordinal, e.g. "01". */
  ordinal: string;
  key: HomepageMethodKey;
  /** Short dimension name, e.g. "Made checkable". */
  label: string;
  /** One-clause gloss naming what the dimension asks. */
  gloss: string;
}

export interface HomepageSpine {
  uncertain: string;
  checkable: string;
  contract: string;
}

export interface HomepageChannel {
  id: string;
  /** Channel identifier, e.g. "CH 01" — muted, never a signal colour. */
  channelLabel: string;
  title: string;
  /** Single head meta line: org · dates · qualifier. */
  meta: string;
  /** Route to this channel's deeper surface (a case study). */
  href: string;
  /** Named per-channel route label, e.g. "Codenames AI case study →". */
  caseStudyLabel: string;
  spine: HomepageSpine;
  /** The one qualified figure Home carries for this channel. */
  figure: HomepageFigure;
}

/**
 * Compressed career-continuity band ("One practice"). The `figure` is
 * supporting continuity evidence, subordinate to the two channel figures — its
 * hierarchy reflects that. The full record lives on About.
 */
export interface HomepageContinuity {
  /** Band label, e.g. "One practice". */
  label: string;
  gloss: string;
  /** The strong continuity claim (roles across the two decades). */
  claim: string;
  body: string;
  figure: HomepageFigure;
  link: { label: string; href: string };
}

/** One destination in the closing route grid. */
export interface HomepageRoute {
  id: string;
  /** Mono role kicker, e.g. "Evidence index". */
  role: string;
  /** Destination name with trailing glyph, e.g. "Projects →". */
  name: string;
  href: string;
  summary: string;
}

export interface HomepageHero {
  title: string;
  lead: string;
  /** Visual-contract thesis (like the H1) — not a metric. */
  leadEmphasis: string;
}

export interface Homepage {
  hero: HomepageHero;
  /** The four method dimensions, in reading order. */
  method: HomepageMethodDimension[];
  /** The two channels, read across (wide) or in sequence (narrow). */
  channels: HomepageChannel[];
  continuity: HomepageContinuity;
  /** Routes into the deeper destination surfaces. */
  routes: HomepageRoute[];
}
