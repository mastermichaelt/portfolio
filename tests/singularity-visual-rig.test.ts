import { describe, expect, it } from "vitest";
import { rigAtProgress } from "@/components/experiments/singularity-wake/singularity-visual-rig";

describe("rigAtProgress", () => {
  it("is deterministic for the same scroll progress", () => {
    const a = rigAtProgress(0.62);
    const b = rigAtProgress(0.62);
    expect(a).toEqual(b);
  });

  it("returns the same pose when revisiting a progress value (scrub back)", () => {
    const forward = rigAtProgress(0.55);
    rigAtProgress(0.12);
    const rewind = rigAtProgress(0.55);
    expect(rewind).toEqual(forward);
  });
});
