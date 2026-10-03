---
name: About résumé rework
overview: Rework the portfolio `/about` page from a continuity thesis into a web-native career record derived from the October 2026 Senior Software Engineer résumé, preserving the existing visual language while replacing the content model and removing obsolete continuity abstractions.
todos:
  - id: plan-review
    content: "Plan-only PR — commit plan artifact and open PR for review; do not implement"
    status: completed
  - id: slice-1
    content: "PR 1: Résumé-derived About page — domain model, content, page, CSS, tests, minor collateral"
    status: completed
  - id: plan-closure
    content: "Docs-only PR after slice 1: add # Shipped note, move plan to .cursor/plans/archive/2026-10-03-about-resume-rework.plan.md"
    status: pending
isProject: false
---

# About page — résumé-derived career record

Rework `/about` from a continuity thesis (“one engineering practice, 2014 to now”) into a web-native expanded résumé. **Canonical source:** October 2026 Senior Software Engineer résumé (not older portfolio copy or historical artifacts).

**Site IA (unchanged intent):**

| Surface  | Role                            |
| -------- | ------------------------------- |
| Home     | Positioning / first impression  |
| About    | Career record / expanded résumé |
| Projects | Deeper evidence                 |
| Articles | Engineering reasoning           |

**Out of scope:** homepage repositioning, Projects, Articles, résumé repo content, general portfolio redesign, new metrics.

**Privacy:** Do not copy, render, or expose the résumé phone number anywhere in the portfolio (content, metadata, tests, fixtures, snapshots).

---

## Recommended execution authority

| Slice        | Recommended authority | Agent instruction                                      |
| ------------ | --------------------- | ------------------------------------------------------ |
| plan-review  | Plan-only PR          | Do not implement. Stop after opening the plan-only PR. |
| slice-1      | Open PR only          | Do not merge. Stop after opening the PR.               |
| plan-closure | Open PR only          | Do not merge. Stop after opening the PR.               |

---

## Repository topology (default)

Start each slice from latest `origin/main`. Branch represents only the current slice. PR base must be `main`.

---

## Pre-implementation report (inspection complete)

### Proposed section structure

| Section                                     | Content                                                                                       |
| ------------------------------------------- | --------------------------------------------------------------------------------------------- |
| **Header**                                  | Eyebrow `About · career record`; H2 from résumé positioning; two-paragraph summary (no phone) |
| **§01 Professional Experience · Atlassian** | Five roles, newest first                                                                      |
| **§02 Independent Projects**                | Three capability blocks after Atlassian history                                               |
| **§03 Skills · Education & work rights**    | Compact résumé sidebar content                                                                |
| **Closing**                                 | Existing availability block + mailto CTA                                                      |

**Atlassian roles (résumé-canonical dates):**

1. Senior Software Engineer · May 2024 – Aug 2025 · Full-time
2. Engineering Manager · May 2020 – May 2024 · Full-time
3. Program Lead · Mar 2022 – Aug 2025 · Concurrent Program
4. Senior Software Engineer · Feb 2019 – May 2020 · Full-time
5. Software Developer · **Apr 2015** – Feb 2019 · Full-time _(fixes current 2014 start error)_

**Independent projects:**

1. AI Product Engineering · Codenames AI · May 2026 – Present
2. Agent Engineering & Developer Infrastructure · Jun 2026 – Present · Supporting Project
3. Engineering Research & Writing · Jun 2026 – Present · Supporting Project

### Concepts that remain

- Identity rail in [`app/about/page.tsx`](app/about/page.tsx)
- [`components/QualifiedFigure.tsx`](components/QualifiedFigure.tsx) + `CaseFigure.source` inventory review aids
- Shell layout in [`app/styles/about.css`](app/styles/about.css): `.about-shell`, `.about-rail`, `.about-doc`, numbered sections, era/band grids, `.about-close`
- `PortfolioRepository.getAbout()` boundary

### Concepts to remove

| Removed                                               | Why                                                                            |
| ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| `throughLine`, continuity `statement`/`lead.emphasis` | “One engineering practice”, “same job under different names”, “layers changed” |
| `AboutEra.carry` + `.about-carry`                     | Per-era “Carried forward” mechanism                                            |
| `arcEvidence` section gutter                          | Figures attach to the role that produced them                                  |
| `AboutManagement` band                                | EM is a role entry; no “management was this practice” framing                  |
| `AboutCurrent` + then/now `map`                       | Attribution→validators mappings                                                |
| `AboutSurface` / §05 “Where each thing lives”         | Per product direction                                                          |
| `ledgerNote`                                          | Old homepage ledger cross-link hook                                            |

**Intentionally unchanged:** homepage continuity band ([`content/homepage.ts`](content/homepage.ts)), `profile.bio`.

### Highlighted figures by role/project

