import { sceneAtProgress } from "./singularity-choreography";

/** Scroll-sculpted transform + camera pose (prototype scenes I–II only). */
export interface SingularityVisualRig {
  birth: number;
  turbulence: number;
  dive: number;
  rotationX: number;
  rotationY: number;
  rotationZ: number;
  scale: number;
  groupPosition: { x: number; y: number; z: number };
  cameraPosition: { x: number; y: number; z: number };
}

/**
 * Maps scroll progress → rig. Pure function so scrub forward/back lands on the
 * same pose. Scene III (tunnel / Passage) is out of scope for this prototype.
 */
export function rigAtProgress(progress: number): SingularityVisualRig {
  const p = Math.max(0, Math.min(1, progress));
  const { scene, local } = sceneAtProgress(p);

  const birth = scene === "point" ? 0.08 + local * 0.92 : 1;
  const turbulence = scene === "wake" ? local : local * 0.25;
  const dive = scene === "wake" ? local : 0;

  const rotationY = p * Math.PI * 2.85 + turbulence * Math.PI * 0.65;
  const rotationX = 0.25 + turbulence * 0.9;
  const rotationZ = Math.sin(p * Math.PI * 2) * 0.12;
  const scale = birth * (1 + turbulence * 0.35);

  return {
    birth,
    turbulence,
    dive,
    rotationX,
    rotationY,
    rotationZ,
    scale,
    groupPosition: { x: 0, y: -dive * 0.35, z: dive * 1.6 },
    cameraPosition: {
      x: Math.sin(p * Math.PI) * 0.22,
      y: -0.12 + dive * 0.45,
      z: 5.2 - dive * 2.2,
    },
  };
}

export function sceneLabelAtProgress(progress: number): string {
  const { scene, local } = sceneAtProgress(progress);
  if (scene === "point") return "Scene I — Point";
  return `Scene II — Wake · ${Math.round(local * 100)}%`;
}
