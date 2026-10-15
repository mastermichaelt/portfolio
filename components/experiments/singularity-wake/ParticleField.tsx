"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef, type RefObject } from "react";
import type { Group } from "three";
import { AdditiveBlending } from "three";
import { createSingularityParticleGeometry } from "./create-particle-geometry";
import { rigAtProgress } from "./singularity-visual-rig";

/** Scroll-coupled shimmer (not time-integrated) so scrub rewind is pixel-stable. */
const AMBIENT_DRIFT_AMPLITUDE = 0.028;

export function ParticleField({
  progressRef,
}: {
  progressRef: RefObject<number>;
}) {
  const groupRef = useRef<Group>(null);

  const geometry = useMemo(() => createSingularityParticleGeometry(), []);

  useFrame(({ camera }) => {
    const group = groupRef.current;
    if (!group) return;

    const progress = progressRef.current ?? 0;
    const rig = rigAtProgress(progress);
    const ambient = Math.sin(progress * 42.7) * AMBIENT_DRIFT_AMPLITUDE;

    group.rotation.set(rig.rotationX, rig.rotationY + ambient, rig.rotationZ);
    group.scale.setScalar(rig.scale);
    group.position.set(
      rig.groupPosition.x,
      rig.groupPosition.y,
      rig.groupPosition.z,
    );

    const cam = camera;
    cam.position.set(
      rig.cameraPosition.x,
      rig.cameraPosition.y,
      rig.cameraPosition.z,
    );
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
