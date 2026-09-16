---
name: Diagram ownership migration
overview: Move the Editorial and Renovate React Flow workflow diagrams from `/ecosystem` onto their owning project pages (verbatim data + shared canvas primitives), then remove only those two sections from Ecosystem ahead of the 1b redesign.
todos:
  - id: plan-review
    content: "Plan-only PR — commit plan artifact and open PR for review; do not implement"
    status: completed
  - id: diagram-migration
    content: "PR 1: Move Editorial + Renovate workflow views to project pages; remove from Ecosystem; tests + e2e"
    status: completed
  - id: plan-closure
    content: "Docs-only PR after last slice: add # Shipped note, move plan to .cursor/plans/archive/2026-09-16-diagram-ownership-migration.plan.md"
    status: pending
isProject: false
---

# Diagram ownership migration

Prerequisite migration before the approved 1b Ecosystem redesign. Move two project-specific architecture diagrams from `/ecosystem` to the project pages that own them. Do **not** redesign Ecosystem or migrate remaining content in this plan.

## Recommended execution authority

| Slice             | Recommended authority | Agent instruction                                      |
| ----------------- | --------------------- | ------------------------------------------------------ |
| plan-review       | Plan-only PR          | Do not implement. Stop after opening the plan-only PR. |
| diagram-migration | Open PR only          | Do not merge. Stop after opening the PR.               |
| plan-closure      | Open PR only          | Do not merge. Stop after opening the PR.               |

