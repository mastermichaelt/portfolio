---
title: Vector retrieval experiment findings
status: shipped
updated: 2026-10-08
related:
  - docs/assistant/architecture-direction.md
  - docs/assistant/assistant-database.md
  - docs/assistant/okf-normalization-experiment.md
  - docs/assistant/rag-generation-direction.md
  - .cursor/plans/archive/2026-10-07-assistant-vector-retrieval-experiment.plan.md
  - .cursor/plans/archive/2026-10-08-assistant-corpus-coverage-expansion.plan.md
  - docs/assistant/corpus-coverage-expansion.md
---

# Vector retrieval experiment findings

Multi-slice experiment validating **derive → embed → sync → retrieve → eval** over a **bounded** OKF corpus (~35 concepts → **61 structure-aware retrieval units** on the reference ingested index). This document records evidence and architectural conclusions. It is not a runtime specification.

**Follow-on (shipped):** [corpus-coverage-expansion.md](./corpus-coverage-expansion.md) — production portfolio OKF scope on the same structure-aware pipeline. **Next active plan:** [assistant-career-inventory-corpus.plan.md](../../.cursor/plans/assistant-career-inventory-corpus.plan.md).

## Experiment conclusion

| Finding                                         | Result                                                                              |
| ----------------------------------------------- | ----------------------------------------------------------------------------------- |
| Postgres + pgvector as retrieval backbone       | **Yes** — local Docker + hosted Neon operator path; schema in `db/migrations/`      |
| Thin OpenAI embeddings adapter                  | **Yes** — `text-embedding-3-small`, batching/retries, dimension validation          |
| Idempotent ingest (upsert/skip/delete stale)    | **Yes** — index is derived; canonical truth remains Git sources → OKF               |
| Inspectable retrieval CLI                       | **Yes** — cosine distance + provenance fields; no LLM answers                       |
| Structure-aware 1:N retrieval units             | **Yes** — production strategy; historical 1:1 derivation was infrastructure-only    |
| Bounded corpus retrieval quality (fixture eval) | **Yes** — six scored positive cases pass on structure-aware index (see below)       |
| Full portfolio coverage                         | **No** — deferred to corpus coverage expansion plan                                 |
| Answer generation / abstention thresholds       | **No** — documented in [rag-generation-direction.md](./rag-generation-direction.md) |

## Pipeline (shipped dev tooling)

```text
content/ + fixtures
        ↓
npm run okf:build          → generated/okf/ (gitignored)
        ↓
npm run assistant:derive   → generated/retrieval-units.json (structure-aware 1:N)
        ↓
npm run assistant:ingest   → assistant_retrieval_units + embeddings (DATABASE_URL)
        ↓
npm run assistant:retrieve → top-K cosine search (exact; no ANN)
        ↓
retrieval-eval (Vitest)    → fixture cases when DATABASE_URL + OPENAI_API_KEY set
```

Operator workflow: [assistant-database.md](./assistant-database.md).

## Storage and sync model

| Layer                         | Canonical? | Notes                                                            |
| ----------------------------- | ---------- | ---------------------------------------------------------------- |
| `content/`, repo/DEV fixtures | Yes        | Git                                                              |
| OKF concepts                  | No         | Ephemeral `generated/okf/`                                       |
| Retrieval units               | No         | Derived at `assistant:derive`; stable `unit_id` + `content_hash` |
| Embeddings / pgvector rows    | No         | Rebuildable via ingest; **not** source of truth                  |

**Sync semantics:** ingest compares `content_hash` and embedding model config; upserts changed units, skips unchanged, deletes rows whose `unit_id` disappeared from the current derivation output. Ingestion run metadata is recorded for inspection.

**Two Postgres concerns (unchanged):** site `PortfolioRepository` persistence (future) vs assistant `DATABASE_URL` index — separate connection strings, schemas, and migration lifecycles.

## pgvector representation and search

