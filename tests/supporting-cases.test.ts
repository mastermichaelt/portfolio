import { describe, expect, it } from "vitest";

import {
  supportingCases,
  supportingCaseSourceProse,
} from "@/content/supporting-cases";
import type { SupportingProseBlock } from "@/domain/supporting-case";

function proseBlocks(slug: string): SupportingProseBlock[] {
  const entry = supportingCases.find((candidate) => candidate.slug === slug)!;
  return entry.blocks.filter(
    (block): block is SupportingProseBlock => block.type === "prose",
  );
}

describe("supporting-tier cases", () => {
  it("exposes exactly Editorial then Renovate, both Supporting tier", () => {
    expect(supportingCases.map((entry) => entry.slug)).toEqual([
      "editorial-workflow",
      "renovate-governance",
    ]);
    for (const entry of supportingCases) {
      expect(entry.header.tier).toBe("Supporting");
    }
  });

  it("numbers blocks contiguously and keeps Artifacts unnumbered", () => {
    for (const entry of supportingCases) {
      const ordinals = entry.blocks.map((block) => block.ordinal);
      expect(ordinals).toEqual(
        entry.blocks.map((_, index) => String(index + 1).padStart(2, "0")),
      );
    }
  });

  it("places the architecture block immediately after System", () => {
    for (const entry of supportingCases) {
      const archIndex = entry.blocks.findIndex(
        (block) => block.type === "architecture",
      );
      expect(archIndex).toBeGreaterThan(0);
      const before = entry.blocks[archIndex - 1]!;
      expect(before.category).toBe("System");
      const arch = entry.blocks[archIndex]!;
      expect(arch.navLabel).toBe("Architecture");
      if (arch.type === "architecture") {
        expect(arch.viewSlug).toBe(entry.slug);
      }
    }
  });

  it("gives Editorial one contract and Renovate two", () => {
    const contracts = (slug: string) =>
      proseBlocks(slug).filter((block) => block.contract).length;
    expect(contracts("editorial-workflow")).toBe(1);
    expect(contracts("renovate-governance")).toBe(2);
  });

  it("keeps every lead, body and contract verbatim from the source prose", () => {
    for (const entry of supportingCases) {
      for (const block of proseBlocks(entry.slug)) {
        const source = supportingCaseSourceProse[`${entry.slug}:${block.id}`];
        expect(source, `${entry.slug}:${block.id} source`).toBeDefined();
        const parts = [block.lead, ...block.body];
        if (block.contract) parts.push(block.contract);
        for (const part of parts) {
          expect(source, `${entry.slug}:${block.id} "${part}"`).toContain(part);
        }
      }
    }
  });

  it("never introduces a qualified numeric figure", () => {
    for (const entry of supportingCases) {
      // The presentation model has no figure slot; assert no stray figure data
      // sneaks in through a block object either.
      for (const block of entry.blocks) {
        expect(block).not.toHaveProperty("figures");
        expect(block).not.toHaveProperty("figure");
      }
    }
  });

  it("draws gutter notes only for the designated blocks", () => {
    const noteCategories = (slug: string) =>
      proseBlocks(slug)
        .filter((block) => block.note)
        .map((block) => block.category);
    expect(noteCategories("editorial-workflow")).toEqual([
      "System",
      "Constraints",
    ]);
    expect(noteCategories("renovate-governance")).toEqual([
      "Constraints",
      "Operation",
    ]);
  });

  it("keeps Editorial artifacts public and Renovate's audit absence stated", () => {
    const editorial = supportingCases[0]!;
    expect(editorial.artifacts.rows).toHaveLength(4);
    expect(editorial.artifacts.rows.every((row) => Boolean(row.href))).toBe(
      true,
    );

    const renovate = supportingCases[1]!;
    expect(renovate.artifacts.rows).toHaveLength(3);
    const absence = renovate.artifacts.rows.find((row) => row.labelMuted);
    expect(absence?.affordance).toBe("Private");
    expect(absence?.href).toBeUndefined();
    expect(renovate.artifacts.rows.filter((row) => row.href)).toHaveLength(2);
  });

  it("cross-links the two cases through Elsewhere and the closing note", () => {
    const editorial = supportingCases[0]!;
    const renovate = supportingCases[1]!;
    expect(editorial.elsewhere.map((link) => link.href)).toContain(
      "/projects/renovate-governance",
    );
    expect(renovate.elsewhere.map((link) => link.href)).toContain(
      "/projects/editorial-workflow",
    );
  });
});
