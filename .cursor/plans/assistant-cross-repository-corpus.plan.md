---
name: Assistant cross-repository corpus
overview: Discover and selectively ingest high-value professional knowledge from sibling repositories into the existing OKF → derive → ingest pipeline — before RAG generation. Deterministic producers first; explicit publication boundaries.
todos:
  - id: cross-repo-source-inventory
    content: "Plan-only — source inventory, extraction recommendation, eval matrix (docs)"
    status: completed
  - id: corpus-expansion-acceptance-gate
    content: "Operator — merge PR #45, re-ingest ~209 units, retrieval-eval, corpus-expansion plan-closure"
    status: pending
  - id: career-inventory-producer
    content: "Allowlist + pinned snapshots + career/ OKF producer + coverage tests + re-ingest"
    status: pending
  - id: marketplace-public-docs
    content: "Curated cursor-team-marketplace public docs → OKF tooling/ concepts"
    status: pending
  - id: savepoints-public-notes
    content: "Reviewed savepoints notes architecture → OKF (agent memory gap)"
    status: pending
  - id: codenames-engineering-docs
    content: "Bounded codenames docs (AI pipeline, validation) → OKF"
    status: pending
  - id: retrieval-eval-expansion
    content: "Add eval cases + acceptance criteria; run on expanded index; document regressions"
    status: pending
  - id: plan-closure
    content: "Docs-only PR — cross-repo findings, archive plan"
    status: pending
isProject: false
---

# Assistant cross-repository corpus

**Goal:** Improve retrieval evidence for career depth, agent tooling, and independent projects **without** replacing the shipped retrieval stack (OKF, structure-aware units, `text-embedding-3-small`, pgvector ingest, retrieval-eval).

**Inventory (research):** [docs/assistant/cross-repository-source-inventory.md](../../docs/assistant/cross-repository-source-inventory.md)

**Supersedes:** [assistant-career-inventory-corpus.plan.md](assistant-career-inventory-corpus.plan.md) (career work lives as `career-inventory-producer` slice here).

## Status: shipped vs pending vs new

