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

## Recommended execution authority

| Slice                 | Recommended authority | Agent instruction                        |
| --------------------- | --------------------- | ---------------------------------------- |
| quality-observability | Open PR only          | Do not merge. Stop after opening the PR. |
| plan-closure          | Open PR only          | Do not merge. Stop after opening the PR. |

## Architecture decisions (summary)

- **Terminal write** after generation outcome (success, abstention, or failure) — no pending rows.
- **Same Postgres** as retrieval/rate limits (`DATABASE_URL`); dedicated table, not corpus schema.
- **Fail-open** persistence; public API contract unchanged.
- **PostHog unchanged** — no question/answer text in generation telemetry events.
- **Retention** via explicit scheduled `assistant:evaluation:cleanup` (default 30-day window).

Full detail: [docs/assistant/evaluation-observability.md](../docs/assistant/evaluation-observability.md).

## Agent prompts (copy/paste for Cursor)

### quality-observability

Implement @.cursor/plans/2026-10-29-assistant-quality-observability.plan.md slice **quality-observability** only. Open PR targeting `main`; do not merge. Mark the slice todo completed in the same PR.

### plan-closure

Execute plan closure for @.cursor/plans/2026-10-29-assistant-quality-observability.plan.md only: verify todos, add # Shipped note, move plan to `.cursor/plans/archive/`, mark `plan-closure` completed. Docs-only PR; do not merge unless granted.
