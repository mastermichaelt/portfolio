"use client";

import Script from "next/script";
import { useCallback } from "react";

/** The one element the engine is allowed to see. Authored on the homepage's
 *  existing method section, so the engine's `root.querySelectorAll` cannot
 *  reach the hero, the continuity band, the route grid, the site chrome, or any
 *  other route. */
const SCOPE_SELECTOR = "[data-scrollcraft-scope]";

/** Written to the scope element once a live engine instance is driving it, and
 *  read by `app/styles/scrollcraft.css` as the gate for the armed (hidden)
 *  state. It is a CSS gate, not the mount guard — see `mountedRoot`. */
const LIVE_FLAG = "scrollcraftMounted";

/** At most one `ScrollCraft.mount()` per document, enforced at module scope.
 *
 *  A flag on the scope element cannot do this. Next.js App Router destroys the
 *  home tree on client-side navigation and builds fresh DOM on return, so an
 *  element-held flag is gone by the time `onReady` fires again: Home → About →
 *  Home three times produced four engine instances. The engine has no unmount,
 *  so each one permanently leaks a `requestAnimationFrame` loop and eight
 *  window listeners (`touchstart`, `touchend`, `pointerdown`, `click`, two
 *  `scroll`, `focusin`, `resize`). Its five `prime` listeners self-remove only
 *  under `if (playheads.length && primedCount >= playheads.length)`, and
 *  `playheads.length` is 0 here because this slice loads no video, so that
 *  branch never runs.
 *
 *  Module scope is the right lifetime: it is per-document, so it survives every
 *  client-side navigation and resets on a real page load, which is exactly when
 *  a new engine instance is wanted.
 *
 *  The cost is deliberate and small: after the first client-side return to `/`
 *  the reveal does not re-arm, and the method section renders in its resolved
 *  state with no animation. That is the correct trade. The alternative — mount
 *  again to re-animate — is the leak, and it is why the armed state is gated on
 *  the scope element's own attribute rather than on `html.sc-ready`: `sc-ready`
 *  persists across client-side navigation, so gating on it while refusing to
 *  re-mount would leave the fresh DOM armed with nothing to reveal it, turning
 *  a leak into permanently invisible content. */
let mountedRoot: Element | null = null;

/**
 * Mounts the vendored scroll-craft engine against the homepage method section,
 * and nothing else.
 *
 * This is the whole integration boundary. The engine is served from `public/`
 * rather than imported, so:
 *
 *   - no `app/`, `components/`, `domain/`, `repositories/` or `lib/` module
 *     depends on it, and no bundler transform touches the hash-pinned bytes;
 *   - `app/page.tsx` stays a server component — this is a leaf client child
 *     that renders no DOM of its own, only the script tag;
 *   - removing the experiment is deleting this file, `app/styles/scrollcraft.css`,
 *     its `globals.css` import, and the `data-sc-*` attribute pass on the
 *     method section.
 *
 * The engine does not auto-mount: it exposes `window.ScrollCraft.mount(root)`
 * and does nothing until called. That is what makes a scoped mount possible at
 * all, and it is why scroll-craft can be a leaf dependency here rather than an
 * architectural one.
 *
 * Boundary, findings and exit criteria: docs/experiments/scroll-craft-baseline.md
 */
export function ScrollCraftMethodReveal() {
  const mount = useCallback(() => {
    if (mountedRoot) return;
    if (!window.ScrollCraft) return;

    const root = document.querySelector<HTMLElement>(SCOPE_SELECTOR);
    if (!root) return;

    // Arm before mounting, so the hidden state is in place for the same frame
    // the engine's IntersectionObserver first reports in.
    mountedRoot = root;
    root.dataset[LIVE_FLAG] = "true";
    window.ScrollCraft.mount(root);
  }, []);

  return (
    <Script
      src="/vendor/scrollcraft/scrollcraft.js"
      // `afterInteractive`, not `beforeInteractive`: the reveal is an
      // enhancement over markup that is already readable, so it must never sit
      // in front of first paint. `onReady` rather than `onLoad` because it also
      // fires when the script is already cached from an earlier client-side
      // navigation, where `onLoad` does not run again.
      strategy="afterInteractive"
      onReady={mount}
    />
  );
}
