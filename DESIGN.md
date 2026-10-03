---
name: Portfolio
description: Verification Discipline — near-black ground, warm off-white ink, a single amber signal, hairline panels and strong horizontal rhythm
---

## Overview

Visual contract for this portfolio. **Normative token values** live in [`app/styles/tokens.css`](app/styles/tokens.css). **Guidance, rationale, and component posture** live in [`docs/design-system.md`](docs/design-system.md). This file states semantic roles and portfolio-specific constraints — it does not duplicate literal hex values.

Mode: **Document** — the page reads as a technical record. Evidence leads; chrome is hairlines and type.

The system exists to serve one thesis: this engineer makes uncertain systems dependable. Every rule below is downstream of that. Where a visual choice and the legibility of evidence conflict, evidence wins.

## Colors

Two themes, one system. Dark is the baseline and the visual-regression reference; light is the same semantic token system resolved to a warm-paper palette — not a separate design and not a fork. Use semantic variables (`--bg`, `--surface`, `--fg`, `--fg-2`, `--muted`, `--border`, `--border-strong`, and the accent roles below) by role, never raw values. Both themes are declared in [`app/styles/theme.css`](app/styles/theme.css); `:root` keeps the dark values so an unthemed document renders as dark. See [`docs/design-system.md`](docs/design-system.md) § Theme system for the state model, the no-flash bootstrap, and the control.

One signal colour: amber, in three semantic roles chosen by **what the accent is doing**, not by which component uses it. No component carries a light-mode rule; only the role tokens diverge.

- **`--accent` (ink)** — all accent text and every mark thinner than a surface: section marks, current-nav underline, evidence figures, the email address, outbound arrows, rail/TOC bars, selected/expanded diagram borders, focus rings. Ochre in light so thin marks clear 3:1 on paper; brand amber in dark.
- **`--accent-fill` (fill)** — strong filled or selected surfaces with `--accent-ink` on top: the primary CTA, the selected Ecosystem chip. Brand amber in **both** themes.
- **`--accent-soft` (soft)** — subtle tinted surfaces derived from the fill role (the `.pill` wash); its text stays `--accent`.

Anything that fills with amber must use `--accent-fill`, never `--accent` — a selected surface filled with the light-mode ink accent renders dark brown. Aim for no more than four amber elements in a viewport, in either theme.

`--muted` is the contrast floor (5.26:1 dark, 5.2:1 light) on `--bg`, not a starting point. Any text darker than it fails. Each light ink value is tuned to its dark counterpart's contrast ratio, so emphasis is preserved across themes.

## Typography

Two stacks: sans (IBM Plex Sans — headings, body, UI) and mono (IBM Plex Mono — eyebrows, technical identifiers, dates, evidence figures, scope lines). The serif display stack is retired. `--font-display-stack` aliases the sans stack.

Display headings set tight (`--tracking-tight`); labels set wide and uppercase (`--tracking-label`). Figures always use tabular numerals. Use the `--fs-*` scale; do not invent one-off sizes.

The statement scale carries two named tokens for the About register: `--fs-page-statement` (`clamp(34px, 5.4vw, 52px)` — the About document statement) and `--fs-statement` (`clamp(26px, 4.6vw, 34px)` — the About §03 band statement). They were added rather than inlined because these sizes sit off the `--fs-*` heading scale; reuse them, do not introduce further one-off statement sizes.

The Articles reasoning-line claim has its own named token, `--fs-claim` (`clamp(22px, 2.4vw, 28px)`), for the same reason. It is deliberately a step below the statement scale: a claim opens a line _inside_ a band, not a page or §-band, so it caps at 28px rather than 34/52. Use it for the `/articles` claim only; do not substitute a statement token or inline the size.

## Layout

Content column `--container` with `--gutter` inset. Vertical rhythm comes from full-width 1px rules at section heads, not from cards. Panels are separated by 1px gaps over `--border` — the gap _is_ the border; do not add per-panel borders on top of it.

Generous negative space is part of the identity. `--gap-2xl` above each major section; do not compress it to fit more content on screen.

## Elevation & Depth

None. No shadows, no glow, no gradient, no blur. Depth is expressed as `--surface` sitting one step off `--bg`, separated by a hairline.

## Shapes

Square. `--radius` and `--radius-lg` are `0`. Existing `.card` / `.pill` / `.tag` class names stay; they are square, not rounded.

## Components

Semantic CSS classes under `app/styles/` remain the primary styling API. Case studies are panels in a hairline grid; supporting work and writing are hairline lists. Primary fill text uses `--accent-ink`. There is no boxed chrome in the hero, and no separate signature/identity stylesheet.

**Theme switch (Treatment 04, `app/styles/theme-control.css`):** a binary, icon-led control that names the destination — a thin-line sun + "Light mode" in dark, a moon + "Dark mode" in light. On desktop it sits directly right of the email address inside `.topnav-end` (the only structural header change; `.topnav-inner` stays at its no-switch height); on mobile it is one more row in the existing sheet. The glyph is the site's one drawn mark and follows the architecture figure's stroke discipline (no fill, no radius, `currentColor`) — do not add an icon library. It carries no border, pill, radius or tooltip; idle ink is `--muted`, hover `--fg`, focus is the standard amber ring. Its destination label is its accessible name; the glyph is `aria-hidden`.

**About register (`app/styles/about.css`):** a document with a persistent identity rail — a numbered résumé-shaped career record beside a sticky portrait/contact rail, type and hairlines only, with the mailto CTA the single filled element. The rail is why About needs no separate Contact route. `.about-employment-note` (concurrent-program distinction) reuses the `.figure-scope` treatment — mono, `--muted-strong`, a 2px `--border-strong` left rule — but is a separate class, **not** a figure: the figure/scope invariant below is not weakened by the visual borrow.

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

- Do not introduce a second accent hue, a third theme, or accent-coloured body text (the two approved themes share one amber signal in three roles)
- Do not fork stylesheets or write `[data-theme="light"] .component {…}` rules — themes diverge only in the role tokens
- Do not add radii, shadows, gradients or glow
- Do not reintroduce the retired sage accent, serif display stack, or the graph/systems-map signature motif — all superseded (the approved light theme is a warm-paper _ground_ in the same square, hairline, no-elevation system, not a return to that direction)
- Do not put the ecosystem map in the first viewport or the primary nav
- Do not show a number without its scope
- Do not expand Tailwind `@theme` into a utility surface without an explicit plan
