---
title: Portfolio assistant — RAG generation direction
subtitle: Design considerations between retrieval and grounded answers (not implemented)
status: draft
version: 0.1.0
updated: 2026-10-08
related:
  - docs/assistant/architecture-direction.md
  - docs/assistant/assistant-database.md
  - docs/assistant/okf-normalization-experiment.md
  - .cursor/plans/assistant-vector-retrieval-experiment.plan.md
---

# RAG generation direction

This note captures **future** answer-generation architecture for the portfolio assistant. It does **not** specify API routes, prompts, models, or implementation slices. It preserves design considerations so a full RAG pipeline can be designed holistically when that milestone arrives.

Sections use the same labels as [architecture-direction.md](./architecture-direction.md): **current implementation**, **proposed design option**, **open decision**, **architectural direction**.

**Explicit non-goals for this document:** changing active `.cursor/plans/` scope, implementing chat UI, or shipping generation code.

---

## Implemented retrieval boundary (today)

**Current implementation.** Visitor-facing RAG does not exist. The production Next.js app has no `app/api/` assistant routes and no chat UI.

**Current implementation (assistant dev tooling).** The bounded-corpus retrieval pipeline is shipped as CLIs outside the app bundle:

```text
canonical sources (content/, fixtures, selected repo/writing producers)
        ↓
npm run okf:build          → generated/okf/ (transient OKF concepts)
        ↓
npm run assistant:derive   → retrieval units (in-memory / JSON inspect)
        ↓
npm run assistant:ingest   → OpenAI embeddings + Postgres pgvector (derived index)
        ↓
npm run assistant:retrieve → top-K vector hits + provenance metadata (CLI)
        ↓
(answer generation)        → not implemented — hard stop
```

**Current implementation.** Retrieval-unit derivation is **structure-aware 1:N** from OKF concept bodies: deterministic `unit_id`, `content_hash`, parent `okf_concept_id`, optional `section_heading`, `chunk_index` / `chunk_count`, and OKF `sources` / `resource` on every unit. Chunking lives in `scripts/assistant/retrieval/` only — not in OKF producers. Ingest is granularity-agnostic (upsert/skip/delete by derived `unit_id` set).

**Current implementation.** Vector search uses `text-embedding-3-small` @ 1536 dimensions, pgvector cosine distance (`<=>`), exact search (no ANN index in the first experiment). Operator workflow: [assistant-database.md](./assistant-database.md).

**Current implementation.** Active experiment work includes **retrieval evaluation** (question fixtures against the ingested index) — measuring retrieval quality, not grounded answers.

### Boundary with future answer generation

**Architectural direction (decision).** Treat **retrieval** and **generation** as separate subsystems with a narrow, typed handoff:

| Stage                 | Owns                                                          | Does not own                                 |
| --------------------- | ------------------------------------------------------------- | -------------------------------------------- |
| **Retrieval**         | Query embedding, similarity search, filters, hit ranking      | Natural-language answers, citations in prose |
| **Evidence assembly** | Selecting, expanding, grouping, budgeting context for the LLM | Rewriting canonical sources as truth         |
| **Generation**        | Grounded answer text, citation surfacing, abstention UX       | OKF normalization, embedding index schema    |

**Architectural direction.** `PortfolioRepository` and page routes must not depend on retrieval or generation. Future `app/api/` (or equivalent) may call retrieval + assembly + generation; the browsable site remains valid with the assistant removed.

**Open decision.** Whether evidence assembly runs in the same server process as retrieval, a dedicated module, or a durable workflow step — defer until generation milestone planning.

---

## Evidence assembly (retrieval → LLM context)

**Architectural direction.** Raw top-K vector hits are an **input** to evidence assembly, not the final prompt context. Assembly turns hits into a **bounded evidence packet**: ordered passages, stable citation keys, deduplicated parent coverage, and metadata the model can attribute.

**Proposed design option — minimal packet (baseline).** Concatenate top-K `retrieval_text` (or title + body slice) with fixed separators; attach parallel citation registry (`unit_id`, `okf_concept_id`, `resource`, `sources`, section/chunk fields). No expansion beyond retrieved rows.

