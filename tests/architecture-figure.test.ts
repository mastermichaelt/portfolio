import { describe, expect, it } from "vitest";

import { projectWorkflowViewsBySlug } from "@/content/project-workflows";
import {
  FIGURE_OFFSET,
  MIN_FIGURE_SCALE,
  NODE_H,
  NODE_W,
  buildFigureGeometry,
  buildTrace,
  fitScale,
  isConditionalEdge,
  narrowThresholdFor,
  nodeOrdinalMap,
  prefersTrace,
  traceEdgeIds,
  type TraceConnectorRow,
  type TraceNodeRow,
} from "@/lib/architecture-figure";

/** Every (x, y) coordinate pair in an SVG path `d` (all commands are M/L here). */
function pathPoints(d: string): Array<[number, number]> {
  const nums = (d.match(/-?\d+(?:\.\d+)?/g) ?? []).map(Number);
  const points: Array<[number, number]> = [];
  for (let i = 0; i + 1 < nums.length; i += 2) {
    points.push([nums[i]!, nums[i + 1]!]);
  }
  return points;
}

const editorial = projectWorkflowViewsBySlug["editorial-workflow"]!;
const renovate = projectWorkflowViewsBySlug["renovate-governance"]!;
const views = [editorial, renovate];

const INTRINSIC = { editorial: 1104, renovate: 1064 };

describe("architecture figure geometry", () => {
  it("places every node at source position + offset, once", () => {
    for (const view of views) {
      const geometry = buildFigureGeometry(view);
      expect(geometry.nodes).toHaveLength(view.nodes.length);
      for (const node of view.nodes) {
        const box = geometry.nodes.find(
          (candidate) => candidate.id === node.id,
        );
        expect(box, node.id).toBeDefined();
        expect(box!.left).toBe(node.position.x + FIGURE_OFFSET);
        expect(box!.top).toBe(node.position.y + FIGURE_OFFSET);
      }
    }
  });

  it("numbers nodes by workflow reading order, not array order", () => {
    // Editorial's Refresh is authored first in the data array but is step 04.
    const ordinals = nodeOrdinalMap(editorial);
    expect(ordinals.get("node-capture")).toBe("01");
    expect(ordinals.get("node-refresh")).toBe("04");
    expect(ordinals.get("node-publish")).toBe("09");
    expect(nodeOrdinalMap(renovate).get("node-merge-gates")).toBe("05");
  });

  it("emits wide-figure node boxes in ordinal reading order (DOM/tab order)", () => {
    for (const view of views) {
      // geometry.nodes is the order the wide figure renders its buttons, so it
      // is the keyboard tab order. It must be 01..0N — not source-array order,
      // where Editorial's Refresh (04) is authored first and would focus first.
      const geometry = buildFigureGeometry(view);
      expect(geometry.nodes.map((box) => box.ordinal)).toEqual(
        view.nodes.map((_, index) => String(index + 1).padStart(2, "0")),
      );
      // And it matches the narrow trace's node reading order exactly, so both
      // representations traverse the workflow in the same sequence.
      const traceNodeIds = buildTrace(view)
        .filter((row): row is TraceNodeRow => row.type === "node")
        .map((row) => row.nodeId);
      expect(geometry.nodes.map((box) => box.id)).toEqual(traceNodeIds);
    }
  });

  it("renders every edge once, with source labels and directions intact", () => {
    for (const view of views) {
      const geometry = buildFigureGeometry(view);
      expect(geometry.edges.map((edge) => edge.id).sort()).toEqual(
        view.edges.map((edge) => edge.id).sort(),
      );
      for (const edge of view.edges) {
        const drawn = geometry.edges.find(
          (candidate) => candidate.id === edge.id,
        );
        expect(drawn, edge.id).toBeDefined();
        expect(drawn!.d.startsWith("M")).toBe(true);
        if (edge.label) {
          expect(drawn!.label).toBe(edge.label);
          expect(drawn!.labelX).toBeTypeOf("number");
          expect(drawn!.labelY).toBeTypeOf("number");
        }
      }
    }
  });

  it("dashes edges from explicit conditional semantics, not routing handles", () => {
    // The conditional (dashed) weight is an authored presentation semantic, not
    // an inference from the out-top routing handle. Assert it stays exactly the
    // Optional / Investigate edges even though other edges also use non-default
    // handles (e.g. e-edit-4 out / in-top, e-reno-4 out-bottom / in-top).
    const expectedByView: Record<string, string[]> = {
      "workflow-editorial": ["e-edit-3"],
      "workflow-renovate": ["e-reno-2"],
    };
    for (const view of views) {
      const dashed = buildFigureGeometry(view)
        .edges.filter((edge) => edge.dashed)
        .map((edge) => edge.id)
        .sort();
      expect(dashed).toEqual(expectedByView[view.id]);
      for (const edge of view.edges) {
        expect(isConditionalEdge(edge.id)).toBe(
          expectedByView[view.id]!.includes(edge.id),
        );
      }
      // A solid edge routed through a non-default handle must stay solid.
      const nonDefaultSolid = view.edges.find(
        (edge) =>
          (edge.sourceHandle === "out-top" ||
            edge.sourceHandle === "out-bottom" ||
            edge.targetHandle === "in-top") &&
          !expectedByView[view.id]!.includes(edge.id),
      );
      if (nonDefaultSolid) {
        const drawn = buildFigureGeometry(view).edges.find(
          (edge) => edge.id === nonDefaultSolid.id,
        );
        expect(drawn!.dashed).toBe(false);
      }
    }
  });

  it("keeps the wide and trace conditional weights consistent", () => {
    for (const view of views) {
      const wideDashed = buildFigureGeometry(view)
        .edges.filter((edge) => edge.dashed)
        .map((edge) => edge.id)
        .sort();
      const traceDashed = buildTrace(view)
        .filter(
          (row): row is TraceConnectorRow =>
            row.type === "connector" && row.dashed === true,
        )
        .flatMap((row) => row.edgeIds)
        .sort();
      expect(traceDashed).toEqual(wideDashed);
    }
  });

  it("carries the locked artboard sizes", () => {
    expect(buildFigureGeometry(editorial)).toMatchObject({
      width: 1104,
      height: 560,
    });
    expect(buildFigureGeometry(renovate)).toMatchObject({
      width: 1064,
      height: 468,
    });
  });

  it("keeps the wide figure — nodes and routed edges — inside its artboard", () => {
    for (const view of views) {
      const geometry = buildFigureGeometry(view);

      for (const node of geometry.nodes) {
        expect(node.left).toBeGreaterThanOrEqual(0);
        expect(node.top).toBeGreaterThanOrEqual(0);
        expect(node.left + NODE_W).toBeLessThanOrEqual(geometry.width);
        expect(node.top + NODE_H).toBeLessThanOrEqual(geometry.height);
      }

      // The routed topology — not just the node boxes — must stay in bounds.
      // This is the contract that justifies an artboard taller than the node
      // extent (e.g. the Editorial "Revise" loop drops below the last node row).
      for (const edge of geometry.edges) {
        for (const [x, y] of pathPoints(edge.d)) {
          expect(x, `${view.id} ${edge.id} x`).toBeGreaterThanOrEqual(0);
          expect(x, `${view.id} ${edge.id} x`).toBeLessThanOrEqual(
            geometry.width,
          );
          expect(y, `${view.id} ${edge.id} y`).toBeGreaterThanOrEqual(0);
          expect(y, `${view.id} ${edge.id} y`).toBeLessThanOrEqual(
            geometry.height,
          );
        }
      }
    }
  });
});

