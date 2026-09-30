import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * The Codenames stage choreography. GSAP owns scroll → progress (pin + scrub);
 * this module authors progress → beat states as one timeline, so dwell/holds
 * are empty segments, the language transform is a stagger, and everything
 * reverts cleanly on unmount and rebuilds on remount (via `useGSAP` +
 * `gsap.matchMedia`). No bespoke scroll-progress engine.
 *
 * The pinned scrub runs only on desktop and tablet, and only when motion is
 * allowed. Mobile and reduced-motion never arm the stage: the component's
 * server-rendered resolved document (and the mobile snap cards) is the floor
 * this degrades to, so no content depends on the timeline running.
 */

export interface CodenamesChoreoData {
  statusPlanning: string;
  statusEvaluating: string;
  statusVerdict: string;
  callFirst: string;
  callBoth: string;
  /** Band identifiers per beat, in scroll order. */
  bandIds: string[];
}

/** Progress landmarks (0..1), shared by the timeline and the label mapper so
 *  the two never drift. Panels sit at these centres with a plateau of dwell. */
const PANEL_CENTERS = [0.22, 0.37, 0.51, 0.65, 0.8];
const HEAD_OUT = 0.15;
const TURN_ON = 0.05;
const TURN_OFF = 0.6;
const STATUS_EVAL = 0.05;
const STATUS_VERDICT = 0.12;
const CALLS_BOTH = 0.085;
const LANG_START = 0.56;
const COLLAPSE = 0.9;
const ACTIVE = "#2563eb";
const IDLE = "#34363f";

