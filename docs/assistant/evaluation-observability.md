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
  → build public answer + envelope validation
  → insert assistant_generation_evaluations (terminal, fail-open)
  → flush PostHog generation telemetry (unchanged)
  → return public JSON (unchanged)
```

- **Single terminal insert** after the API knows the outcome (success, abstention, public-envelope failure, or generation failure). No `completed`/`abstained` row is written if the handler returns a generation-related 500 from envelope validation or post-generation errors.
- **At most one row per accepted request** — a guard prevents a second insert when a terminal record was already written (including fail-open attempts).
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

**Failed rows when `runRagGeneration` throws:** the outer handler persists `failed` with `failure_category` from the error only — evidence IDs and latency fields are included when `runRagGeneration` returned a result but post-processing failed (empty response, envelope validation, or public answer construction). When generation throws before a result object exists, partial diagnostics are not available without redesigning error propagation; operator review may show sparser failed rows for those paths.

## Privacy and retention

- **Composer disclosure:** server-rendered on `/assistant` from `resolveEvaluationObservabilityConfig()` (enabled flag only). When collection is enabled, copy states that questions and responses may be stored to improve the assistant and links removal requests to the [About](/about) contact surface.
- **PostHog:** generation events remain aggregate-only; do not add question or answer text to telemetry properties. Contract enforced in `generation-telemetry.mjs` (`findForbiddenGenerationTelemetryPropertyKeys`) and tested via `createGenerationTelemetry` + `runRagGeneration` in `tests/assistant-generation-service.test.ts`.
- **Recovery diagnostics (generation pipeline):** when validation recovery runs, `runRagGeneration` attaches non-public `recovery_*` fields to generation diagnostics and emits the same boolean/stage/count codes on `assistant_generation_completed` and `assistant_generation_failed` when available (deterministic repair, single model retry, graceful degradation). Failed corrective retries set `recovery_model_retry_attempted` without `recovery_model_retry_succeeded`. Operator logs use `[assistant-generation recovery]` JSON summaries without prompts or evidence bodies.
- **Token metrics:** `completion_tokens` on diagnostics and PostHog success/failure events is cumulative known consumption across initial and corrective model passes when usage metadata exists. `output_token_utilization` on `assistant_generation_completed` only measures the final pass output tokens against `max_output_tokens` (budget signal, not cumulative).
- **What we store:** assistant questions and generated responses may be stored in Postgres to improve answer quality. We do not store visitor identities with these rows.
- **Retention:** evaluation records are kept until explicitly deleted. There is **no** automatic deletion schedule in this repository.
- **Removal requests:** visitors can ask for deletion through the existing contact mechanism on [About](/about). Because we do not store visitor identities, locating a submission may require the question text and an approximate submission date. We do not promise a specific deletion timeframe in product copy.
- **Manual operator cleanup:** `npm run assistant:evaluation:cleanup` deletes rows older than an **explicit** age window (`--days <n>` or `ASSISTANT_EVALUATION_RETENTION_DAYS`). Use only when you intentionally trim history — not as a standing retention policy.
- **Disable collection:** `ASSISTANT_EVALUATION_ENABLED=false` or unset `DATABASE_URL`.

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

## Production activation (operator — after merge)

Do **not** run these steps until this policy slice and migration are merged. Use the **direct** Neon connection string for migrate/verify; pooled `DATABASE_URL` on Vercel is fine for runtime.

**Prerequisites**

- Vercel production (or preview) has `DATABASE_URL` (assistant Neon database), `OPENAI_API_KEY`, and optional generation env vars from `.env.example`.
- Evaluation collection is enabled when `DATABASE_URL` is set and `ASSISTANT_EVALUATION_ENABLED` is not `false`.
- No re-embed, corpus rebuild, or retrieval data migration is required for the evaluation table.

**Sequence**

1. **Apply migration** on the assistant branch (direct `DATABASE_URL`):

   ```bash
   export DATABASE_URL='postgresql://…'  # Neon direct; gitignored / secrets only
   npm run assistant:db:migrate
   ```

   Expect Drizzle to apply `0001_assistant_generation_evaluations` when not yet in `drizzle.__drizzle_migrations`.

2. **Verify schema** (includes `assistant_generation_evaluations`):

   ```bash
   npm run assistant:db:verify
   ```

3. **Confirm evaluation persistence is enabled** — `DATABASE_URL` present; `ASSISTANT_EVALUATION_ENABLED` not `false`.

4. **Controlled generation request** (local with production secrets, or against deployed site):

   ```bash
   npm run dev
   curl -sS -X POST http://localhost:3000/api/assistant/generate \
     -H 'Content-Type: application/json' \
     -d '{"question":"What projects has Michael shipped?"}' | jq .
   ```

   Public JSON shape is unchanged — no evaluation id in the response.

5. **Inspect the evaluation row**:

   ```bash
   npm run assistant:evaluation:review -- recent 5
   ```

6. **Confirm generation remains functional** — expect `200` with `answer` envelope; check PostHog generation events still aggregate-only if configured.

**Migration readiness (repository)**

- **Authority:** Drizzle Kit + `db/schema.ts`; forward SQL in `drizzle/0001_assistant_generation_evaluations.sql` matches `assistantGenerationEvaluations` in `db/schema.ts` (columns, indexes, UUID default).
- **Additive:** creates only `assistant_generation_evaluations` and indexes — no changes to retrieval tables or embeddings.
- **Verify script:** `scripts/assistant/db/verify.mjs` and `scripts/assistant/db/migration-meta.mjs` include the evaluation table.
- **Journal:** `drizzle/meta/_journal.json` tag `0001_assistant_generation_evaluations`.

## Future feedback (explicit integration task)

**Current behavior (this slice):**

- Postgres assigns `assistant_generation_evaluations.id` (UUID) on insert.
- `persistGenerationEvaluationSafely()` returns that id internally but **does not** expose it on the public `POST /api/assistant/generate` JSON envelope — by design for this slice.
- The browser has no stable handle to attach thumbs-up/down to a specific answer yet.

**Follow-up slice (not implemented here):**

1. Decide a client-visible correlation mechanism (e.g. allowlisted `evaluation_id` on success responses, or a signed opaque token).
2. Add a feedback endpoint that accepts rating + that id, validates the row exists, and stores feedback in a separate table keyed by `assistant_generation_evaluations.id`.
3. Keep fail-open generation if feedback persistence fails; do not block the answer.

Until that slice ships, operator review uses CLI/SQL only; visitors see the composer disclosure but cannot submit structured feedback.

## Related docs

- [assistant-database.md](./assistant-database.md) — migration authority and topology
- Generation telemetry — `scripts/assistant/generation/generation-telemetry.mjs`
