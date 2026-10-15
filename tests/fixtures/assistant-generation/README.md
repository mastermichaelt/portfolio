# Assistant generation eval fixtures

Frozen **evidence packets** and **eval cases** for `tests/assistant-generation-eval.test.ts` and `scripts/assistant/generation/eval.mjs`. No live Neon or embeddings required for deterministic CI.

## Layout

| Path              | Role                                                       |
| ----------------- | ---------------------------------------------------------- |
| `packets/*.json`  | Pre-assembled `EvidencePacket` snapshots per assembly mode |
| `eval-cases.json` | Questions, mock model JSON, semantic scoring expectations  |

## Assembly modes compared

1. **`no_retrieval`** — empty packet (`packets/empty-no-retrieval.json`); eval-only baseline.
2. **`top_k_only`** — matched retrieval rows only.
3. **`full_parent`** — expanded parent concept units (frozen assembly output).

Retrieval-eval fixtures under `tests/fixtures/assistant-retrieval/` are unchanged.

## Scoring layers

| Layer                                              | Where                                                                                        |
| -------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Citation integrity + structural rules              | `validateGenerationResponse` (generation contract)                                           |
| Citation support, attribution accuracy, abstention | `scripts/assistant/generation/eval.mjs` (deterministic heuristics from fixture expectations) |

Operator-run live model comparisons and LLM-as-judge are optional; not required in CI.
