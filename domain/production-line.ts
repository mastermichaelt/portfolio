/**
 * The Ecosystem "line" — one fixed production lifecycle that four unrelated
 * systems each run down. This is a lightweight presentation model, deliberately
 * separate from the WorkflowView canvas model: a lane cell is a one-line account
 * of what a system does at a stage, not a node in a graph.
 *
 * Design of record: the locked `#1b` artboard in `Ecosystem Exploration.dc.html`
 * and `Ecosystem 1b - Implementation Handoff.dc.html`. Copy is final.
 */

/** One of the five fixed stages in the rack, in fixed left-to-right order. */
export interface ProductionStage {
  id: string;
  /** 1-based position; also the source of the zero-padded "01" display code. */
  order: number;
  name: string;
  /** The gate text — the single sentence that decides when the stage passes. */
  passCondition: string;
}

/** One cell of a lane: what a system does at a single stage. Two lines shown. */
export interface LaneCell {
  stageId: string;
  title: string;
  body: string;
}

/** One selectable system's run down the line: exactly five cells, one per stage. */
export interface LineLane {
  systemId: string;
  /** Chip label. */
  name: string;
  cells: LaneCell[];
}

/** A shared-infrastructure item beneath the line; constant across selections. */
export interface UnderTheLineItem {
  id: string;
  name: string;
  body: string;
  meta: string;
  /** True for the savepoints prototype: its meta line renders in the accent. */
  prototype?: boolean;
}

/** The whole surface: the fixed rack, the selectable lanes, and what's below it. */
export interface ProductionLine {
  stages: ProductionStage[];
  lanes: LineLane[];
  infrastructure: UnderTheLineItem[];
  /** The lane selected on load and server-rendered. */
  defaultSystemId: string;
}

/** The zero-padded two-digit display code for a stage, e.g. 1 → "01". */
export function stageCode(order: number): string {
  return String(order).padStart(2, "0");
}
