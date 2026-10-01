# scroll-craft integration baseline

> **Status: retired (2026-10-02).** scroll-craft was an integration spike only.
> The portfolio has since converged on **GSAP ScrollTrigger as its single scroll
> runtime** (the Codenames case study, then the homepage method reveal), and the
> vendored engine, its hand-scoped stylesheet (`app/styles/scrollcraft.css`), its
> type shim and its integrity test were removed. The homepage reveal now lives in
> [`components/home/MethodReveal.tsx`](../../components/home/MethodReveal.tsx) with
> its escapes in [`app/styles/home.css`](../../app/styles/home.css); the Codenames
> choreography in [`components/projects/codenames-choreography.ts`](../../components/projects/codenames-choreography.ts).
>
> This document is kept as the **methodology record**: the a11y-escape discipline,
> scope containment, reduced-motion contract and SSR-resolved/arm-on-mount model
> below are runtime-agnostic and still govern every scroll device on the site.
> The engine-specific mechanics (`--sc-p`, `data-sc-*`, `html.sc-ready`,
> `mount(root)`, the no-unmount leak) describe the retired engine and are retained
> for context, not as current behaviour. GSAP's `useGSAP` reverts and rebuilds on
> every mount, which is precisely what removed the mount-once compromise §3.9
> documents as the engine's sharpest edge.

