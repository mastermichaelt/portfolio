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

1. **Two themes, one system** — dark is the baseline (near-black ground `--bg`, one-step `--surface` / `--surface-2`); light is the same token system resolved to a warm-paper palette. Both are declared in [`theme.css`](../app/styles/theme.css); `:root` holds the dark values so an unthemed document is dark. Components never carry a light-mode rule — only the role tokens diverge. See § Theme system.
2. **Single amber signal in three roles** — `--accent` (ink), `--accent-fill` (fill), `--accent-soft` (soft), chosen by what the accent does, not which component uses it. Aim for no more than four amber elements in a viewport, in either theme.
3. **No elevation** — hairline `--border` only. `--shadow` / `--shadow-sm` are `none`. No glow, gradient, or blur.
4. **Square** — `--radius` and `--radius-lg` are `0`. Existing card/pill/tag classes keep their names and become square.
5. **Hairline rhythm** — full-width 1px rules and 1px gaps over `--border` carry structure, not cards or shadows.
6. **Evidence qualification** — a figure and its scope are one block; never show a number without its qualifier.
7. **Restrained instrument vocabulary** — channel ids, section-head technical labels, mono dates. Do not extend into gauges, terminals, or scanlines.
8. **Predominantly 4px/8px-derived spacing** — `--gap-xs` … `--gap-2xl` are the shared scale; `--gutter` tightens at 920px and 600px.

The retired **sage** accent, serif display stack, and systems-map signature motif (ambient brand light, live spine animation, section connector nodes) stay retired. The approved light theme is a warm-paper _ground_ within this same square, hairline, no-elevation system — not a return to that direction.

## Color token roles

| Token             | Role                                                                                                                                                                                                              |
| ----------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `--bg`            | Page canvas                                                                                                                                                                                                       |
| `--surface`       | Panels (cards, canvases, secondary button fill)                                                                                                                                                                   |
| `--surface-2`     | Hover wash and inline-code fill, one step above `--surface`                                                                                                                                                       |
| `--fg`            | Primary text and interactive ink                                                                                                                                                                                  |
| `--fg-2`          | Body copy inside panels, leads, supporting sentences                                                                                                                                                              |
| `--muted`         | Meta, labels, idle nav — **contrast floor** (5.26:1 on `--bg`)                                                                                                                                                    |
| `--muted-strong`  | Scope / qualifier lines (above the floor)                                                                                                                                                                         |
| `--border`        | Hairline rules and 1px panel gaps                                                                                                                                                                                 |
| `--border-strong` | Stronger rules (scope bar, control outlines)                                                                                                                                                                      |
| `--rule`          | Section-head rule (aliases `--fg`)                                                                                                                                                                                |
| `--accent`        | **Ink role** — accent text and every mark thinner than a surface (eyebrow, current-nav underline, figures, address, rail/TOC bars, selected/expanded diagram borders, focus). Ochre in light, brand amber in dark |
| `--accent-fill`   | **Fill role** — strong filled/selected surfaces (`.btn-primary`, selected line chip), with `--accent-ink` on top. Brand amber in both themes                                                                      |
| `--accent-ink`    | Ink on the fill role (buttons, selected chip) — not `--surface`                                                                                                                                                   |
| `--accent-soft`   | **Soft role** — subtle wash derived from `--accent-fill` (pills); its text stays `--accent`                                                                                                                       |
| `--fg-soft`       | Soft ink wash (hover fills)                                                                                                                                                                                       |
| `--shadow*`       | Always `none` — kept so existing `box-shadow` declarations are inert                                                                                                                                              |

Do not darken `--muted`; it is the floor, not a starting point. Anything that _fills_ with amber uses `--accent-fill`, not `--accent` — a surface filled with the light-mode ink accent renders dark brown. Derived hover amber uses `color-mix` with `--accent-fill` in component CSS — keep that pattern rather than inventing a new accent token.

### Accent vs muted

