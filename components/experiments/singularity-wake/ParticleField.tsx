"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import type { Group } from "three";
import { AdditiveBlending } from "three";
import { sceneAtProgress } from "./singularity-choreography";
import { createSingularityParticleGeometry } from "./create-particle-geometry";

export function ParticleField({
  progressRef,
}: {
  progressRef: RefObject<number>;
}) {
  const groupRef = useRef<Group>(null);

  const geometry = useMemo(() => createSingularityParticleGeometry(), []);

  useFrame((state, delta) => {
    const group = groupRef.current;
    if (!group) return;

    const progress = progressRef.current ?? 0;
    const { scene, local } = sceneAtProgress(progress);

    const birth = scene === "point" ? 0.08 + local * 0.92 : 1;
    const turbulence = scene === "wake" ? local : local * 0.25;
    const dive = scene === "wake" ? local : 0;

    group.rotation.y += delta * (0.15 + turbulence * 1.4);
    group.rotation.x = 0.25 + turbulence * 0.9;
    group.rotation.z = Math.sin(progress * Math.PI * 2) * 0.12;

    const scale = birth * (1 + turbulence * 0.35);
    group.scale.setScalar(scale);
    group.position.z = dive * 1.6;
    group.position.y = -dive * 0.35;

    const cam = state.camera;
    cam.position.z = 5.2 - dive * 2.2;
    cam.position.y = -0.12 + dive * 0.45;
    cam.position.x = Math.sin(progress * Math.PI) * 0.22;
    cam.lookAt(0, 0, 0);
  });

  return (
    <group ref={groupRef}>
      <points geometry={geometry}>
        <pointsMaterial
          size={0.028}
          vertexColors
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          opacity={0.75}
          sizeAttenuation
        />
      </points>
    </group>
  );
}
