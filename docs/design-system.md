# Design system

Production visual system for this portfolio. Change **values** in the token layer; change **how they are applied** in CSS/components; use this doc for **why** and **when**.

## Source-of-truth layers

| Layer                   | Normative home                                      | Role                                                                                    |
| ----------------------- | --------------------------------------------------- | --------------------------------------------------------------------------------------- |
| Token values            | [`app/styles/tokens.css`](../app/styles/tokens.css) | Hex/OKLch, spacing scale, type scale, radii — edit literal values here                  |
| Implementation patterns | `app/styles/*` + React components                   | How tokens are applied (classes, chrome, page patterns)                                 |
| Guidance / rationale    | This file                                           | Principles, semantic meaning, accent vs muted, accessibility — not a second value table |

`app/globals.css` is the single stylesheet entry imported from `app/layout.tsx`. It is a thin barrel over the layers under `app/styles/`.

Do **not** copy every token hex into this document — tables that duplicate CSS drift. Prefer token **names** and roles; open `tokens.css` for current values.

## Visual principles

Seeded from the pre-production brand posture that landed in production tokens:

1. **Warm neutrals** — page background (`--bg`) and surface (`--surface`) stay paper-warm; ink (`--fg`) stays soft-black, not pure black.
2. **Single sage accent** — `--accent` for primary signals only (eyebrow, primary CTA). Aim for ≤2 primary accent uses per screen.
3. **Soft depth** — hairline `--border`; `--shadow` / `--shadow-sm` only on interactive surfaces (cards, secondary buttons). Avoid stacked decorative shadows.
4. **Progressive disclosure** — case studies and evidence packs favor scannable sections over dense dumps.
5. **Predominantly 4px/8px rhythm** — spacing tokens are 4px/8px-derived (`--gap-xs` … `--gap-2xl`), not a strict multiples-of-8 scale (`--gap-sm` is 12px, `--gap-md` is 20px); radii stay modest (`--radius`, `--radius-lg`).

## Color token roles

| Token           | Role                                                           |
| --------------- | -------------------------------------------------------------- |
| `--bg`          | Page canvas                                                    |
| `--surface`     | Raised panels (cards, mobile nav sheet, secondary button fill) |
| `--fg`          | Primary text and interactive ink                               |
| `--muted`       | Secondary copy, meta, nav idle state                           |
| `--border`      | Hairline rules and control outlines                            |
| `--accent`      | Primary brand signal (eyebrow, primary CTA, active indicators) |
| `--accent-soft` | Soft accent wash (pills, diagram fills)                        |
| `--fg-soft`     | Soft ink wash (hover washes, diagram fills)                    |
| `--shadow*`     | Elevation on interactive surfaces only                         |

Derived hover sage uses `color-mix` with `--accent` in component CSS — keep that pattern rather than inventing a second accent token unless contrast needs force it.

### Accent vs muted

- **Accent:** primary CTA fill, eyebrow, current-nav underline, TOC active border, contact links.
- **Muted:** leads, meta, idle nav, card body copy, tags.
- Do not tint large text blocks with accent. Do not use accent for decorative chrome that is not a primary signal.

## Typography roles

**Stacks** (from `tokens.css`, faces loaded in `app/layout.tsx`):

- `--font-display-stack` — display / headings / brand mark
- `--font-body-stack` — body UI
- `--font-mono-stack` — eyebrow, meta, pills

**Classes / elements:**

| Class / element | Role                                          |
| --------------- | --------------------------------------------- |
| `.brand-mark`   | Hero identity (name as brand)                 |
| `.h1` / `h1`    | Page title scale (`--fs-h1`)                  |
| `.h2` / `h2`    | Section title scale (`--fs-h2`)               |
| `.h3` / `h3`    | Card / list title scale (`--fs-h3`)           |
| `.lead`         | Supporting sentence under a title (`--muted`) |
| `.positioning`  | Short display positioning line                |
| `.eyebrow`      | Mono uppercase accent label                   |
| `.meta`         | Mono secondary metadata                       |

Size tokens: `--fs-h1` … `--fs-meta`. Prefer these over one-off `font-size` unless a surface is intentionally unique (e.g. a slightly smaller about-page brand mark).

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
| `.hero-cta`                  | Hero CTA row; includes shared top margin (28px exception vs scale)   |
| `.hero-compact`              | Index/about heroes with tighter bottom padding (`--gap-lg`)          |
| `.hero-case`                 | Case-study heroes with slightly deeper bottom padding (40px)         |

Honest one-off spacing (distinct roles, single use) may stay as `style={{}}` or a narrowly named class — do not invent a utility vocabulary that flattens different layout needs.

## Component posture

| Pattern                                          | When appropriate                                                      |
| ------------------------------------------------ | --------------------------------------------------------------------- |
| `.card` / `.card-interactive`                    | Interactive containers (project tiles, TOC, contact panel)            |
| `.btn-primary` / `.btn-secondary` / `.btn-ghost` | CTAs; primary = accent fill; secondary = surface + border             |
| `.pill`                                          | Kind / status chip with accent wash                                   |
| `.tag`                                           | Neutral topic chip                                                    |
| `.text-link`                                     | Links embedded in prose; underlined by default, accent on hover/focus |
| Hero / log-row / work-card                       | Page composition patterns already owned by CSS                        |

Default: **no cards in the hero**. Cards exist for interaction or dense grouped content (contact, TOC), not for decorative boxing.

## Accessibility expectations

- Preserve contrast between `--fg` / `--muted` and `--bg` / `--surface`; recheck after any token edit.
- Focus rings and keyboard reachability for nav toggle, links, and buttons must remain usable (do not remove outline without an equivalent).
- Prefer `text-wrap: pretty` / `balance` (already on body copy and headings) over manual line breaks.
- Interactive cards and rows should remain full-hit targets (link wraps the card / log row).

## Tailwind

Semantic CSS classes under `app/styles/` are the primary styling API.

`@theme inline` in `tokens.css` only bridges `--color-background`, `--color-foreground`, and font stacks for Tailwind. **Do not expand** `@theme` into a full `bg-surface` / `text-muted` utility surface without an explicit follow-up plan.

## Related files

- Entry barrel: [`app/globals.css`](../app/globals.css)
- Tokens: [`app/styles/tokens.css`](../app/styles/tokens.css)
- Base / reset: [`app/styles/base.css`](../app/styles/base.css)
- Layout + type roles: [`app/styles/layout.css`](../app/styles/layout.css)
- Chrome, surfaces, page patterns: [`app/styles/components.css`](../app/styles/components.css)
- Architecture context: [`docs/architecture/overview.md`](architecture/overview.md)
