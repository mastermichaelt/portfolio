---
name: Portfolio
description: Verification Discipline — near-black ground, warm off-white ink, a single amber signal, hairline panels and strong horizontal rhythm
---

## Overview

Visual contract for this portfolio. **Normative token values** live in [`app/styles/tokens.css`](app/styles/tokens.css). **Guidance, rationale, and component posture** live in [`docs/design-system.md`](docs/design-system.md). This file states semantic roles and portfolio-specific constraints — it does not duplicate literal hex values.

Mode: **Document** — the page reads as a technical record. Evidence leads; chrome is hairlines and type.

The system exists to serve one thesis: this engineer makes uncertain systems dependable. Every rule below is downstream of that. Where a visual choice and the legibility of evidence conflict, evidence wins.

## Colors

Dark by default, and only dark — there is no light mode. Use semantic variables (`--bg`, `--surface`, `--fg`, `--fg-2`, `--muted`, `--border`, `--border-strong`, `--accent`) by role, never raw values.

One signal colour: amber. It is permitted on section marks, the current nav item, evidence figures, the email address, and outbound arrows. Nowhere else. Aim for no more than four amber elements in a viewport.

`--muted` is the contrast floor at 5.26:1 on `--bg`, not a starting point. Any text darker than it fails.

## Typography

Two stacks: sans (IBM Plex Sans — headings, body, UI) and mono (IBM Plex Mono — eyebrows, technical identifiers, dates, evidence figures, scope lines). The serif display stack is retired. `--font-display-stack` aliases the sans stack.

Display headings set tight (`--tracking-tight`); labels set wide and uppercase (`--tracking-label`). Figures always use tabular numerals. Use the `--fs-*` scale; do not invent one-off sizes.

## Layout

Content column `--container` with `--gutter` inset. Vertical rhythm comes from full-width 1px rules at section heads, not from cards. Panels are separated by 1px gaps over `--border` — the gap _is_ the border; do not add per-panel borders on top of it.

Generous negative space is part of the identity. `--gap-2xl` above each major section; do not compress it to fit more content on screen.

## Elevation & Depth

None. No shadows, no glow, no gradient, no blur. Depth is expressed as `--surface` sitting one step off `--bg`, separated by a hairline.

## Shapes

Square. `--radius` and `--radius-lg` are `0`. Existing `.card` / `.pill` / `.tag` class names stay; they are square, not rounded.

## Components

Semantic CSS classes under `app/styles/` remain the primary styling API. Case studies are panels in a hairline grid; supporting work and writing are hairline lists. Primary fill text uses `--accent-ink`. There is no boxed chrome in the hero, and no separate signature/identity stylesheet.

## Evidence qualification

A figure and its qualification are one component and one DOM block: value (`.figure-value`), metric name (`.figure-name`), scope and timeframe (`.figure-scope`). The scope line never drops below 11px or below 4.5:1, never truncates, never collapses behind a tooltip, and never sits in a horizontal scroller. A figure whose scope will not fit is not shown.

Ranges stay ranges. Qualifiers stay in the source's own words. No metric strip, no counters, no charts.

## Restrained instrument vocabulary

A small borrowed vocabulary carries identity: channel identifiers on first-class case studies (`CH 01` / `CH 02`), the technical identifier at the right of each section head, mono dates and labels. It is deliberately limited to those.

Do not extend it: no gauges, dials, sparklines, charts, tick rulers, status LEDs, terminal frames, scanlines, or console chrome.

## Do's and Don'ts

**Do**

- Reference token names and roles; open `tokens.css` for current values
- Keep the figure/scope pair intact at every breakpoint
- Preserve focus rings (amber, 2px, 3px offset) and 44px minimum hit targets
- Honor `prefers-reduced-motion: reduce`
- Let sections breathe before adding content

**Don't**

- Do not introduce a light theme, a second accent, or accent-coloured body text
- Do not add radii, shadows, gradients or glow
- Do not reintroduce the warm-paper canvas, sage accent, serif display stack, or the graph/systems-map signature motif — all superseded
- Do not put the ecosystem map in the first viewport or the primary nav
- Do not show a number without its scope
- Do not expand Tailwind `@theme` into a utility surface without an explicit plan