describe("architecture fit scale", () => {
  // The locked §03 column → scale table from the updated handoff. Columns are
  // the design's reference figure-viewport widths; scales are its stated values.
  const EDITORIAL_TABLE: Array<[column: number, scale: number]> = [
    [980, 0.8877],
    [924, 0.837],
    [883, 0.8],
    [838, 0.8],
    [816, 0.8],
    [796, 0.8],
    [668, 0.8],
    [637, 0.8],
    [565, 0.8],
  ];
  const RENOVATE_TABLE: Array<[column: number, scale: number]> = [
    [980, 0.9211],
    [924, 0.8684],
    [851, 0.8],
    [838, 0.8],
    [816, 0.8],
    [796, 0.8],
    [668, 0.8],
    [637, 0.8],
    [565, 0.8],
  ];

  it("matches the locked column → scale table for both projects", () => {
    for (const [column, scale] of EDITORIAL_TABLE) {
      expect(
        fitScale(column, INTRINSIC.editorial),
        `editorial ${column}`,
      ).toBeCloseTo(scale, 3);
    }
    for (const [column, scale] of RENOVATE_TABLE) {
      expect(
        fitScale(column, INTRINSIC.renovate),
        `renovate ${column}`,
      ).toBeCloseTo(scale, 3);
    }
  });

  it("is clamped to [0.80, 1] and equals the raw ratio between", () => {
    expect(fitScale(500, 1104)).toBe(MIN_FIGURE_SCALE); // below floor → pinned
    expect(fitScale(2000, 1104)).toBe(1); // wider than intrinsic → 1:1
    expect(fitScale(1104, 1104)).toBe(1); // exactly intrinsic → 1:1
    expect(fitScale(924, 1104)).toBeCloseTo(924 / 1104, 6); // between → raw ratio
    // Degenerate inputs (e.g. a hidden frame) never divide by zero.
    expect(fitScale(0, 1104)).toBe(1);
  });

  it("permits horizontal overflow only below 0.80 × intrinsic", () => {
    for (const [name, intrinsic] of Object.entries(INTRINSIC)) {
      const boundary = MIN_FIGURE_SCALE * intrinsic;
      for (const column of [
        boundary + 40,
        boundary + 1,
        boundary,
        boundary - 1,
        boundary - 200,
      ]) {
        const rendered = intrinsic * fitScale(column, intrinsic);
        if (column < boundary - 0.001) {
          // Frame scrolls: the rendered figure is wider than the column.
          expect(rendered, `${name} ${column} overflows`).toBeGreaterThan(
            column + 0.001,
          );
        } else {
          // Figure is whole in the frame: rendered fits within the column.
          expect(rendered, `${name} ${column} fits`).toBeLessThanOrEqual(
            column + 0.001,
          );
        }
      }
    }
  });
});

