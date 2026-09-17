import type { WorkflowEdge, WorkflowView } from "@/domain/workflow-view";

/**
 * Static architecture-figure geometry. The migrated /ecosystem canvases render
 * here as fixed SVG figures — no React Flow, no pan/zoom/minimap/dot grid.
 *
 * Topology is read from the WorkflowView (nodes, positions, edges, directions,
 * labels); only the orthogonal routing and the fixed artboard box are
 * presentation. Node screen position is `source position + OFFSET`, so the
 * figure never hand-places a node.
 */

export const NODE_W = 168;
export const NODE_H = 104;
/** Both axes are offset by this from the source coordinates in project-workflows.ts. */
export const FIGURE_OFFSET = 28;
/** Ports sit at box mid-height (top + 52) and mid-width (left + 84). */
const PORT_MID_X = NODE_W / 2; // 84
const PORT_MID_Y = NODE_H / 2; // 52
/** The rendered path stops this far short of the target port so the arrowhead touches the border. */
const ARROW_GAP = 4;
/** A same-row return edge drops this far below the row before crossing back. */
const LOOP_DROP = 32;

/**
 * Locked artboard sizes from the implementation handoff. These are the rule
 * where node extent alone would under-size the board (e.g. the Editorial
 * "Revise" loop dips below the lowest node row).
 */
const ARTBOARDS: Record<string, { width: number; height: number }> = {
  "workflow-editorial": { width: 1104, height: 560 },
  "workflow-renovate": { width: 1064, height: 468 },
};

export interface FigureNodeBox {
  id: string;
  left: number;
  top: number;
  ordinal: string;
  kind: string;
  label: string;
  subtitle?: string;
}

export interface FigureEdgePath {
  id: string;
  /** SVG path `d`. */
  d: string;
  /** Whether the edge is the conditional/optional (dashed) weight. */
  dashed: boolean;
  label?: string;
  /** Label plate anchor (centre of the labelled segment). */
  labelX?: number;
  labelY?: number;
}

export interface FigureGeometry {
  width: number;
  height: number;
  nodes: FigureNodeBox[];
  edges: FigureEdgePath[];
}

type Side = "top" | "bottom" | "left" | "right";
type Point = { x: number; y: number };

function boxFor(view: WorkflowView, nodeId: string) {
  const node = view.nodes.find((candidate) => candidate.id === nodeId);
  if (!node) throw new Error(`architecture figure: unknown node ${nodeId}`);
  return {
    left: node.position.x + FIGURE_OFFSET,
    top: node.position.y + FIGURE_OFFSET,
  };
}

function port(box: { left: number; top: number }, side: Side): Point {
  switch (side) {
    case "top":
      return { x: box.left + PORT_MID_X, y: box.top };
    case "bottom":
      return { x: box.left + PORT_MID_X, y: box.top + NODE_H };
    case "left":
      return { x: box.left, y: box.top + PORT_MID_Y };
    case "right":
      return { x: box.left + NODE_W, y: box.top + PORT_MID_Y };
  }
}

function sourceSide(handle?: string): Side {
  if (handle === "out-top") return "top";
  if (handle === "out-bottom") return "bottom";
  return "right";
}

function targetSide(handle?: string): Side {
  if (handle === "in-top") return "top";
  if (handle === "in-bottom") return "bottom";
  return "left";
}

/** Deterministic orthogonal route between two ports, keyed by their sides. */
function routePoints(s: Point, sSide: Side, t: Point, tSide: Side): Point[] {
  const midX = (s.x + t.x) / 2;
  const midY = (s.y + t.y) / 2;

  if (sSide === "right" && tSide === "left") {
    if (s.y === t.y) return [s, t];
    return [s, { x: midX, y: s.y }, { x: midX, y: t.y }, t];
  }
  if (sSide === "right" && tSide === "top") {
    return [s, { x: t.x, y: s.y }, t];
  }
  if (sSide === "top" && tSide === "bottom") {
    return [s, { x: s.x, y: midY }, { x: t.x, y: midY }, t];
  }
  if (sSide === "top" && tSide === "left") {
    return [s, { x: s.x, y: t.y }, t];
  }
  if (sSide === "bottom" && tSide === "left") {
    return [s, { x: s.x, y: t.y }, t];
  }
  if (sSide === "bottom" && tSide === "top") {
    if (s.x === t.x) return [s, t];
    return [s, { x: s.x, y: midY }, { x: t.x, y: midY }, t];
  }
  if (sSide === "bottom" && tSide === "bottom") {
    const drop = Math.max(s.y, t.y) + LOOP_DROP;
    return [s, { x: s.x, y: drop }, { x: t.x, y: drop }, t];
  }
  // Fallback: straight segment (no unhandled side-pair exists in the two views).
  return [s, t];
}

