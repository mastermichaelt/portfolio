---
name: Design system hardening
overview: "Promote surviving CSS tokens into a documented production design system: design-system.md, split globals.css into token/base/component layers, and replace repeated page-level inline spacing with semantic classes. No Storybook, Stylelint, or token build pipeline."
todos:
  - id: plan-review
    content: "Plan-only PR — commit plan artifact and open PR for review; do not implement"
    status: completed
  - id: design-system-hardening
    content: "PR: docs/design-system.md, split app/globals.css into app/styles layers, replace repeated inline spacing with semantic classes"
    status: pending
  - id: plan-closure
    content: "Docs-only PR after last slice: add # Shipped note, move plan to .cursor/plans/archive/YYYY-MM-DD-design-system-hardening.plan.md"
    status: pending
isProject: false
---

# Design-system hardening

## Recommended execution authority

| Slice                   | Recommended authority | Agent instruction                                      |
| ----------------------- | --------------------- | ------------------------------------------------------ |
| plan-review             | Plan-only PR          | Do not implement. Stop after opening the plan-only PR. |
| design-system-hardening | Open PR only          | Do not merge. Stop after opening the PR.               |
| plan-closure            | Open PR only          | Do not merge. Stop after opening the PR.               |

Repo default: **Open PR only** ([planning-standards.md](../standards/planning-standards.md#repo-default-when-no-plan-slice-applies)).

## Repository topology (default)

This invariant prevents accidental stacked PRs. Multi-slice plans stack execution order, not Git branches.

The repository integration branch is `main`. Implementation slices start from and target `main` by default.

**Before implementation:** start this slice from the latest integration branch (`git fetch` then a fresh branch from `origin/main`).

**Before opening the PR:** verify the branch represents only this slice — previous-slice work is present through the integration branch, not through branch ancestry.

**After opening the PR:** verify the GitHub PR base branch is `main` and the diff does not include previous-slice work except through merged `main`.

---

## Context

After [portfolio#11](https://github.com/mastermichaelt/portfolio/pull/11) deleted the HTML prototype, [`app/globals.css`](../../app/globals.css) is the sole live design source of truth, but it still points at a deleted file:

```css
/* Brand tokens from prototypes/ai-engineering-portfolio/brand-spec.md */
```

Token values survived; the standalone brand rationale did not. Layout composition still uses ~30 page-level `style={{}}` spacings (plus Satori styles in [`app/opengraph-image.tsx`](../../app/opengraph-image.tsx), which stay as-is).

**Out of scope for this plan:** Storybook, Stylelint, token build systems, broad Tailwind `@theme` expansion, visual redesign, OG image refactor.

---

## Plan review (pre-slice)

**Recommended authority:** Plan-only PR

**Rationale:**

- Plan must be reviewed before implementation begins
- Expected diff is plan artifact only

**Agent instruction:** Do not implement. Stop after opening the plan-only PR.

---

## Slice — design-system-hardening

**Recommended authority:** Open PR only

**Rationale:**

- Cross-cutting but small enough for one merge-safe PR (docs + CSS organization + repeated inline cleanup)
- No behavior redesign; mediation through tokens/classes
- Human review of CSS split and spacing class choices before merge

**Agent instruction:** Do not merge. Stop after opening the PR.

**Goal:** Formalize production design tokens as a documented system and make layout composition less ad hoc.

### 1. Document the production design system

Add [`docs/design-system.md`](../../docs/design-system.md) as the durable brand/token guide. Seed it from the deleted prototype brand-spec (recoverable via `git show d828d1d^:prototypes/ai-engineering-portfolio/brand-spec.md`) plus current production tokens in `globals.css`.

Document:

- Visual principles (warm neutrals, single sage accent, soft depth, progressive disclosure)
- Semantic meaning of each color/spacing/type/radius token
- Typography roles (display / body / mono + `.h1`–`.meta` / `.eyebrow`)
- Spacing conventions (`--gap-*`, section rhythm, measure widths)
- Component posture (when `.card` / buttons / pills are appropriate)
- Accent vs muted usage (accent ≤2 primary signals per screen; muted for secondary copy)
- Accessibility expectations (contrast, focus rings, text-wrap)
- Explicit source-of-truth note: tokens live in CSS; this doc explains them
- Explicit Tailwind note: semantic CSS classes are primary; `@theme` only bridges background/foreground/fonts today — do not expand utilities in this PR

Update pointers in [`README.md`](../../README.md) and [`AGENTS.md`](../../AGENTS.md) from “brand lives in `app/globals.css`” to also link `docs/design-system.md`. Optionally add a one-line pointer from [`docs/architecture/overview.md`](../../docs/architecture/overview.md) (that file is still skeleton-era and can stay light).

### 2. Split CSS into layers

Keep [`app/layout.tsx`](../../app/layout.tsx) importing `./globals.css` as the single entry. Turn `globals.css` into a thin barrel:

```css
@import "tailwindcss";
@import "./styles/tokens.css";
@import "./styles/base.css";
@import "./styles/components.css";
```

New files under [`app/styles/`](../../app/styles/) (colocated with the Next entry):

- `tokens.css` — `:root` variables + `@theme inline` (token store + Tailwind bridge only)
- `base.css` — reset, `html`/`body`, element defaults
- `components.css` — layout utilities, chrome, buttons, surfaces, page patterns, motion, responsive block

Remove the stale prototype comment; replace with a short pointer to `docs/design-system.md`.

No behavioral/visual changes intended in the split — pure extraction.

### 3. Replace repeated inline spacing with semantic classes

Target repeated page patterns only (not one-offs that would force awkward API, not OG Satori styles).

Add a small set of measure/spacing utilities in `components.css` (using existing `--gap-*` tokens where values map cleanly):

- `.measure` — ~62ch / content-narrow reading width (and/or `.measure-md` for 720px list heroes)
- `.measure-sm` — ~40ch / ~34ch short positioning blocks if one class covers both use cases; otherwise keep the closer tokenized pair
- Hero CTA top spacing via existing `.hero-cta` rule instead of `marginTop: 28`
- Compact hero bottom padding via a modifier (e.g. `.hero.hero-compact`) replacing repeated `paddingBottom: 32|40`
- Stack gap variants (e.g. `.stack-lg`) replacing `style={{ gap: 40 }}` where used

Then scrub matching `style={{}}` from:

- [`app/page.tsx`](../../app/page.tsx)
- [`app/about/page.tsx`](../../app/about/page.tsx)
- [`app/articles/page.tsx`](../../app/articles/page.tsx)
- [`app/projects/page.tsx`](../../app/projects/page.tsx)
- [`app/projects/[slug]/page.tsx`](../../app/projects/[slug]/page.tsx)
- [`app/ecosystem/page.tsx`](../../app/ecosystem/page.tsx)
- light touch on [`components/SiteFooter.tsx`](../../components/SiteFooter.tsx) / [`components/CaseStudyToc.tsx`](../../components/CaseStudyToc.tsx) if the same patterns apply

Leave non-spacing layout hints that have no token (e.g. `alignItems: "end"`, `flexWrap`) either as small utility classes (`.row-end`) or inline if a class would be a one-off with no reuse — prefer class only when reused ≥2 times.

**Desktop intentionally unchanged** in look; this is mediation through tokens/classes, not a redesign.

### Acceptance

- `docs/design-system.md` exists and is linked from README/AGENTS
- `app/globals.css` is a barrel importing `app/styles/{tokens,base,components}.css`
- Stale `prototypes/.../brand-spec.md` comment removed from production CSS
- Repeated page-level spacing `style={{}}` patterns replaced with semantic classes (OG image excluded)
- No intentional visual redesign

### Verify

- `npm run lint` / `typecheck` / `test` (and `format:check` / `build` as CI requires)
- Manual: home, projects list, project detail, about at desktop and ~375px — no spacing regressions
- No remaining references to `prototypes/ai-engineering-portfolio/brand-spec.md` in production code/docs (archived plan history may still mention it; leave archive alone)

### Explicitly skip

- Expanding `@theme` to full `bg-surface` / `text-muted` utilities
- Stylelint / custom drift tests
- Storybook or component gallery

---

## Plan closure (docs-only PR)

**Recommended authority:** Open PR only

**Rationale:**

- Docs-only archival; human review of closure checklist

**Agent instruction:** Do not merge. Stop after opening the PR.

After the last implementation slice merges, open a final docs-only closure PR:

1. Verify all implementation todos are already `completed` (or `cancelled` if deferred); fix stragglers only
2. Add a `# Shipped` closure note at the top of the plan body
3. Move this file to `.cursor/plans/archive/YYYY-MM-DD-design-system-hardening.plan.md`
4. Mark `plan-closure` `completed` and update agent prompt references to the archived path

Do not archive inside implementation PRs. Implementation PRs mark their own slice `completed` in frontmatter in the same PR as the code.

---

## Agent prompts (copy/paste for Cursor)

Use a **fresh Agent-mode chat** per slice.

- **Plan review — plan-review**
  - "Execute plan-review from `@.cursor/plans/2026-08-04-design-system-hardening.plan.md` only. Redraft or commit the plan artifact per repo planning standards. **Agent instruction:** Do not implement. Stop after opening the plan-only PR. Mark `plan-review` completed in plan frontmatter. Do not start implementation slices."
- **Slice — design-system-hardening**
  - "Implement design-system-hardening from `@.cursor/plans/2026-08-04-design-system-hardening.plan.md` only. Prerequisite: plan-review merged (or plan accepted on `main`). Start this slice from the latest `origin/main`, implement only this slice, verify the branch represents only this slice before opening the PR, open the PR targeting `main`, and verify the GitHub PR base branch is `main` after creation. Add `docs/design-system.md`, split `app/globals.css` into `app/styles/` layers, replace repeated inline spacing with semantic classes; do not expand Tailwind `@theme`, add Storybook, or Stylelint. **Agent instruction:** Do not merge. Stop after opening the PR. Mark `design-system-hardening` completed in plan frontmatter. Do not start plan closure. Do not archive the plan."
- **Plan closure — plan-closure**
  - "Execute plan-closure from `@.cursor/plans/2026-08-04-design-system-hardening.plan.md` only. Prerequisites: all implementation slices merged and already marked completed in frontmatter. Start this slice from the latest `origin/main`, verify the branch represents only this slice before opening the PR, open the PR targeting `main`, and verify the GitHub PR base branch is `main` after creation. Docs-only PR: verify slice todos, add `# Shipped` note, move plan to `.cursor/plans/archive/YYYY-MM-DD-design-system-hardening.plan.md`, mark `plan-closure` completed, update references. **Agent instruction:** Do not merge. Stop after opening the PR."