describe("architecture narrow threshold", () => {
  it("derives the per-view threshold from ARTBOARDS × MIN_FIGURE_SCALE", () => {
    // Per-figure, derived — never a second authored constant.
    expect(narrowThresholdFor(editorial)).toBe(
      Math.round(INTRINSIC.editorial * MIN_FIGURE_SCALE),
    );
    expect(narrowThresholdFor(renovate)).toBe(
      Math.round(INTRINSIC.renovate * MIN_FIGURE_SCALE),
    );
    expect(narrowThresholdFor(editorial)).toBe(883);
    expect(narrowThresholdFor(renovate)).toBe(851);
  });

  it("switches exactly at the boundary, per view", () => {
    // 883 → artboard, 882.9 → trace (and likewise 851 for renovate).
    expect(prefersTrace(883, editorial)).toBe(false);
    expect(prefersTrace(882.9, editorial)).toBe(true);
    expect(prefersTrace(851, renovate)).toBe(false);
    expect(prefersTrace(850.9, renovate)).toBe(true);
    // A zero-width read (a hidden frame) keeps the artboard.
    expect(prefersTrace(0, editorial)).toBe(false);
    // The two figures switch at different column widths: 864 (viewport 920 with
    // the rail unstuck) is trace for editorial but artboard for renovate.
    expect(prefersTrace(864, editorial)).toBe(true);
    expect(prefersTrace(864, renovate)).toBe(false);
  });
});

