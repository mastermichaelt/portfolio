---
name: Design system hardening
overview: "Promote surviving CSS tokens into a documented production design system: design-system.md, split globals.css along clear layer boundaries, and reduce repeated page-level inline spacing via semantic classes where roles are truly shared. No Storybook, Stylelint, or token build pipeline."
todos:
  - id: plan-review
    content: "Plan-only PR — commit plan artifact and open PR for review; do not implement"
    status: completed
  - id: design-system-hardening
    content: "PR: docs/design-system.md, split app/globals.css by layer boundaries, reduce repeated inline spacing, substantiate visual neutrality with Playwright screenshot comparison"
    status: completed
  - id: plan-closure
    content: "Docs-only PR after last slice: add # Shipped note, move plan to .cursor/plans/archive/2026-08-05-design-system-hardening.plan.md"
    status: completed
isProject: false
---

# Shipped

**Archived 2026-08-05.**

| Slice                   | Delivered                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| plan-review             | [#13](https://github.com/mastermichaelt/portfolio/pull/13) — plan artifact only (Plan-only PR)                                       |
| design-system-hardening | [#15](https://github.com/mastermichaelt/portfolio/pull/15) — `docs/design-system.md`, CSS layer split, shared-role spacing mediation |
| plan-closure            | This PR — archive to `.cursor/plans/archive/2026-08-05-design-system-hardening.plan.md`                                              |

**Deferred (out of scope):** Storybook; Stylelint; token build pipeline; broad Tailwind `@theme` expansion; visual redesign; OG image refactor; permanent committed visual-regression baselines.

This plan is archived. The work described here has shipped; the remaining content is preserved for historical context.

# Design-system hardening

## Recommended execution authority

| Slice                   | Recommended authority | Agent instruction                                      |
| ----------------------- | --------------------- | ------------------------------------------------------ |
| plan-review             | Plan-only PR          | Do not implement. Stop after opening the plan-only PR. |
| design-system-hardening | Open PR only          | Do not merge. Stop after opening the PR.               |
| plan-closure            | Open PR only          | Do not merge. Stop after opening the PR.               |

Repo default: **Open PR only** ([planning-standards.md](../../standards/planning-standards.md#repo-default-when-no-plan-slice-applies)).

## Repository topology (default)

This invariant prevents accidental stacked PRs. Multi-slice plans stack execution order, not Git branches.

The repository integration branch is `main`. Implementation slices start from and target `main` by default.

**Before implementation:** start this slice from the latest integration branch (`git fetch` then a fresh branch from `origin/main`).

**Before opening the PR:** verify the branch represents only this slice — previous-slice work is present through the integration branch, not through branch ancestry.

**After opening the PR:** verify the GitHub PR base branch is `main` and the diff does not include previous-slice work except through merged `main`.

---

## Context

After [portfolio#11](https://github.com/mastermichaelt/portfolio/pull/11) deleted the HTML prototype, [`app/globals.css`](../../../app/globals.css) is the sole live design source of truth, but it still points at a deleted file:

```css
/* Brand tokens from prototypes/ai-engineering-portfolio/brand-spec.md */
```

Token values survived; the standalone brand rationale did not. Layout composition still uses ~30 page-level `style={{}}` spacings (plus Satori styles in [`app/opengraph-image.tsx`](../../../app/opengraph-image.tsx), which stay as-is).

**Out of scope for this plan:** Storybook, Stylelint, token build systems, broad Tailwind `@theme` expansion, visual redesign, OG image refactor, permanent committed visual-regression baselines (temporary comparison artifacts only).

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
- Human review of CSS layering, class choices, and visual-neutrality evidence before merge

**Agent instruction:** Do not merge. Stop after opening the PR.

**Goal:** Formalize production design tokens as a documented system and make layout composition less ad hoc.

### 1. Document the production design system

Add [`docs/design-system.md`](../../../docs/design-system.md) as human guidance and rationale — not a second store of literal token values.

**Source-of-truth layers (state explicitly in the doc):**

| Layer                   | Normative home                                             | Role                                                                         |
| ----------------------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------- |
| Token values            | `tokens.css` (or the token layer file under `app/styles/`) | Hex/OKLch, spacing scale, type scale, radii — change values here             |
| Implementation patterns | Production CSS under `app/styles/` + React components      | How tokens are applied (classes, chrome, page patterns)                      |
| Guidance / rationale    | `docs/design-system.md`                                    | Principles, semantic meaning, when to use accent vs muted, a11y expectations |

Where possible, the document should reference **token names and semantic roles** rather than copying every literal value into tables (tables that duplicate CSS will drift). Seed principles from the deleted prototype brand-spec (recoverable via `git show d828d1d^:prototypes/ai-engineering-portfolio/brand-spec.md`) and current production tokens.

Document:

- Visual principles (warm neutrals, single sage accent, soft depth, progressive disclosure)
- Semantic meaning of each color/spacing/type/radius **token name**
- Typography roles (display / body / mono + `.h1`–`.meta` / `.eyebrow`)
- Spacing conventions (`--gap-*`, section rhythm, measure widths)
- Component posture (when `.card` / buttons / pills are appropriate)
- Accent vs muted usage (accent ≤2 primary signals per screen; muted for secondary copy)
- Accessibility expectations (contrast, focus rings, text-wrap)
- Explicit Tailwind note: semantic CSS classes are primary; `@theme` only bridges background/foreground/fonts today — do not expand utilities in this PR

Update pointers in [`README.md`](../../../README.md) and [`AGENTS.md`](../../../AGENTS.md) from “brand lives in `app/globals.css`” to also link `docs/design-system.md`. Optionally add a one-line pointer from [`docs/architecture/overview.md`](../../../docs/architecture/overview.md) (that file is still skeleton-era and can stay light).

### 2. Split CSS by layer boundaries (not a fixed file count)

Keep [`app/layout.tsx`](../../../app/layout.tsx) importing `./globals.css` as the single entry. Turn `globals.css` into a thin barrel that imports layered styles under [`app/styles/`](../../../app/styles/) (colocated with the Next entry).

**Required layer boundaries** (acceptance is about these roles, not exactly three filenames):

1. **Tokens** — `:root` variables + `@theme inline` only
2. **Base / reset** — `html`/`body`, element defaults, box model
3. **Reusable layout and component styles** — layout utilities, chrome, buttons, surfaces, page patterns, motion, responsive rules

A suggested starting topology:

```css
@import "tailwindcss";
@import "./styles/tokens.css";
@import "./styles/base.css";
@import "./styles/components.css";
```

The implementer **may** split the reusable layer further if the current stylesheet naturally supports it (for example `layout.css` + `components.css`, or chrome/page-pattern files), as long as:

- `globals.css` remains the only entry imported from `layout.tsx`
- Token values stay isolated in the token layer
- Base/reset stays isolated from component chrome
- The split does not recreate one giant catch-all under a new name without improving boundaries

Do not treat “exactly three files” as an acceptance constraint.

Remove the stale prototype comment; replace with a short pointer to `docs/design-system.md`.

No behavioral/visual changes intended in the split — pure extraction.

### 3. Reduce repeated inline spacing (not eliminate all inline styles)

**Acceptance principle:** reduce repeated ad hoc styles, not necessarily all `style={{}}`. A handful of honest one-off inline values is better than a misleading utility vocabulary that flattens distinct layout needs.

Target repeated page patterns only when the **visual role is actually shared** (not OG Satori styles).

Candidates (illustrative — only introduce a class when reuse and shared role hold):

- Reading / measure widths that appear with the same role on multiple surfaces → e.g. `.measure` for a shared ~62ch body measure; do **not** force `40ch` and `34ch` into one `.measure-sm` if the roles differ
- Hero CTA top spacing: production `.hero-cta` today only sets flex layout (`display`, `gap`, `flex-wrap`) — it has **no** top margin. Before removing inline `marginTop: 28` on home/about, **add** `margin-top` to `.hero-cta` in CSS (prefer a `--gap-*` token if visual parity holds; otherwise keep `28px` and note the exception). Do not drop the inline style without adding the CSS rule first.
- Compact hero bottom padding: only share a modifier (e.g. `.hero.hero-compact`) when `32` and `40` are intentionally the same role; otherwise keep distinct values (tokenized or honest inline)
- Stack gap variants only where the same stack rhythm is reused

Surfaces that may be touched when patterns match:

- [`app/page.tsx`](../../../app/page.tsx)
- [`app/about/page.tsx`](../../../app/about/page.tsx)
- [`app/articles/page.tsx`](../../../app/articles/page.tsx)
- [`app/projects/page.tsx`](../../../app/projects/page.tsx)
- [`app/projects/[slug]/page.tsx`](../../../app/projects/[slug]/page.tsx)
- [`app/ecosystem/page.tsx`](../../../app/ecosystem/page.tsx)
- light touch on [`components/SiteFooter.tsx`](../../../components/SiteFooter.tsx) / [`components/CaseStudyToc.tsx`](../../../components/CaseStudyToc.tsx) if the same patterns apply

Leave non-spacing layout hints that have no token (e.g. `alignItems: "end"`, `flexWrap`) either as small utility classes when reused ≥2 times, or inline when one-off.

**Desktop intentionally unchanged** in look; this is mediation through tokens/classes, not a redesign.

### Acceptance

- `docs/design-system.md` exists, is linked from README/AGENTS, and states the three source-of-truth layers (token values / implementation patterns / guidance)
- Doc prefers token **names** and roles over duplicated literal value tables
- `app/globals.css` is a barrel importing layered files under `app/styles/` that satisfy the required layer boundaries (file count flexible)
- Stale `prototypes/.../brand-spec.md` comment removed from production CSS
- Repeated **shared-role** page-level spacing patterns moved to semantic classes; remaining one-off `style={{}}` is acceptable (OG image excluded)
- No intentional visual redesign
- PR includes visual-neutrality evidence (see Verify) — not permanent snapshot baselines

### Verify

- `npm run lint` / `typecheck` / `test` (and `format:check` / `build` as CI requires)
- Existing `npm run test:e2e` remains green
- **Visual neutrality (required for this refactor):** using Playwright already in the repo, capture before/after screenshots (or temporary comparison artifacts) for at least:
  - homepage desktop and mobile (~375px)
  - projects index
  - one long project detail (e.g. codenames-ai)
  - About
  - mobile menu open state
- Store artifacts under gitignored `.agent-runs/design-system-hardening/` (add `.agent-runs/` to [`.gitignore`](../../../.gitignore) in this PR if missing). Do **not** commit permanent visual baselines unless a later plan justifies it.
- Human-review the before/after set (or attach to the PR / summarize deltas in the PR body) to substantiate “no visual changes”
- No remaining references to `prototypes/ai-engineering-portfolio/brand-spec.md` in production code/docs (archived plan history may still mention it; leave archive alone)

### Explicitly skip

- Expanding `@theme` to full `bg-surface` / `text-muted` utilities
- Stylelint / custom drift tests
- Storybook or component gallery
- Permanent committed Playwright visual-regression snapshot suite

---

## Plan closure (docs-only PR)

**Recommended authority:** Open PR only

**Rationale:**

- Docs-only archival; human review of closure checklist

**Agent instruction:** Do not merge. Stop after opening the PR.

After the last implementation slice merges, open a final docs-only closure PR:

1. Verify all implementation todos are already `completed` (or `cancelled` if deferred); fix stragglers only
2. Add a `# Shipped` closure note at the top of the plan body
3. Move this file to `.cursor/plans/archive/2026-08-05-design-system-hardening.plan.md`
4. Mark `plan-closure` `completed` and update agent prompt references to the archived path

Do not archive inside implementation PRs. Implementation PRs mark their own slice `completed` in frontmatter in the same PR as the code.

---

## Agent prompts (copy/paste for Cursor)

Use a **fresh Agent-mode chat** per slice.

- **Plan review — plan-review**
  - "Execute plan-review from `@.cursor/plans/archive/2026-08-05-design-system-hardening.plan.md` only. Redraft or commit the plan artifact per repo planning standards. **Agent instruction:** Do not implement. Stop after opening the plan-only PR. Mark `plan-review` completed in plan frontmatter. Do not start implementation slices."
- **Slice — design-system-hardening**
  - "Implement design-system-hardening from `@.cursor/plans/archive/2026-08-05-design-system-hardening.plan.md` only. Prerequisite: plan-review merged (or plan accepted on `main`). Start this slice from the latest `origin/main`, implement only this slice, verify the branch represents only this slice before opening the PR, open the PR targeting `main`, and verify the GitHub PR base branch is `main` after creation. Add `docs/design-system.md` with sharp source-of-truth layers; split `app/globals.css` by layer boundaries (file count flexible); reduce repeated shared-role inline spacing without inventing misleading utilities; capture Playwright before/after screenshots under gitignored `.agent-runs/design-system-hardening/` and note visual review in the PR. Do not expand Tailwind `@theme`, add Storybook, Stylelint, or permanent visual baselines. **Agent instruction:** Do not merge. Stop after opening the PR. Mark `design-system-hardening` completed in plan frontmatter. Do not start plan closure. Do not archive the plan."
- **Plan closure — plan-closure**
  - "Execute plan-closure from `@.cursor/plans/archive/2026-08-05-design-system-hardening.plan.md` only. Prerequisites: all implementation slices merged and already marked completed in frontmatter. Start this slice from the latest `origin/main`, verify the branch represents only this slice before opening the PR, open the PR targeting `main`, and verify the GitHub PR base branch is `main` after creation. Docs-only PR: verify slice todos, add `# Shipped` note, move plan to `.cursor/plans/archive/2026-08-05-design-system-hardening.plan.md`, mark `plan-closure` completed, update references. **Agent instruction:** Do not merge. Stop after opening the PR."
