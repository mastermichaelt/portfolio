import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(ScrollTrigger);

/**
 * The Codenames stage choreography.
 *
 * Desktop and tablet pin the stage and map scroll → beat states directly
 * (ADDENDUM-03): each beat owns a slot that is settled at full opacity for the
 * great majority of its distance, with a short squared crossfade at the slot
 * boundary, so stopping at an arbitrary scroll position almost always lands on a
 * single coherent composition rather than a prolonged overlap. Product
 * progression (clue arrival, relay build, rings, status, language flip, ghost
 * boards, collapse) stays scrubbed, because the progression is itself the
 * information. The stage is content-sized and centred in the viewport by CSS
 * (ADDENDUM-04): the engineering pane grid-stacks its panels so it is as tall as
 * its tallest beat, and the frame centres the resulting figure.
 *
 * Mobile owns nothing (ADDENDUM-05): it is an ordinary native document of beat
 * cards. The only motion reads native scroll to play the opening turn as card 01
 * is scrolled; nothing writes the viewport position (no snap, no scrollTo).
 *
 * Everything reverts cleanly on unmount and rebuilds on remount via `useGSAP` +
 * `gsap.matchMedia`. Reduced motion and no-JS never arm: the server-rendered
 * resolved document is the floor this degrades to.
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

/**
 * ADDENDUM-03 timing. A beat is settled across `SETTLED` of its slot on each
 * side of centre and replaced in the `XFADE` window at the boundary; squaring
 * the opacity moves the crossover near 0.25/0.25 so a mid-window stop never
 * shows two competing panels. The centres are spread so a board-only moment sits
 * between beats — the product is what persists while the engineering idea
 * changes. The premise is the slot before beat 01, so identity holds at rest and
 * hands over in the same window that brings reasoning in.
 */
const SLOT = 0.085;
const XFADE = 0.12;
const SETTLED = 0.5 - XFADE / 2; // 0.44
const CENTERS = [0.25, 0.42, 0.58, 0.74, 0.89];
const PREMISE_C = CENTERS[0] - SLOT; // 0.165
// Switching language resolves a different playable pool, so the zh board is a
// fresh board — the English turn's rings and reveals must clear before it.
const ZH_AT = 0.72;
const FREEZE_C = 0.47; // product-frozen window spanning plays-legally / model-change
const ACTIVE = "#2563eb";
const IDLE = "#34363f";
const ACTIVE_INK = "#e8eaef";
const IDLE_INK = "#9ca3af";

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const seg = (p: number, a: number, b: number) => clamp((p - a) / (b - a), 0, 1);

/** Settled at full opacity within SETTLED of centre; a short squared crossfade
 *  to 0 across the XFADE window; invisible beyond it. */