- **Accent ink (`--accent`):** eyebrow, current-nav underline, TOC active border, contact links, outbound arrows, figures, address, and every thin mark. Ochre in light.
- **Accent fill (`--accent-fill`):** primary CTA fill and the selected Ecosystem chip, with `--accent-ink` on top. Brand amber in both themes.
- **Muted:** meta, idle nav, labels, dates.
- **`--fg-2`:** leads and panel body copy — not `--muted`, so reading text stays above the floor with room to spare.
- Do not tint large text blocks with accent. Do not use accent for decorative chrome that is not a primary signal.
- Primary fill text uses `--accent-ink` so amber buttons stay readable on dark ground.

## Theme system

Dark and light are the same semantic tokens resolved twice, in [`app/styles/theme.css`](../app/styles/theme.css) (imported immediately after `tokens.css`). `[data-theme="dark"]` and `[data-theme="light"]` each redeclare the full token set; `:root` keeps the dark values so an unthemed document renders as dark. Light is a **reflected** ladder — `--surface` still steps _away_ from `--bg` (toward paper-white), so panels lift and hover deepens in the same direction. Each light ink value is tuned to its dark counterpart's contrast ratio, so emphasis is preserved. `color-scheme` is set per theme so native controls, scrollbars and form widgets match.

**State model** (`lib/theme.ts`): the theme lives as `data-theme` on `<html>`. `localStorage["theme"]` holds an explicit `"light"` / `"dark"` choice; **absence means follow the system** (`prefers-color-scheme`) — System is the implicit default and is never stored, so the UI needs no third state. `resolveTheme()` lets an explicit choice win, else follows the system; the provider follows live OS-theme changes only while no choice is stored.

**No-flash bootstrap** (`components/ThemeScript.tsx`): a tiny inline `<head>` script resolves and sets `data-theme` before first paint, so the correct theme paints on the first frame even when a stored choice conflicts with the system. There is **no CSP** on this app today, so the inline script needs no nonce; if a CSP is ever added, this is the one script to allow (nonce or hash). `<html suppressHydrationWarning>` absorbs the attribute the script adds.

**Switching is instant** — no crossfade. Several components carry 0.15s hover transitions on colour/border properties that resolve to theme tokens, so the provider sets `data-theme-switching` on `<html>` for one frame around the swap (a global `transition: none` guard in `theme.css`), then removes it — the swap paints at once while hover transitions resume immediately after. The switch display (glyph + destination label) is CSS-driven from `html[data-theme]` rather than React state, so it is correct on the first frame with no hydration reconciliation and works without JS.

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

| Pattern                                          | When appropriate                                                                                                                             |
| ------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------- |
| `.card` / `.card-interactive`                    | Interactive containers (project tiles, TOC, contact panel) — square, unshadowed; hover uses `--surface-2`                                    |
| `.btn-primary` / `.btn-secondary` / `.btn-ghost` | CTAs; primary = accent fill + `--accent-ink`; secondary = surface + border                                                                   |
| `.pill`                                          | Kind / status chip with accent wash, square                                                                                                  |
| `.tag`                                           | Neutral topic chip, square                                                                                                                   |
| `.text-link`                                     | Links embedded in prose; underlined by default, accent on hover/focus                                                                        |
| `.topnav`                                        | Opaque `--bg`, hairline, no blur                                                                                                             |
| Hero / log-row / work-card                       | Inner-page composition patterns already owned by CSS                                                                                         |
| `.section-head` / `.anchor-pair` / `.case-grid`  | Homepage 1b composition — hairline section rules, equal-weight anchors, two-column case panels                                               |
| `.spine` / `.figures` / `.ledger` / `.list-row`  | Homepage method spine, figure/scope pair, career ledger, supporting/writing lists                                                            |
| `.about-rail` / `.about-*`                       | About "Standing Record": a sticky identity + contact rail beside a numbered chronological practice record — type and hairlines only, no card |