Repo default: **Open PR only** ([planning-standards.md](../standards/planning-standards.md#repo-default-when-no-plan-slice-applies)).

## Repository topology (default)

The repository integration branch is `main`. Each slice starts from latest `origin/main` and targets `main`.

**Before implementation:** `git fetch` then a fresh branch from `origin/main`.

**Before opening the PR:** verify the branch represents only the current slice.

**After opening the PR:** verify GitHub PR base is `main` and the diff does not include prior-slice work except through merged `main`.

---

## Scope boundary (all slices)

**In scope:**

- Editorial field-report pipeline → `/projects/editorial-workflow`
- Renovate governance ladder → `/projects/renovate-governance`
- Remove only those two workflow sections from `/ecosystem`
- Reuse existing diagram components/data where sensible

**Out of scope:**

- 1b Ecosystem redesign (system selector + five-stage lane)
- Remaining Ecosystem content migration
- Generalizing diagrams into a cross-project model
- Changing diagram semantics to ease future Ecosystem design

---

## Slice — plan-review

**Recommended authority:** Plan-only PR

**Rationale:**

- Cross-cutting content + UI move; review plan before touching canvases, project pages, and Ecosystem tests.

**Agent instruction:** Do not implement. Stop after opening the plan-only PR.

**Goal:** Commit this plan artifact for review.

**Acceptance:** PR contains only `.cursor/plans/2026-09-16-diagram-ownership-migration.plan.md` (plan-only).

---

## Slice — diagram-migration

**Recommended authority:** Open PR only

**Rationale:**

- Focused ownership migration with clear verification; human review before merge.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Goal:** Editorial architecture lives on the Editorial Workflow project page; Renovate architecture lives on the Renovate project page; `/ecosystem` no longer renders those two sections; everything else on Ecosystem unchanged.

### Current state

Both diagrams are **data-driven React Flow canvases** in [`content/ecosystem.ts`](../../content/ecosystem.ts):

- `workflow-editorial` — 9 nodes, 10 edges (optional Refresh branch, Draft↔Critique loop, human Publish)
- `workflow-renovate` — 5 nodes, 5 edges (Investigate / Auto path, audit → Maintainer → Merge gates)

Pipeline: `content/ecosystem.ts` → `listWorkflowViews()` → [`EcosystemExplorer`](../../components/ecosystem/EcosystemExplorer.tsx) → [`EcosystemCanvas`](../../components/ecosystem/EcosystemCanvas.tsx) + [`EcosystemDetailPanel`](../../components/ecosystem/EcosystemDetailPanel.tsx) + [`lib/ecosystem-canvas.ts`](../../lib/ecosystem-canvas.ts).

Destination: generic case-study template [`app/projects/[slug]/page.tsx`](../../app/projects/[slug]/page.tsx) + [`content/projects.ts`](../../content/projects.ts).

**Preserve on each migrated section:**

- Eyebrow **Operational workflow**
- Title, summary, talk track (including classifier-never-merges / human-publish boundaries)
- Full diagram: nodes, branches, loops, labels, handles, relationships — no simplification

**Do not touch on Ecosystem:** `system-overview`, `workflow-product-loop`, entity inventory, relationships, hero, or other chrome.

### Implementation steps

1. **Move workflow data (verbatim)** — Create [`content/project-workflows.ts`](../../content/project-workflows.ts); cut/paste the two `WorkflowView` objects unchanged; export `projectWorkflowViewsBySlug`. Remove only those entries from `workflowViews` in [`content/ecosystem.ts`](../../content/ecosystem.ts). Keep `entities` and `relationships` untouched. Update [`domain/workflow-view.ts`](../../domain/workflow-view.ts) doc comment.

2. **Repository** — Add `getProjectWorkflowView(slug)` to [`PortfolioRepository`](../../repositories/portfolio-repository.ts) and [`StaticPortfolioRepository`](../../repositories/static-portfolio-repository.ts).

3. **Project diagram UI** — Add [`components/projects/ProjectWorkflowDiagram.tsx`](../../components/projects/ProjectWorkflowDiagram.tsx): single-view shell reusing `EcosystemCanvas`, `EcosystemDetailPanel`, and ecosystem CSS (920px side/inline panel). Extend `EcosystemDetailPanel` with optional `currentProjectSlug` to hide self-link on the owning project page.

4. **Project page integration** — In [`app/projects/[slug]/page.tsx`](../../app/projects/[slug]/page.tsx): load entities + `getProjectWorkflowView(slug)`; insert diagram **immediately after** the `system` section; TOC entry `{ id: "operational-workflow", title: "Operational workflow" }`. Do not displace existing prose sections.

5. **Remove from Ecosystem** — After project pages render both diagrams, delete `workflow-renovate` and `workflow-editorial` from `workflowViews` only.

6. **Tests** — Update [`tests/ecosystem-content.test.ts`](../../tests/ecosystem-content.test.ts) (2 ecosystem views: `system-overview`, `workflow-product-loop`); retarget [`tests/ecosystem-canvas.test.ts`](../../tests/ecosystem-canvas.test.ts) editorial/renovate imports to `content/project-workflows.ts`; add [`tests/project-workflows.test.ts`](../../tests/project-workflows.test.ts); update [`tests/static-portfolio-repository.test.ts`](../../tests/static-portfolio-repository.test.ts); retarget [`e2e/happy-path.spec.ts`](../../e2e/happy-path.spec.ts) ecosystem tests and add project-page diagram e2e coverage (desktop + 375px).

### Acceptance

- Editorial project page: complete pipeline + diagram + talk track
- Renovate project page: complete governance ladder + diagram + talk track
- Architectural semantics unchanged; responsive at existing breakpoints
- `/ecosystem` no longer renders those two sections; no other Ecosystem content changed
- Existing project-page prose not displaced or lost
- lint, typecheck, unit tests, build, relevant e2e pass

**Verification:**

```bash
npm run lint
npm run typecheck
npm test
npm run build
npm run test:e2e
```

Mark `diagram-migration` `completed` in frontmatter in the same PR as the code.

---

## Plan closure (docs-only PR)

**Recommended authority:** Open PR only

**Rationale:** Docs-only archival after the migration PR merges.

**Agent instruction:** Do not merge. Stop after opening the PR.

After `diagram-migration` merges:

1. Verify implementation todos are `completed`
2. Add `# Shipped` closure note at top of plan body
3. Move this file to `.cursor/plans/archive/2026-09-16-diagram-ownership-migration.plan.md`
4. Mark `plan-closure` `completed`; update agent prompt paths to archived location

---

## Agent prompts (copy/paste for Cursor)

### plan-review

```text
@.cursor/plans/2026-09-16-diagram-ownership-migration.plan.md

Execute slice plan-review only. Do not start diagram-migration or plan-closure.

Authority: Plan-only PR — commit the plan artifact and open a PR for review; do not implement.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: commit .cursor/plans/2026-09-16-diagram-ownership-migration.plan.md only. Mark plan-review completed in frontmatter in this PR.

Verification: PR diff is plan artifact only; clearly marked plan-only in PR description.
```

### diagram-migration

```text
@.cursor/plans/2026-09-16-diagram-ownership-migration.plan.md

Implement slice diagram-migration only. Prerequisite: plan-review merged. Do not start plan-closure. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Scope: Move Editorial field-report pipeline and Renovate governance ladder from /ecosystem to their project pages (verbatim diagram data + talk tracks). Remove only those two sections from Ecosystem. Reuse EcosystemCanvas/EcosystemDetailPanel via ProjectWorkflowDiagram. Do not implement 1b Ecosystem redesign or migrate other Ecosystem content.

Deliverables: content/project-workflows.ts, getProjectWorkflowView, ProjectWorkflowDiagram, project page wiring, ecosystem removal, test/e2e updates. Mark diagram-migration completed in frontmatter in this PR.

Verification: npm run lint && npm run typecheck && npm test && npm run build && npm run test:e2e; manual spot-check Editorial + Renovate project pages and /ecosystem.
```

### plan-closure

```text
@.cursor/plans/2026-09-16-diagram-ownership-migration.plan.md

Execute only plan-closure.

Authority: Open PR only — docs-only archive PR; do not merge.

Prerequisites: diagram-migration merged and marked completed in frontmatter.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: verify slice todos, add # Shipped note, move plan to .cursor/plans/archive/2026-09-16-diagram-ownership-migration.plan.md, mark plan-closure completed, update agent prompt references to the archived path.

Verification: confirm diagram-migration PR is merged before archiving.
```
