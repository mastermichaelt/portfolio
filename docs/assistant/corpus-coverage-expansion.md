---
title: Corpus coverage expansion findings
status: shipped
updated: 2026-10-08
related:
  - docs/assistant/architecture-direction.md
  - docs/assistant/vector-retrieval-experiment.md
  - docs/assistant/assistant-database.md
  - .cursor/plans/archive/2026-10-08-assistant-corpus-coverage-expansion.plan.md
  - .cursor/plans/assistant-career-inventory-corpus.plan.md
---

# Corpus coverage expansion findings

Follow-on to the [vector retrieval experiment](./vector-retrieval-experiment.md): expand **what** is normalized into OKF and indexed with the **same** structure-aware retrieval-unit derivation — without reopening 1:1 vs 1:N mapping, embedding model changes, or ingest-sync rewrites.

**Next active plan:** [assistant-career-inventory-corpus.plan.md](../../.cursor/plans/assistant-career-inventory-corpus.plan.md) — public-safe career inventory from `mastermichaelt/resumes` before RAG generation.

## Outcome

| Area                           | Result                                                                                                                                                                      |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Production portfolio OKF scope | **Shipped** — supporting + flagship cases, full article catalog, DEV article bodies (pinned fixtures), ecosystem inventory/graph/workflows, About, Renovate runbook fixture |
| Content drift guard            | **Shipped** — `tests/okf-content-coverage.test.ts` pins `content/` module hashes; content edits require paired producer/registry updates                                    |
| Retrieval machinery            | **Unchanged** — `okf:build` → `assistant:derive` (structure-aware) → `assistant:ingest`; same embedding model and pgvector exact cosine                                     |
| Scale (reference build)        | **89** OKF concepts (was **35** on bounded experiment corpus); structure-aware derive → **~209** retrieval units (was **~61** on experiment index)                          |
| Career inventory               | **Deferred** — separate plan; About alone is insufficient for evidence-backed career Q&A                                                                                    |

Implementation: [#45](https://github.com/mastermichaelt/portfolio/pull/45). Production corpus scope is documented in [architecture-direction.md](./architecture-direction.md) (Current implementation — production OKF corpus scope).

## Operator acceptance (post-merge, not CI-gated)

After [#45](https://github.com/mastermichaelt/portfolio/pull/45) merges, re-ingest the assistant index and re-run retrieval eval — see [assistant-database.md](./assistant-database.md) §6.

1. `npm run assistant:ingest` against the intended assistant `DATABASE_URL`.
2. Confirm ingest summary and unit count well above the prior ~61-unit experiment baseline.
3. `npm run test -- tests/assistant-retrieval-eval.test.ts` with `DATABASE_URL` and `OPENAI_API_KEY` set.
4. If rankings regress, record here (or in a follow-up doc PR) before weakening `tests/fixtures/assistant-retrieval/eval-cases.json` — more units competing in top-K is expected signal, not noise to fixture away without review.

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
