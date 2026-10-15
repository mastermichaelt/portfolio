"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRef, useState } from "react";
import {
  armSingularityScroll,
  sceneAtProgress,
} from "./singularity-choreography";

gsap.registerPlugin(useGSAP, ScrollTrigger);

const SingularityCanvas = dynamic(
  () => import("./SingularityCanvas").then((mod) => mod.SingularityCanvas),
  { ssr: false },
);

export interface SingularityPrototypeProps {
  name: string;
  title: string;
  lead: string;
}

/**
 * Singularity Wake visual prototype — Scene I (Point) + Scene II (Wake) only.
 *
 * SSR floor (no JS / reduced motion): resolved copy + center amber mark; no pin,
 * no canvas. Motion arms only under `(prefers-reduced-motion: no-preference)` on
 * desktop-wide viewports; mobile uses static plates (concept §6).
 */
export function SingularityPrototype({
  name,
  title,
  lead,
}: SingularityPrototypeProps) {
  const rootRef = useRef<HTMLElement>(null);
  const progressRef = useRef(0);
  const [progress, setProgress] = useState(0);
  const [showCanvas, setShowCanvas] = useState(false);

  const { scene, local } = sceneAtProgress(progress);

  useGSAP(
    () => {
      const root = rootRef.current;
      if (!root) return;

      const mm = gsap.matchMedia();
      let teardownScroll: (() => void) | undefined;

      mm.add(
        {
          isDesktop:
            "(min-width: 821px) and (prefers-reduced-motion: no-preference)",
          isMobileMotion:
            "(max-width: 820px) and (prefers-reduced-motion: no-preference)",
          isReduced: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { isDesktop, isMobileMotion, isReduced } = context.conditions!;

          if (isReduced) {
            setShowCanvas(false);
            return;
          }

          if (isDesktop) {
            setShowCanvas(true);
            teardownScroll = armSingularityScroll(root, {
              scrollVh: 420,
              onProgress: (p) => {
                progressRef.current = p;
                setProgress(p);
              },
            });
            return;
          }

          if (isMobileMotion) {
            setShowCanvas(false);
            return;
          }
        },
      );

      return () => {
        teardownScroll?.();
        mm.revert();
      };
    },
    { scope: rootRef },
  );

  return (
    <article
      ref={rootRef}
      className="sw-proto"
      data-singularity-scene={scene}
      aria-label="Singularity Wake cinematic prototype"
    >
      <p className="sw-proto__banner">
        Visual prototype — not production home.{" "}
        <Link href="/">Return to site</Link>
      </p>

      <div className="sw-proto__mobile">
        <div className="sw-proto__mobile-copy">
          <p className="sw-proto__kicker">{name}</p>
          <h1 className="sw-proto__title">{title}</h1>
          <p className="sw-proto__lead">{lead}</p>
        </div>
        <div className="sw-proto__mobile-plates">
          <figure className="sw-proto__plate">
            <div className="sw-proto__plate-art sw-proto__plate-art--point" />
            <figcaption>Scene I — Point</figcaption>
          </figure>
          <figure className="sw-proto__plate">
            <div className="sw-proto__plate-art sw-proto__plate-art--wake" />
            <figcaption>Scene II — Wake</figcaption>
          </figure>
        </div>
      </div>

      <div className="sw-proto__desktop" data-singularity-scroll-spacer="">
        <div className="sw-proto__stage" data-singularity-stage="">
          <div className="sw-proto__pixel" aria-hidden="true" />
          {showCanvas ? (
            <div className="sw-proto__canvas-host">
              <SingularityCanvas progressRef={progressRef} dpr={1.75} />
            </div>
          ) : null}

          <div className="sw-proto__hud">
            <p className="sw-proto__kicker">{name}</p>
            <h1 className="sw-proto__title">{title}</h1>
            <p className="sw-proto__lead">{lead}</p>
            <p className="sw-proto__scene-label" data-sw-scene-label="">
              {scene === "point"
                ? "Scene I — Point"
                : `Scene II — Wake · ${Math.round(local * 100)}%`}
            </p>
          </div>
        </div>
      </div>
    </article>
  );
}
