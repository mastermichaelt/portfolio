# Homepage cinematic concepts

**Status:** Creative exploration (slice `creative-three-concepts`)  
**Plan:** [`.cursor/plans/2026-10-15-homepage-cinematic-redesign.plan.md`](../../.cursor/plans/2026-10-15-homepage-cinematic-redesign.plan.md)  
**Polish bar:** [webfueled.dev](https://webfueled.dev) — scroll pacing and transition confidence, adapted to portfolio evidence tone and amber budget ([`DESIGN.md`](../../DESIGN.md))  
**Motion runtime (implementation):** GSAP + ScrollTrigger only ([`AGENTS.md`](../../AGENTS.md)); optional Three.js / R3F as render layers synced to ScrollTrigger timelines, never a second scroll system.

## Methodology constraints (all concepts)

Inherited from [scroll-craft baseline](scroll-craft-baseline.md) (runtime-agnostic only):

| Constraint            | Creative implication                                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| SSR-resolved floor    | Every chapter’s copy and hierarchy exist in the initial HTML; motion **arms** on mount, never hides load-bearing text in CSS-only cues.         |
| Reduced motion        | `gsap.matchMedia("(prefers-reduced-motion: no-preference)")` gates pin/scrub/hide; reduced branch = native document, full narrative visible.    |
| Keyboard / print      | Any scroll-armed opacity/transform on content gets `:focus-within` and `@media print` settles with `!important` (GSAP inline styles).           |
| Mobile pin discipline | Desktop may pin/scrub chapters; mobile defaults to **native vertical document** (Codenames precedent), with shorter beats and no sustained pin. |
| Scope containment     | One client choreography module + server-resolved markup; `domain/` / `content/` stay unaware of GSAP.                                           |

Storyboards below use **frame notation**: `F0` = load, `F1…Fn` = scroll progress landmarks. Implementation would use `useGSAP` + scoped refs ([gsap-react](https://gsap.com/docs/v3/React/)), chapter timelines with `scrollTrigger: { scrub, pin, snap }` where noted ([gsap-scrolltrigger](https://gsap.com/docs/v3/Plugins/ScrollTrigger/)).

## Three-axis discipline

These concepts sit on **different primary axes** (Impeccable-style variants), not three layouts of the same idea:

| Id    | Name             | Primary axis                                | Centerpiece medium                    |
| ----- | ---------------- | ------------------------------------------- | ------------------------------------- |
| **A** | **Ledger Film**  | Editorial document / horizontal film leader | Typographic “qualified figure” object |
| **B** | **Strata Cut**   | Spatial cross-section / system depth        | Layered stack (WebGL or CSS 3D)       |
| **C** | **Chorus Index** | Rhythmic index / measurement grid           | Animated mono grid + signal pulses    |

---

## Concept A — Ledger Film

### 1. Visual identity

A **forensic scroll**: the homepage reads as one continuous technical record unrolling on a hairline grid — IBM Plex Mono for ordinals and scope lines, sans for claims, amber only on ink roles (`--accent`), never gratuitous fill. Differs from B’s volumetric depth and C’s pulsing grid; motion feels **lateral and deliberate** (webfueled-style confidence) rather than orbital or staccato.

### 2. Signature centerpiece

A **single oversized qualified figure** (tab nums, scope line, source pointer) pinned beside the hero claim — the same evidence grammar as case studies, but at cinematic scale. It is the visual anchor every chapter revisits with new numbers (175+, 9%–41%, 8–10) without becoming a résumé ticker.

### 3. Scroll narrative

| Chapter             | Frames (storyboard)                                                                                                                                                                  | Visual state                                   | Transition                                                                  |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------- | --------------------------------------------------------------------------- |
| **0 — Threshold**   | `F0`: Full hero H1 + lead visible; figure ghosted at 40% opacity right rail. `F1`: First 15vh scroll — kicker (headline · location · availability) slides under H1; figure sharpens. | Document mode; hairline top rule; no cards.    | `scrub` 0→0.12: figure opacity + 8px x; ease `power2.out`.                  |
| **1 — Requirement** | `F2`: Section pins (`pin: main` wrapper). Left: CH 01 requirement line. Right: figure shows `175+` with scope. `F3`: Scroll 20% through pin — depth line cross-fades in mono.        | Split panel; vertical 1px divider.             | Scrubbed crossfade between spine beats; `snap: labels` on timeline.         |
| **2 — Contract**    | `F4`: Pin continues; contract line gains amber ink underline (not fill). `F5`: Figure swaps to 9%–41% with scope expansion animating in.                                             | Emphasis on **contract** typography.           | Figure swap: outgoing scope slides up, incoming from below (stagger 0.08s). |
| **3 — Continuity**  | `F6`: Pin releases; “One practice” band scrolls naturally. `F7`: Narrow portrait rail hint (static image or CSS mask) at `--surface`.                                                | About-register echo without full About layout. | `once` reveal on band; no hide.                                             |
| **4 — Index coda**  | `F8`: Inline index lines (not a 2×2 grid): Projects / Articles / About as **numbered continuations** `05`, `06`, `07` with one-line summaries. `F9`: Footer availability + mailto.   | Hairline list; amber arrow on hover only.      | Stagger `ScrollTrigger.batch` on index rows at `start: top 88%`.            |

ASCII storyboard (desktop pin beat):

```text
F2 ┌──────────────────────────────────────────────┐
   │ 01 REQUIREMENT          │    ┌─────────────┐ │
   │ Players need an AI…     │    │    175+     │ │
   │                         │    │ monthly…    │ │
   │                         │    │ scope line  │ │
   └──────────────────────────────────────────────┘
        ↑ scrub scroll drives timeline progress →
```

### 4. Contextual navigation

- **Projects:** Chapter 1 case-study handoff — inline “Codenames AI case study →” after CH 01 beat (same href as today’s matrix).
- **Articles:** Chapter 4 index line `06` — “Field reports” with count from content when available.
- **About:** Chapter 3 continuity link + Chapter 4 `07` practice record line.
- **Ecosystem:** Optional eighth index line only if narrative mentions “same gates” (continuity body); not required in v1.

### 5. Positioning story

Shows **judgment through evidence grammar**: requirement → depth → contract → qualified number, mirroring how Michael works without listing employers in the hero. Senior/hands-on reads in the **depth** copy (validators, pipelines, migrations); AI-native reads in CH 01; product-engineering reads in cross-layer framing. Ledger detail stays on `/about`; proof stays on `/projects`.

### 6. Desktop vs mobile

| Surface          | Pin / scroll                                          | Centerpiece                                                 | WebGL                                |
| ---------------- | ----------------------------------------------------- | ----------------------------------------------------------- | ------------------------------------ |
| Desktop (≥821px) | Pin chapters 1–2 (~180vh each); `scrub: 1`            | Full-height figure rail                                     | **Off** — DOM + tabular nums suffice |
| Mobile (≤820px)  | Native scroll; condensed chapters as stacked sections | Figure inline between beats, smaller `--fs-statement` scale | **Off**                              |

### 7. Technology split

| Beat           | GSAP / ScrollTrigger                    | WebGL | HTML / CSS                     |
| -------------- | --------------------------------------- | ----- | ------------------------------ |
| Hero threshold | Scrub opacity/x on figure               | —     | Hero type, kicker, grid        |
| CH 01–02 pin   | `pin`, `scrub`, timeline `snap: labels` | —     | Split panels, hairlines        |
| Figure swaps   | Timelines scrubbed to scroll progress   | —     | `QualifiedFigure`-style markup |
| Continuity     | `once` fade-up                          | —     | Band, link                     |
| Index coda     | `ScrollTrigger.batch` stagger           | —     | List rows, mailto              |

WebGL rows: **none** — convincing qualified figures and mono scope are DOM-native.

### 8. Assessment matrix

| Dimension                 | Rating      | Rationale                                                                                 |
| ------------------------- | ----------- | ----------------------------------------------------------------------------------------- |
| Visual impact             | Medium–high | Strong typographic drama within existing design system; less “wow” than spatial concepts. |
| Originality               | Medium      | Evidence-first scroll is on-brand; not a generic WebGL hero.                              |
| Implementation complexity | Medium      | Pin/scrub + figure swaps are Codenames-adjacent patterns already in repo.                 |
| Performance risk          | Low         | No GPU layer; pin count bounded to two chapters on desktop.                               |

---

## Concept B — Strata Cut

### 1. Visual identity

A **geologic cross-section** of software: ambiguous requirement at the surface, layers peeled away to expose data, validation, and telemetry strata — near-black void between layers, warm ink, amber only at **fracture lines** where contracts hold. Differs from A’s flat document and C’s flat grid; motion is **depth-axis** (z-parallax, layer separation).

### 2. Signature centerpiece

An interactive **layer stack** (5–7 planes: UI, API, schema, validator, telemetry, human review) that separates on scroll like a technical diagram coming apart. Memorable image: amber edge light on the **validator** plane when CH 01 contract line locks.

### 3. Scroll narrative

| Chapter              | Frames                                                                                                                                                         | Visual state                                       | Transition                                                  |
| -------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------------------------- |
| **0 — Surface**      | `F0`: Hero text floats over closed stack (orthographic). `F1`: Scroll begins — stack tilts 12° (CSS or WebGL camera).                                          | Calm, webfueled-slow first 10vh.                   | Camera/scrub 0→0.1.                                         |
| **1 — First cut**    | `F2`: Pin viewport; scroll drives `z` separation 0→120px between layers. `F3`: CH 01 copy appears on the UI plane as texture or overlaid HTML sync’d to depth. | Labels mono on layer edges.                        | `scrub` tied to layer gaps; HTML copy never hidden pre-arm. |
| **2 — Fault line**   | `F4`: Validator plane highlights; contract quote pins to fracture. `F5`: CH 02 layer exposes pipeline/graph motif (simplified).                                | Amber hairline on validator edge.                  | Shader or CSS `outline` pulse once at label.                |
| **3 — Bedrock**      | `F6`: Layers collapse to single `--surface` panel; continuity copy.                                                                                            | Return to 2D document.                             | Reverse scrub or hard cut with 400ms ease (desktop only).   |
| **4 — Exit tunnels** | `F7`: Three **depth tunnels** (not cards) — shallow parallax corridors labeled Projects / Articles / About; scroll past chooses none, click enters.            | Perspective corridors, no shadows (design system). | `once` scale 0.98→1 on tunnel mouth.                        |

ASCII (first cut, side view):

```text
F3      [ UI copy plane ]
           ║ gap ║
        [ API · schema ]
           ║ gap ║
        [ validator ] ← amber edge
           ║ gap ║
        [ telemetry ]
```

### 4. Contextual navigation

- **Projects:** Tunnel `01` at bedrock exit — “Evidence index” with Codenames thumbnail plane.
- **Articles:** Tunnel `02` — field-report stripe motif.
- **About:** Continuity chapter link + tunnel `03` practice record.
- **Ecosystem:** Fourth tunnel only if bedrock copy references shared gates (optional).

### 5. Positioning story

**Hands-on depth** is literal: visitors see layers opened. Senior scope reads in how many planes exist; AI-native reads in validator + schema planes; product-engineering reads in requirement-on-surface → contract-on-fracture. Avoid animated CV by keeping numbers on planes as **one** qualified figure per chapter, not a timeline of jobs.

### 6. Desktop vs mobile

| Surface | Pin / scroll                                             | Centerpiece                                          | WebGL                                             |
| ------- | -------------------------------------------------------- | ---------------------------------------------------- | ------------------------------------------------- |
| Desktop | Pin `F2–F5`; scrub separation                            | Full R3F stack or CSS `transform-style: preserve-3d` | **On** (preferred) for lighting on fracture edges |
| Mobile  | No pin; **pre-separated static diagram** + vertical copy | Simplified 2D exploded view (SVG)                    | **Off** — static SVG fallback                     |

### 7. Technology split

| Beat             | GSAP / ScrollTrigger                | WebGL (R3F/three)           | HTML / CSS                                    |
| ---------------- | ----------------------------------- | --------------------------- | --------------------------------------------- |
| Surface tilt     | Scrub camera uniform or CSS rotateX | Plane meshes + ortho camera | Hero HTML overlay                             |
| Layer separation | `scrub` → uniform `uSpread`         | Layer meshes, edge emissive | Synced copy panels (absolute, pointer-events) |
| CH labels        | Timeline labels                     | —                           | Mono edge labels                              |
| Bedrock collapse | Timeline reverse                    | Optional morph to flat      | Continuity section                            |
| Exit tunnels     | `once` transforms                   | Optional light sweep        | Tunnel links                                  |

WebGL justification: **convincing emissive fracture edges and coherent multi-plane separation** without faking depth in flat DOM; mobile degrades to SVG.

### 8. Assessment matrix

| Dimension                 | Rating      | Rationale                                                                                   |
| ------------------------- | ----------- | ------------------------------------------------------------------------------------------- |
| Visual impact             | High        | Strongest “cinematic” first impression; closest to reference-site spectacle while on-brand. |
| Originality               | High        | Layer metaphor matches positioning; not a template hero video.                              |
| Implementation complexity | High        | R3F layer + HTML sync + fallback art; new dependency if WebGL in.                           |
| Performance risk          | Medium–high | GPU + pin; must cap planes, lazy-load canvas, kill on reduced-motion.                       |

---

## Concept C — Chorus Index

### 1. Visual identity

A **measurement chorus**: the page is a living index — ordinals, channel labels, and scope lines **pulse in rhythm** like instruments coming online, then settle into readable stanzas. Square grid, mono eyebrows, sans stanzas; amber appears only when a **channel locks** (CH 01, CH 02). Differs from A’s film leader (continuous lateral) and B’s depth; motion is **temporal/rhythmic** (stagger, beat slots) more than spatial.

### 2. Signature centerpiece

A **full-viewport mono grid** (hairlines only) where cells briefly highlight in scan order, then hold on two channel “cells” that expand into the current CH 01 / CH 02 narratives. The grid is the memorable object — evidence as **instrumentation**, not decoration.

### 3. Scroll narrative

| Chapter            | Frames                                                                                                                                           | Visual state                | Transition                                                     |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ | --------------------------- | -------------------------------------------------------------- |
| **0 — Tuning**     | `F0`: Hero H1 centered; grid at 5% opacity full bleed. `F1`: 8vh scroll — scan wave across cells (single pass).                                  | Grid `_ _ _ _` rhythm.      | `gsap.fromTo` cell backgrounds scrubbed 0→0.15.                |
| **1 — CH 01 lock** | `F2`: Cell `CH 01` expands (grid-template morph via FLIP or width tween). `F3`: Requirement → depth → contract lines stagger in.                 | Channel cell becomes panel. | Timeline with `stagger: 0.12`; no opacity-zero start for copy. |
| **2 — CH 02 lock** | `F4`: Collapse CH 01 to rail; CH 02 cell expands. `F5`: Figure 9%–41% counts up only if motion allowed (`toggleActions` / reduced branch skips). | Second channel panel.       | `snap: 0.5` between two channel states on desktop pin.         |
| **3 — Unison**     | `F6`: Both channels sit in two-column desktop / stack mobile; continuity stanza spans full width.                                                | “One practice” mono kicker. | Crossfade grid opacity down to 0.15.                           |
| **4 — Coda links** | `F7`: Three **inline refrains** — each a single line with arrow link (Projects, Articles, About). `F8`: Availability footer.                     | No route grid.              | `ScrollTrigger.batch` on refrains.                             |

ASCII (tuning wave):

```text
F1   ┌──┬──┬──┬──┐
     │██│  │  │  │  ← scan highlight moves →
     ├──┼──┼──┼──┤
     │  │██│  │  │
     └──┴──┴──┴──┘
        Hero H1 beneath / over grid
```

### 4. Contextual navigation

- **Projects:** Refrain after CH 01 — “Every system, and what it is allowed to claim →”
- **Articles:** Refrain in coda — field reports line from current routes copy.
- **About:** Continuity stanza link + coda refrain.
- **Ecosystem:** Omit unless unison copy names ecosystem walkthrough.

### 5. Positioning story

Communicates **instrumentation mindset** (growth measurement + AI validation) through grid metaphor. Senior/hands-on: depth lines in each channel; product-engineering: two channels, one method; AI-native: CH 01 prominence. Shows craft via **timing and restraint** (webfueled pacing), not employer logos.

### 6. Desktop vs mobile

| Surface | Pin / scroll                                                   | Centerpiece                        | WebGL                                                          |
| ------- | -------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------- |
| Desktop | Short pin on `F2–F5` channel swap (~120vh)                     | CSS grid + GSAP                    | Optional **ambient** particles at 3% opacity (non-interactive) |
| Mobile  | Native; channel sections stack; scan wave shortened to 4 cells | Grid becomes horizontal rules only | **Off**                                                        |

### 7. Technology split

| Beat         | GSAP / ScrollTrigger         | WebGL                   | HTML / CSS        |
| ------------ | ---------------------------- | ----------------------- | ----------------- |
| Scan wave    | Scrub cell highlights        | Optional ambient points | CSS grid template |
| CH expand    | FLIP / width tweens, `pin`   | —                       | Channel copy      |
| Figure count | `snap` scrub on number tween | —                       | Tabular nums      |
| Unison       | Timeline crossfade           | —                       | Continuity        |
| Coda         | `batch` stagger              | —                       | Inline links      |

WebGL optional row: **ambient field only** — DOM cannot add subtle depth without violating no-blur/no-glow rule; if used, extremely subtle and disabled on mobile/reduced-motion.

### 8. Assessment matrix

| Dimension                 | Rating      | Rationale                                                                  |
| ------------------------- | ----------- | -------------------------------------------------------------------------- |
| Visual impact             | Medium–high | Distinctive grid; less literal wow than B, more kinetic than static home2. |
| Originality               | Medium–high | Grid-as-instrument fits thesis; risks feeling “data viz” if over-animated. |
| Implementation complexity | Medium      | Mostly GSAP; FLIP/grid morph needs careful SSR floor.                      |
| Performance risk          | Low–medium  | No heavy GPU unless ambient particles enabled.                             |

---

## Comparative summary

| Id                   | Best when prioritizing…                                           | WebGL v1 default       | Mobile strategy         |
| -------------------- | ----------------------------------------------------------------- | ---------------------- | ----------------------- |
| **A — Ledger Film**  | Design-system fidelity, fastest path to ship, evidence typography | Out                    | Native stack            |
| **B — Strata Cut**   | Maximum cinematic differentiation, depth metaphor                 | In (with SVG fallback) | Static exploded diagram |
| **C — Chorus Index** | Rhythm and “instrumentation” story without 3D                     | Optional ambient only  | Shortened scan, stack   |

## Direction selection (next slice)

Human gate `creative-direction-select` records:

- Chosen concept id and link to section above
- Rejected concepts + rationale
- WebGL in/out for v1 and prototype centerpiece

_No decision recorded in this document until that gate completes._
