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

Use a **fresh Agent-mode chat** per slice. Each default frontmatter todo has exactly one `### <todo-id>` heading copied from that todo’s `id` — do not rename ids to match prose.

### slice-1

```text
@.cursor/plans/<slug>.plan.md

Implement slice slice-1 only. Do not start slice-2 or later slices. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: …. Mark slice-1 completed in plan frontmatter in this PR.

Verification: ….
```

### slice-2

```text
@.cursor/plans/<slug>.plan.md

Implement slice slice-2 only. Prerequisite: slice-1 merged. Do not start plan-closure. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: …. Mark slice-2 completed in plan frontmatter in this PR.

Verification: ….
```

### plan-closure

```text
@.cursor/plans/<slug>.plan.md

Execute only plan-closure.

Authority: Open PR only — docs-only archive PR; do not merge.

Prerequisites: all implementation slices merged and already marked completed in frontmatter.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: verify slice todos, add # Shipped note, move plan to .cursor/plans/archive/YYYY-MM-DD-slug.plan.md, mark plan-closure completed, update agent prompt references to the archived path.
```

<!-- Merge-granted slice example (replace Open PR only blocks above when appropriate):

**Recommended authority:** Merge granted

**Rationale:**
- Docs-only / low-risk scope
- No application behavior changes
- Verification listed below

**Agent instruction:** You may merge after documented verification passes.

**Preconditions:** …
**Verify:** …

Agent prompt (uncomment as `### <slice-id>` — do not reuse a default todo id as a live heading):

```text
@.cursor/plans/<slug>.plan.md

Implement slice <slice-id> only.

Authority: Merge granted — You may merge after documented verification passes.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: …. Mark <slice-id> completed in plan frontmatter in this PR.

Verification: ….
```

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

Agent prompt (uncomment as `### plan-review`):

```text
@.cursor/plans/<slug>.plan.md

Execute only plan-review. Do not start implementation slices.

Authority: Plan-only PR — commit the plan artifact only; do not implement. Stop after opening the plan-only PR.

Topology: start from latest origin/main; branch represents only the plan artifact; PR base must be main.

Deliverables: plan file under .cursor/plans/; mark plan-review completed in frontmatter in the same PR.
```

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

Agent prompt (uncomment as `### manual-verification`):

```text
@.cursor/plans/<slug>.plan.md

Run the manual verification gate (manual-verification) only. Prerequisites: <prior-slices> merged and marked completed. Do not start plan-closure.

Authority: Manual verification gate.

Specified verification: run only <verification-name>.

Allowed gitignored outputs: .agent-runs/<path-named-in-slice>/**

Agent instruction: Do not commit or open a PR. Run only the specified manual verification, do not perform implementation work, write only allowed gitignored outputs if needed, report the verdict, and stop.
```


Plan-closure prerequisite: verify the manual verification gate completed (verification run, required gitignored artifacts present, verdict reported) before archiving.
-->
