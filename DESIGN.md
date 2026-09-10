---
name: Portfolio
description: Warm, systems-oriented personal engineering portfolio — paper canvas, sage accent, quiet graph motif
---

## Overview

Visual contract for this portfolio. **Normative token values** live in [`app/styles/tokens.css`](app/styles/tokens.css). **Guidance, rationale, and component posture** live in [`docs/design-system.md`](docs/design-system.md). This file states semantic roles and portfolio-specific constraints for Impeccable — it does not duplicate literal hex or OKLch values.

Mode: **Experience** — the artifact (projects, ecosystem map, case studies) leads; chrome recedes.

## Colors

Use semantic CSS variables (`--bg`, `--surface`, `--fg`, `--muted`, `--border`, `--accent`, and related roles) by purpose, not raw colors. Single sage accent for primary signals only. Warm neutrals for canvas and ink.

See [Color token roles](docs/design-system.md#color-token-roles) and [Accent vs muted](docs/design-system.md#accent-vs-muted).

## Typography

Three stacks: display (headings, brand mark), body (UI), mono (eyebrow, meta, pills). Use existing type roles (`.h1`, `.lead`, `.eyebrow`, and related classes) and size tokens — do not invent one-off scales.

See [Typography roles](docs/design-system.md#typography-roles).

## Layout

4px/8px-derived spacing rhythm via `--gap-*` tokens. Container, measure, and section classes define width and vertical rhythm — prefer them over ad-hoc margins.

See [Spacing and measure](docs/design-system.md#spacing-and-measure).

## Elevation & Depth

Soft depth only: hairline borders and shadows on interactive surfaces. No stacked decorative shadows or glow effects.

## Shapes

Modest radii via `--radius` and `--radius-lg`. Pills and tags use existing component patterns.

## Components

Semantic CSS classes under `app/styles/` are the primary styling API. Default: no decorative cards in the hero; cards for interaction or grouped content. Buttons follow `.btn-primary`, `.btn-secondary`, and `.btn-ghost` posture.

See [Component posture](docs/design-system.md#component-posture).

## Signature — systems map

The quiet graph motif (ambient brand light, hero systems map, live spine signal, section connector nodes) lives in `app/styles/signature.css`. Mirror ecosystem content — do not invent nodes. Keep character as a whisper behind content.

See [Signature — systems map](docs/design-system.md#signature--systems-map).

## Do's and Don'ts

**Do**

- Reference token names and roles; open `tokens.css` for current values
- Preserve focus rings and full hit targets on interactive elements
- Honor `prefers-reduced-motion: reduce` for signature animations
- Keep accent use sparing (aim for ≤2 primary accent uses per screen)

**Don't (portfolio-specific)**

- Do not expand Tailwind `@theme` into a full utility surface without an explicit plan
- Do not add cards or boxed chrome to the hero for decoration
- Do not use accent for large text blocks or decorative non-signal chrome
- Do not introduce graph-paper textures or repeating patterns behind body copy
- Do not split accent into a second competing brand color without contrast justification
- Do not duplicate token hex or OKLch values in this file — that creates drift from `tokens.css`
