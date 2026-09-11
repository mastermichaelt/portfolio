# Design system

Production visual system for this portfolio. Change **values** in the token layer; change **how they are applied** in CSS/components; use this doc for **why** and **when**.

## Source-of-truth layers

| Layer                   | Normative home                                      | Role                                                                                    |
| ----------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Token values            | [`app/styles/tokens.css`](../app/styles/tokens.css) | Hex, spacing scale, type scale, radii — edit literal values here                        |
| Implementation patterns | `app/styles/*` + React components                   | How tokens are applied (classes, chrome, page patterns)                                 |
| Guidance / rationale    | This file                                           | Principles, semantic meaning, accent vs muted, accessibility — not a second value table |

`app/globals.css` is the single stylesheet entry imported from `app/layout.tsx`. It is a thin barrel over the layers under `app/styles/`.

Do **not** copy every token hex into this document — tables that duplicate CSS drift. Prefer token **names** and roles; open `tokens.css` for current values.

## Visual principles

1. **Dark only** — near-black ground (`--bg`), one-step `--surface` / `--surface-2`. There is no light theme.
2. **Single amber signal** — `--accent` for primary signals only. Aim for no more than four amber elements in a viewport.
3. **No elevation** — hairline `--border` only. `--shadow` / `--shadow-sm` are `none`. No glow, gradient, or blur.
4. **Square** — `--radius` and `--radius-lg` are `0`. Existing card/pill/tag classes keep their names and become square.
5. **Hairline rhythm** — full-width 1px rules and 1px gaps over `--border` carry structure, not cards or shadows.
6. **Evidence qualification** — a figure and its scope are one block; never show a number without its qualifier.
7. **Restrained instrument vocabulary** — channel ids, section-head technical labels, mono dates. Do not extend into gauges, terminals, or scanlines.
8. **Predominantly 4px/8px-derived spacing** — `--gap-xs` … `--gap-2xl` are the shared scale; `--gutter` tightens at 920px and 600px.

The sage-on-paper canvas, serif display stack, and systems-map signature motif (ambient brand light, live spine animation, section connector nodes) are retired.

## Color token roles

| Token             | Role                                                                 |
| ----------------- | -------------------------------------------------------------------- |
| `--bg`            | Page canvas                                                          |
| `--surface`       | Panels (cards, canvases, secondary button fill)                      |
| `--surface-2`     | Hover wash and inline-code fill, one step above `--surface`          |
| `--fg`            | Primary text and interactive ink                                     |
| `--fg-2`          | Body copy inside panels, leads, supporting sentences                 |
| `--muted`         | Meta, labels, idle nav — **contrast floor** (5.26:1 on `--bg`)       |
| `--muted-strong`  | Scope / qualifier lines (above the floor)                            |
| `--border`        | Hairline rules and 1px panel gaps                                    |
| `--border-strong` | Stronger rules (scope bar, control outlines)                         |
| `--rule`          | Section-head rule (aliases `--fg`)                                   |
| `--accent`        | Primary brand signal (eyebrow, current nav, figures, address)        |
| `--accent-ink`    | Ink on primary fill (buttons) — not `--surface`                      |
| `--accent-soft`   | Soft accent wash (pills)                                             |
| `--fg-soft`       | Soft ink wash (hover fills)                                          |
| `--shadow*`       | Always `none` — kept so existing `box-shadow` declarations are inert |

Do not darken `--muted`; it is the floor, not a starting point. Derived hover amber uses `color-mix` with `--accent` in component CSS — keep that pattern rather than inventing a second accent token.

### Accent vs muted

- **Accent:** eyebrow, current-nav underline, primary CTA fill, TOC active border, contact links, outbound arrows.
- **Muted:** meta, idle nav, labels, dates.
- **`--fg-2`:** leads and panel body copy — not `--muted`, so reading text stays above the floor with room to spare.
- Do not tint large text blocks with accent. Do not use accent for decorative chrome that is not a primary signal.
- Primary fill text uses `--accent-ink` so amber buttons stay readable on dark ground.

## Typography roles

**Stacks** (from `tokens.css`, faces loaded in `app/layout.tsx`):

- `--font-display-stack` — aliases the sans stack (headings, brand mark)
- `--font-body-stack` — IBM Plex Sans (body UI)
- `--font-mono-stack` — IBM Plex Mono (eyebrow, meta, pills, technical ids)

Newsreader and Source Sans are retired.

**Classes / elements:**

| Class / element | Role                                         |
| --------------- | -------------------------------------------- |
| `.brand-mark`   | Hero identity (name as brand)                |
| `.h1` / `h1`    | Page title scale (`--fs-h1`)                 |
| `.h2` / `h2`    | Section title scale (`--fs-h2`)              |
| `.h3` / `h3`    | Card / list title scale (`--fs-h3`)          |
| `.lead`         | Supporting sentence under a title (`--fg-2`) |
| `.positioning`  | Short display positioning line               |
| `.eyebrow`      | Mono uppercase accent label (`--fs-label`)   |
| `.meta`         | Mono secondary metadata                      |

Size tokens: `--fs-h1` … `--fs-meta`, plus `--fs-figure` and `--fs-label`. Prefer these over one-off `font-size` unless a surface is intentionally unique (e.g. a slightly smaller about-page brand mark).

