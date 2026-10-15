import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/** Scroll progress 0–1 across Scene I (Point) + Scene II (Wake) for the visual prototype. */
export const SCENE_WAKE_START = 0.38;

export type SingularityScene = "point" | "wake";

export function sceneAtProgress(progress: number): {
  scene: SingularityScene;
  /** 0–1 within the active scene */
  local: number;
} {
  const p = Math.max(0, Math.min(1, progress));
  if (p < SCENE_WAKE_START) {
    return { scene: "point", local: p / SCENE_WAKE_START };
  }
  return {
    scene: "wake",
    local: (p - SCENE_WAKE_START) / (1 - SCENE_WAKE_START),
  };
}

export interface ArmSingularityScrollOptions {
  /** Pin + scrub distance in viewport heights (desktop). */
  scrollVh?: number;
  onProgress: (progress: number) => void;
}

/**
 * Desktop pin/scrub for Singularity Wake beats I–II. GSAP is the only scroll
 * orchestrator; WebGL reads progress via callback (no second scroll runtime).
 */
export function armSingularityScroll(
  scope: HTMLElement,
  options: ArmSingularityScrollOptions,
): () => void {
  const scrollVh = options.scrollVh ?? 420;
  const stage = scope.querySelector<HTMLElement>("[data-singularity-stage]");
  const spacer = scope.querySelector<HTMLElement>(
    "[data-singularity-scroll-spacer]",
  );
  if (!stage || !spacer) return () => {};

  const header = document.querySelector<HTMLElement>("header");
  const navH = header ? header.offsetHeight : 63;
  scope.style.setProperty("--sw-nav-h", `${navH}px`);
  spacer.style.height = `${scrollVh}vh`;

  const proxy = { value: 0 };
  const tween = gsap.to(proxy, {
    value: 1,
    ease: "none",
    scrollTrigger: {
      trigger: spacer,
      start: `top ${navH}px`,
      end: "bottom bottom",
      scrub: 1,
      pin: stage,
      pinSpacing: false,
      invalidateOnRefresh: true,
      onUpdate(self) {
        options.onProgress(self.progress);
      },
    },
  });

  scope.dataset.singularityProto = "armed";
  options.onProgress(0);

  return () => {
    delete scope.dataset.singularityProto;
    tween.scrollTrigger?.kill();
    tween.kill();
  };
}
