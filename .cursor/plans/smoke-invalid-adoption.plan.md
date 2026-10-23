---
name: Smoke invalid plan
overview: Intentionally invalid plan for plan-validator negative smoke (missing agent prompts section).
todos:
  - id: slice-a
    content: "PR: smoke slice"
    status: pending
  - id: plan-closure
    content: "Docs-only closure"
    status: pending
isProject: false
---

# Smoke invalid plan

## Recommended execution authority

| Slice        | Recommended authority | Agent instruction                        |
| ------------ | --------------------- | ---------------------------------------- |
| slice-a      | Open PR only          | Do not merge. Stop after opening the PR. |
| plan-closure | Open PR only          | Do not merge. Stop after opening the PR. |

## Slice — slice-a

**Recommended authority:** Open PR only

**Rationale:**

- Negative smoke only.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Goal:** Trigger validator failure.

**Acceptance:** CI fails with a rule-id diagnostic on this file.

## Plan closure (docs-only PR)

**Recommended authority:** Open PR only

**Rationale:**

- Negative smoke only.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Acceptance:** N/A — missing Agent prompts section by design.