**Proposed design option — parent-context expansion (“small-to-big”).** Retrieve at **chunk granularity** (precise vector match), then **expand** selected hits with additional text from the same parent OKF concept before generation. Motivation for this corpus:

- Bounded size (~tens of concepts, ~order 10² retrieval units after structure-aware chunking).
- Strong parent key: every unit carries `okf_concept_id` and shared `resource` / `sources`.
- Chunk hits may be locally relevant but omit neighbouring section context the model needs for coherent answers.

**This is a proposed design option, not an approved implementation requirement.** Evaluation (retrieval-eval and later answer-eval) should justify whether expansion helps more than it adds noise or token cost.

### Parent-context expansion patterns (options, not commitments)

| Pattern                          | Idea                                                                                                          | When it might help                                                             | Risk                                                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------ |
| **Neighbouring-chunk expansion** | After a hit on `unit/{concept}#{part}`, also include adjacent `chunk_index` ± N for the same `okf_concept_id` | Section-specific questions where the answer spans chunk boundaries             | Redundant or off-topic neighbouring text                                 |
| **Full-parent expansion**        | Replace or supplement the hit with all units sharing `okf_concept_id`                                         | Small concepts where the full OKF body fits comfortably in the evidence budget | Defeats purpose of chunking for long concepts; token blowups             |
| **Grouped deduplication**        | Multiple top-K hits on the same `okf_concept_id` merge into one parent group with ordered chunks              | Avoid repeating title/sources; present one citation per parent                 | Must preserve which chunk was the primary retrieval signal for debugging |
| **Selective parent fetch**       | Expand only parents of hits above a similarity threshold (or top rank per parent)                             | Balance sufficiency vs budget                                                  | Threshold tuning; open decision                                          |

**Open decision.** Expansion policy per question type (career fact vs runbook procedure vs article narrative) vs one global policy.

**Open decision.** Whether expansion reads from **re-derived units** (`assistant:derive`), **stored rows** in Postgres, or **OKF concept bodies** at answer time. Tradeoffs: consistency with embedded text vs freshness vs avoiding a second normalization path.

---

## Evidence token budgets and context quality

**Architectural direction.** Generation needs an explicit **evidence token budget** (and optionally a separate **generation budget**). Assembly must stop before unbounded parent expansion fills the context window.

**Architectural direction.** Optimize for two criteria that can conflict:

1. **Relevance** — passages most related to the query (vector rank, optional rerank later).
2. **Context sufficiency** — enough surrounding material to answer without inventing bridges between chunks.

**Proposed design option.** Allocate budget in layers: reserve slots for top hits first; spend remaining budget on parent expansion; drop lowest-similarity expanded chunks first when over budget.

**Proposed design option.** Deduplicate at text and citation level: identical `content_hash`, highly overlapping chunk bodies, or repeated canonical `resource` lines should not appear multiple times in the packet unless needed for disambiguation.

**Open decision.** Token counting strategy (model tokenizer vs heuristic) for budget enforcement pre-call.

**Open decision.** Whether to include OKF frontmatter fields in the model context or only `retrieval_text` + citation registry.

---

## Provenance and citations through to answers

**Current implementation.** Each retrieved row exposes `unit_id`, `okf_concept_id`, `source_class`, `title`, `resource`, `sources` (JSON), `retrieval_text`, and `metadata` (tags, chunk provenance, `generated.by`).

**Architectural direction (decision).** Visitor-visible citations must trace to **retrieval provenance**, not URLs invented by the model. Citation granularity may be:

- **Unit-level** — `unit_id` (including chunked `unit/{concept}#{partKey}`),
- **Parent-level** — canonical `resource` for the OKF concept,
- **Source-chain** — entries from OKF `sources[]` when the answer spans multiple originating sources.

**Proposed design option.** Require the generation contract to emit **structured citations** (citation ids referencing the evidence packet registry) with a renderer that maps ids → portfolio routes and external URLs.

