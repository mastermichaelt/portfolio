# Assistant generation eval findings

Stub for operator-recorded results from the generation eval harness (`scripts/assistant/generation/eval.mjs`, `tests/assistant-generation-eval.test.ts`).

## Deterministic CI

Required checks use **frozen evidence packets** and **mock model JSON** — citation integrity (contract), citation support, attribution accuracy, and abstention scorers. No LLM-as-judge in CI.

## Assembly modes

| Mode           | Role                                                       |
| -------------- | ---------------------------------------------------------- |
| `no_retrieval` | Model-only baseline (empty packet); eval-only              |
| `top_k_only`   | Matched retrieval rows only                                |
| `full_parent`  | Default production assembly (frozen snapshots in fixtures) |

## Operator follow-ups (not blocking CI)

- Live `assistant:answer` comparisons across assembly modes on the ingested index
- Semantic spot checks and cost/latency notes before `operational-acceptance`
- Optional LLM-as-judge or human rubric scores — record here when run

## Sign-off

Operational acceptance and public-ready sign-off are tracked in the grounded RAG plan (`operational-acceptance` slice). Do not treat this stub as production verification.
