import type { CaseFigure } from "@/domain/project-case";

/**
 * Presentation model for the Codenames AI scroll-driven case study ("1c — two
 * screens, one game"), rendered at `/projects/codenames-ai`. A distinct
 * presentation concern from the co-primary `ProjectCase` evidence document
 * (which still backs the projects index, homepage channels and metadata): this
 * one is a scroll experience whose left surface is the shipped product and whose
 * right surface changes character at every beat.
 *
 * All copy is transcribed verbatim from the approved design handoff prototype
 * and verified against the live repos. Board words, team assignments and the
 * product strings are lifted from `codenames-ai-guesser`; the qualified figures
 * are sourced from the existing `codenamesAi` `ProjectCase` so a figure has one
 * home. Nothing here is authored in a component.
 */

/** Product-register team of a board tile. */
export type TileTeam = "red" | "blue" | "neutral" | "assassin";

/** One codename on the spymaster board. */
export interface BoardTile {
  /** English codename (the classic English pool). */
  word: string;
  /**
   * The tile's Simplified Chinese token from the extended zh-Hans pool. It is
   * the pool's own word, not a translation of `word`; the language beat
   * crossfades to it in place.
   */
  zh: string;
  team: TileTeam;
  /** Already revealed on the shipped board (STADIUM). */
  revealed?: boolean;
}

/**
 * The relay that spans the band above both panes and keeps the two AI roles
 * legible: which role is acting, and the single clue that passes between them.
 */
export interface Relay {
  /** Mode label, e.g. "Solo vs AI" (the ◈ glyph is drawn by the component). */
  mode: string;
  spymaster: string;
  guesser: string;
  /** The clue handed over, e.g. "EMPIRE · two links". */
  clue: string;
  /** The guesser's first call, before the second lands. */
  callFirst: string;
  /** Both calls once the turn completes. */
  callBoth: string;
  /** Status phases, in scrubbed order. */
  statusPlanning: string;
  statusEvaluating: string;
  statusVerdict: string;
}

/** Fields shared by every beat's header (band id, mobile card id, kicker). */
interface BeatBase {
  /** Stable key used by the choreography and board projection, e.g. "legality". */
  id: string;
  /** Desktop band identifier, e.g. "01 / reasoning". */
  bandId: string;
  /** Mobile card identifier, e.g. "01 / the turn". */
  cardId: string;
  /** Role chip label in the kicker, e.g. "Both roles". */
  roleChip: string;
  /** Plain kicker after the chip, e.g. "It has to play legally". */
  kicker: string;
  /** The beat's statement line. */
  statement: string;
}

/** Beat 1 — the relay reads out: intent → clue → calls with confidence tiers. */
export interface ReasoningBeat extends BeatBase {
  kind: "reasoning";
  /** The spymaster's intended targets, e.g. "BEIJING · WALL". */
  intent: string;
  clue: string;
  /** The line marking the clue as the only thing handed over. */
  handover: string;
  /** Guesser calls with confidence tier and bar percentage. */
  calls: { word: string; tier: string; pct: number }[];
  /** The read the guesser discounted. */
  discounted: { word: string; note: string };
}

/** Beat 2 — each role can propose something illegal; neither acts on it. */
export interface LegalityBeat extends BeatBase {
  kind: "legality";
  /** One rejected candidate per role, in separate labelled rows. */
  rows: { role: string; token: string; note: string }[];
  /** The accepted, legal path. */
  accepted: string;
  contract: string;
  reportUrl: string;
}

/** Beat 3 — the frozen model-change beat (Looked like / Actually was). */
export interface MigrationBeat extends BeatBase {
  kind: "migration";
  lookedLike: string;
  actuallyWas: string;
  contract: string;
  reportUrl: string;
}

/** Beat 4 — the only beat that transforms the calm surface (language). */
export interface LanguageBeat extends BeatBase {
  kind: "language";
  /** The abstraction, e.g. ["word set", "language", "playable pool"]. */
  formula: string[];
  classicLine: string;
  extendedLine: string;
  contract: string;
  note: string;
  /**
   * The mobile language card's own 4-tile crop — real tokens from the extended
   * zh-Hans pool, authored per language, so they carry their own teams rather
   * than the English board's (the pool is a different board).
   */
  mobileTiles: { zh: string; team: TileTeam }[];
}

/** Beat 5 — a deployed product emitting real sessions (event stream). */
export interface OperationBeat extends BeatBase {
  kind: "operation";
  events: string[];
  note: string;
  reportUrl: string;
}

export type Beat =
  ReasoningBeat | LegalityBeat | MigrationBeat | LanguageBeat | OperationBeat;

/** A resolved field-report link in the "read the reasoning" door. */
export interface DoorReport {
  title: string;
  url: string;
}

/** The three progressive-depth doors below the primary narrative. */
export interface ExperienceDoors {
  experience: {
    label: string;
    title: string;
    body: string;
    /** The mode inventory line. */
    modes: string;
    ctaHref: string;
    ctaLabel: string;
  };
  reasoning: {
    label: string;
    title: string;
    /** Resolved from articles by `relatedProjectSlug`, never hard-coded. */
    reports: DoorReport[];
  };
  inspect: {
    label: string;
    title: string;
    body: string;
    /** The declared absence, e.g. "Private repository · no public URL". */
    absence: string;
  };
}

/**
 * The at-rest opening state (Addendum 01): identity and premise are present at
 * `scrollY = 0` and only *yield* on scroll — only the AI turn begins with
 * interaction. The premise fills the right pane at rest so it is never empty,
 * and explains the game to a visitor who does not know Codenames.
 */
export interface Premise {
  /** Kicker, e.g. "The premise". */
  kicker: string;
  /** What the game is (shown on desktop and tablet). */
  statement: string;
  /** The deployed/players claim (desktop only; tablet drops it for depth). */
  lead: string;
  /** Scroll-affordance label, e.g. "Scroll". */
  affordanceLabel: string;
  /** Scroll-affordance text. */
  affordanceText: string;
  /** The premise compressed to one sentence for the mobile identity block. */
  mobileSentence: string;
}

/** The fully-assembled Codenames scroll experience. */
export interface CodenamesExperience {
  slug: string;
  /** Hero eyebrow, e.g. "CH 01 · Independent · 2026 – present · live product". */
  eyebrow: string;
  /** Hero title — present at rest, yields to the beat identifier on scroll. */
  title: string;
  externalUrl: string;
  externalLabel: string;
  /** Mobile opening card identifier, e.g. "01 / the turn". */
  openingCardId: string;
  /** The at-rest identity's companion: what this is, before any beat. */
  premise: Premise;
  relay: Relay;
  board: BoardTile[];
  beats: Beat[];
  /** The statement below the pinned stage. */
  statement: string;
  evidenceLabel: string;
  evidenceTechnical: string;
  /** The three qualified figures, sourced from the `codenamesAi` case. */
  figures: CaseFigure[];
  deeperLabel: string;
  deeperTechnical: string;
  doors: ExperienceDoors;
}