**Open decision.** Whether answers cite the **chunk** that retrieved best, the **parent concept**, or both (chunk for precision, parent for stable human link).

**Open decision.** How to cite multi-chunk evidence from one parent without cluttering the UI (footnote list vs inline pills).

---

## Retrieval confidence, abstention, and out-of-corpus questions

**Architectural direction.** Corpus-only assistant knowledge is **bounded**. Questions outside indexed material (e.g. private life details, employers’ internal data, future plans not published) should eventually be handled with explicit **abstention** or careful qualification — not silent invention.

**Current implementation.** No confidence scoring, refusal gates, or abstention UX — by design for early learning ([architecture-direction.md](./architecture-direction.md) grounding posture).

**Proposed design option — retrieval signals for gating (generation-time).** Use inspectable signals before calling the LLM:

- Top hit similarity / distance gap (best vs second-best),
- Whether any hit exceeds a minimum similarity floor,
- Whether top hits agree on `okf_concept_id` or `source_class`,
- Retrieval-eval fixtures documenting expected parents/units.

**Proposed design option — abstention responses.** When signals fail thresholds: short message that the corpus does not contain enough evidence; optional suggested portfolio links from coarse retrieval or static IA — **not** a fabricated answer.

**Open decision.** Threshold values and whether abstention is **fail-closed** (no LLM call) vs **grounded hedge** (LLM with explicit “insufficient evidence” instruction).

**Open decision.** Relationship between retrieval-eval pass/fail and production abstention (evaluation metric vs runtime policy).

**Architectural direction.** Distinguish **“no hits”** from **“weak hits”** from **“hits that do not answer the question”** — the last case may require answer-level evaluation, not retrieval alone.

---

## Evaluation: retrieval quality vs grounded answer quality

**Current implementation (in progress).** The vector retrieval experiment adds a **retrieval-eval** slice: representative questions, expected `okf_concept_id` / optional `unit_id` / section metadata, ranking assertions, failure-mode notes — against the ingested index when `DATABASE_URL` is set.

**Architectural direction (decision).** **Evaluate retrieval separately from grounded generation** until both subsystems exist. Mixing them early obscures whether failures are chunking, embedding, ranking, assembly, or hallucination.

| Layer                 | What to measure (examples)                                                                              | Typical artifacts                                                |
| --------------------- | ------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Retrieval**         | Parent concept recall, chunk specificity, rank of expected unit, distance diagnostics, filter behaviour | retrieval-eval fixtures, `assistant:retrieve --json` transcripts |
| **Evidence assembly** | Budget compliance, deduplication, expansion policy regressions                                          | Unit tests + fixture packets (future)                            |
| **Grounded answer**   | Faithfulness to packet, citation correctness, abstention on negatives, readability                      | Human review, LLM-as-judge (open), comparison to baseline        |

**Open decision.** When to introduce **answer-eval** fixtures (after minimal generation path exists).

**Open decision.** Whether to maintain a **negative question set** (e.g. unrelated topics) for abstention and distance inspection without `must_not_include` claim tests in retrieval-eval.

**Proposed design option.** Keep retrieval-eval as the regression gate for derivation/chunking changes; add answer-eval later that **consumes** frozen evidence packets where possible so assembly + generation can be tested without re-embedding.

---

## Relationship to the active vector retrieval experiment

**Current implementation.** The experiment plan stops at retrieval CLI + retrieval-eval + docs closure — **no answer generation slice**.

**Architectural direction.** Findings from structure-aware chunking and retrieval-eval should **inform** parent-context expansion and citation design, not automatically add generation scope to the same plan.

**Open decision.** Name and staging of the **first generation experiment** (API route vs CLI `assistant:answer` vs internal-only) — plan when retrieval-eval has baseline results.

---

## Changelog

| Date       | Change                                                                                                                                                                         |
| ---------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 2026-10-08 | Initial draft: retrieval/generation boundary, evidence assembly options, parent-context expansion as proposed (not mandated), budgets, citations, abstention, split evaluation |
