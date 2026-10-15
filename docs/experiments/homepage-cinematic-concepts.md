# Homepage cinematic concepts

**Status:** **Concept D — Singularity Wake** selected (`creative-direction-select` complete, 2026-10-16). **Visual prototype** at `/experiments/home-hero-prototype` (Scene I–II; see slice `visual-prototype` in [plan](../../.cursor/plans/2026-10-15-homepage-cinematic-redesign.plan.md)).  
**Plan:** [`.cursor/plans/2026-10-15-homepage-cinematic-redesign.plan.md`](../../.cursor/plans/2026-10-15-homepage-cinematic-redesign.plan.md)  
**Polish references:** [webfueled.dev](https://webfueled.dev) (scroll confidence, typographic scale over cinematic stills); [GetLayers — New Era](https://www.getlayers.ai/layer/new-era) (particle/WebGL scroll spectacle — see inspection below)  
**Motion runtime (implementation):** GSAP + ScrollTrigger only ([`AGENTS.md`](../../AGENTS.md)); R3F/three/shaders as render layers synced to ScrollTrigger timelines, never a second scroll system.

## Replacement scope (creative canvas)

The cinematic homepage is a **blank art-directed experience**. It does **not** adapt, reskin, or preserve:

- The current two-channel method matrix, continuity band, route grid, or grid-based visual language
- Homepage “methodology” chapter structure (requirement / depth / contract framing as IA)

**Preserve:** global header/footer and primary nav ([`lib/nav.ts`](../../lib/nav.ts)), routes to Projects / Articles / About (Ecosystem only where narrative warrants), SEO/a11y contracts from the plan, future assistant integration, and **legacy homepage behind PostHog `cinematic-homepage` until launch**.

Engineering background informs **tone and narrative** (judgment, craft, live systems) — not literal software diagrams, résumé timelines, or portfolio-template layouts.

## Methodology constraints (all concepts)

Inherited from [scroll-craft baseline](scroll-craft-baseline.md) (runtime-agnostic only):

| Constraint            | Creative implication                                                                                                                            |
| --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| SSR-resolved floor    | Every scene’s copy and hierarchy exist in the initial HTML; motion **arms** on mount, never hides load-bearing text in CSS-only cues.           |
| Reduced motion        | `gsap.matchMedia("(prefers-reduced-motion: no-preference)")` gates pin/scrub/hide/scene wipes; reduced branch = static storyboard stack.        |
| Keyboard / print      | Armed hides get `:focus-within` and `@media print` settles with `!important`.                                                                   |
| Mobile pin discipline | Desktop: long pin/scrub sequences allowed; mobile: **native document** or short pins only — no multi-minute pinned WebGL on phone.              |
| Scope containment     | Client choreography module + server-resolved markup; flag-gated route; `domain/` / `content/` evolve in later slices, not in concept selection. |

Storyboards use **frame notation**: `F0` = load, `F1…Fn` = scroll landmarks. Implementation: `useGSAP` + scoped refs, master timeline with `scrollTrigger: { scrub, pin, snap }` per scene.

---

## Reference inspection

### GetLayers — “New Era” (`/layer/new-era`)

**Inspection date:** 2026-10-15 (automated browser + page metadata). **Live scroll experience was not available** — the layer is **Premium** (“Upgrade to unlock”; prompt and source download gated). Findings below separate **observed** from **inferred**.

| Observed (primary sources)                                                                                                                                                                                                                                                                                           | Inferred (not verified interactively)                                                                                    |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Page title and H2: **“New Era”**. Official blurb on the layer detail panel: _“A luminous swarm of orange-and-blue particles drifts through deep space, endlessly reshaping itself as you scroll — a cinematic voyage from a single point of light to a vast spiral galaxy.”_                                         | Full-page scroll choreography matches the blurb (particle morph tied to scroll progress).                                |
| Tags listed: **Health / Science**, **landing page**, **threejs**, **nextjs**.                                                                                                                                                                                                                                        | Built as App Router + Three.js stack per GetLayers workflow docs on the same page.                                       |
| Preview **video** URL present in DOM: `https://storage.getlayers.ai/templates/new-era.mp4` (marketing capture, not interactive). Still frame shows a **dense particle vortex** around a **central dark void**, **orange–amber warm particles** on one side and **cyan–blue** on the other, on **near-black** ground. | Interactive version uses scroll-scrubbed uniforms (particle spread, curl, color mix) rather than discrete section fades. |
| UI: “Copy prompt”, “Download source code”, “Upgrade to Full Stack” — **no public iframe demo** in the inspected session.                                                                                                                                                                                             | Production layer likely single-page immersive hero + scroll acts (typical GetLayers “Templates” category).               |
| OG description (meta): _“New Era — a premium layer from the GetLayers library. landing page · threejs · nextjs.”_                                                                                                                                                                                                    | —                                                                                                                        |

**Takeaways for this portfolio (creative, not clone):** particle fields as **primary art direction**; scroll as **continuous metamorphosis** rather than stacked sections; WebGL justified for density and organic motion DOM cannot carry; color can stay **on-brand** (warm ink + single amber signal on near-black) instead of marketing orange/blue.

### webfueled.dev

| Observed                                                                                                                                                                                                                                                                           | Inferred                                                                                                                             |
| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Hero: **full-viewport cinematic still** (portrait, dramatic side light, deep black surround). **Large centered question headline** in white sans. **“Scroll”** affordance with mouse icon at bottom. Page copy references a **“scroll-driven hero”** as the product demonstration. | Pacing: slow first scroll, confidence in negative space; typography as **poster**, not document grid.                                |
| Below fold: course marketing sections (skills / build / business) — conventional layout **after** the hero spectacle.                                                                                                                                                              | Narrative arc = one strong immersive opening → simpler content; for portfolio, **entire home** should stay immersive until nav coda. |

**Takeaways:** pair **one unforgettable opening image or field** with **restrained type**; treat scroll as **directed camera**; avoid “hero spectacle → default portfolio layout.”

---

## Exploration round 1 — **not selected**

Stakeholder review (2026-10-15): Ledger Film, Strata Cut, and Chorus Index **do not meet creative ambition** — too close to conventional portfolio structure (pinned text, methodology channels, grids, stack diagrams). **Do not prototype these.** Retained for history.

| Id    | Name             | Primary axis                                | Why not selected (summary)                                       |
| ----- | ---------------- | ------------------------------------------- | ---------------------------------------------------------------- |
| **A** | **Ledger Film**  | Editorial document / horizontal film leader | Document + qualified-figure rail = animated case study, not film |
| **B** | **Strata Cut**   | Spatial cross-section / system depth        | Literal layer stack = software diagram metaphor                  |
| **C** | **Chorus Index** | Rhythmic index / measurement grid           | Grid + channel cells = matrix reskin                             |

<details>
<summary>Round 1 full write-ups (collapsed)</summary>

### Concept A — Ledger Film

Forensic scroll on hairline grid; oversized qualified figure rail; CH 01/02 pin beats; index coda. WebGL: none. See git history of this file for full tables.

### Concept B — Strata Cut

Geologic layer stack peeling on scroll; validator plane highlight; exit tunnels. WebGL-forward. Superseded by round 2 spatial ideas without stack metaphor.

### Concept C — Chorus Index

Full-viewport mono grid scan; CH cell expand. Superseded by round 2 kinetic environments.

</details>

---

## Exploration round 2 — candidate directions (current)

Three **distinct visual worlds** prioritizing differentiation and ambition over implementation ease. Each uses **scene-to-scene transformation** (morph, wipe, or camera voyage), not section reveals.

| Id    | Name                 | World axis                              | Centerpiece                                       |
| ----- | -------------------- | --------------------------------------- | ------------------------------------------------- |
| **D** | **Singularity Wake** | Particle cosmos / scroll-sculpted field | Living particle vortex (portfolio-colored)        |
| **E** | **Monolith Script**  | Monumental type as architecture         | One hero sentence as traversable typographic ruin |
| **F** | **Threshold Rooms**  | Serial installation chambers            | Full-screen organic **dissolve** between rooms    |

---

## Concept D — Singularity Wake

### 1. Visual identity

**Deep-document black** (`--bg`) holding a **living particle ocean** — millions of points in warm ink and **amber ink** (`--accent`), never fill-heavy UI. The world feels like **observatory footage**: silence, drift, then violent graceful reconfiguration. Differs from E’s stone type and F’s photographic rooms; motion is **fluid simulation**, color is **ember-on-void**.

**Moodboard (concrete references)**

| Reference                                                                    | What to steal                                                   |
| ---------------------------------------------------------------------------- | --------------------------------------------------------------- |
| GetLayers **New Era** preview (`storage.getlayers.ai/templates/new-era.mp4`) | Vortex density, scroll-implied metamorphosis, void at center    |
| **Arrival** (2016) docking / time POV shots                                  | Slow approach, scale shift without UI chrome                    |
| **Ryoji Ikeda** — `data.scan` / superposition installations                  | Point-cloud aesthetics, restraint, no literal charts            |
| **webfueled.dev** hero                                                       | Poster typography over full-bleed atmosphere                    |
| Portfolio tokens                                                             | Near-black ground, ochre/amber thin marks only, IBM Plex stacks |

### 2. Signature centerpiece

A **particle singularity** — torus/vortex whose **curl, radius, and color temperature** are the main character. It is not a galaxy stock photo; it is an **abstract engine** that could read as nebula, turbine, or flock depending on scroll phase.

### 3. Scroll narrative — scene transformations

| Scene                       | Frames     | Visual state                                                                                                                                                                                                       | Transformation (not a “section reveal”)                                                                      |
| --------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| **I — Point**               | `F0`–`F1`  | Single amber pixel at center; name + one-line positioning in IBM Plex Sans, bottom third (SSR).                                                                                                                    | Particles **nucleate** from the pixel (shader birth rate ↑ with scroll); type holds fixed while field grows. |
| **II — Wake**               | `F2`–`F4`  | Vortex forms; camera **dives** along the wake (scroll-scrubbed camera spline).                                                                                                                                     | **Continuous morph**: particle velocity field rotates from laminar to turbulent; no cut.                     |
| **III — Passage**           | `F5`–`F7`  | Vortex **opens** into a tunnel (hollow core widens); copy for “what I build” floats on a **glass-dark plane** (CSS `--surface` 85% opacity) that **rides the tunnel wall** (3D transform synced to ScrollTrigger). | Tunnel is not a new page — same particle system, new boundary conditions in shader.                          |
| **IV — Constellation coda** | `F8`–`F10` | Field expands to sparse stars; **three bright nodes** pulse once (Projects / Articles / About) with mono labels; mailto as fourth faint node.                                                                      | Particles **re-seed** to anchor points; vortex dissolves into navigable sky.                                 |

ASCII (Scene II → III):

```text
F3        ·  ·    ·
      ·   ╱╲   ·     ← wake
    ·   ╱    ╲   ·
  ·     ████     ·   ← void opens into tunnel on next scrub
```

**Narrative (engineering-informed, not illustrative):** the film is about **following a signal into structure** — ambiguity as particle cloud, judgment as stable orbit — without naming stacks or employers in the visuals.

### 4. Contextual navigation

- **Projects:** Scene IV node — label “Evidence” / link `/projects` (copy from content layer later).
- **Articles:** second node — `/articles`.
- **About:** third node — `/about`.
- **Ecosystem:** omit unless copy in Scene III explicitly references the map; no default fourth card.

### 5. Positioning story

Senior / hands-on / product / AI-native reads through **pacing and craft** (shader stability, readable type on chaos), not through diagrams. One short hero line (existing hero intent) + **one** mid-film stanza max; depth lives on subpages.

### 6. Desktop vs mobile

| Surface | Storyboard                                                                                                                                                                    | Centerpiece                           | Reduced motion                                                          |
| ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- | ----------------------------------------------------------------------- |
| Desktop | Full pin `F1`–`F9` (~400–600vh); `scrub: 1`; `snap: { snapTo: labels, duration: 0.4 }` on scene boundaries                                                                    | WebGL particles + scrubbed camera     | Static poster: final Scene IV still + full text stack in document order |
| Mobile  | **No long pin**; 4 static **plates** (screenshots from each scene) with short scroll between; optional 15s loop video of wake on `prefers-reduced-motion: no-preference` only | Simplified 2D canvas or CSS dot field | Plates only, no autoplay video                                          |

### 7. Technology split

| Scene            | GSAP / ScrollTrigger                                                  | WebGL (R3F/three)                                  | HTML / CSS                                |
| ---------------- | --------------------------------------------------------------------- | -------------------------------------------------- | ----------------------------------------- |
| I–IV master      | Master timeline; `pin` viewport; scrub progress → uniform `uProgress` | Instanced particles, curl noise, additive blending | Hero + stanza copy, focusable links in IV |
| Camera           | Scroll-linked camera rig (GSAP proxy)                                 | Perspective camera                                 | —                                         |
| Tunnel wall copy | Transform sync from timeline                                          | Optional depth buffer read for parallax            | Panel on `--surface`                      |

**WebGL justification:** **≥10⁵** animated points with organic coherence; DOM/SVG cannot hit density or fluid morph at 60fps.

### 8. Performance and feasibility

| Topic       | Notes                                                                                           |
| ----------- | ----------------------------------------------------------------------------------------------- |
| Budget      | Lazy-load R3F chunk on flag ON; `dpr` cap 1.5 mobile, 2 desktop; kill canvas on reduced-motion. |
| Risk        | Medium–high GPU; mitigate with instancing, fixed timestep, `visibility` pause when off-screen.  |
| Feasibility | High engineering fit (Codenames choreography patterns + new R3F dep in later slice).            |

### 9. Assessment matrix

| Dimension                 | Rating      | Rationale                                              |
| ------------------------- | ----------- | ------------------------------------------------------ |
| Visual impact             | Very high   | Closest to New Era ambition, on-brand palette          |
| Originality               | High        | Particle sites exist; story + type treatment is custom |
| Implementation complexity | Very high   | Shader + camera + a11y floor                           |
| Performance risk          | Medium–high | Mitigable with tiered mobile                           |

---

## Concept E — Monolith Script

### 1. Visual identity

A **brutalist typographic landscape** — letters the size of buildings, carved from `--surface` stone on `--bg` sky. Motion feels **tectonic**: slides, shears, dust. Amber appears only when a **word fractures** and the crack glows. Differs from D’s fluid field and F’s photographic realism.

**Moodboard**

| Reference                                         | What to steal                                |
| ------------------------------------------------- | -------------------------------------------- |
| **webfueled.dev**                                 | Scale of headline relative to viewport       |
| **Experimental Jetset** posters                   | Monument sans, grid tension                  |
| **Tadao Ando** concrete + slit light              | Material seriousness (no fake glassmorphism) |
| **Karsten Schmidt** (typographic installations)   | Type as environment                          |
| **Denis Villeneuve** title cards (Dune / Arrival) | Slow push-ins on letterforms                 |

### 2. Signature centerpiece

The hero sentence **set in colossal IBM Plex Sans** (words as separate meshes or DOM blocks): _“I follow the product requirement as deep as it needs to go.”_ Visitors **scroll through** the sentence — camera passes between words like alleys.

### 3. Scroll narrative — scene transformations

| Scene              | Frames     | Visual state                                                                                                                                              | Transformation                                                                           |
| ------------------ | ---------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **I — Facade**     | `F0`–`F2`  | Full sentence fills viewport; only first line legible.                                                                                                    | Camera **tracks backward**; other words rise from below horizon (y/rotateX scrub).       |
| **II — Split**     | `F3`–`F5`  | Word **“deep”** shears open (vertical split); amber crack line; interior is darkness with floating mono **evidence phrases** (short, not metrics parade). | Split is FLIP + transform; interior copy is SSR, revealed by widening gap not opacity-0. |
| **III — Collapse** | `F6`–`F7`  | Letters **fall forward** toward camera (perspective); dust particles (light WebGL or CSS)                                                                 | Scene **morph**: typography becomes rubble field; rubble **resolves** into flat plaza.   |
| **IV — Plaza**     | `F8`–`F10` | Three **standing stones** (not cards) engraved Projects / Articles / About; horizon hairline.                                                             | Stones rise from rubble via timeline; links are engraved text (underline on focus).      |

ASCII (Scene II):

```text
F4    DEEP
      ║ ║  ← amber crack
      ║ ║     mono phrases inside
```

### 4. Contextual navigation

Engraved stones in Scene IV; optional mid-film inline link inside split (“Codenames AI →”) only as **carved footnote**, not a case-study panel.

### 5. Positioning story

**Depth as literal space** — product requirement becomes architecture. Engineering judgment shown by **what the split reveals** (short field phrases), not timeline. AI-native hinted in footnote copy only if sourced from `content/` later.

### 6. Desktop vs mobile

| Surface | Storyboard                                                                                  | Reduced motion                                     |
| ------- | ------------------------------------------------------------------------------------------- | -------------------------------------------------- |
| Desktop | Pin through II–III; horizontal **containerAnimation** optional for alley walk between words | Full sentence + stones visible; no shear animation |
| Mobile  | Single-column stack: sentence blocks; split becomes **accordion** with details open         | Same accordion, no perspective                     |

### 7. Technology split

| Scene          | GSAP / ScrollTrigger           | WebGL                                     | HTML / CSS                     |
| -------------- | ------------------------------ | ----------------------------------------- | ------------------------------ |
| Facade / track | `pin`, scrub camera on wrapper | Optional dust in collapse only            | Giant type blocks              |
| Split          | Timeline + FLIP                | —                                         | Crack `:after` with `--accent` |
| Collapse       | `rotateX`, `z`, stagger        | Low-count debris shader OR CSS transforms | —                              |
| Plaza          | `once` rise                    | —                                         | Stone links                    |

**WebGL optional:** debris **only** if CSS particle count insufficient; not required for v1.

### 8. Performance and feasibility

| Topic       | Notes                                                                                                   |
| ----------- | ------------------------------------------------------------------------------------------------------- |
| Budget      | Prefer DOM transforms; WebGL dust ≤2k points if used                                                    |
| Risk        | Medium (layout thrash on huge type — use `will-change` sparingly, `ScrollTrigger.refresh` on font load) |
| Feasibility | High without WebGL; masterpiece with light GPU                                                          |

### 9. Assessment matrix

| Dimension                 | Rating    | Rationale                                  |
| ------------------------- | --------- | ------------------------------------------ |
| Visual impact             | Very high | Unmistakable identity; typographic courage |
| Originality               | Very high | Not a template portfolio layout            |
| Implementation complexity | High      | FLIP + perspective + a11y                  |
| Performance risk          | Medium    | DOM-heavy but predictable                  |

---

## Concept F — Threshold Rooms

### 1. Visual identity

**Serial installation art** — four full-screen **rooms** with different materials (concrete + slit light, fog + single beacon, night water + horizon, empty gallery with one portrait). Square frames, no shadows per design system; depth from **photography / WebGL quads** only. Transitions are **organic wipes** (noise threshold), not fades. Differs from D (continuous field) and E (type ruin).

**Moodboard**

| Reference                                                                | What to steal                                                  |
| ------------------------------------------------------------------------ | -------------------------------------------------------------- |
| **James Turrell** Ganzfeld / wedgework                                   | Color fields, slow perception shift                            |
| **Bill Viola** slow-motion thresholds                                    | Emotional pacing between spaces                                |
| **GetLayers** section templates (category copy: “Sections … own motion”) | Distinct acts, each with own art direction                     |
| **Edward Burtynsky** (abstracted)                                        | Human scale vs industrial void — **not** literal eco messaging |
| **webfueled.dev**                                                        | First-frame cinematic confidence                               |

### 2. Signature centerpiece

The **threshold wipe** itself — a full-viewport **shader curtain** (film burn / noise dissolve) that carries color from Room N into Room N+1. The wipe is the brand: **crossing under uncertainty**.

### 3. Scroll narrative — scene transformations

| Scene                | Frames     | Visual state                                                                                                                             | Transformation                                                                   |
| -------------------- | ---------- | ---------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------- |
| **Room 1 — Slit**    | `F0`–`F2`  | Concrete texture; vertical **amber slit** (CSS gradient banned — use photographic plate or painted WebGL quad); hero line in lower left. | Scroll **widens slit** (mask scrub) until room blows out to white-hot edge.      |
| **Room 2 — Fog**     | `F3`–`F5`  | Fog plate; single `--accent-fill` beacon far away; one-sentence voiceover text (lead).                                                   | **Wipe** from slit edge; fog density tied to scroll (shader or video crossfade). |
| **Room 3 — Horizon** | `F6`–`F8`  | Night sea; horizon as 1px `--border-strong`; subtle reflection.                                                                          | Horizon **tilts** (camera roll scrub) → wipe to gallery.                         |
| **Room 4 — Gallery** | `F9`–`F11` | Near-black room; **one** portrait (Michael) lit like webfueled reference; three doorways (text labels) to Projects / Articles / About.   | Doors are **light gaps**, not cards; hover = amber ink underline.                |

ASCII (wipe between rooms):

```text
F3  [ concrete ]█████░░░░░[ fog ]
              ↑ noise dissolve boundary moves →
```

### 4. Contextual navigation

Doorway gaps in Room 4; optional whisper link in Room 2 footer (“field reports →”) as mono text.

### 5. Positioning story

Rooms are **states of practice** (constraint, ambiguity, measurement, accountability) without labeling them as methodology. Portrait grounds **human** senior IC/leader presence without résumé scroll.

### 6. Desktop vs mobile

| Surface | Storyboard                                                               | WebGL                                 | Reduced motion                        |
| ------- | ------------------------------------------------------------------------ | ------------------------------------- | ------------------------------------- |
| Desktop | Pin per room (~100vh scrub each); wipe overlaps 15% scroll between rooms | Wipe shader + optional fog video loop | Four full-height stills, copy between |
| Mobile  | Rooms stack; **static** stills; shortened copy                           | Wipe becomes **hard cut** (CSS)       | Same stills                           |

### 7. Technology split

| Beat      | GSAP / ScrollTrigger             | WebGL / media                                                  | HTML / CSS                           |
| --------- | -------------------------------- | -------------------------------------------------------------- | ------------------------------------ |
| Room pins | `pin`, scrub masks               | Textured quads, fog shader or H.264 loop (muted, plays inline) | Type                                 |
| Wipes     | Timeline progress → `uThreshold` | Full-screen fragment shader                                    | —                                    |
| Gallery   | `once` door glow                 | —                                                              | Portrait `next/image`, doorway links |

**WebGL justification:** **seamless photochemical wipe** between unrelated plates; CSS crossfade reads as template, not cinema.

### 8. Performance and feasibility

| Topic       | Notes                                                                              |
| ----------- | ---------------------------------------------------------------------------------- |
| Assets      | Optimized WebP/AVIF plates + short WebM fog; art-directed shoot or licensed stills |
| Risk        | Medium (video bandwidth) — serve poster + play only desktop motion branch          |
| Feasibility | High creative control; production cost is **asset pipeline**, not math             |

### 9. Assessment matrix

| Dimension                 | Rating    | Rationale                    |
| ------------------------- | --------- | ---------------------------- |
| Visual impact             | Very high | Memorable rooms + wipes      |
| Originality               | Very high | Portfolio as gallery install |
| Implementation complexity | High      | Assets + shader + pin        |
| Performance risk          | Medium    | Video weight; lazy media     |

---

## Round 2 comparative summary

| Id                       | Selection    | Ambition                         | WebGL                   | Best prototype proof          |
| ------------------------ | ------------ | -------------------------------- | ----------------------- | ----------------------------- |
| **D — Singularity Wake** | **Chosen**   | Particle spectacle, New Era tier | **Required**            | Scene I→II wake + tunnel open |
| **E — Monolith Script**  | Not selected | Typographic installation         | Optional dust           | Word split + plaza stones     |
| **F — Threshold Rooms**  | Not selected | Cinematic photography + wipes    | **Wipe + optional fog** | Room 1 slit → Room 2 wipe     |

## Creative direction — recorded decision

**Human gate:** `creative-direction-select` — **complete** (2026-10-16).  
**Chosen direction:** [**Concept D — Singularity Wake**](#concept-d--singularity-wake) (Round 2).

### Rationale (stakeholder)

- Closest match to the immersive, particle-driven experience that originally attracted review of [GetLayers New Era](https://www.getlayers.ai/layer/new-era) — adapted to this portfolio’s art direction, **not** a reproduction of the reference template.
- Deliberately ambitious **Three.js / R3F + GSAP** frontend engineering exercise.
- **Continuous scene transformation** (wake → tunnel → field) is more compelling than discrete typographic installations or photographic room sequences.
- Target: visually distinctive and **personal**, while staying within site tokens, shell nav, SEO/a11y, and flag-gated rollout.

### Not selected (exploration history)

| Id    | Name                                  | Status             | Why not chosen (summary)                                                                                                                                                |
| ----- | ------------------------------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| A–C   | Ledger Film, Strata Cut, Chorus Index | Rejected (Round 1) | Too close to conventional portfolio / matrix / grid / stack metaphors — see [Round 1](#exploration-round-1--not-selected).                                              |
| **E** | **Monolith Script**                   | Not selected       | Monumental type-as-architecture is strong but secondary to particle continuity; split/collapse/plaza arc deferred. Full write-up retained above for history.            |
| **F** | **Threshold Rooms**                   | Not selected       | Installation + photographic wipes are cinematic but separate rooms lack the single morphing field; asset-heavy path deferred. Full write-up retained above for history. |

**No hybrid:** v1 follows Singularity Wake scenes as authored in Concept D; do not merge Monolith or Threshold motifs without a new human gate.

### WebGL for v1

**In.** R3F/three is the **rendering layer** for the particle singularity, tunnel opening, and scroll-scrubbed camera. GSAP + ScrollTrigger remains the **only** scroll orchestration runtime; shader uniforms and camera transforms are driven from the master timeline progress ([`AGENTS.md`](../../AGENTS.md)).

### Scope boundaries (unchanged)

- **Existing homepage** at `/` stays operational until cinematic launch; replacement ships behind PostHog **`cinematic-homepage`** in later slices (fail-closed default OFF).
- Do **not** reintroduce current homepage grid, method matrix, continuity band, route grid, or methodology chapter IA on the cinematic branch.
- Global header/footer, primary nav routes, accessibility floor, and SEO requirements from the [plan](../../.cursor/plans/2026-10-15-homepage-cinematic-redesign.plan.md) still apply.

### `visual-prototype` requirements (next slice — **pending, not authorized here**)

When `visual-prototype` begins (separate PR/slice after this decision merges), prove at minimum:

| Requirement              | Detail                                                                                                                                         |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **Transformation proof** | Particle **wake** morphing into an **opening tunnel** (Concept D Scenes I→III: Point → Wake → Passage).                                        |
| **Scroll authority**     | GSAP/ScrollTrigger master timeline; scrub/pin as designed; no parallel scroll libraries.                                                       |
| **Render layer**         | Three.js/R3F particle system + camera rig; scroll progress controls simulation parameters and camera spline.                                   |
| **Accessibility**        | SSR-resolved HTML copy; reduced-motion branch (static/stacked floor); keyboard `:focus-within` and print settles per scroll-craft methodology. |
| **Mobile**               | Fallback strategy per Concept D (plates / simplified field — no long pinned WebGL on phone).                                                   |
| **Production isolation** | Prefer experiment route; **do not change** production `/` until flag slice unless plan explicitly allows.                                      |

**This document update does not start implementation** — `visual-prototype` remains **pending** in plan frontmatter until that slice is explicitly executed.
