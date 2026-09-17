import { describe, expect, it } from "vitest";

import { projectWorkflowViewsBySlug } from "@/content/project-workflows";
import {
  FIGURE_OFFSET,
  NODE_H,
  NODE_W,
  buildFigureGeometry,
  narrowLayoutFor,
  nodeOrdinalMap,
  type NarrowConnectorRow,
  type NarrowNodeRow,
} from "@/lib/architecture-figure";

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

  it("uses exactly one dashed (conditional) edge per view", () => {
    expect(
      buildFigureGeometry(editorial).edges.filter((edge) => edge.dashed),
    ).toHaveLength(1);
    expect(
      buildFigureGeometry(renovate).edges.filter((edge) => edge.dashed),
    ).toHaveLength(1);
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

  it("keeps the wide figure inside its artboard", () => {
    for (const view of views) {
      const geometry = buildFigureGeometry(view);
      for (const node of geometry.nodes) {
        expect(node.left + NODE_W).toBeLessThanOrEqual(geometry.width);
        expect(node.top + NODE_H).toBeLessThanOrEqual(geometry.height);
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