Display headings use `--tracking-tight`. Labels use `--tracking-label` (wide, uppercase). Figures use tabular numerals.

## Spacing and measure

| Token / class                | Role                                                                 |
| ---------------------------- | -------------------------------------------------------------------- |
| `--gap-xs` … `--gap-2xl`     | Shared spacing scale                                                 |
| `--container` / `.container` | Default content width + gutter (`--gutter`)                          |
| `.container-narrow`          | Index / placeholder hero measure (~720px)                            |
| `.section`                   | Vertical section rhythm                                              |
| `.section-flush`             | Follow-on section with no top padding (continues a compact hero)     |
| `.measure`                   | Long body / summary measure (~62ch)                                  |
| `.measure-intro`             | Short section-intro column (~40ch) — not the same role as 34ch lines |
| `.lead-follow`               | Lead that sits under a title with shared top spacing                 |
| `.hero-cta`                  | Hero CTA row; includes shared top margin                             |
| `.hero-compact`              | Index/about heroes with tighter bottom padding (`--gap-lg`)          |
| `.hero-case`                 | Case-study heroes with slightly deeper bottom padding                |

Honest one-off spacing (distinct roles, single use) may stay as `style={{}}` or a narrowly named class — do not invent a utility vocabulary that flattens different layout needs.

## Component posture

| Pattern                                          | When appropriate                                                                                          |
| ------------------------------------------------ | --------------------------------------------------------------------------------------------------------- |
| `.card` / `.card-interactive`                    | Interactive containers (project tiles, TOC, contact panel) — square, unshadowed; hover uses `--surface-2` |
| `.btn-primary` / `.btn-secondary` / `.btn-ghost` | CTAs; primary = accent fill + `--accent-ink`; secondary = surface + border                                |
| `.pill`                                          | Kind / status chip with accent wash, square                                                               |
| `.tag`                                           | Neutral topic chip, square                                                                                |
| `.text-link`                                     | Links embedded in prose; underlined by default, accent on hover/focus                                     |
| `.topnav`                                        | Opaque `--bg`, hairline, no blur                                                                          |
| Hero / log-row / work-card                       | Inner-page composition patterns already owned by CSS                                                      |
| `.section-head` / `.anchor-pair` / `.case-grid`  | Homepage 1b composition — hairline section rules, equal-weight anchors, two-column case panels            |
| `.spine` / `.figures` / `.list-row`              | Homepage method spine, figure/scope pair (CSS present even when unused), supporting/writing lists         |

Default: **no cards in the hero**. Cards exist for interaction or dense grouped content (contact, TOC), not for decorative boxing.

Focus rings are amber, 2px, 3px offset. Interactive rows and buttons keep a 44px minimum hit target.

[`components/SystemsDiagram.tsx`](../components/SystemsDiagram.tsx) is demoted from the homepage hero. Keep the component for `/ecosystem` (do not delete). Live orientation on that route is the React Flow canvases. It uses the same hairline/square tokens — it is not a signature identity layer.

## Evidence qualification

A figure and its qualification are one component: `.figure-value`, `.figure-name`, `.figure-scope`. The scope line never drops below 11px or below 4.5:1, never truncates, never collapses behind a tooltip, and never sits in a horizontal scroller. A figure whose scope will not fit is not shown.

Ranges stay ranges. Qualifiers stay in the source's own words. No metric strip, no counters, no charts.

## Restrained instrument vocabulary

Identity is a small borrowed set: channel identifiers (`CH 01` / `CH 02`), technical identifiers on section heads, mono dates and labels. Do not extend it with gauges, dials, sparklines, charts, tick rulers, status LEDs, terminal frames, scanlines, or console chrome.

## Accessibility expectations

- Preserve contrast between `--fg` / `--fg-2` / `--muted` and `--bg` / `--surface`; `--muted` is the floor — recheck after any token edit.
- Focus rings and keyboard reachability for nav toggle, links, and buttons must remain usable (do not remove outline without an equivalent).
- Prefer `text-wrap: pretty` / `balance` (already on body copy and headings) over manual line breaks.
- Interactive cards and rows should remain full-hit targets (link wraps the card / log row).
- `prefers-reduced-motion: reduce` is a global duration floor in `base.css`.

## Tailwind

Semantic CSS classes under `app/styles/` are the primary styling API.

`@theme inline` in `tokens.css` only bridges `--color-background`, `--color-foreground`, and font stacks for Tailwind. **Do not expand** `@theme` into a full `bg-surface` / `text-muted` utility surface without an explicit follow-up plan.

## Related files

- Entry barrel: [`app/globals.css`](../app/globals.css)
- Tokens: [`app/styles/tokens.css`](../app/styles/tokens.css)
- Base / reset: [`app/styles/base.css`](../app/styles/base.css)
- Layout + type roles: [`app/styles/layout.css`](../app/styles/layout.css)
- Chrome, surfaces, page patterns: [`app/styles/components.css`](../app/styles/components.css)
- Ecosystem canvases + systems diagram: [`app/styles/ecosystem.css`](../app/styles/ecosystem.css)
- Architecture context: [`docs/architecture/overview.md`](architecture/overview.md)
