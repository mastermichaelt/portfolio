---
title: Assistant quality observability
---

# Assistant quality observability

Question-level evaluation rows complement **generation telemetry** (PostHog): telemetry reports latency, token usage, attribution counts, and outcomes **without** storing visitor questions or answer text. Evaluation rows persist the normalized question, public answer text, support metadata, and evidence identifiers for operator review.

## Data flow

```text
POST /api/assistant/generate
  → validate question (no row if rejected)
  → rate limit (no row if limited)
  → runRagGeneration (unchanged)
  → build evaluation record (terminal write)
  → insert assistant_generation_evaluations (fail-open)
  → flush PostHog generation telemetry (unchanged)
  → return public JSON (unchanged)
```

- **Single terminal insert** after generation completes or fails (no pending rows).
- **UUID `id`** is generated in Postgres for each row; reserved for a future visitor-feedback slice (see [Future feedback](#future-feedback-explicit-integration-task)). The public API does **not** return this id yet.
- Writes use the same `DATABASE_URL` pool as retrieval and rate limits; they do not alter the model response or public envelope.

## Schema

Drizzle table `assistant_generation_evaluations` (migration `drizzle/0001_assistant_generation_evaluations.sql`):

| Column                                                           | Purpose                               |
| ---------------------------------------------------------------- | ------------------------------------- |
| `id`                                                             | UUID primary key                      |
| `created_at`, `completed_at`                                     | Timestamps (set on insert)            |
| `status`                                                         | `completed`, `abstained`, or `failed` |
| `question`, `question_length`                                    | Normalized visitor question           |
| `answer_text`, `support_level`, `abstained`, `abstention_reason` | Public answer summary                 |
| `failure_category`                                               | Set when `status = failed`            |
| `evidence_unit_ids`, `evidence_ids`                              | JSON arrays of identifiers only       |
| `retrieved_evidence_count`, `attribution_counts`                 | Diagnostic metadata                   |
| `model`, token fields, latency fields                            | Copied from generation diagnostics    |

No evidence packet bodies, prompts, IP addresses, or client identifiers.

## Privacy and retention

- Composer disclosure: questions and answers may be stored up to 30 days to improve the assistant (see `AssistantComposer`).
- **PostHog:** generation events remain aggregate-only; do not add question or answer text to telemetry properties. Contract enforced in `generation-telemetry.mjs` (`findForbiddenGenerationTelemetryPropertyKeys`) and tested via `createGenerationTelemetry` + `runRagGeneration` in `tests/assistant-generation-service.test.ts`.
- **Retention default:** 30 days (`ASSISTANT_EVALUATION_RETENTION_DAYS`).
- **Cleanup:** `npm run assistant:evaluation:cleanup` deletes rows with `created_at` older than the retention window. **Not automatic** — schedule operator cron or Vercel Cron in production; setting the env var alone does not delete data.
- **Disable:** `ASSISTANT_EVALUATION_ENABLED=false` or unset `DATABASE_URL`.

## Developer review

Requires `DATABASE_URL` (direct Postgres, same assistant database):

```bash
npm run assistant:evaluation:review -- recent 20
npm run assistant:evaluation:review -- abstained
npm run assistant:evaluation:review -- failed
npm run assistant:evaluation:review -- weak
npm run assistant:evaluation:review -- by-support
npm run assistant:evaluation:review -- show <uuid>
```

No public HTTP route exposes these rows.

## Deployment checklist

1. Merge migration and run `npm run assistant:db:migrate` on the Neon assistant database.
2. Run `npm run assistant:db:verify` (includes `assistant_generation_evaluations`).
3. Schedule `npm run assistant:evaluation:cleanup` (daily recommended).
4. Confirm production `DATABASE_URL` on the generate route.

## Future feedback (explicit integration task)

**Current behavior (this slice):**

- Postgres assigns `assistant_generation_evaluations.id` (UUID) on insert.
- `persistGenerationEvaluationSafely()` returns that id internally but **does not** expose it on the public `POST /api/assistant/generate` JSON envelope — by design for this slice.
- The browser has no stable handle to attach thumbs-up/down to a specific answer yet.

**Follow-up slice (not implemented here):**

1. Decide a client-visible correlation mechanism (e.g. allowlisted `evaluation_id` on success responses, or a signed opaque token).
2. Add a feedback endpoint that accepts rating + that id, validates the row exists and is within retention, and stores feedback in a separate table keyed by `assistant_generation_evaluations.id`.
3. Keep fail-open generation if feedback persistence fails; do not block the answer.

Until that slice ships, operator review uses CLI/SQL only; visitors see the composer retention disclosure but cannot submit structured feedback.

## Related docs

- [assistant-database.md](./assistant-database.md) — migration authority and topology
- Generation telemetry — `scripts/assistant/generation/generation-telemetry.mjs`
