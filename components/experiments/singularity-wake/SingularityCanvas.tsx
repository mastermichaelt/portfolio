"use client";

import { Canvas } from "@react-three/fiber";
import { Suspense, type RefObject } from "react";
import { ParticleField } from "./ParticleField";

export function SingularityCanvas({
  progressRef,
  dpr,
}: {
  progressRef: RefObject<number>;
  dpr: number;
}) {
  return (
    <Canvas
      className="sw-proto__canvas"
      dpr={dpr}
      gl={{ antialias: true, alpha: true }}
      camera={{ fov: 48, position: [0, 0, 5.2], near: 0.1, far: 40 }}
    >
      <color attach="background" args={["#121110"]} />
      <Suspense fallback={null}>
        <ParticleField progressRef={progressRef} />
      </Suspense>
    </Canvas>
  );
}
