"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

/**
 * The homepage "two systems, one method" reveal, on GSAP ScrollTrigger.
 *
 * This is the production successor to the scroll-craft spike: GSAP is now the
 * single scroll runtime across the site (the Codenames case study already runs
 * on it), so the method section's once-on-entry stagger moves onto the same
 * runtime and the vendored engine is retired. The visual effect is unchanged —
 * each row of whichever projection is shown fades up 10px, 90ms apart, once on
 * entry and never re-hidden — and so is its a11y contract, carried over from
 * docs/experiments/scroll-craft-baseline.md:
 *
 *   - **No JavaScript → settled.** The server-rendered markup is the resolved
 *     composition. The hidden state is set by GSAP at mount; with no JS it is
 *     never applied, so the rows render fully visible. There is no CSS rule that
 *     hides anything, so nothing can strand content behind a runtime that never
 *     loaded.
 *   - **Reduced motion → settled.** The arming branch is gated on
 *     `(prefers-reduced-motion: no-preference)`, so a reduced-motion visitor is
 *     never armed and the document stays settled — stricter than an opacity
 *     fade, matching the `base.css` floor.
 *   - **Keyboard + print → settled.** GSAP writes the armed state as an inline
 *     `opacity: 0`, which only `!important` can override, so the `:focus-within`
 *     keyboard rescue and the `@media print` settle live in `home.css`. A
 *     keyboard reader never lands on an invisible row, and the comparison never
 *     prints blank for a reader who has not scrolled to it.
 *
 * Because `useGSAP` reverts every tween, ScrollTrigger and matchMedia branch on
 * unmount and rebuilds them on remount, the mount-once compromise the engine
 * forced (no unmount, so re-mounting leaked rAF loops and listeners) is gone:
 * every visit — including a client-side return to `/` — gets the full reveal,
 * with nothing left driving detached DOM.
 *
 * It renders no DOM of its own. The method section's markup lives in the server
 * component (`app/page.tsx`); this leaf finds the two projections by
 * `[data-method-reveal]` and arms whichever one the breakpoint shows. The two
 * are mutually exclusive at 820px, so only the displayed projection is armed,
 * and crossing the breakpoint reverts it and arms the other.
 */

/** Both projections carry this; only one is shown at a time (820px). */
const GROUP_SELECTOR = "[data-method-reveal]";
/** Matches the engine's 90ms cascade and the `.fade-in` motion in
 *  components.css (0.55s / 10px), so the feel is unchanged by the runtime swap. */
const STAGGER = 0.09;
const DURATION = 0.55;
const RISE = 10;

function armGroup(group: HTMLElement): () => void {
  const rows = Array.from(group.children) as HTMLElement[];
  if (rows.length === 0) return () => {};

  gsap.set(rows, { opacity: 0, y: RISE });
  // A live-arm signal for tests and for anyone inspecting the DOM; the attribute
  // is otherwise just the selector marker.
  group.dataset.methodReveal = "armed";

  gsap.to(rows, {
    opacity: 1,
    y: 0,
    duration: DURATION,
    ease: "power2.out",
    stagger: STAGGER,
    scrollTrigger: {
      trigger: group,
      // Fire as the group clears the bottom of the viewport, once, and hold —
      // content that re-hides on scroll-up is a defect, not an effect.
      start: "top 85%",
      once: true,
    },
  });

  return () => {
    // matchMedia reverts the GSAP inline styles; only the marker is ours to
    // reset, so the resolved markup is exactly what a no-JS visitor would see.
    group.dataset.methodReveal = "";
  };
}

export function MethodReveal() {
  useGSAP(() => {
    const groups = Array.from(
      document.querySelectorAll<HTMLElement>(GROUP_SELECTOR),
    );
    if (groups.length === 0) return;

    const mm = gsap.matchMedia();
    const cleanups: Array<() => void> = [];

    mm.add(
      {
        // Only arm the projection the breakpoint actually shows (820px), and
        // never under reduced motion — then neither branch matches and the
        // document is left settled.
        wide: "(min-width: 821px) and (prefers-reduced-motion: no-preference)",
        narrow:
          "(max-width: 820px) and (prefers-reduced-motion: no-preference)",
      },
      (ctx) => {
        const { wide, narrow } = ctx.conditions as {
          wide: boolean;
          narrow: boolean;
        };
        if (!wide && !narrow) return;

        // The wide projection is the matrix; the narrow one is the schema. Arm
        // every group the current breakpoint shows (the hidden one is
        // display:none and must not be armed, or its ScrollTrigger would measure
        // a zero-height box).
        const shown = groups.filter(
          (group) => group.offsetParent !== null || group.offsetHeight > 0,
        );
        const targets = shown.length > 0 ? shown : groups;
        const revert = targets.map(armGroup);
        return () => revert.forEach((fn) => fn());
      },
    );

    cleanups.push(() => mm.revert());
    return () => cleanups.forEach((fn) => fn());
  });

  return null;
}
