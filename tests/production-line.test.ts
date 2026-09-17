import { describe, expect, it } from "vitest";

import { productionLine } from "@/content/production-line";
import { stageCode } from "@/domain/production-line";

const { stages, lanes, infrastructure, defaultSystemId } = productionLine;

describe("production line — fixed rack", () => {
  it("has exactly five stages in the locked order", () => {
    expect(stages.map((stage) => stage.name)).toEqual([
      "Intent",
      "Agent execution",
      "Verification",
      "Judgment",
      "Evidence",
    ]);
  });

  it("numbers the stages 1..5 in order", () => {
    expect(stages.map((stage) => stage.order)).toEqual([1, 2, 3, 4, 5]);
  });

  it("gives every stage a non-empty pass condition", () => {
    for (const stage of stages) {
      expect(stage.passCondition.trim().length).toBeGreaterThan(0);
    }
    expect(stages[2]!.passCondition).toBe(
      "Passes on a named reject class or a green check — never on a plausible reading.",
    );
    expect(stages[4]!.passCondition).toBe(
      "Passes when the claim carries its scope, or is not made at all.",
    );
  });

  it("derives the zero-padded display code from the order", () => {
    expect(stages.map((stage) => stageCode(stage.order))).toEqual([
      "01",
      "02",
      "03",
      "04",
      "05",
    ]);
  });
});

describe("production line — selectable lanes", () => {
  it("offers exactly four systems in the fixed chip order", () => {
    expect(lanes.map((lane) => lane.name)).toEqual([
      "Codenames AI",
      "Renovate governance",
      "Editorial workflow",
      "This portfolio",
    ]);
  });

  it("defaults to Codenames AI, and the default is a real lane", () => {
    expect(defaultSystemId).toBe("codenames");
    expect(lanes[0]!.systemId).toBe("codenames");
    expect(lanes.some((lane) => lane.systemId === defaultSystemId)).toBe(true);
  });

  it("gives every lane exactly five cells, one per stage in order", () => {
    const stageOrder = stages.map((stage) => stage.id);
    for (const lane of lanes) {
      expect(lane.cells).toHaveLength(5);
      expect(lane.cells.map((cell) => cell.stageId)).toEqual(stageOrder);
      for (const cell of lane.cells) {
        expect(cell.title.trim().length).toBeGreaterThan(0);
        expect(cell.body.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it("keeps the verbatim cell copy for spot-checked cells", () => {
    const codenames = lanes.find((lane) => lane.systemId === "codenames")!;
    expect(codenames.cells[0]).toMatchObject({
      stageId: "intent",
      title: "Model migration as experiment",
    });

    const renovate = lanes.find((lane) => lane.systemId === "renovate")!;
    expect(renovate.cells[4]).toMatchObject({
      stageId: "evidence",
      title: "Two reports, no outcomes claim",
      body: "The case study deliberately carries no outcomes section — the ladder is the claim, and two field reports document it.",
    });

    const editorial = lanes.find((lane) => lane.systemId === "editorial")!;
    expect(editorial.cells[4]!.title).toBe("15 reports, published by hand");
  });
});

describe("production line — under the line", () => {
  it("carries four constant infrastructure items", () => {
    expect(infrastructure.map((item) => item.name)).toEqual([
      "Team-harness plugin",
      "Four-layer hook stack",
      "Facts inventory",
      "Savepoints",
    ]);
  });

  it("marks exactly one item — savepoints — as a prototype", () => {
    const prototypes = infrastructure.filter((item) => item.prototype);
    expect(prototypes).toHaveLength(1);
    expect(prototypes[0]!.id).toBe("savepoints");
    expect(prototypes[0]!.meta).toBe("prototype · not a shipped surface");
  });
});
