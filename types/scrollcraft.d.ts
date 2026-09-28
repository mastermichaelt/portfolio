/** Ambient shape of the vendored scroll-craft engine's single global.
 *
 *  The engine is an IIFE served from `public/vendor/scrollcraft/scrollcraft.js`
 *  (see vendor/scrollcraft/PROVENANCE.md); it is not part of the module graph,
 *  so there is nothing to `import` a type from. Only the two members this
 *  repository actually touches are declared — `instances` exists upstream for
 *  the verification harness, and `reduce` is the engine's own read of
 *  `prefers-reduced-motion` at load time. */
interface ScrollCraftInstance {
  layout: () => void;
  read: () => void;
}

interface ScrollCraftGlobal {
  mount: (root: Element | string) => ScrollCraftInstance;
  reduce: boolean;
  instances: ScrollCraftInstance[];
}

interface Window {
  ScrollCraft?: ScrollCraftGlobal;
}