| Role / project                 | Figure(s)                                 | Inventory source                                                  |
| ------------------------------ | ----------------------------------------- | ----------------------------------------------------------------- |
| Senior SWE 2024–25             | `10×` OKR attainment vs target            | `resumes/facts/loom-acquisition.yml` (`okr-attainment`)           |
| Engineering Manager            | `8–10` engineers; `>10%` over-attribution | `em-growth-delivery.yml`, `cross-flow-experiment-measurement.yml` |
| Program Lead                   | `3,552` matches; optional `86%` sentiment | `aim-participation-scale.yml`, `aim-sentiment-atlas.yml`          |
| Codenames AI                   | `175+` monthly active players             | `codenames-ai-telemetry.yml`                                      |
| Engineering Research & Writing | `18` reports; `2,200+` DEV followers      | `writing-field-reports.yml`                                       |

**Integrity guards:** Savepoints not named and not described as a production product; preserve voice guardrails (`175+` floor, no `.yml` in copy, forbidden framings).

---

## Slice 1 — Résumé-derived About page

**Recommended authority:** Open PR only

**Rationale:**

- Single cohesive page change (domain, content, presentation, tests)
- Merge-safe on its own; no dependency on other slices

**Agent instruction:** Do not merge. Stop after opening the PR.

**Goal:** Replace About continuity model with résumé-shaped career record; preserve visual language.

**Deliverables:**

1. **Domain** — [`domain/about.ts`](domain/about.ts): `AboutExperienceEntry`, `AboutSection`, `AboutSkillsCluster`; remove era/continuity types
2. **Content** — [`content/about.ts`](content/about.ts): transcribe résumé bullets; wire figures to inventory sources
3. **Page** — [`app/about/page.tsx`](app/about/page.tsx): summary header, §01–§03, closing; update metadata description
4. **CSS** — [`app/styles/about.css`](app/styles/about.css): `.about-role-bullets`, employment note, skills/education; remove carry/map/surfaces rules
5. **Tests** — [`tests/content-foundation.test.ts`](tests/content-foundation.test.ts), [`tests/static-portfolio-repository.test.ts`](tests/static-portfolio-repository.test.ts), [`e2e/happy-path.spec.ts`](e2e/happy-path.spec.ts)
6. **Minor collateral** — [`app/ecosystem/page.tsx`](app/ecosystem/page.tsx) link text; [`DESIGN.md`](DESIGN.md) About register note

**Acceptance:**

- About reads as chronological career record matching résumé hierarchy and dates (Apr 2015 Atlassian start)
- No continuity thesis copy, carry clauses, or then/now map
- Figures attached to producing roles/projects via `QualifiedFigure`
- No phone number in any artifact
- `npm run lint`, `typecheck`, `test`, `build` pass; About e2e assertions updated

**Verify:**

```bash
npm run lint && npm run typecheck && npm test && npm run build
npm run test:e2e
```

Visual check: About at desktop (1200px) and mobile (375px).

Mark `slice-1` `completed` in plan frontmatter in the same PR as the code.

---

## Plan closure (docs-only PR)

**Recommended authority:** Open PR only

**Rationale:** Docs-only archival; human review of closure checklist

**Agent instruction:** Do not merge. Stop after opening the PR.

After slice 1 merges:

1. Verify `slice-1` and `plan-review` are `completed`
2. Add `# Shipped` closure note
3. Move this file to `.cursor/plans/archive/2026-10-03-about-resume-rework.plan.md`
4. Mark `plan-closure` `completed`

---

## Agent prompts (copy/paste for Cursor)

### plan-review

```text
@.cursor/plans/2026-10-03-about-resume-rework.plan.md

Execute only plan-review. Do not start slice-1 or later slices.

Authority: Plan-only PR — commit the plan artifact only; do not implement. Stop after opening the plan-only PR.

Topology: start from latest origin/main; branch represents only the plan artifact; PR base must be main.

Deliverables: plan file under .cursor/plans/; mark plan-review completed in frontmatter in the same PR.

Verification: plan satisfies repo planning standards; no implementation changes included.
```

### slice-1

```text
@.cursor/plans/2026-10-03-about-resume-rework.plan.md

Implement slice slice-1 only. Do not start plan-closure. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: domain/about.ts, content/about.ts, app/about/page.tsx, app/styles/about.css, tests, minor collateral per slice acceptance. Mark slice-1 completed in plan frontmatter in this PR.

Verification: npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e; visual check About at desktop and 375px.

Constraints: October 2026 Senior SWE résumé is canonical for career content. No phone number. Savepoints not a production product. Homepage/Projects/Articles unchanged.
```

### plan-closure

```text
@.cursor/plans/2026-10-03-about-resume-rework.plan.md

Execute only plan-closure.

Authority: Open PR only — docs-only archive PR; do not merge.

Prerequisites: slice-1 merged and marked completed in frontmatter.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: verify slice todos, add # Shipped note, move plan to .cursor/plans/archive/2026-10-03-about-resume-rework.plan.md, mark plan-closure completed, update agent prompt references to the archived path.

Verification: confirm slice-1 PR is merged and slice-1 todo is completed before archiving.
```

---

## Content that may not map cleanly

- **Résumé “Featured Work & Profiles”** — partially redundant with rail links; project links on entries instead
- **Full education honors** — compressed in §03
- **Concurrent Program Lead** — `employmentNote` distinguishes it; not a separate timeline fork
- **Homepage “2014–2025”** in continuity band — out of scope
