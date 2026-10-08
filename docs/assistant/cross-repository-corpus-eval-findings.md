# Cross-repository corpus — retrieval eval findings

**Slice:** `retrieval-eval-expansion` ([archived plan](../../.cursor/plans/archive/2026-10-08-assistant-cross-repository-corpus.plan.md))

**Prerequisite:** Cross-repo OKF producers merged (`career-inventory-producer`, `marketplace-public-docs`, `savepoints-public-notes`, `codenames-engineering-docs`) and structure-aware corpus re-ingested on the assistant `DATABASE_URL`.

## Operational acceptance (2026-10-08)

Command: `npm run test -- tests/assistant-retrieval-eval.test.ts`

| Result                  | Detail                                                                                                                          |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Vitest                  | All tests passed (helpers + integration when `DATABASE_URL` and `OPENAI_API_KEY` set)                                           |
| **Baseline regression** | **6/6** pre-expansion positives (`BASELINE_POSITIVE_IDS` in `assistant-retrieval-eval.test.ts`; fixture list must match) passed |
| **Scored positives**    | **12/12** `kind: positive` cases passed on the cross-repo expanded index                                                        |
| **Diagnostics**         | **1** case: `nuclear-reactor-negative-inspection` (`negative_inspection`) — observations logged only                            |

Fixtures: [`tests/fixtures/assistant-retrieval/eval-cases.json`](../../tests/fixtures/assistant-retrieval/eval-cases.json)

### Reclassified case: `agent-memory-corpus-gap`

Previously `corpus_gap` (no Savepoints OKF in corpus). After `savepoints-public-notes` indexing, reclassified to **`positive`** with parents `tooling/savepoints-architecture-direction` and `career/savepoints-durable-capture`.

**Corpus presence vs default top-K:** This case proves Savepoints OKF is **indexable and retrievable** for an agent-memory phrasing — not that a default top-5 (or chat-sized) retrieval would surface it. On the ingested index, agent-portability writing still dominates ranks 1–9; `tooling/savepoints-architecture-direction` first appears at **parent rank 10** (cosine distance ~0.63). The fixture uses `top_k: 10` and `min_parent_rank: 10` accordingly. **Known limitation:** ranking improvements for this question belong to a later phase; do not treat a pass here as reliable agent-memory Q&A at production `top_k`.

### New positive cases (cross-repo coverage)

| Case id                         | Parent match (first expected in top-K)               | Notes                                                                                                                               |
| ------------------------------- | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| `admin-hub-experimentation`     | `career/admin-hub-experimentation` @ rank 1          | `about/atlassian-swe-2024` @ rank 5                                                                                                 |
| `cross-flow-attribution-depth`  | `career/cross-flow-experiment-measurement` @ rank 2  | `portfolio/experiment-measurement-b01-attribution` @ rank 1 (related portfolio block; career fact still within `min_parent_rank` 5) |
| `cursor-team-marketplace`       | `tooling/cursor-team-marketplace-overview` @ rank 1  |                                                                                                                                     |
| `savepoints-architecture`       | `tooling/savepoints-architecture-direction` @ rank 1 |                                                                                                                                     |
| `codenames-validation-pipeline` | `repo/codenames-ai-validation-flow` @ rank 2         | `portfolio/codenames-ai-case` @ rank 1 (product case; validation repo doc within rank 5)                                            |

### Diagnostic: `nuclear-reactor-negative-inspection`

Unchanged. Harness logs top-K distances and titles for manual review; **not** a pass/fail gate. Compare against positive baselines via the integration test’s distance comparison log.

## Regression policy

Do not weaken `expected_parent_concepts`, `min_parent_rank`, or `require_specificity` on baseline or new positives without recording parent-rank diagnostics here (or in PR rationale). Expanded corpus increases top-K competition — optional `optional_unit_miss` on `developer-infrastructure` remains non-blocking.

## Related

- [corpus-coverage-expansion.md § Operational acceptance](./corpus-coverage-expansion.md#operational-acceptance) — pre-cross-repo baseline (6 scored positives + 2 diagnostics)
- [vector-retrieval-experiment.md](./vector-retrieval-experiment.md) — harness vocabulary and historical reference run