export function armCodenamesStage(
  scope: HTMLElement | null,
  data: CodenamesChoreoData,
): (() => void) | void {
  if (!scope) return;
  const stage = scope.querySelector<HTMLElement>(".cn-stage");
  const frame = scope.querySelector<HTMLElement>("[data-cn-stage]");
  if (!stage || !frame) return;

  // Start the pin below the sticky site header.
  const header = document.querySelector<HTMLElement>("header");
  const navH = header ? header.offsetHeight : 63;
  scope.style.setProperty("--cn-nav-h", `${navH}px`);

  const q = <T extends HTMLElement = HTMLElement>(sel: string) =>
    stage.querySelector<T>(sel);
  const qa = (sel: string) =>
    Array.from(stage.querySelectorAll<HTMLElement>(sel));

  const head = q("[data-cn-head]");
  const bandid = q("[data-cn-bandid]");
  const relay = q("[data-cn-relay]");
  const boardwrap = q("[data-cn-boardwrap]");
  const right = q("[data-cn-right]");
  const ghosts = q("[data-cn-ghosts]");
  const freeze = q("[data-cn-freeze]");
  const panels = qa(".cn-panel");
  const beijing = q('[data-w="BEIJING"]');
  const wall = q('[data-w="WALL"]');
  const status = q("[data-relay-status]");
  const calls = q('[data-relay="calls"]');
  const gSm = q('[data-relay="sm"]');
  const gGu = q('[data-relay="gu"]');
  const gClue = q('[data-relay="clue"]');
  const gArrows = [
    q('[data-relay="a1"]'),
    q('[data-relay="a2"]'),
    q('[data-relay="a3"]'),
  ].filter(Boolean) as HTMLElement[];
  const ens = qa(".cn-board .cn-en");
  const zhs = qa(".cn-board .cn-zh");

  const setAttr = (el: HTMLElement | null, name: string, on: boolean) => {
    if (!el) return;
    if (on) {
      if (!el.hasAttribute(name))
        el.setAttribute(name, name === "data-ring" ? "red" : "");
    } else if (el.hasAttribute(name)) {
      el.removeAttribute(name);
    }
  };
  const setText = (el: HTMLElement | null, text: string) => {
    if (el && el.textContent !== text) el.textContent = text;
  };
  const nearestPanel = (p: number) => {
    let best = 0;
    let bestD = Infinity;
    PANEL_CENTERS.forEach((c, i) => {
      const d = Math.abs(p - c);
      if (d < bestD) {
        bestD = d;
        best = i;
      }
    });
    return best;
  };

  /** Discrete labels + board reveal, mapped from the timeline's own progress. */
  const updateDiscrete = (p: number) => {
    const zh = p > TURN_OFF;
    const turnOn = p > TURN_ON && !zh;
    setAttr(beijing, "data-ring", turnOn);
    setAttr(wall, "data-ring", turnOn);
    setAttr(beijing, "data-rv", p > 0.08 && !zh);
    setAttr(wall, "data-rv", p > 0.1 && !zh);

    setText(
      status,
      p < STATUS_EVAL
        ? data.statusPlanning
        : p < STATUS_VERDICT
          ? data.statusEvaluating
          : data.statusVerdict,
    );
    setText(calls, p < CALLS_BOTH ? data.callFirst : data.callBoth);

    if (gSm) gSm.style.borderColor = p < 0.06 ? ACTIVE : IDLE;
    if (gGu) gGu.style.borderColor = p > 0.06 && p < HEAD_OUT ? ACTIVE : IDLE;

    if (bandid) setText(bandid, data.bandIds[nearestPanel(p)] ?? "");
  };

  const mm = gsap.matchMedia();
  mm.add(
    {
      desktop:
        "(min-width: 1024px) and (prefers-reduced-motion: no-preference)",
      tablet:
        "(min-width: 700px) and (max-width: 1023px) and (prefers-reduced-motion: no-preference)",
    },
    (ctx) => {
      const conditions = ctx.conditions as {
        desktop: boolean;
        tablet: boolean;
      };
      if (!conditions.desktop && !conditions.tablet) return;
      const mode = conditions.desktop ? "desktop" : "tablet";
      scope.dataset.cnArmed = mode;

      // Armed initial state (all reverted by matchMedia on exit).
      gsap.set(head, { opacity: 0 });
      gsap.set(relay, { opacity: 0 });
      gsap.set(bandid, { opacity: 0 });
      gsap.set(panels, { opacity: 0, yPercent: 3 });
      gsap.set(ghosts, { opacity: 0 });
      gsap.set(freeze, { opacity: 0 });
      gsap.set([gClue, ...gArrows, calls], { opacity: 0 });
      gsap.set(gGu, { opacity: 0.3 });
      gsap.set(zhs, { opacity: 0 });
      gsap.set(ens, { opacity: 1 });
      gsap.set(boardwrap, { scale: 1, transformOrigin: "top center" });
      updateDiscrete(0);

      const span = (mode === "desktop" ? 6.6 : 6.2) * window.innerHeight;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stage,
          start: () => `top top+=${navH}`,
          end: () => `+=${span}`,
          pin: frame,
          scrub: 0.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => updateDiscrete(self.progress),
        },
      });

      // Intro — the AI takes its turn while the hero title still holds.
      tl.to(head, { opacity: 1, duration: 0.04 }, 0.01)
        .to(relay, { opacity: 1, duration: 0.04 }, 0.02)
        .to(gClue, { opacity: 1, duration: 0.03 }, 0.05)
        .to(gArrows[0] ?? {}, { opacity: 1, duration: 0.02 }, 0.045)
        .to(gGu, { opacity: 1, duration: 0.03 }, 0.07)
        .to(gArrows[1] ?? {}, { opacity: 1, duration: 0.02 }, 0.07)
        .to([gArrows[2] ?? {}, calls], { opacity: 1, duration: 0.02 }, 0.1);

      // Hero out, band identifier in.
      tl.to(head, { opacity: 0, duration: 0.04 }, HEAD_OUT - 0.02).to(
        bandid,
        { opacity: 1, duration: 0.04 },
        HEAD_OUT,
      );

      // Beats crossfade with a plateau of dwell in the middle of each.
      panels.forEach((panel, i) => {
        const c = PANEL_CENTERS[i];
        tl.fromTo(
          panel,
          { opacity: 0, yPercent: 3 },
          { opacity: 1, yPercent: 0, duration: 0.05, ease: "power1.out" },
          c - 0.08,
        );
        if (i < panels.length - 1) {
          tl.to(
            panel,
            { opacity: 0, yPercent: -3, duration: 0.05, ease: "power1.in" },
            c + 0.05,
          );
        }
      });

      // Frozen model-change beat states it plainly.
      tl.fromTo(
        freeze,
        { opacity: 0 },
        { opacity: 0.9, duration: 0.03 },
        PANEL_CENTERS[2] - 0.05,
      ).to(freeze, { opacity: 0, duration: 0.03 }, PANEL_CENTERS[2] + 0.05);

      // Language — the one beat that transforms the calm surface. Stagger the
      // tiles rather than flipping all twenty-five at once.
      tl.to(
        ens,
        { opacity: 0, duration: 0.06, stagger: { each: 0.003, from: "start" } },
        LANG_START,
      ).to(
        zhs,
        { opacity: 1, duration: 0.06, stagger: { each: 0.003, from: "start" } },
        LANG_START + 0.01,
      );

      // Operation — many real games fade in behind the board.
      tl.to(ghosts, { opacity: 1, duration: 0.05 }, PANEL_CENTERS[4] - 0.04);

      // Collapse — the ending resolves.
      if (mode === "desktop") {
        tl.to(right, { opacity: 0, duration: 0.08 }, COLLAPSE)
          .to(ghosts, { opacity: 0, duration: 0.06 }, COLLAPSE)
          .to(boardwrap, { scale: 1.12, duration: 0.09 }, COLLAPSE);
      } else {
        tl.to(right, { height: 0, opacity: 0, duration: 0.08 }, COLLAPSE)
          .to(ghosts, { opacity: 0, duration: 0.06 }, COLLAPSE)
          .to(boardwrap, { scale: 1.06, duration: 0.09 }, COLLAPSE);
      }
      // Settle the timeline's total near 1 so progress ≈ the landmark space.
      tl.to({}, { duration: 0.01 }, 1);

      return () => {
        // gsap reverts inline styles; the attributes and text below are ours,
        // so restore the resolved document by hand.
        setAttr(beijing, "data-ring", true);
        setAttr(beijing, "data-rv", true);
        setAttr(wall, "data-ring", true);
        setAttr(wall, "data-rv", true);
        setText(status, data.statusVerdict);
        setText(calls, data.callBoth);
        setText(bandid, "");
        if (gSm) gSm.style.borderColor = "";
        if (gGu) gGu.style.borderColor = "";
        delete scope.dataset.cnArmed;
      };
    },
  );

  return () => mm.revert();
}