| Item                                                                                                      | State                                                                                |
| --------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------ |
| Vector retrieval experiment + structure-aware chunking                                                    | **Shipped** on `main`                                                                |
| PR [#45](https://github.com/mastermichaelt/portfolio/pull/45) portfolio corpus (~89 concepts)             | **Open** — predecessor; do not duplicate                                             |
| Post-merge ingest + `tests/assistant-retrieval-eval.test.ts` on expanded index                            | **Pending** ([assistant-database.md](../../docs/assistant/assistant-database.md) §6) |
| [assistant-corpus-coverage-expansion.plan.md](assistant-corpus-coverage-expansion.plan.md) `plan-closure` | **Pending** after acceptance                                                         |
| Cross-repo sources (resumes, marketplace, savepoints, …)                                                  | **New work** — this plan                                                             |
| RAG generation / chat UI                                                                                  | **Out of scope** — after corpus + eval                                               |

## Architectural extension (minimal)

```text
allowlist + publication review (portfolio repo)
        ↓
deterministic cross-repo producers (new) ──→ existing okf:build
        ↓
existing assistant:derive → assistant:ingest → pgvector
        ↓
retrieval-eval (+ new cases) — regression baselines preserved
```

- **Stable IDs:** `career/<fact-id>`, `tooling/<doc-slug>`, `repo/<project>-<section>` — extend `listConceptFiles`, `cleanGeneratedConcepts`, `sourceClassFromConceptId` as needed.
- **Incremental updates:** unchanged `content_hash` → ingest skip; removed concepts → stale `unit_id` delete (existing sync).
- **Duplicates:** canonicality table in inventory; one body per theme; catalog/summary concepts link to full narrative.
- **Freshness:** pinned snapshots + manifest hashes (same pattern as DEV `published/` and `content-source-registry`).
- **No vector redesign** unless eval proves retrieval infrastructure inadequate.

## Extraction recommendation

**Hybrid policy with deterministic default:** parse YAML and Markdown directly; **no LLM extraction** in v1. Revisit LLM only for a source that cannot be structured deterministically **and** passes publication review (committed snapshot required).

## Recommended execution authority

| Slice                            | Authority                    | Agent instruction                |
| -------------------------------- | ---------------------------- | -------------------------------- |
| cross-repo-source-inventory      | Plan-only PR                 | Inventory doc only; no producers |
| corpus-expansion-acceptance-gate | **Manual verification gate** | Operator only; no code PR        |
| career-inventory-producer        | Open PR only                 | Do not merge                     |
| marketplace-public-docs          | Open PR only                 | Do not merge                     |
| savepoints-public-notes          | Open PR only                 | Do not merge                     |
| codenames-engineering-docs       | Open PR only                 | Do not merge                     |
| retrieval-eval-expansion         | Open PR only                 | Do not merge                     |
| plan-closure                     | Open PR only                 | Do not merge                     |

Repo default: **Open PR only** ([planning-standards.md](../standards/planning-standards.md)).

## Repository topology

Integration branch: `main`. Each implementation slice from latest `origin/main`; PR base `main`. Do not stack cross-repo slices on unmerged PR #45 — merge or rebase after #45 lands.

---

### Slice — `cross-repo-source-inventory`

**Status:** Completed in this research pass ([cross-repository-source-inventory.md](../../docs/assistant/cross-repository-source-inventory.md)).

---

### Slice — `corpus-expansion-acceptance-gate`

**Type:** Operator prerequisite (not an agent implementation PR).

1. Merge PR #45.
2. `npm run assistant:ingest` on intended `DATABASE_URL`.
3. Confirm ~209 units indexed; record ingest summary.
4. `npm run test -- tests/assistant-retrieval-eval.test.ts`.
5. Complete [assistant-corpus-coverage-expansion.plan.md](assistant-corpus-coverage-expansion.plan.md) `plan-closure`.

**Stop:** Document results before starting `career-inventory-producer`.

---

### Slice — `career-inventory-producer` (first measurable coverage)

**Purpose:** Close the largest evidence gap — `mastermichaelt/resumes` career inventory.

**Deliverables:**

- Committed public allowlist (`facts/`, `roles/`, `meta/` subset)
- Pinned snapshots under `tests/fixtures/assistant-okf/career-inventory/`
- `career-inventory-producer.mjs` + `source_class: career`
- Coverage tests (snapshot hashes)
- Re-ingest; note unit count delta

**Does not include:** `applications/**`, `out/`, `stories/`, per-application variants

**Depends on:** `corpus-expansion-acceptance-gate` (recommended)

**Design:** [career-inventory-corpus-direction.md](../../docs/assistant/career-inventory-corpus-direction.md)

---

### Slice — `marketplace-public-docs`

**Purpose:** Answer visitor questions about Cursor Team Marketplace and team-harness.

**Source repo:** `multipliers-dev/cursor-team-marketplace` (verified name).

**Deliverables:** Pinned public paths only — `README.md`, `docs/engineering-invariants.md`, `plugins/team-harness/docs/layers.md` (and optionally `versioning.md`); OKF `tooling/` or `repo/` namespace; no bulk `SKILL.md` without review.

**Depends on:** `career-inventory-producer` merged (recommended ordering, not hard)

---

### Slice — `savepoints-public-notes`

**Purpose:** Address retrieval-eval `agent-memory-corpus-gap` with approved public architecture notes.

**Deliverables:** Human-reviewed excerpt or full `notes/architecture-direction.md` (+ optional `savepoints-6-pager.md` summary concept); exclude `.cursor/plans/` and hook implementation detail.

**Depends on:** publication review sign-off

---

### Slice — `codenames-engineering-docs`

**Purpose:** Deeper Codenames AI engineering evidence beyond case study + articles.

**Deliverables:** Bounded concepts from `docs/ai-pipeline-outcome.md`, `docs/judge-ai-validation-flow.md` via section extractor; pinned fixtures.

**Priority:** P2 — merge-safe alone if scope stays small.

---

### Slice — `retrieval-eval-expansion`

**Purpose:** Prove improved coverage without weakening existing cases.

**Deliverables:**

- New fixture cases (see below) added to `tests/fixtures/assistant-retrieval/eval-cases.json`
- Run eval on fully re-ingested index; document pass/fail in findings doc
- Adjust fixtures only after reviewing ranking competition (do not weaken baselines preemptively)

**Depends on:** prior source slices merged and re-ingested

---

### Slice — `plan-closure`

Archive plan; link inventory + operator findings; mark todos complete.

---

## Proposed retrieval-eval additions (after new sources)

Add **positive** cases (draft — tune `expected_parent_concepts` after first ingest):

| id                              | question                                                             | expected sources (parent concepts)                                           |
| ------------------------------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `admin-hub-experimentation`     | What did Michael do with Admin Hub and experimentation at Atlassian? | `career/admin-hub-experimentation`, `about/atlassian-swe-2024`               |
| `cross-flow-attribution-depth`  | What was the Cross Flow attribution formula and why did it matter?   | `career/cross-flow-experiment-measurement`                                   |
| `cursor-team-marketplace`       | What is the Cursor Team Marketplace and what does it provide?        | `tooling/cursor-team-marketplace-overview` (or chosen id)                    |
| `savepoints-architecture`       | What is Savepoints and how does capture review work?                 | `tooling/savepoints-architecture-direction` (or chosen id)                   |
| `codenames-validation-pipeline` | How does Codenames AI validate LLM outputs?                          | `repo/codenames-ai-validation-flow`, `portfolio/codenames-ai-b01-validation` |

**Acceptance criteria:**

- All **pre-existing** eval cases remain passing on the expanded index (regression baseline).
- New cases pass **or** failures are recorded with parent-rank diagnostics and corpus-gap classification — fixtures updated only in a follow-up PR with rationale.
- `corpus_gap` and `negative_inspection` cases unchanged in intent.

---

## Agent prompts (copy/paste for Cursor)

### corpus-expansion-acceptance-gate

```text
Manual verification gate only — do not implement code or open a PR.

Prerequisites: PR #45 merged to main.

Run: npm run assistant:ingest; confirm unit count ~209; npm run test -- tests/assistant-retrieval-eval.test.ts.

Report pass/fail and ingest summary. Then execute assistant-corpus-coverage-expansion plan-closure (docs-only archive PR) if eval acceptable.

Mark corpus-expansion-acceptance-gate completed in assistant-cross-repository-corpus.plan.md only if your scope includes plan frontmatter update in that closure PR.
```

### career-inventory-producer

```text
@.cursor/plans/assistant-cross-repository-corpus.plan.md

Implement slice career-inventory-producer only. Prerequisite: corpus-expansion-acceptance-gate complete (PR #45 merged + eval run).

Authority: Open PR only — do not merge. Topology: origin/main; base main.

Use docs/assistant/cross-repository-source-inventory.md and career-inventory-corpus-direction.md. Deterministic YAML producer + allowlist + pinned snapshots only. Extend pipeline (career/ namespace, source_class) without replacing ingest/derive.

Mark career-inventory-producer completed in plan frontmatter in the same PR.
```

### marketplace-public-docs

```text
@.cursor/plans/assistant-cross-repository-corpus.plan.md

Implement slice marketplace-public-docs only. Authority: Open PR only. Curated public docs from multipliers-dev/cursor-team-marketplace via pinned fixtures — no agent plan bulk ingest.

Mark marketplace-public-docs completed in frontmatter in the same PR.
```

### savepoints-public-notes

```text
@.cursor/plans/assistant-cross-repository-corpus.plan.md

Implement slice savepoints-public-notes only. Authority: Open PR only. Human-reviewed public notes only; exclude .cursor/plans and hooks.

Mark savepoints-public-notes completed in frontmatter in the same PR.
```

### codenames-engineering-docs

```text
@.cursor/plans/assistant-cross-repository-corpus.plan.md

Implement slice codenames-engineering-docs only. Authority: Open PR only. Bounded docs/ markdown sections only.

Mark codenames-engineering-docs completed in frontmatter in the same PR.
```

### retrieval-eval-expansion

```text
@.cursor/plans/assistant-cross-repository-corpus.plan.md

Implement slice retrieval-eval-expansion only. Authority: Open PR only. Add eval cases per plan; run against re-ingested index; document results. Do not weaken existing cases without documented regression analysis.

Mark retrieval-eval-expansion completed in frontmatter in the same PR.
```

### plan-closure

```text
@.cursor/plans/assistant-cross-repository-corpus.plan.md

Execute plan-closure only. Docs-only archive PR; Open PR only; do not merge.

Move plan to .cursor/plans/archive/2026-10-08-assistant-cross-repository-corpus.plan.md; add # Shipped note; mark plan-closure completed.
```
