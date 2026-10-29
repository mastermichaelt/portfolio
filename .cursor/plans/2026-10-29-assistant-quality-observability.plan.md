---
name: Assistant quality observability
overview: Persist privacy-conscious question-level evaluation rows for POST /api/assistant/generate with operator review CLI and retention cleanup.
todos:
  - id: quality-observability
    content: "PR: evaluation table, API fail-open persistence, disclosure, CLI, tests, docs"
    status: completed
  - id: plan-closure
    content: "Docs-only PR after merge: archive plan with # Shipped note"
    status: pending
isProject: false
---

# Assistant quality observability

Single merge-safe PR (`quality-observability`).

## Architecture decisions (summary)

- **Terminal write** after generation outcome (success, abstention, or failure) — no pending rows.
- **Same Postgres** as retrieval/rate limits (`DATABASE_URL`); dedicated table, not corpus schema.
- **Fail-open** persistence; public API contract unchanged.
- **PostHog unchanged** — no question/answer text in generation telemetry events.
- **Retention** via explicit scheduled `assistant:evaluation:cleanup` (default 30-day window).

Full detail: [docs/assistant/evaluation-observability.md](../docs/assistant/evaluation-observability.md).

---

## Slice — quality-observability

**Recommended authority:** Open PR only

**Rationale:** Backend observability only; no RAG, API contract, or conversational UI redesign.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Goal:** Question-level evaluation rows, privacy disclosure, operator review/cleanup CLIs, tests, and docs.

**Acceptance:** Per [evaluation-observability.md](../docs/assistant/evaluation-observability.md); CI green.

---

## Slice — plan-closure

**Recommended authority:** Open PR only

**Rationale:** Docs-only archival after **quality-observability** merges.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Prerequisites:** **quality-observability** merged on `main`.

**Deliverables:** `# Shipped` note; move plan to `.cursor/plans/archive/2026-10-29-assistant-quality-observability.plan.md`; mark `plan-closure` completed.

---

## Recommended execution authority

| Slice                 | Recommended authority | Agent instruction                        |
| --------------------- | --------------------- | ---------------------------------------- |
| quality-observability | Open PR only          | Do not merge. Stop after opening the PR. |
| plan-closure          | Open PR only          | Do not merge. Stop after opening the PR. |

Repo default: **Open PR only** ([planning-standards.md](../standards/planning-standards.md#repo-default-when-no-plan-slice-applies)).

## Repository topology (default)

Integration branch: **`main`**. Start from latest `origin/main`. PR base **`main`**; diff contains only this slice.

---

## Agent prompts (copy/paste for Cursor)

### quality-observability

```text
@.cursor/plans/2026-10-29-assistant-quality-observability.plan.md

Implement slice quality-observability only. Do not start plan-closure. Do not change RAG ranking, prompts, or generation behavior.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: evaluation table + migration, fail-open API persistence, composer disclosure, review/cleanup CLIs, tests, docs per plan. Mark quality-observability completed in plan frontmatter in this PR.

Verification: npm run lint, typecheck, test; assistant DB migration meta tests updated.
```

### plan-closure

```text
@.cursor/plans/2026-10-29-assistant-quality-observability.plan.md

Execute only plan-closure after quality-observability merges. Do not implement product code in this PR.

Authority: Open PR only — docs-only archive PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: verify slice todos, add # Shipped note, move plan to .cursor/plans/archive/2026-10-29-assistant-quality-observability.plan.md, mark plan-closure completed, update agent prompt references to the archived path.

Verification: confirm quality-observability merged before archiving; plan-validator passes.
```

## Explicit follow-ups (outside this PR)

- **Claude Design:** polish composer retention disclosure layout/copy.
- **Visitor feedback integration:** document in [evaluation-observability.md](../docs/assistant/evaluation-observability.md#future-feedback-explicit-integration-task) — return a client correlation id on generate responses and add a feedback endpoint keyed by `assistant_generation_evaluations.id`. Public API envelope unchanged in this slice.
