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
const PREMISE_OUT = 0.12;
const HEAD_OUT = 0.15;
const TURN_ON = 0.05;
const STATUS_EVAL = 0.05;
const STATUS_VERDICT = 0.12;
const CALLS_BOTH = 0.085;
const LANG_START = 0.56;
// The English turn state (rings + reveals) is fully cleared just before the
// language crossfade begins, so the fresh zh board never inherits it.
const TURN_OFF = LANG_START - 0.01;
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
  const premise = q("[data-cn-premise]");
  const boardwrap = q("[data-cn-boardwrap]");
  const split = q(".cn-split");
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

    // Once the premise has yielded, it must not block clicks to the reasoning
    // panel beneath it (it stays in the DOM at opacity 0, above the pane).
    if (premise)
      premise.style.pointerEvents = p > PREMISE_OUT ? "none" : "auto";

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

      // Armed initial state (all reverted by matchMedia on exit). Identity,
      // the pre-turn relay and the premise are present at rest (opacity 1) and
      // only yield on scroll — nothing fades in at the top.
      gsap.set(head, { opacity: 1 });
      gsap.set(relay, { opacity: 1 });
      gsap.set(premise, { opacity: 1, yPercent: 0 });
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

      // Scroll length of the pinned scrub, in viewport-heights. Computed inside
      // the end callback (not captured once) so ScrollTrigger.refresh recomputes
      // it against the current viewport — otherwise a build that runs before the
      // viewport has settled locks in a too-short pin.
      const spanVh = mode === "desktop" ? 6.6 : 6.2;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stage,
          start: () => `top top+=${navH}`,
          end: () => `+=${spanVh * window.innerHeight}`,
          pin: frame,
          scrub: 0.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => updateDiscrete(self.progress),
        },
      });

      // The turn is the one thing that begins with interaction: the clue
      // arrives, the relay builds, the guesser lights and the calls land.
      // There is an opening dwell before this so the premise can be read.
      tl.to(gClue, { opacity: 1, duration: 0.03 }, 0.05)
        .to(gArrows[0] ?? {}, { opacity: 1, duration: 0.02 }, 0.045)
        .to(gGu, { opacity: 1, duration: 0.03 }, 0.07)
        .to(gArrows[1] ?? {}, { opacity: 1, duration: 0.02 }, 0.07)
        .to([gArrows[2] ?? {}, calls], { opacity: 1, duration: 0.02 }, 0.1);

      // The premise yields to 01 / reasoning and the hero yields to the beat
      // identifier — both were present at rest, so they animate OUT.
      tl.to(
        premise,
        { opacity: 0, yPercent: -3, duration: 0.065 },
        PREMISE_OUT,
      );
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
        // Collapse the lower zone by animating its grid track to 0% (the
        // board's 1fr track then takes the whole frame). Animating the item's
        // height would not move the track, so the board would never expand.
        // --cn-lower-pct is declared on .cn-split in the tablet CSS.
        tl.to(split, { "--cn-lower-pct": 0, duration: 0.09 }, COLLAPSE)
          .to(right, { opacity: 0, duration: 0.07 }, COLLAPSE)
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
        // updateDiscrete drives this inline and GSAP does not manage it, so
        // restore it here alongside the other hand-managed inline styles.
        if (premise) premise.style.pointerEvents = "";
        delete scope.dataset.cnArmed;
      };
    },
  );

  // Mobile: no pin. The opening card (card 01) plays the turn as it is scrolled
  // — pre-turn at rest, resolved with no JS / reduced motion. This is a light,
  // non-pinned scrub tied to the card's own travel, which touch handles well.
  mm.add(
    "(max-width: 699px) and (prefers-reduced-motion: no-preference)",
    () => {
      const card = scope.querySelector<HTMLElement>(".cn-card--opening");
      if (!card) return;
      const cq = (sel: string) => card.querySelector<HTMLElement>(sel);
      const bj = cq('[data-w="BEIJING"]');
      const wl = cq('[data-w="WALL"]');
      const st = cq("[data-cn-open-status]");
      const clue = cq("[data-cn-open-clue]");
      const arrow = cq("[data-cn-open-arrow]");

      // Reset to pre-turn — at rest the board is Planning, no rings, no clue.
      setAttr(bj, "data-ring", false);
      setAttr(bj, "data-rv", false);
      setAttr(wl, "data-ring", false);
      setAttr(wl, "data-rv", false);
      setText(st, data.statusPlanning);

      // The turn is one scrubbed GSAP timeline (the same primitive the desktop
      // stage uses), so GSAP does the driving. The clue arrives as a real tween;
      // the board's discrete flips/rings/status advance in the timeline's own
      // onUpdate via the shared setAttr/setText helpers (data-rv is presence-
      // based in CSS, so it is toggled cleanly rather than left at a stale
      // attribute value). The opening card is the first content, so at rest its
      // top sits at the viewport top: progress 0 (pre-turn) holds until the
      // first scroll gesture, then the turn plays.
      const openTurn = (p: number) => {
        setAttr(bj, "data-ring", p > 0.12);
        setAttr(wl, "data-ring", p > 0.12);
        setAttr(bj, "data-rv", p > 0.45);
        setAttr(wl, "data-rv", p > 0.68);
        setText(
          st,
          p < 0.2
            ? data.statusPlanning
            : p < 0.62
              ? data.statusEvaluating
              : data.statusVerdict,
        );
      };

      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: card,
          start: "top top",
          end: "+=85%",
          scrub: 0.4,
          invalidateOnRefresh: true,
          onUpdate: (self) => openTurn(self.progress),
        },
      });
      tl.fromTo(
        [arrow, clue],
        { opacity: 0 },
        { opacity: 1, duration: 0.22 },
        0.06,
      );
      // Hold the timeline open across the whole scrubbed range so the onUpdate
      // resolution follows the full turn, not just the clue's fade.
      tl.to({}, { duration: 1 });
      openTurn(0);

      return () => {
        // Restore the resolved turn (the no-JS / reduced-motion state).
        setAttr(bj, "data-ring", true);
        setAttr(bj, "data-rv", true);
        setAttr(wl, "data-ring", true);
        setAttr(wl, "data-rv", true);
        setText(st, data.statusVerdict);
      };
    },
  );

  return () => mm.revert();
}
