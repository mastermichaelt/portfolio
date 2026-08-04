---
name: Plan title
overview: One-line summary of the multi-PR plan.
todos:
  - id: slice-1
    content: "PR 1: First merge-safe slice"
    status: pending
  - id: slice-2
    content: "PR 2: Second merge-safe slice"
    status: pending
  - id: plan-closure
    content: "Docs-only PR after last slice: add # Shipped note, move plan to .cursor/plans/archive/YYYY-MM-DD-slug.plan.md"
    status: pending
isProject: false
---

# Plan title

> **Boilerplate only.** This file is a skeleton for new multi-PR plans. Do **not** execute it as an active plan. Copy it to a new `.cursor/plans/<slug>.plan.md` and fill in real slices.

## Recommended execution authority

| Slice        | Recommended authority | Agent instruction                        |
| ------------ | --------------------- | ---------------------------------------- |
| slice-1      | Open PR only          | Do not merge. Stop after opening the PR. |
| slice-2      | Open PR only          | Do not merge. Stop after opening the PR. |
| plan-closure | Open PR only          | Do not merge. Stop after opening the PR. |

Repo default: **Open PR only** ([planning-standards.md](../standards/planning-standards.md#repo-default-when-no-plan-slice-applies)).

Use this template for **cross-cutting / multi-concern** work. Typos, copy tweaks, and single page/content updates can be direct PRs without a staged plan — see [Lightweight vs staged planning](../standards/planning-standards.md#lightweight-vs-staged-planning).

Per-slice rationale and verification details are in each slice section below.

## Repository topology (default)

This invariant prevents accidental stacked PRs. Multi-slice plans stack execution order, not Git branches.

The repository integration branch is `main` unless this plan explicitly authorizes otherwise for a slice. Implementation slices start from and target the integration branch by default.

**Before implementation:** start this slice from the latest integration branch (typically `git fetch` then a fresh branch from `origin/main`).

**Before opening the PR:** verify the branch represents only this slice — previous-slice work is present through the integration branch, not through branch ancestry.

**After opening the PR:** verify the GitHub PR base branch is `main` and the diff does not include previous-slice work except through merged `main`.

---

## Slice 1 — First merge-safe slice

**Recommended authority:** Open PR only

**Rationale:**

- …

**Agent instruction:** Do not merge. Stop after opening the PR.

**Goal:** …

**Acceptance:** …

---

## Slice 2 — Second merge-safe slice

**Recommended authority:** Open PR only

**Rationale:**

- …

**Agent instruction:** Do not merge. Stop after opening the PR.

**Goal:** …

**Acceptance:** …

---

## Plan closure (docs-only PR)

**Recommended authority:** Open PR only

**Rationale:**

- Docs-only archival; human review of closure checklist

**Agent instruction:** Do not merge. Stop after opening the PR.

After the last implementation slice merges, open a final docs-only closure PR:

1. Verify all implementation todos are already `completed` (or `cancelled` if deferred); fix stragglers only
2. Add a `# Shipped` closure note at the top of the plan body
3. Move this file to `.cursor/plans/archive/YYYY-MM-DD-slug.plan.md`
4. Mark `plan-closure` `completed` and update agent prompt references to the archived path

Do not archive inside implementation PRs. Implementation PRs mark their own slice `completed` in frontmatter in the same PR as the code.

---

## Agent prompts (copy/paste for Cursor)

Use a **fresh Agent-mode chat** per slice.

- **Slice 1 — slice-1**
  - "Implement slice 1 (slice-1) from `@.cursor/plans/<slug>.plan.md` only. Start this slice from the latest `origin/main`, implement only this slice, verify the branch represents only this slice before opening the PR, open the PR targeting `main`, and verify the GitHub PR base branch is `main` after creation. … **Agent instruction:** Do not merge. Stop after opening the PR. Mark `slice-1` completed in plan frontmatter. Do not start slice 2 or later slices. Do not archive the plan."
- **Slice 2 — slice-2**
  - "Implement slice 2 (slice-2) from `@.cursor/plans/<slug>.plan.md` only. Prerequisite: slice 1 merged. Start this slice from the latest `origin/main`, implement only this slice, verify the branch represents only this slice before opening the PR, open the PR targeting `main`, and verify the GitHub PR base branch is `main` after creation. … **Agent instruction:** Do not merge. Stop after opening the PR. Mark `slice-2` completed in plan frontmatter. Do not start plan closure. Do not archive the plan."
- **Plan closure — plan-closure**
  - "Execute plan-closure from `@.cursor/plans/<slug>.plan.md` only. Prerequisites: all implementation slices merged and already marked completed in frontmatter. Start this slice from the latest `origin/main`, verify the branch represents only this slice before opening the PR, open the PR targeting `main`, and verify the GitHub PR base branch is `main` after creation. Docs-only PR: verify slice todos, add `# Shipped` note, move plan to `.cursor/plans/archive/YYYY-MM-DD-slug.plan.md`, mark `plan-closure` completed, update references. **Agent instruction:** Do not merge. Stop after opening the PR."

<!-- Merge-granted slice example (replace Open PR only blocks above when appropriate):

**Recommended authority:** Merge granted

**Rationale:**
- Docs-only / low-risk scope
- No application behavior changes
- Verification listed below

**Agent instruction:** You may merge after documented verification passes.

**Preconditions:** …
**Verify:** …

Agent prompt: "… **Agent instruction:** You may merge after documented verification passes. …"
-->

<!-- Optional plan-review pre-slice (before implementation slices):

Add to frontmatter todos, authority table, and agent prompts when the plan should land for review first:

  - id: plan-review
    content: "Plan-only PR — commit plan artifact and open PR for review; do not implement"
    status: pending

| plan-review | Plan-only PR | Do not implement. Stop after opening the plan-only PR. |

## Plan review (optional pre-slice)

**Recommended authority:** Plan-only PR

**Rationale:**
- Plan must be reviewed before implementation slices begin
- Expected diff is plan artifact only

**Agent instruction:** Do not implement. Stop after opening the plan-only PR.

Agent prompt: "Execute plan-review from `@.cursor/plans/<slug>.plan.md` only. Redraft or commit the plan artifact per repo planning standards. **Agent instruction:** Do not implement. Stop after opening the plan-only PR. Mark `plan-review` completed in plan frontmatter. Do not start implementation slices."
-->

<!-- Optional Manual verification gate slice (orthogonal non-PR mode — before plan-closure):

Add to frontmatter todos, authority table, and agent prompts when a plan requires evidence generation without repository mutation:

  - id: manual-verification
    content: "Manual verification gate: run <verification-name> and report verdict before plan closure"
    status: pending

| manual-verification | Manual verification gate | Do not commit or open a PR. Run only the specified manual verification, do not perform implementation work, write only allowed gitignored outputs if needed, report the verdict, and stop. |

## Manual verification (optional gate slice)

**Recommended authority:** Manual verification gate

**Rationale:**
- Verification writes only gitignored artifacts, not tracked implementation changes
- Evidence must be produced before plan closure

**Agent instruction:** Do not commit or open a PR. Run only the specified manual verification, do not perform implementation work, write only allowed gitignored outputs if needed, report the verdict, and stop.

**Allowed gitignored outputs:** `.agent-runs/<path-named-in-slice>/**` (name explicit paths in the slice)

Agent prompt: "Run the manual verification gate (`manual-verification`) from `@.cursor/plans/<slug>.plan.md` only. Prerequisites: <prior-slices> merged and marked completed. Run only <verification-name>. Do not edit tracked files, do not commit, do not open a PR, do not start plan-closure. **Agent instruction:** Do not commit or open a PR. Run only the specified manual verification, do not perform implementation work, write only allowed gitignored outputs if needed, report the verdict, and stop. Report artifact paths and verdict."

Plan-closure prerequisite: verify the manual verification gate completed (verification run, required gitignored artifacts present, verdict reported) before archiving.
-->