Integration-only spike. It establishes whether [scroll-craft](https://github.com/nateherkai/scroll-craft)
can coexist with this portfolio's architecture, and it deliberately does **not**
redesign the homepage. The homepage's copy, information architecture, visual
system, typography and assets are unchanged.

**Date:** 2026-09-28
**Branch:** `experiment/scroll-craft-integration-baseline`
**Upstream:** `nateherk-design@nateherk` 0.3.0, installed as a Claude Code plugin
**Purpose:** a trustworthy technical baseline for a separate Claude Design
exploration afterwards, not a scroll-driven homepage.

## 1. The integration boundary

| Layer                 | Decision                                                                                                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Engine                | Vendored verbatim to [`public/vendor/scrollcraft/scrollcraft.js`](../../public/vendor/scrollcraft/scrollcraft.js), hash-pinned. Provenance: [`vendor/scrollcraft/PROVENANCE.md`](../../vendor/scrollcraft/PROVENANCE.md) |
| Delivery              | `<Script src="/vendor/scrollcraft/scrollcraft.js" strategy="afterInteractive">`. **Served, never imported**                                                                                                              |
| Mount                 | [`components/experiments/ScrollCraftMethodReveal.tsx`](../../components/experiments/ScrollCraftMethodReveal.tsx) calls `ScrollCraft.mount(root)` against one element                                                     |
| Scope                 | `[data-scrollcraft-scope]`, authored on the existing `.home2-method` section. Nothing else is reachable                                                                                                                  |
| Styling               | [`app/styles/scrollcraft.css`](../../app/styles/scrollcraft.css), a hand-scoped subset of the engine's device rules. The upstream stylesheet is **not** vendored                                                         |
| Repository interfaces | Untouched. Nothing in `domain/`, `repositories/`, `lib/` or `content/` knows scroll-craft exists                                                                                                                         |

The engine is a leaf of one page, not an architectural dependency. Three
properties make that true, and all three are asserted by tests:

1. **The engine does not auto-mount.** It is an IIFE that exposes
   `window.ScrollCraft.mount(root)` and does nothing until called. Without this
   there would be no scoped integration at all, only a page-wide takeover.
2. **`mount(root)` genuinely scopes.** Every device is collected with
   `root.querySelectorAll`, so an unmounted section cannot be driven.
3. **Nothing imports it.** `app/page.tsx` stays a server component; the mount is
   a leaf client child that renders no DOM of its own. `next build` still emits
   `/` as `○ (Static)`.

Removing the experiment is four deletions: the component, the stylesheet, its
`globals.css` import, and the `data-sc-*` attribute pass on the method section.

## 2. What the minimal proof exercises

One device: the four method-dimension rows reveal once on entry, staggered
90ms apart, in **both** responsive projections.

`data-sc-in` was chosen over every other device for one reason: it is the only
one whose hidden state can be made safe. It fires once on entry via
IntersectionObserver and never re-hides, and it falls back to "revealed" when
`IntersectionObserver` is absent. The section's `.container` additionally carries
`data-sc-act="flow"`, which publishes normalized scroll progress as `--sc-p` —
scroll-craft's documented hook for bespoke behaviour — while changing no layout.

Not used: `scrub`, `pin`, `pan`, `data-sc-cue`, `data-sc-kinetic`,
`data-sc-reveal`, `data-sc-parallax`, `data-sc-drift`, `data-sc-count`,
worldflight, the pointer devices (`tilt` / `magnet` / `spotlight`),
`[data-sc-progress]`, and `.sc-grain`. No imagery was generated and no video
exists, so the engine's playhead never runs.

## 3. Which scroll-craft assumptions did not fit

### 3.1 The engine stylesheet is a competing design system (blocking)

`engine/scrollcraft.css` is two layers in one file. The device rules are
mechanism; the rest is a full taste floor: a `:root` token block (six colour
roles, a fluid type ramp, a 4px space scale, radii, elevation, easings), a
reset, and `body { background / color / font-family / font-size / line-height /
letter-spacing }`, plus `::selection`, `:root { caret-color / accent-color }`,
`:focus-visible`, `html { scroll-behavior: smooth }` and scrollbar theming.

Importing it would replace this portfolio's typography and both themes, and it
would outrank [`app/styles/`](../../app/styles) simply by loading later. So it is
not vendored. `app/styles/scrollcraft.css` carries the device rules this slice
needs, expressed in this portfolio's own tokens, and records what was refused.

**Consequence for the design exploration:** scroll-craft's design floor is not
available here. Its _devices_ are. Any scroll-craft guidance that assumes
`--sc-canvas`, `.sc-display`, `.sc-wrap`, `.sc-section` or `.sc-copy` has to be
re-expressed in [`app/styles/tokens.css`](../../app/styles/tokens.css) terms.

### 3.2 `data-sc-cue` cannot carry portfolio copy (blocking for that device)

`[data-sc-cue]` is `opacity: 0` in CSS, and the engine drives its opacity from
scroll position. Two consequences that rule it out for load-bearing content:

- **With no JavaScript the content never appears.** The CSS hides it; only the
  engine reveals it.
- **Reduced motion does not settle it.** The engine's reduced-motion policy is
  "fewer and gentler, not zero": it drops the transform but keeps the opacity
  ramp, so cued copy is still invisible at most scroll positions. It also zeroes
  cues when their act scrolls out of range.

That is defensible for a marketing page whose copy is a caption over film. It is
not compatible with a portfolio whose content is the product. `data-sc-in` has
neither property.

### 3.3 The two reduced-motion contracts disagree, and this repo's wins

|                      | scroll-craft                                                                                   | this portfolio                                                                                                                            |
| -------------------- | ---------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Policy               | "Fewer and gentler, not zero." Cues still fade; translation collapses; clips are never fetched | A hard duration floor: `animation-duration / transition-duration: 0.01ms !important` on `*` ([`base.css:118`](../../app/styles/base.css)) |
| Effect on this slice | a 220ms opacity fade                                                                           | instant, position-free appearance                                                                                                         |

The portfolio's floor is `!important` on `*`, so it wins, and
[`tests/reduced-motion.test.ts`](../../tests/reduced-motion.test.ts) asserts it
verbatim. `app/styles/scrollcraft.css` therefore contains no
`prefers-reduced-motion` block and no `!important`: fighting the floor to restore
upstream's 220ms would break a documented contract to make the motion _less_
accessible. Verified settled-and-unoffset under `reducedMotion: "reduce"`.

### 3.4 Gating the hidden state inverts upstream's transition placement (defect found and fixed)

Upstream declares the reveal's `transition` on the **hidden** rule. That is safe
upstream, because there the hidden state is the element's initial state.

Gating the hidden state at all — required so that no-JS renders the resolved
composition — creates an earlier visible state. (The gate began as
`html.sc-ready` and moved to the scope element's own `data-scrollcraft-mounted`
for the reason in §3.9; the transition problem is the same either way.) With the transition
still on the hidden rule, the rows rendered settled at first paint and then
visibly **faded out** over 0.55s the moment the engine mounted, before fading
back in on entry. Worse than either end state, and invisible to the upstream
harness.

CSS transitions read the after-change style, so declaring `transition` only on
the `.sc-in` rules makes arming instant and the reveal animated. The e2e test
asserts the armed rows sit at exactly `0`, not merely near it, so the regression
cannot come back quietly.

### 3.5 Nothing stops keyboard focus reaching an armed reveal (defect found and fixed)

The engine carries a `focusin` handler for exactly this problem — focus landing
on a control whose cue has not opened yet — but it only covers `[data-sc-cue]`.
`data-sc-in` gets none of it, and upstream's stylesheet sets no `pointer-events`
on an armed element either.

Measured: tabbing out of the site header at 1280×460 lands on the tab stop
`Codenames AI case study →` while its row is still at **opacity 0**. The focus
ring sits on content that is not visible. The browser's own scroll-into-view does
trigger the IntersectionObserver, so it resolves after the fact over the full
0.55s transition, but the reader is unsighted for that whole window.

Fixed in this repository's own CSS, not in the engine: a `:focus-within` rule
settles the whole group the instant focus enters it, with no transition declared,
because a keyboard reader should never wait on an animation to see where they
are. `e2e/scrollcraft-method-reveal.spec.ts` asserts the landed row is at exactly
opacity 1; removing the rule fails that test.

### 3.6 Armed content has no print escape (defect found and fixed)

Every scroll-craft reveal hides content until scroll reveals it. Print has no
scroll, so on paper nothing ever does.

Measured under `emulateMedia({ media: "print" })` at 1280×460 with the engine
mounted and the page unscrolled: all six `.home2-matrix` rows compute
`opacity: 0` while their text sits in the DOM and in the accessibility tree. A
reader printing or saving the homepage to PDF before scrolling to the method
section gets a heading, an intro line, and a blank block where the entire
two-system comparison should be. Nothing in the portfolio resets it — there is
no `@media print` rule anywhere in `app/styles/`.

Note which failure this is: not JavaScript off, which the gate already covers,
but JavaScript _working_ and the reader simply not having scrolled yet. That is
the state every print starts from.

Fixed with an `@media print` block in `app/styles/scrollcraft.css` that settles
every staggered group unconditionally. Asserted at both projections in e2e,
including that returning to screen media re-arms the reveal rather than leaving
it permanently settled.

### 3.7 `mount(root)` does not match the root itself (sharp edge)

Devices are collected with `root.querySelectorAll`, which never matches `root`.
A `data-sc-act` on the mount root is silently ignored: no act is created, no
`--sc-p` is published, and nothing warns. This cost two debugging cycles here
and will cost them again. **The act must be a strict descendant of the mount
root.** That is why `data-sc-act="flow"` sits on the section's `.container`
rather than on the section carrying `data-scrollcraft-scope`.

### 3.8 The upstream harness cannot see this slice (limitation, not a defect)

`scripts/shoot.mjs` runs cleanly against a Next.js route — a useful finding in
itself, since it needs only a URL and `html.sc-ready`, not a scroll-craft-authored
HTML file. But all three of its findings are inert here:

| Harness finding                             | Status on this page                                        |
| ------------------------------------------- | ---------------------------------------------------------- |
| dead scroll                                 | reports "no dead scroll detected" — real, but trivially so |
| cues that never peak                        | `cues=0`. A `data-sc-in` reveal is not a cue               |
| contrast over media, at the brightest frame | nothing to measure: no media, no scrims                    |

It also samples **per act**, so a page with one flow act gets 7 frames over the
whole document rather than dense coverage of the interaction. The reveal's
behaviour is therefore asserted in
[`e2e/scrollcraft-method-reveal.spec.ts`](../../e2e/scrollcraft-method-reveal.spec.ts)
instead, including its intermediate cascade state.

### 3.9 The engine has no unmount, and Next.js navigation destroys its DOM (defect found and fixed)

`mount()` pushes to a module-level `instances` array, registers eight window
listeners (`touchstart`, `touchend`, `pointerdown`, `click`, two `scroll`,
`focusin`, `resize`) and starts a `requestAnimationFrame` loop. None of it can
be torn down, and its five `prime` listeners self-remove only under
`if (playheads.length && primedCount >= playheads.length)` — `playheads.length`
is 0 here because this slice loads no video, so that branch never runs.

The first version of this integration guarded against a double mount with a flag
on the scope element. That guard does not hold. App Router destroys the home
tree on client-side navigation and builds fresh DOM on return, so the flag is
gone by the time `next/script` fires `onReady` again. Measured: Home → About →
Home three times produced **four** engine instances, three of them driving
detached nodes, each with its own permanent rAF loop and listener set. The
supposedly isolated leaf integration accumulated runtime state during ordinary
navigation.

The guard now lives at module scope, whose lifetime is the document: it survives
every client-side navigation and resets on a real page load, which is exactly
when a new instance is wanted.

That fix alone would have been worse than the bug. `html.sc-ready` survives
client-side navigation while the section's DOM does not, so refusing to re-mount
while still gating the armed state on `sc-ready` would leave the rebuilt rows
hidden with no engine instance observing them — permanently invisible content.
So the gate moved onto the scope element's own `data-scrollcraft-mounted`, which
is destroyed and rebuilt with the element it describes. The gate and the engine
instance can no longer disagree.

**The residual, stated plainly.** One instance survives for the life of the
document, and after the first navigation away it is left pointing at an act
element React has removed: `instances: 1, detachedActs: 1`, constant across any
number of round trips. Releasing that would require an unmount the engine does
not have, and adding one means editing the engine, which scroll-craft forbids.
Bounded and constant is the fix; growing was the bug. The e2e test asserts exact
equality rather than an upper bound so any regrowth fails.

**The behavioural cost.** After the first client-side return to `/` the reveal
does not re-arm and the method section renders in its resolved state, with no
animation. A cold visitor — which is every visitor arriving from a link, a
search result, or a new tab — still gets the reveal. This is the right trade for
a first-impression device, but the design exploration should know that any act
it adds will behave the same way, and should not design a beat whose _meaning_
depends on animating every time the route is revisited.

### 3.10 Things that fit better than expected

- **No global mutation unless you ask for it.** The engine writes `--sc-canvas`
  on `<html>` only for `data-sc-drift`, and drives a progress bar only if
  `[data-sc-progress]` exists. Neither is used.
- **It adds `sc-ready` to `<html>`**, a usable "engine is up" signal — though
  not the right gate for hidden content, because it outlives the DOM it stands
  for under client-side navigation (§3.9).
- **It generates no DOM and reorders nothing**, so the method section's ARIA
  table roles, its rowheader/columnheader associations, and the 820px dual
  projection survive untouched.
- **`position: sticky` is viable.** No ancestor of the method section clips
  overflow or sets a transform, filter, `contain` or `perspective` (§5).

## 4. macOS and tooling

`doctor.mjs` is macOS-clean: it found Chrome at
`/Applications/Google Chrome.app/Contents/MacOS/Google Chrome`, resolved the
workspace, and `playwright-core` resolves from the repo root already (transitively
via `@playwright/test`), so no extra install was needed. `shoot.mjs` and
`worldflight-assert.mjs` both search macOS Chrome paths. No Windows-only path
assumption was hit. `encode.sh` is `#!/usr/bin/env bash` with a WinGet glob that
simply misses on macOS.

Findings worth recording, updated after ffmpeg was installed:

1. **`doctor.mjs` exits non-zero without ffmpeg, even for builds that generate
   nothing.** ffmpeg is `sev: "required"`, but this slice has no video: it is
   used only by `encode.sh` and by `shoot.mjs`'s contact-sheet tile, which
   already degrades with a clear message. A green doctor is therefore not a
   precondition for an asset-free integration. With ffmpeg 9.0.2 installed
   (`brew install ffmpeg`, 489 filters) **doctor now exits 0**, reporting only
   three optional warnings: the libwebp encoder, `KIE_AI_API_KEY`, and the
   not-yet-created registry.
2. **ffmpeg has no Homebrew bottle on this machine** and compiled from source,
   taking roughly 40 minutes. Anyone reproducing an asset-generating build on
   macOS should start that install well before they need it, or point
   `SCROLLCRAFT_FFMPEG` at an existing full build.
3. **Homebrew's ffmpeg has no libwebp encoder**, which is new information the
   first pass could not have surfaced. `ffmpeg -encoders` matches `webp` zero
   times, though the muxer is present, and `webp` is not pulled in as a formula
   dependency. `doctor.mjs` grades this `optional` and says posters "fall back
   to JPEG. Not fatal, just heavier" — but the skill's own README lists a
   missing WebP muxer as one of the three faults that otherwise surface as a
   misleading error, and `assets.md` encodes posters as `.webp`. **An
   asset-generating build on this machine needs an ffmpeg built with
   `--enable-libwebp` first**, or its posters will be heavier than the skill
   intends. The integration slice is unaffected: it generates no posters.
4. **The workspace resolves inside the repository.** With no `SCROLLCRAFT_HOME`
   and no `.scrollcraft.json`, it is `<project root>/scrollcraft` — i.e. builds
   and `FINGERPRINTS.md` would land in this repo. `/scrollcraft/` is gitignored
   rather than relocated, so the default resolution keeps working with no
   machine-specific config committed. A design exploration that wants a durable
   fingerprint registry should either commit `scrollcraft/FINGERPRINTS.md`
   deliberately or set `SCROLLCRAFT_HOME`.

**The native contact sheet now works.** `shoot.mjs` writes `sheet.png` instead
of skipping it, at all three configurations. Two notes on reading them:

- The desktop and reduced-motion sheets are **byte-identical**, and that is
  correct rather than a flag being ignored. The harness waits for each sample
  position to settle before shooting, and the `data-sc-in` reveal has finished
  by then, so both photograph the same resolved page. Confirmed separately that
  the flag does reach the page: under `reducedMotion: "reduce"` the rows compute
  `transition-duration: 1e-05s`, the `base.css` floor, against `0.55s` without
  it. Reduced motion is asserted properly in e2e, not from these sheets.
- The mobile sheet is the one that carries new information: at a true 390×844
  the page is 5.1 viewport-heights rather than 2.5, and the sheet captures the
  narrow schema mid-reveal.

**A verification mistake worth recording, because it invalidated a round.** The
second harness round was driven from a shell loop that passed its per-config
flags as an unquoted `$args`. zsh does not word-split unquoted parameter
expansions, so `--width 390 --height 844` arrived as a single argument and was
ignored: all three passes silently ran at 1440×900 with no reduced motion, and
produced three byte-identical sheets. The tell was that the "mobile" frames were
2880px wide. Passing the flags literally fixed it. A harness that reports
`page: 2.5 viewport-heights` for both desktop and mobile is reporting that it
never changed viewport.

`verify.md` also warns that the harness will photograph whatever is on the port
if the server failed to bind. This happened here: a stale `next start` held 4500,
the restart failed with `EADDRINUSE` into a log nobody was reading, and two
verification rounds ran against the previous build. The title/asset curl check
`verify.md` prescribes is not optional.

## 5. The pinned-act probe (disposable, not committed)

Pinned acts (`scrub` / `pin` / `pan`) are the devices most likely to be
incompatible, and using one would have restructured the method section — a
redesign, which is out of scope. So pinning was probed at runtime against the
built page, with upstream's own `.sc-stage` rules injected and the engine
re-mounted. Nothing was committed and the homepage was not reshaped to make the
probe pass.

**It pins.** At 1440×900 the stage computed `position: sticky`, held at viewport
top through the act's travel and released cleanly. No ancestor blocked sticky, and
the engine emitted no warnings. The act took its `height: 250vh` and the document
grew accordingly.

**But a 100vh stage clips this section's content at both widths:**

| Viewport | Section content | Stage | Overflow  |
| -------- | --------------- | ----- | --------- |
| 1440×900 | 921px           | 900px | marginal  |
| 390×844  | 2324px          | 844px | **2.75×** |

On a phone the narrow projection is nearly three viewports tall, so pinning it
as authored would hide roughly two thirds of it, and the document got _shorter_
(4339px → 4081px) because a 2368px section collapsed into 250vh. Pinning is
available to the design exploration, but only for content authored to fit one
viewport per act — not for the method section in its current form.

## 6. Verification performed

| Check                                         | Result                                                                                                                                                                                   |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `npm run lint` / `typecheck` / `format:check` | pass                                                                                                                                                                                     |
| `npm test` (vitest)                           | pass                                                                                                                                                                                     |
| `npm run build`                               | pass; `/` still `○ (Static)` — the client Script does not force dynamic rendering                                                                                                        |
| `npm run test:e2e`                            | pass, including the pre-existing homepage happy path                                                                                                                                     |
| Desktop behaviour                             | `shoot.mjs` 1440×900, 8 samples/act: no dead scroll, native contact sheet. Reveal cascade asserted in e2e                                                                                |
| Mobile behaviour                              | `shoot.mjs` 390×844 (page 5.1 viewport-heights): no dead scroll, native contact sheet capturing the narrow schema mid-reveal. Narrow projection reveal asserted at 390×640               |
| Reduced motion                                | `shoot.mjs --reduced-motion`, and e2e under `reducedMotion: "reduce"`: rows settle at opacity 1 with zero translation                                                                    |
| Intermediate scroll states                    | e2e asserts the mid-cascade frame (first row ahead of last) and the engine-written delays `0/90/180/270/360/450ms`, not just the end state                                               |
| JavaScript disabled                           | e2e under `javaScriptEnabled: false`: no engine, no `data-scrollcraft-mounted`, every row at opacity 1, heading visible                                                                  |
| Print                                         | e2e asserts both projections settle to opacity 1 under `emulateMedia({ media: "print" })` while unscrolled and armed, and re-arm on return to screen media (§3.6)                        |
| Client-side navigation                        | e2e drives Home → About → Home three times through the site's own links and asserts `instances: 1, detachedActs: 1` after every cycle, plus that the returned section is readable (§3.9) |
| Once-only reveal                              | e2e scrolls away and back: no re-hide                                                                                                                                                    |
| Accessibility / reading order                 | ARIA table roles, `aria-labelledby`, six `role="row"` children and the ordinal sequence `01–04` asserted unchanged                                                                       |
| Keyboard access                               | e2e tabs out of the header into the section and asserts the landed row is at opacity 1 (§3.5); removing the `:focus-within` rule fails it                                                |
| Cross-route containment                       | e2e asserts `/projects`, `/articles`, `/about`, `/ecosystem` carry no scope element, no `data-sc-*`, no engine global and no script tag                                                  |
| Engine integrity                              | `tests/scrollcraft-engine-integrity.test.ts` pins the sha256 and asserts the boundary rules                                                                                              |

Not verified: a real phone. Headless Chrome cannot reproduce iOS touch scrolling
or its video decoder. This slice loads no video, which removes the failure mode
`verify.md` warns hardest about, but touch-scroll feel on the staggered reveal is
untested on device.

## 7. For the design exploration

**Available now**

- The engine, scoped, hash-pinned, with a proven mount path and a removal path.
- `--sc-p` on the method section's container: normalized scroll progress,
  verified advancing 0.155 → 1.000, which is the sanctioned hook for bespoke
  behaviour that must not touch the engine.
- Pinning works. No ancestor defeats `position: sticky`.
- `shoot.mjs` works against a Next.js route at any viewport, including
  `--reduced-motion`, and now writes native contact sheets (§4). Pass its flags
  literally; a shell loop that expands them from one variable silently shoots
  the wrong viewport.
- `doctor.mjs` exits 0 on this machine. Before generating assets, check
  `ffmpeg -encoders | grep libwebp` — Homebrew's build has no WebP encoder (§4).

**Constraints**

- **The engine's design floor is not in play.** Its tokens, type ramp, layout and
  copy classes were refused. Devices only.
- **`data-sc-cue` is off-limits for content**, and `data-sc-kinetic` splits text
  into spans inside a cue, so it inherits the same problem. Reveals must be
  once-on-entry and settle without JavaScript.
- **Every device that hides content needs three escapes authored alongside it,
  not one:** a settled state without JavaScript, a `:focus-within` rescue for
  keyboard readers (§3.5), and an `@media print` settle (§3.6). The engine
  supplies none of them. Treat "what does this look like with no scroll" as part
  of designing the act, not as a post-hoc accessibility pass.
- **Acts only arm once per document.** After a client-side return to `/` the
  reveal renders settled with no animation, because re-mounting the engine is
  what leaked (§3.9). Cold visitors always see it. Do not design a beat whose
  meaning depends on re-animating when a route is revisited.
- **Any device that hides content needs a keyboard rescue authored alongside it.**
  The engine only rescues focus inside cues (§3.5), and nothing upstream settles armed content for print (§3.6). Every armed region added
  later needs its own `:focus-within` settle, or the equivalent.
- **Reduced motion here is a hard floor, not a gentler curve.** Any act whose
  meaning depends on motion has to carry a static alternative that is genuinely
  equivalent, not merely a stilled version.
- **Pinned acts need one-viewport content.** The method section is 2.75
  viewports on a phone. Pinning means re-authoring what a beat contains, which
  is a design decision, not a markup change.
- **No imagery exists.** This portfolio ships no photography, no video and no
  illustration, by design. `scrub`, worldflight and the layered hero all assume
  an asset budget that does not exist yet, and generating one is a positioning
  decision, not a technical one.
- **`DESIGN.md` bans extending the instrument vocabulary** with gauges, tick
  rulers, counters, scanlines or console chrome. That rules out
  `[data-sc-progress]` and `data-sc-count` as drawn, independently of scroll-craft.
- **scroll-craft's own bans overlap usefully**: no scroll cue, no `01 / 06`
  counters, no gradient text, no em dash in visible copy. The last one is worth
  checking against existing copy before adopting its review checklist wholesale.
- **The fingerprint registry is empty and local.** The gate has nothing to clear
  on a first build; decide where the registry lives before the second.

**Open question the spike deliberately did not answer:** whether a scroll-driven
homepage is the right move for a portfolio whose credibility rests on qualified
figures and legible evidence. Every device this engine is good at moves attention;
every rule in `DESIGN.md` is about holding it still. That tension is the design
exploration's subject, not a technical blocker.