describe("architecture narrow trace", () => {
  const nodeRows = (view = editorial) =>
    buildTrace(view).filter((row): row is TraceNodeRow => row.type === "node");
  const connectorRows = (view = editorial) =>
    buildTrace(view).filter(
      (row): row is TraceConnectorRow => row.type === "connector",
    );
  const rowFor = (view: typeof editorial, edgeId: string) =>
    connectorRows(view).find((row) => row.edgeIds.includes(edgeId));
  const tagFor = (view: typeof editorial, nodeId: string) =>
    nodeRows(view).find((row) => row.nodeId === nodeId)?.tag;

  it("lists every node once, in workflow reading order", () => {
    for (const view of views) {
      const ordered = [...nodeOrdinalMap(view).keys()];
      expect(nodeRows(view).map((row) => row.nodeId)).toEqual(ordered);
      expect(new Set(nodeRows(view).map((row) => row.nodeId)).size).toBe(
        view.nodes.length,
      );
    }
  });

  it("carries every edge exactly once across connector rows", () => {
    for (const view of views) {
      const connectorEdges = connectorRows(view).flatMap((row) => row.edgeIds);
      expect(connectorEdges.sort()).toEqual(
        view.edges.map((edge) => edge.id).sort(),
      );
      // traceEdgeIds (the shared accessor) agrees with the built rows.
      expect([...traceEdgeIds(view)].sort()).toEqual(connectorEdges.sort());
    }
  });

  it("trace node ordinals equal nodeOrdinalMap for the view", () => {
    for (const view of views) {
      const ordinals = nodeOrdinalMap(view);
      for (const row of nodeRows(view)) {
        expect(row.ordinal).toBe(ordinals.get(row.nodeId));
      }
    }
  });

  it("composes connector text from source edge labels, never authored prose", () => {
    for (const view of views) {
      const labelById = new Map(
        view.edges.map((edge) => [edge.id, edge.label] as const),
      );
      for (const row of connectorRows(view)) {
        for (const edgeId of row.edgeIds) {
          const label = labelById.get(edgeId);
          if (label) expect(row.text).toContain(label);
        }
      }
    }
    // The retired hand-written strings must not reappear as derived prose.
    const allText = views
      .flatMap((view) => connectorRows(view))
      .map((row) => row.text)
      .join("\n");
    expect(allText).not.toContain("bypassing 04");
    expect(allText).not.toContain("Auto path rejoins here");
  });

  it("derives the fork, join and loop rows exactly (both views)", () => {
    // Fork: ↓ {edgeLabel} — branch to {targetOrd} {targetLabel}
    expect(rowFor(editorial, "e-edit-3")?.text).toBe(
      "↓ Optional — branch to 04 Refresh",
    );
    expect(rowFor(renovate, "e-reno-2")?.text).toBe(
      "↓ Investigate — branch to 03 Investigate",
    );

    // Join: one generic formula, phrased by whether the rejoin edge is labelled.
    // Editorial's rejoin (e-edit-4) is unlabelled; Renovate's (e-reno-4) is not.
    expect(rowFor(editorial, "e-edit-4")?.text).toBe(
      "↓ Skip bypasses 04 · rejoins at 05 Context",
    );
    expect(rowFor(renovate, "e-reno-4")?.text).toBe(
      "↓ After audit · Auto path rejoins at 04 Maintainer",
    );
    // The rejoin row folds in the bypass/auto edge — no duplicate node.
    expect(rowFor(renovate, "e-reno-4")?.edgeIds).toContain("e-reno-3");

    // Loop: ↑ {backEdgeLabel} — returns to {targetOrd} {targetLabel}
    const loop = rowFor(editorial, "e-edit-8");
    expect(loop?.kind).toBe("loop");
    expect(loop?.text).toBe("↑ Revise — returns to 06 Draft");

    // A labelled step keeps its label; an unlabelled step is a bare rail.
    expect(rowFor(editorial, "e-edit-9")?.text).toBe("↓ Ready");
    expect(rowFor(editorial, "e-edit-1")?.text).toBe("");
  });

  it("derives partner tags for conditional, loop-pair and convergence nodes", () => {
    // Conditional out-edge → → {targetOrd} {label|lc}
    expect(tagFor(editorial, "node-schedule")).toBe("→ 04 optional");
    expect(tagFor(renovate, "node-route")).toBe("→ 03 investigate");
    // Loop pair: later ordinal ↑, earlier ordinal ←.
    expect(tagFor(editorial, "node-critique")).toBe("↑ 06 revise");
    expect(tagFor(editorial, "node-draft")).toBe("← 07 revise");
    // Convergence (>1 in-edge) → ← {ordA} / {ordB} rejoin, sorted ascending.
    expect(tagFor(editorial, "node-context")).toBe("← 03 / 04 rejoin");
    expect(tagFor(renovate, "node-maintainer")).toBe("← 02 / 03 rejoin");
    // Branch-lane nodes carry no tag — the lane states the relationship.
    expect(tagFor(editorial, "node-refresh")).toBe("");
    expect(tagFor(renovate, "node-investigate")).toBe("");
  });

  it("builds the expansion edge line from every edge in source labels", () => {
    // 07 Critique: an in-edge, a labelled out-edge, and another labelled out.
    const critique = nodeRows(editorial).find(
      (row) => row.nodeId === "node-critique",
    );
    expect(critique?.edgeLine).toBe(
      "in: 06  ·  out: 06 Revise  ·  out: 08 Ready",
    );
    expect(critique?.kindLine).toBe("skill · node 07 · Analyze before score");

    // A conditional edge is marked · conditional (02 Route's Investigate out).
    const route = nodeRows(renovate).find((row) => row.nodeId === "node-route");
    expect(route?.edgeLine).toContain("out: 03 Investigate · conditional");
  });

  it("chips only non-dominant kinds", () => {
    // Editorial: skill is the strict majority → chip only 09 Publish (output).
    const editorialChipped = nodeRows(editorial)
      .filter((row) => row.showKind)
      .map((row) => row.nodeId);
    expect(editorialChipped).toEqual(["node-publish"]);
    // Renovate: agent is the majority → chip 02 Route and 05 Merge gates.
    const renovateChipped = nodeRows(renovate)
      .filter((row) => row.showKind)
      .map((row) => row.nodeId);
    expect(renovateChipped).toEqual(["node-route", "node-merge-gates"]);
  });

  it("marks the branch node as on the dashed lane", () => {
    const refresh = nodeRows(editorial).find(
      (row) => row.nodeId === "node-refresh",
    );
    expect(refresh?.onLane).toBe(true);
    const capture = nodeRows(editorial).find(
      (row) => row.nodeId === "node-capture",
    );
    expect(capture?.onLane).toBe(false);
  });
});