- Column type: `vector(1536)` fixed to `text-embedding-3-small`.
- Metric: cosine distance via pgvector `<=>` on unit-normalized embeddings.
- CLI reports `cosine_distance` (lower = nearer) and `similarity = 1 - cosine_distance` as a **diagnostic only**.
- **Exact search** over all rows — deliberate baseline. ANN (HNSW/IVFFlat) is a later optimization once corpus size and latency justify it.
- Optional CLI filter: `--filter-source-class` (metadata on `source_class`); no hybrid lexical search in this experiment.

Model or dimension change requires a **schema migration and full re-embed**, not an env-only swap.

## OKF boundary (unchanged from normalization experiment)

OKF remains a **transient normalization boundary**. Retrieval units add structure-aware chunking and embed-facing `text`; they do not replace canonical sources or become a second content store.

## Structure-aware chunking (production strategy)

Derivation: `scripts/assistant/retrieval/chunk-okf-body.mjs` + `derive-units.mjs`.

- Split OKF markdown bodies on ATX headings (`#`–`###`), fence-aware (no false splits inside code fences).
- Body before the first heading → `intro` chunk.
- Oversized sections: greedy paragraph merge up to ~1200 estimated tokens; single huge paragraphs emit once (no mid-paragraph split).
- **Stable IDs:** single-chunk concepts → `unit/{okf_concept_id}`; multi-chunk → `unit/{okf_concept_id}#{partKey}` (`intro`, heading slug, or `{slug}-p{n}` for paragraph splits).
- Every unit carries parent `okf_concept_id`, `sources`, `resource`, and chunk metadata (`section_heading`, `part_key`, optional `chunk_index` / `chunk_count`).

**Lessons from chunk boundaries**

1. **Parent vs passage:** Chunk-level search can rank a case overview section (e.g. `#elsewhere`, `#intro`) while the user intent targets a block concept — eval uses `expected_parent_concepts` separately from optional `expected_unit_any_of` / `expected_sections`.
2. **Broad questions vs narrow chunks:** `developer-infrastructure` retrieved a valid parent (`about/agent-infra` at rank 1) but missed optional Renovate/repo unit patterns in top-5 (`optional_unit_miss`) — broaden top-K or tune chunk text for cross-cutting infra questions.
3. **Section eval is intentionally loose (v1):** `expected_sections` matches substring in `section_heading`, `title`, or first 400 chars of `retrieval_text` — enough to catch gross wrong-section failures; stricter heading-only matching is a follow-on eval improvement.
4. **Do not normalize for retrieval:** chunking reads OKF bodies as produced; fixing boundaries belongs in producers or OKF body shape, not ad hoc retrieval hacks.

Historical **1 OKF concept → 1 unit** (`retrieval-units` slice) validated embeddings and ingest only; it is not maintained as a parallel strategy.

## Retrieval eval results

Harness: `tests/assistant-retrieval-eval.test.ts`, fixtures `tests/fixtures/assistant-retrieval/eval-cases.json`, helpers `scripts/assistant/retrieve/eval.mjs`.

**Run conditions:** integration cases execute when `DATABASE_URL` points at a migrated index with a **structure-aware corpus ingested** and `OPENAI_API_KEY` is set. CI skips integration when unset; unit tests for eval helpers always run.

**Reference run (2026-10-08, local ingested index, 61 units):**

