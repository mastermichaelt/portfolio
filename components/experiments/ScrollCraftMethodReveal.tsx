"use client";

import Script from "next/script";
import { useCallback } from "react";

/** The one element the engine is allowed to see. Authored on the homepage's
 *  existing method section, so the engine's `root.querySelectorAll` cannot
 *  reach the hero, the continuity band, the route grid, the site chrome, or any
 *  other route. */
const SCOPE_SELECTOR = "[data-scrollcraft-scope]";

/** Set once a mount has happened, so a client-side navigation back to `/` or a
 *  Fast Refresh cannot bind a second engine instance to the same DOM. The
 *  engine keeps a module-level `instances` array and has no unmount, so a
 *  double mount means two rAF loops and two scroll listeners driving one
 *  section. */
const MOUNTED_FLAG = "scrollcraftMounted";

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
    const root = document.querySelector<HTMLElement>(SCOPE_SELECTOR);
    if (!root || root.dataset[MOUNTED_FLAG] === "true") return;
    if (!window.ScrollCraft) return;

    root.dataset[MOUNTED_FLAG] = "true";
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