/** Pull the final point back toward the previous one so the arrowhead clears the node border. */
function withArrowGap(points: Point[]): Point[] {
  if (points.length < 2) return points;
  const end = points[points.length - 1]!;
  const prev = points[points.length - 2]!;
  const dx = end.x - prev.x;
  const dy = end.y - prev.y;
  const len = Math.hypot(dx, dy);
  if (len <= ARROW_GAP) return points;
  const shortened = {
    x: end.x - (dx / len) * ARROW_GAP,
    y: end.y - (dy / len) * ARROW_GAP,
  };
  return [...points.slice(0, -1), shortened];
}

function toPathD(points: Point[]): string {
  return points
    .map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`)
    .join(" ");
}

/** The label sits at the centre of the geometrically longest segment. */
function labelAnchor(points: Point[]): Point {
  let best: Point = { x: points[0]!.x, y: points[0]!.y };
  let bestLen = -1;
  for (let i = 0; i < points.length - 1; i += 1) {
    const a = points[i]!;
    const b = points[i + 1]!;
    const len = Math.hypot(b.x - a.x, b.y - a.y);
    if (len > bestLen) {
      bestLen = len;
      best = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }
  }
  return best;
}

function edgePath(view: WorkflowView, edge: WorkflowEdge): FigureEdgePath {
  const sBox = boxFor(view, edge.source);
  const tBox = boxFor(view, edge.target);
  const sSide = sourceSide(edge.sourceHandle);
  const tSide = targetSide(edge.targetHandle);
  const s = port(sBox, sSide);
  const t = port(tBox, tSide);
  const points = routePoints(s, sSide, t, tSide);
  const anchor = labelAnchor(points);
  // The dashed weight carries a conditional/optional edge. In both views those
  // are exactly the edges routed through a non-default (top/bottom) handle pair
  // that opens an optional lane — data marks them with sourceHandle out-top.
  const dashed = edge.sourceHandle === "out-top";
  return {
    id: edge.id,
    d: toPathD(withArrowGap(points)),
    dashed,
    label: edge.label,
    labelX: edge.label ? anchor.x : undefined,
    labelY: edge.label ? anchor.y : undefined,
  };
}

export function buildFigureGeometry(view: WorkflowView): FigureGeometry {
  const artboard = ARTBOARDS[view.id];
  const ordinals = nodeOrdinalMap(view);
  const nodes: FigureNodeBox[] = view.nodes.map((node) => {
    const box = boxFor(view, node.id);
    return {
      id: node.id,
      left: box.left,
      top: box.top,
      ordinal: ordinals.get(node.id) ?? "—",
      kind: node.kind,
      label: node.label,
      subtitle: node.subtitle,
    };
  });
  const edges = view.edges.map((edge) => edgePath(view, edge));

  // Fall back to node extent + symmetric padding if a view is not in the
  // locked-artboard table (keeps the helper total for future views).
  const width =
    artboard?.width ??
    Math.max(...nodes.map((n) => n.left + NODE_W)) + FIGURE_OFFSET;
  const height =
    artboard?.height ??
    Math.max(...nodes.map((n) => n.top + NODE_H)) + FIGURE_OFFSET;

  return { width, height, nodes, edges };
}

/* ------------------------------------------------------------------ narrow */

/**
 * The explicitly designed narrow stack. Nodes render in ordinal order; every
 * edge that is not a bare next step becomes a labelled connector row, so
 * branches, bypasses and loops survive as text rather than disappearing with
 * the artboard. Each connector names the source edge(s) it represents, so the
 * "every edge once" invariant is checkable and labels stay source-faithful.
 */
export interface NarrowNodeRow {
  type: "node";
  nodeId: string;
  /** One 20px indent step when the node sits on an optional/branch lane. */
  indent?: 1;
}

export interface NarrowConnectorRow {
  type: "connector";
  /** Source edge id(s) this row carries; the union across rows is every edge, once. */
  edgeIds: string[];
  /** Arrow glyph — "down" for a forward step, "up" for a return edge. */
  arrow: "down" | "up";
  /** Conditional/optional edges render on a dashed rule. */
  dashed?: boolean;
  indent?: 1;
  /** Connector copy; the source edge label (when any) is always a substring. */
  text?: string;
}

export type NarrowRow = NarrowNodeRow | NarrowConnectorRow;

const NARROW_EDITORIAL: NarrowRow[] = [
  { type: "node", nodeId: "node-capture" },
  { type: "connector", edgeIds: ["e-edit-1"], arrow: "down" },
  { type: "node", nodeId: "node-triage" },
  { type: "connector", edgeIds: ["e-edit-2"], arrow: "down" },
  { type: "node", nodeId: "node-schedule" },
  {
    type: "connector",
    edgeIds: ["e-edit-3"],
    arrow: "down",
    dashed: true,
    text: "Optional — to 04 Refresh",
  },
  { type: "node", nodeId: "node-refresh", indent: 1 },
  {
    type: "connector",
    edgeIds: ["e-edit-4"],
    arrow: "down",
    indent: 1,
    text: "from 04 Refresh",
  },
  {
    type: "connector",
    edgeIds: ["e-edit-5"],
    arrow: "down",
    indent: 1,
    text: "Skip — 03 Schedule → 05 Context, bypassing 04",
  },
  { type: "node", nodeId: "node-context" },
  { type: "connector", edgeIds: ["e-edit-6"], arrow: "down" },
  { type: "node", nodeId: "node-draft" },
  { type: "connector", edgeIds: ["e-edit-7"], arrow: "down" },
  { type: "node", nodeId: "node-critique" },
  {
    type: "connector",
    edgeIds: ["e-edit-8"],
    arrow: "up",
    text: "Revise — returns to 06 Draft",
  },
  { type: "connector", edgeIds: ["e-edit-9"], arrow: "down", text: "Ready" },
  { type: "node", nodeId: "node-sync" },
  { type: "connector", edgeIds: ["e-edit-10"], arrow: "down", text: "Human" },
  { type: "node", nodeId: "node-publish" },
];

const NARROW_RENOVATE: NarrowRow[] = [
  { type: "node", nodeId: "node-classify" },
  { type: "connector", edgeIds: ["e-reno-1"], arrow: "down" },
  { type: "node", nodeId: "node-route" },
  {
    type: "connector",
    edgeIds: ["e-reno-2"],
    arrow: "down",
    dashed: true,
    indent: 1,
    text: "Investigate — conditional",
  },
  { type: "node", nodeId: "node-investigate" },
  {
    type: "connector",
    // The rejoin row carries both the investigate→maintainer edge (After audit)
    // and the auto path (route→maintainer), rather than duplicating Maintainer.
    edgeIds: ["e-reno-4", "e-reno-3"],
    arrow: "down",
    indent: 1,
    text: "After audit  ·  Auto path rejoins here",
  },
  { type: "node", nodeId: "node-maintainer" },
  { type: "connector", edgeIds: ["e-reno-5"], arrow: "down" },
  { type: "node", nodeId: "node-merge-gates" },
];

const NARROW_LAYOUTS: Record<string, NarrowRow[]> = {
  "workflow-editorial": NARROW_EDITORIAL,
  "workflow-renovate": NARROW_RENOVATE,
};

export function narrowLayoutFor(view: WorkflowView): NarrowRow[] {
  const layout = NARROW_LAYOUTS[view.id];
  if (!layout) {
    throw new Error(`architecture figure: no narrow layout for ${view.id}`);
  }
  return layout;
}

/**
 * Node ordinal (reading order) per node id. The narrow layout lists nodes in
 * their workflow reading order — which is the numbering the wide figure, the
 * stack and the detail strip all share — so a data array whose order differs
 * (Editorial's Refresh is authored first) still numbers by the workflow, not by
 * array position. Falls back to array order for a view with no narrow layout.
 */
export function nodeOrdinalMap(view: WorkflowView): Map<string, string> {
  const layout = NARROW_LAYOUTS[view.id];
  const order = layout
    ? layout
        .filter((row): row is NarrowNodeRow => row.type === "node")
        .map((row) => row.nodeId)
    : view.nodes.map((node) => node.id);
  return new Map(
    order.map((id, index) => [id, String(index + 1).padStart(2, "0")]),
  );
}

/** The reading-order ordinal for a single node (e.g. the detail strip). */
export function ordinalFor(view: WorkflowView, nodeId: string): string {
  return nodeOrdinalMap(view).get(nodeId) ?? "—";
}