Default: **no cards in the hero**. Cards exist for interaction or dense grouped content (contact, TOC), not for decorative boxing.

The About rail keeps identity and contact co-present for the whole scroll (it satisfies the contact IA in place, so About needs no separate Contact route). Each era in the §02 arc ends on a carry-forward clause — `.about-carry`, mono `--muted-strong` with a 2px `--border-strong` left rule. It borrows the `.figure-scope` treatment but is **not** a figure and carries no number; keep it a separate class so the figure/scope invariant is not weakened by association.

Focus rings are amber, 2px, 3px offset. Interactive rows and buttons keep a 44px minimum hit target.

[`components/SystemsDiagram.tsx`](../components/SystemsDiagram.tsx) is demoted from the homepage hero. Keep the component for `/ecosystem` (do not delete). Live orientation on that route is the React Flow canvases. It uses the same hairline/square tokens — it is not a signature identity layer.

## Evidence qualification

A figure and its qualification are one component: `.figure-value`, `.figure-name`, `.figure-scope`. The scope line never drops below 11px or below 4.5:1, never truncates, never collapses behind a tooltip, and never sits in a horizontal scroller. A figure whose scope will not fit is not shown.

Ranges stay ranges. Qualifiers stay in the source's own words. No metric strip, no counters, no charts.

## Restrained instrument vocabulary

Identity is a small borrowed set: channel identifiers (`CH 01` / `CH 02`), technical identifiers on section heads, mono dates and labels. Do not extend it with gauges, dials, sparklines, charts, tick rulers, status LEDs, terminal frames, scanlines, or console chrome.

## Accessibility expectations

- Preserve contrast between `--fg` / `--fg-2` / `--muted` and `--bg` / `--surface` **in both themes**; `--muted` is the floor (5.26:1 dark, 5.2:1 light) — recheck after any token edit.
- Focus rings and keyboard reachability for nav toggle, links, buttons, and the theme switch must remain usable (do not remove outline without an equivalent). The theme switch is a native `<button>`; its destination label is its accessible name, its glyph is `aria-hidden`, and the change is announced via a polite `role="status"` region.
- Keep `color-scheme` aligned with the active theme so native UI (form controls, scrollbars, caret) matches.
- Prefer `text-wrap: pretty` / `balance` (already on body copy and headings) over manual line breaks.
- Interactive cards and rows should remain full-hit targets (link wraps the card / log row).
- `prefers-reduced-motion: reduce` is a global duration floor in `base.css`.

## Tailwind

Semantic CSS classes under `app/styles/` are the primary styling API.

`@theme inline` in `tokens.css` only bridges `--color-background`, `--color-foreground`, and font stacks for Tailwind. **Do not expand** `@theme` into a full `bg-surface` / `text-muted` utility surface without an explicit follow-up plan.

## Related files

- Entry barrel: [`app/globals.css`](../app/globals.css)
- Tokens: [`app/styles/tokens.css`](../app/styles/tokens.css)
- Themes (dark + light palettes, accent roles): [`app/styles/theme.css`](../app/styles/theme.css)
- Theme switch (Treatment 04): [`app/styles/theme-control.css`](../app/styles/theme-control.css), [`components/ThemeSwitch.tsx`](../components/ThemeSwitch.tsx), [`components/ThemeProvider.tsx`](../components/ThemeProvider.tsx), [`components/ThemeScript.tsx`](../components/ThemeScript.tsx), [`lib/theme.ts`](../lib/theme.ts)
- Base / reset: [`app/styles/base.css`](../app/styles/base.css)
- Layout + type roles: [`app/styles/layout.css`](../app/styles/layout.css)
- Chrome, surfaces, page patterns: [`app/styles/components.css`](../app/styles/components.css)
- Ecosystem canvases + systems diagram: [`app/styles/ecosystem.css`](../app/styles/ecosystem.css)
- Architecture context: [`docs/architecture/overview.md`](architecture/overview.md)
