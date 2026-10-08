---
title: Corpus coverage expansion findings
status: shipped
updated: 2026-10-08
related:
  - docs/assistant/architecture-direction.md
  - docs/assistant/vector-retrieval-experiment.md
  - docs/assistant/assistant-database.md
  - .cursor/plans/archive/2026-10-08-assistant-corpus-coverage-expansion.plan.md
  - .cursor/plans/assistant-cross-repository-corpus.plan.md
---

# Corpus coverage expansion findings

Follow-on to the [vector retrieval experiment](./vector-retrieval-experiment.md): expand **what** is normalized into OKF and indexed with the **same** structure-aware retrieval-unit derivation — without reopening 1:1 vs 1:N mapping, embedding model changes, or ingest-sync rewrites.

**Next active plan:** [assistant-cross-repository-corpus.plan.md](../../.cursor/plans/assistant-cross-repository-corpus.plan.md) — cross-repository corpus (career inventory producer first) before RAG generation.

## Outcome

| Area                           | Result                                                                                                                                                                      |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production portfolio OKF scope | **Shipped** — supporting + flagship cases, full article catalog, DEV article bodies (pinned fixtures), ecosystem inventory/graph/workflows, About, Renovate runbook fixture |
| Content drift guard            | **Shipped** — `tests/okf-content-coverage.test.ts` pins `content/` module hashes; content edits require paired producer/registry updates                                    |
| Retrieval machinery            | **Unchanged** — `okf:build` → `assistant:derive` (structure-aware) → `assistant:ingest`; same embedding model and pgvector exact cosine                                     |
| Scale (verified ingest)        | **89** OKF concepts (was **35** on bounded experiment corpus); structure-aware derive → **209** retrieval units (was **~61** on experiment index)                           |
| Operational acceptance         | **Passed** (2026-10-08) — expanded index ingested; retrieval eval green; no blocking regressions (see below)                                                                |
| Career inventory               | **Deferred** — separate plan; About alone is insufficient for evidence-backed career Q&A                                                                                    |

Implementation: [#45](https://github.com/mastermichaelt/portfolio/pull/45). Production corpus scope is documented in [architecture-direction.md](./architecture-direction.md) (Current implementation — production OKF corpus scope).

## Operational acceptance

**Verdict:** The expanded production corpus **passed** the post-[#45](https://github.com/mastermichaelt/portfolio/pull/45) operator acceptance gate (documented in [assistant-database.md](./assistant-database.md) §6). Ingest and retrieval-eval were run against the intended assistant `DATABASE_URL` with `OPENAI_API_KEY` set. **No blocking retrieval regressions** were observed on the six **scored** positive cases; diagnostic cases behaved as designed (see [eval fixtures README](../../tests/fixtures/assistant-retrieval/README.md)).

### Ingestion

Command: `npm run assistant:ingest`

| Metric                     | Value                                  |
| -------------------------- | -------------------------------------- |
| OKF concepts               | 89                                     |
| Derived retrieval units    | 209                                    |
| Units requiring embeddings | 153                                    |
| Unchanged units            | 56                                     |
| Inserted                   | 148                                    |
| Updated                    | 5                                      |
| Deleted                    | 0                                      |
| Skipped                    | 56                                     |
| Embedding model            | `text-embedding-3-small`               |
| Run ID                     | `cc94272f-0572-434e-b835-b5649dacbba7` |

### Retrieval evaluation

Command: `npm run test -- tests/assistant-retrieval-eval.test.ts`

| Result                              | Detail                                                                                                                                |
| ----------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Vitest                              | **18/18** tests passed                                                                                                                |
| Scored positives (`kind: positive`) | **6/6** passed — parent concepts met `min_parent_rank` on the expanded index                                                          |
| Diagnostics (not scored as passes)  | **2** cases ran successfully: `agent-memory-corpus-gap` (`corpus_gap`), `nuclear-reactor-negative-inspection` (`negative_inspection`) |

**Scored case notes (non-blocking signals):**

- **`developer-infrastructure`** — scored **pass** (expected parent ranked first). Logged a non-blocking `optional_unit_miss` on optional `expected_unit_any_of` unit globs; parent-level retrieval satisfied the case.
- **`agent-memory-corpus-gap`** — diagnostic only; still **no dedicated agent-memory evidence** in the corpus (expected gap signal, not a scored failure).
- **`nuclear-reactor-negative-inspection`** — diagnostic only; logs distances/titles for an out-of-corpus question. **No abstention guarantee** is established at the retrieval stage (abstention belongs to later grounded-generation work per [vector-retrieval-experiment.md](./vector-retrieval-experiment.md)).

If future re-ingests change rankings, record outcomes here before weakening `tests/fixtures/assistant-retrieval/eval-cases.json` — expanded top-K competition is expected signal, not noise to fixture away without review.

## Known gaps (unchanged by this milestone)

- **Pinned published article fixtures** — slug coverage ≠ body freshness vs editorial hub master; no live DEV fetch in OKF build ([architecture-direction.md](./architecture-direction.md)).
- **Timeline / homepage metaphor copy** — not in corpus until content ships and eval shows gaps.
- **Additional sibling-repo runbooks** — bounded to Renovate fixture for now.

## Explicit non-goals (this milestone)

Reopening 1:1 vs structure-aware chunking, ANN indexes, hybrid search, answer generation, chat UI, whole-resumes-repo ingestion, live network fetch at `okf:build` time.

## Related artifacts

| Artifact                   | Location                                                                                                                                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Archived execution plan    | [.cursor/plans/archive/2026-10-08-assistant-corpus-coverage-expansion.plan.md](../../.cursor/plans/archive/2026-10-08-assistant-corpus-coverage-expansion.plan.md) |
| Prior experiment findings  | [vector-retrieval-experiment.md](./vector-retrieval-experiment.md)                                                                                                 |
| Coverage tests             | [tests/okf-content-coverage.test.ts](../../tests/okf-content-coverage.test.ts)                                                                                     |
| Published article fixtures | [tests/fixtures/assistant-okf/published/](../../tests/fixtures/assistant-okf/published/)                                                                           |