| Case id                               | Kind                | Scored result | Notes                                                                                                                    |
| ------------------------------------- | ------------------- | ------------- | ------------------------------------------------------------------------------------------------------------------------ |
| `experimentation-infrastructure`      | positive            | Pass          | Parent `about/atlassian-swe-2024` at rank 2 (within `min_parent_rank` 5)                                                 |
| `managed-engineers`                   | positive            | Pass          | Parent `about/atlassian-em-2020` at rank 1                                                                               |
| `return-to-ic`                        | positive            | Pass          | Parent `about/summary` at rank 1                                                                                         |
| `attribution-experience`              | positive            | Pass          | Specificity enforced — parent + unit + section "Attribution"                                                             |
| `ai-built`                            | positive            | Pass          | Parent `about/codenames-ai` at rank 1                                                                                    |
| `developer-infrastructure`            | positive            | Pass          | Parent `about/agent-infra` at rank 1; `optional_unit_miss` for Renovate/repo unit globs (non-blocking)                   |
| `agent-memory-corpus-gap`             | corpus_gap          | Diagnostic    | No dedicated agent-memory/Savepoints evidence in top-K (`memory_related_hits: []`) — **corpus gap**, not harness failure |
| `nuclear-reactor-negative-inspection` | negative_inspection | Diagnostic    | Top hit `about/summary`; best cosine distance **0.72** vs **0.54** for `managed-engineers` positive baseline             |

### Failure modes (harness vocabulary)

| Mode                                           | Meaning                                                      |
| ---------------------------------------------- | ------------------------------------------------------------ |
| `missing_parent_context`                       | No expected `okf_concept_id` in top-K                        |
| `parent_rank_too_low`                          | Parent found but below `min_parent_rank`                     |
| `wrong_chunk_or_over_split`                    | Required unit pattern absent (`require_specificity: true`)   |
| `unit_rank_too_low`                            | Required unit pattern too deep in ranking                    |
| `wrong_section`                                | Required section substring absent when specificity enforced  |
| `optional_unit_miss` / `optional_section_miss` | Logged for tuning; non-blocking unless `require_specificity` |

**Negative-query lesson:** Vector search **always** returns top-K. Unsupported questions still surface career-summary-like units; distance gaps vs positive cases are modest on this corpus — **retrieval distance thresholds** belong to grounded generation ([rag-generation-direction.md](./rag-generation-direction.md)), not this retrieval slice.

**Corpus-gap lesson:** Questions about topics not in the bounded corpus (e.g. agent memory / Savepoints writing) may return loosely related "agent" or "elsewhere" chunks — record as coverage gap; abstention is out of scope here.

## Dedicated vector DB vs Postgres

For this corpus size and operator model, **Postgres + pgvector** is sufficient: one migration path, SQL inspection, shared Neon ops pattern, exact cosine baseline. A dedicated vector SaaS would add another lifecycle without solving OKF derivation or provenance — reconsider only if scale, hybrid search, or ops constraints change.

## Readiness for grounded generation

**Ready (retrieval stage):**

- Deterministic structure-aware units with parent linkage and provenance fields
- Rebuildable index and idempotent ingest
- Inspectable CLI and fixture eval for regression when secrets are available

**Not implemented (generation stage):**

- Evidence packet assembly, token budgeting, parent-context expansion after chunk hit
- LLM answers, citations rendering, abstention / confidence thresholds
- Public API routes or chat UI

See [rag-generation-direction.md](./rag-generation-direction.md) for proposed generation architecture and open decisions.

## Explicit non-goals (this experiment)

Chat UI, answer generation, LangChain/LlamaIndex, Pinecone-style SaaS, ANN indexes, hybrid lexical+semantic search, reranking, public assistant endpoints, full-site OKF producers.

## Related artifacts

| Artifact                     | Location                                                                                                                                                               |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Archived execution plan      | [.cursor/plans/archive/2026-10-07-assistant-vector-retrieval-experiment.plan.md](../../.cursor/plans/archive/2026-10-07-assistant-vector-retrieval-experiment.plan.md) |
| Follow-on coverage (shipped) | [corpus-coverage-expansion.md](./corpus-coverage-expansion.md); archived [plan](../../.cursor/plans/archive/2026-10-08-assistant-corpus-coverage-expansion.plan.md)    |
| Eval fixtures README         | [tests/fixtures/assistant-retrieval/README.md](../../tests/fixtures/assistant-retrieval/README.md)                                                                     |