const panelOpacity = (d: number) => {
  const a = Math.abs(d);
  if (a <= SETTLED) return 1;
  const f = 1 - clamp((a - SETTLED) / XFADE, 0, 1);
  return f * f;
};
/** Drift exists only inside the transition window; a settled panel sits at 0. */
const drift = (d: number) => {
  const a = Math.abs(d);
  if (a <= SETTLED) return 0;
  const u = clamp((a - SETTLED) / XFADE, 0, 1);
  return (d < 0 ? -1 : 1) * u * 14;
};

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

  const stagebody = q(".cn-stagebody");
  const head = q("[data-cn-head]");
  const bandid = q("[data-cn-bandid]");
  const premise = q("[data-cn-premise]");
  const boardwrap = q("[data-cn-boardwrap]");
  const boardEl = q("[data-cn-board]");
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

  let lastPhase = "";
  let lastId = "";
  // Set per matched branch; the collapse scales the board a touch more on the
  // wider desktop surface than on the tablet.
  let collapseScale = 0.12;

  /**
   * progress → every beat state. Narrative panels hold-then-replace (ADDENDUM-03);
   * the product story (relay, rings, status, language, ghosts, collapse) scrubs.
   */
  const render = (p: number) => {
    // Identity + premise are present at rest and YIELD on scroll; nothing fades
    // in at the top. The premise holds its whole slot, then hands over in the
    // same window that brings beat 01 in, so the pane is never blank between.
    const pd = (p - PREMISE_C) / SLOT;
    const po = p < PREMISE_C ? 1 : panelOpacity(pd);
    if (premise) {
      premise.style.opacity = String(po);
      premise.style.transform = `translateY(${p < PREMISE_C ? 0 : drift(pd)}px)`;
      premise.style.pointerEvents = po > 0.5 ? "auto" : "none";
    }
    if (head) head.style.opacity = String(po);
    if (bandid) bandid.style.opacity = String(1 - po);

    // The relay is the product story: which role acts, and what it hands on. The
    // acting role carries the blue border. All of this is scrubbed.
    const acting = p < 0.085 ? "sm" : p < 0.175 ? "gu" : "";
    if (gSm) {
      gSm.style.borderColor = acting === "sm" ? ACTIVE : IDLE;
      gSm.style.color = acting === "sm" ? ACTIVE_INK : IDLE_INK;
    }
    if (gGu) {
      gGu.style.opacity = String(0.3 + 0.7 * seg(p, 0.08, 0.1));
      gGu.style.borderColor = acting === "gu" ? ACTIVE : IDLE;
      gGu.style.color = acting === "gu" ? ACTIVE_INK : IDLE_INK;
    }
    if (gClue) gClue.style.opacity = String(seg(p, 0.055, 0.08));
    if (gArrows[0]) gArrows[0].style.opacity = String(seg(p, 0.05, 0.07));
    if (gArrows[1]) gArrows[1].style.opacity = String(seg(p, 0.078, 0.095));
    if (gArrows[2]) gArrows[2].style.opacity = String(seg(p, 0.1, 0.12));
    if (calls) {
      calls.style.opacity = String(seg(p, 0.105, 0.125));
      setText(calls, p > 0.155 ? data.callBoth : data.callFirst);
    }

    // Rings are the spymaster's intended targets, held while the turn stands;
    // they and the reveals clear before the language flip (fresh board).
    const zh = p > ZH_AT;
    const intent = !zh && p > 0.065;
    setAttr(beijing, "data-ring", intent);
    setAttr(wall, "data-ring", intent);
    setAttr(beijing, "data-rv", !zh && p > 0.105);
    setAttr(wall, "data-rv", !zh && p > 0.155);

    // The narrated role must agree with the lit role: the Guesser chip takes the
    // acting border at 0.085, so the status cannot hand over before then.
    const phase =
      p < 0.085
        ? data.statusPlanning
        : p < 0.175
          ? data.statusEvaluating
          : data.statusVerdict;
    if (phase !== lastPhase) {
      lastPhase = phase;
      setText(status, phase);
    }

    // Panels: settled hold, short squared crossfade at the slot boundary.
    let active = -1;
    panels.forEach((el, i) => {
      const d = (p - CENTERS[i]) / SLOT;
      const o = panelOpacity(d);
      el.style.opacity = String(o);
      el.style.transform = `translateY(${drift(d)}px)`;
      el.style.pointerEvents = o > 0.5 ? "auto" : "none";
      if (o > 0.5) active = i;
    });
    const id = active >= 0 ? (data.bandIds[active] ?? "") : "";
    if (id && id !== lastId) {
      lastId = id;
      setText(bandid, id);
    }

    // The product surface is frozen across plays-legally and model-change.
    if (freeze)
      freeze.style.opacity = String(
        clamp(1 - Math.abs((p - FREEZE_C) / 0.09), 0, 1) * 0.9,
      );

    // Language — a fresh zh board. The EN → 中文 tile crossfade is the CSS
    // opacity transition keyed on the board's data-lang (app/styles/codenames-case.css).
    if (boardEl) boardEl.setAttribute("data-lang", zh ? "zh" : "en");

    // Operation volume, then the final collapse — both scrubbed.
    if (ghosts)
      ghosts.style.opacity = String(seg(p, 0.83, 0.92) * (1 - seg(p, 0.96, 1)));
    const col = seg(p, 0.95, 1);
    if (right) right.style.opacity = String(1 - col);
    if (boardwrap)
      boardwrap.style.transform = `scale(${1 + col * collapseScale})`;
  };

  const mm = gsap.matchMedia();
  mm.add(
    {
      // The min-height gate is ADDENDUM-04's stack fallback / ADDENDUM-05's
      // native model: below it the content-sized figure cannot be held in the
      // viewport, so the stage never arms and the resolved document flows
      // natively instead of clipping a pinned pane — no snapping, no scroll
      // control. Desktop's figure (band + two-pane row) is short, so it clears a
      // low bar; the tablet composition stacks band, board and engineering
      // vertically, so its figure is ~1000px and it only pins on a tall tablet
      // (measured at the 768px boundary). Shorter tablets — the base iPad in
      // portrait among them — get the native resolved document instead.
      desktop:
        "(min-width: 1024px) and (min-height: 680px) and (prefers-reduced-motion: no-preference)",
      tablet:
        "(min-width: 700px) and (max-width: 1023px) and (min-height: 1100px) and (prefers-reduced-motion: no-preference)",
    },
    (ctx) => {
      const conditions = ctx.conditions as {
        desktop: boolean;
        tablet: boolean;
      };
      if (!conditions.desktop && !conditions.tablet) return;
      const mode = conditions.desktop ? "desktop" : "tablet";
      scope.dataset.cnArmed = mode;
      collapseScale = mode === "desktop" ? 0.12 : 0.06;
      lastPhase = "";
      lastId = "";

      // Move the premise into the engineering pane so it overlays the beats and
      // is sized with them (ADDENDUM-01). It returns to its in-flow position
      // before the board on cleanup — the no-JS / reduced-motion order.
      if (premise && right && premise.parentElement !== right) {
        right.insertBefore(premise, right.firstChild);
      }
      if (boardwrap) boardwrap.style.transformOrigin = "top center";

      render(0);

      // A scrubbed timeline is the scroll → progress source; every beat state is
      // authored in render(), not as tweens, so the hold/replacement model
      // (ADDENDUM-03) is one deterministic mapping. The dummy tween gives the
      // scrub a linear 0..1 progress; onUpdate maps it to the stage.
      const spanVh = mode === "desktop" ? 6.6 : 6.2;
      const tl = gsap.timeline({
        defaults: { ease: "none" },
        scrollTrigger: {
          trigger: stage,
          start: () => `top top+=${header ? header.offsetHeight : navH}`,
          end: () => `+=${spanVh * window.innerHeight}`,
          pin: frame,
          scrub: 0.5,
          anticipatePin: 1,
          invalidateOnRefresh: true,
          onUpdate: (self) => render(self.progress),
          onRefresh: (self) => render(self.progress),
        },
      });
      tl.to({}, { duration: 1 });

      return () => {
        tl.scrollTrigger?.kill();
        tl.kill();
        // Restore the resolved turn (the no-JS floor).
        setAttr(beijing, "data-ring", true);
        setAttr(beijing, "data-rv", true);
        setAttr(wall, "data-ring", true);
        setAttr(wall, "data-rv", true);
        setText(status, data.statusVerdict);
        setText(calls, data.callBoth);
        setText(bandid, "");
        if (boardEl) boardEl.setAttribute("data-lang", "en");

        // Clear every inline style the mapping set.
        const clearStyle = (el: HTMLElement | null, ...props: string[]) => {
          if (!el) return;
          for (const prop of props) el.style.removeProperty(prop);
        };
        clearStyle(head, "opacity");
        clearStyle(bandid, "opacity");
        clearStyle(premise, "opacity", "transform", "pointer-events");
        clearStyle(gSm, "border-color", "color");
        clearStyle(gGu, "opacity", "border-color", "color");
        clearStyle(gClue, "opacity");
        for (const a of gArrows) clearStyle(a, "opacity");
        clearStyle(calls, "opacity");
        clearStyle(freeze, "opacity");
        clearStyle(ghosts, "opacity");
        clearStyle(right, "opacity");
        clearStyle(boardwrap, "transform", "transform-origin");
        for (const el of panels)
          clearStyle(el, "opacity", "transform", "pointer-events");

        // Return the premise to its in-flow position before the board.
        if (
          premise &&
          stagebody &&
          split &&
          premise.parentElement !== stagebody
        )
          stagebody.insertBefore(premise, split);

        delete scope.dataset.cnArmed;
      };
    },
  );

  // Mobile (ADDENDUM-05): no pin, no snap, no scroll ownership. The opening card
  // plays the turn as it is scrolled — the timeline only READS native scroll via
  // ScrollTrigger and writes nothing to the viewport. Pre-turn at rest; resolved
  // with no JS / reduced motion.
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

      // The board's discrete flips/rings/status advance in the timeline's own
      // onUpdate; the clue arrives as a real tween. The card is the first
      // content, so at rest its top sits at the viewport top: progress 0
      // (pre-turn) holds until the first scroll gesture, then the turn plays.
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
