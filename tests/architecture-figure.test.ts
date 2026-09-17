import { describe, expect, it } from "vitest";

import { projectWorkflowViewsBySlug } from "@/content/project-workflows";
import {
  FIGURE_OFFSET,
  NODE_H,
  NODE_W,
  buildFigureGeometry,
  isConditionalEdge,
  narrowLayoutFor,
  nodeOrdinalMap,
  type NarrowConnectorRow,
  type NarrowNodeRow,
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

  it("keeps the wide and narrow conditional weights consistent", () => {
    for (const view of views) {
      const wideDashed = buildFigureGeometry(view)
        .edges.filter((edge) => edge.dashed)
        .map((edge) => edge.id)
        .sort();
      const narrowDashed = narrowLayoutFor(view)
        .filter(
          (row): row is NarrowConnectorRow =>
            row.type === "connector" && row.dashed === true,
        )
        .flatMap((row) => row.edgeIds)
        .sort();
      expect(narrowDashed).toEqual(wideDashed);
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

describe("architecture narrow stack", () => {
  it("lists every node once, in workflow reading order", () => {
    for (const view of views) {
      const nodeRows = narrowLayoutFor(view).filter(
        (row): row is NarrowNodeRow => row.type === "node",
      );
      const ordered = [...nodeOrdinalMap(view).keys()];
      expect(nodeRows.map((row) => row.nodeId)).toEqual(ordered);
      expect(new Set(nodeRows.map((row) => row.nodeId)).size).toBe(
        view.nodes.length,
      );
    }
  });

  it("carries every edge exactly once across connector rows", () => {
    for (const view of views) {
      const connectorEdges = narrowLayoutFor(view)
        .filter((row): row is NarrowConnectorRow => row.type === "connector")
        .flatMap((row) => row.edgeIds);
      expect(connectorEdges.sort()).toEqual(
        view.edges.map((edge) => edge.id).sort(),
      );
    }
  });

  it("keeps source edge labels inside their connector copy", () => {
    for (const view of views) {
      const labelById = new Map(
        view.edges.map((edge) => [edge.id, edge.label] as const),
      );
      for (const row of narrowLayoutFor(view)) {
        if (row.type !== "connector") continue;
        for (const edgeId of row.edgeIds) {
          const label = labelById.get(edgeId);
          if (label) expect(row.text ?? "").toContain(label);
        }
      }
    }
  });

  it("renders the Editorial revise loop as an up-arrow return row", () => {
    const revise = narrowLayoutFor(editorial).find(
      (row): row is NarrowConnectorRow =>
        row.type === "connector" && row.edgeIds.includes("e-edit-8"),
    );
    expect(revise?.arrow).toBe("up");
    expect(revise?.text).toContain("Revise");
    expect(revise?.text).toContain("06 Draft");
  });

  it("indents the Editorial optional Refresh lane one step", () => {
    const rows = narrowLayoutFor(editorial);
    const refresh = rows.find(
      (row): row is NarrowNodeRow =>
        row.type === "node" && row.nodeId === "node-refresh",
    );
    expect(refresh?.indent).toBe(1);
  });

  it("folds the Renovate auto path into the rejoin row, not a duplicate node", () => {
    const rejoin = narrowLayoutFor(renovate).find(
      (row): row is NarrowConnectorRow =>
        row.type === "connector" && row.edgeIds.includes("e-reno-3"),
    );
    expect(rejoin?.edgeIds).toContain("e-reno-4");
    expect(rejoin?.text).toContain("Auto path");
    expect(rejoin?.text).toContain("After audit");
  });
});
