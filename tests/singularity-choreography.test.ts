import { describe, expect, it } from "vitest";
import {
  SCENE_WAKE_START,
  sceneAtProgress,
} from "@/components/experiments/singularity-wake/singularity-choreography";

describe("sceneAtProgress", () => {
  it("maps early progress to Scene I", () => {
    const { scene, local } = sceneAtProgress(SCENE_WAKE_START * 0.5);
    expect(scene).toBe("point");
    expect(local).toBeCloseTo(0.5, 5);
  });

  it("maps late progress to Scene II", () => {
    const { scene, local } = sceneAtProgress(
      SCENE_WAKE_START + (1 - SCENE_WAKE_START) * 0.5,
    );
    expect(scene).toBe("wake");
    expect(local).toBeCloseTo(0.5, 5);
  });
});
