---
name: Assistant cross-repository corpus
overview: Cross-repository OKF producers, publication boundaries, and retrieval-eval expansion — shipped 2026-10-08; archived after plan-closure.
todos:
  - id: cross-repo-source-inventory
    content: "Plan-only — source inventory, extraction recommendation, eval matrix (docs)"
    status: completed
  - id: corpus-expansion-acceptance-gate
    content: "Operator — merge PR #45, re-ingest ~209 units, retrieval-eval, corpus-expansion plan-closure"
    status: completed
  - id: career-inventory-producer
    content: "Source eligibility + content publication manifests, reviewed public snapshots, career/ + source_class career"
    status: completed
  - id: marketplace-public-docs
    content: "Marketplace README + engineering docs only (no SKILL summaries unless eval gap)"
    status: completed
  - id: savepoints-public-notes
    content: "Reviewed Savepoints architecture excerpt → OKF; full note only after publication review"
    status: completed
  - id: codenames-engineering-docs
    content: "Bounded codenames docs (AI pipeline, validation) → OKF"
    status: completed
  - id: retrieval-eval-expansion
    content: "Add eval cases + acceptance criteria; run on expanded index; document regressions"
    status: completed
  - id: plan-closure
    content: "Docs-only PR — cross-repo findings, archive plan"
    status: completed
isProject: false
---

# Shipped

**Archived 2026-10-08.**

| Slice                            | Delivered                                                                                                                                                                                 |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| cross-repo-source-inventory      | [#46](https://github.com/mastermichaelt/portfolio/pull/46) — plan + [cross-repository-source-inventory.md](../../../docs/assistant/cross-repository-source-inventory.md)                  |
| corpus-expansion-acceptance-gate | Operator acceptance (2026-10-08) — [corpus-coverage-expansion.md](../../../docs/assistant/corpus-coverage-expansion.md#operational-acceptance)                                            |
| career-inventory-producer        | [#48](https://github.com/mastermichaelt/portfolio/pull/48) — eligibility/publication manifests, career snapshots, `career/` OKF                                                           |
| marketplace-public-docs          | [#49](https://github.com/mastermichaelt/portfolio/pull/49) — pinned marketplace engineering docs → `tooling/`                                                                             |
| savepoints-public-notes          | [#50](https://github.com/mastermichaelt/portfolio/pull/50) — reviewed Savepoints architecture excerpt                                                                                     |
| codenames-engineering-docs       | [#51](https://github.com/mastermichaelt/portfolio/pull/51) — bounded Codenames `docs/` sections → `repo/`                                                                                 |
| retrieval-eval-expansion         | [#52](https://github.com/mastermichaelt/portfolio/pull/52) — eval fixtures + [cross-repository-corpus-eval-findings.md](../../../docs/assistant/cross-repository-corpus-eval-findings.md) |
| plan-closure                     | This PR — verify todos, `# Shipped` note, archive plan                                                                                                                                    |

**Durable artifacts (remain active):**

- [cross-repository-source-inventory.md](../../../docs/assistant/cross-repository-source-inventory.md) — source inventory and decisions
- [career-inventory-corpus-direction.md](../../../docs/assistant/career-inventory-corpus-direction.md) — publication boundary design
- [cross-repository-corpus-eval-findings.md](../../../docs/assistant/cross-repository-corpus-eval-findings.md) — post-expansion retrieval-eval acceptance (**12/12** positives, **6/6** baseline regression)
- Cross-repo OKF producers and pinned fixtures under `scripts/assistant/okf/` and `tests/fixtures/assistant-okf/`
- [`tests/assistant-retrieval-eval.test.ts`](../../../tests/assistant-retrieval-eval.test.ts) and [`eval-cases.json`](../../../tests/fixtures/assistant-retrieval/eval-cases.json)

**Next milestone:** generative assistant (evidence assembly, citations, abstention) — [rag-generation-direction.md](../../../docs/assistant/rag-generation-direction.md) (direction doc only; no active `.cursor/plans/` execution plan yet).

---

# Assistant cross-repository corpus

**Goal:** Improve retrieval evidence for career depth, agent tooling, and independent projects **without** replacing the shipped retrieval stack (OKF, structure-aware units, `text-embedding-3-small`, pgvector ingest, retrieval-eval).

**Inventory (research):** [docs/assistant/cross-repository-source-inventory.md](../../../docs/assistant/cross-repository-source-inventory.md)

**Prerequisites (completed 2026-10-08):** PR [#45](https://github.com/mastermichaelt/portfolio/pull/45) corpus expansion merged; PR [#47](https://github.com/mastermichaelt/portfolio/pull/47) corpus-expansion plan-closure merged; operator acceptance recorded in [corpus-coverage-expansion.md](../../../docs/assistant/corpus-coverage-expansion.md#operational-acceptance) (**89** OKF concepts, **209** retrieval units; ingest **148** inserted / **5** updated / **56** skipped / **0** deleted; retrieval-eval **18/18** with **6/6** scored positives).

**Supersedes:** [assistant-career-inventory-corpus-superseded.plan.md](assistant-career-inventory-corpus-superseded.plan.md) (career work lives as `career-inventory-producer` slice here).

## Decisions (locked — PR #46 review)

| Decision              | Resolution                                                                                                                                                                                                                                                         |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Career publication    | **Two controls:** (1) **source eligibility** — explicit per-file allowlist, default deny; (2) **content publication** — only reviewed public-safe excerpts in pinned snapshots (not wholesale private files). **`career/`** + **`source_class: career`** unchanged |
| Savepoints            | **Reviewed excerpt** first; full `architecture-direction.md` only after publication review                                                                                                                                                                         |
| Marketplace           | README + public engineering docs first; **defer SKILL summaries** unless eval shows a gap                                                                                                                                                                          |
| Ingest vs publication | **Publication approval is upstream of OKF.** `assistant:ingest` success does **not** imply publication approval; producers read **committed public snapshots** only in CI                                                                                          |
| Merge order           | **PR #45 + operator ingest/eval complete** — `career-inventory-producer` is next implementation slice                                                                                                                                                              |

## Status: shipped vs pending vs new

| Item                                                                                                | State                                                                                                                                                                            |
| --------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Vector retrieval experiment + structure-aware chunking                                              | **Shipped** on `main`                                                                                                                                                            |
| PR [#45](https://github.com/mastermichaelt/portfolio/pull/45) portfolio corpus (~89 concepts)       | **Shipped** on `main`                                                                                                                                                            |
| Post-merge ingest + `tests/assistant-retrieval-eval.test.ts` on expanded index                      | **Completed** (2026-10-08) — [corpus-coverage-expansion.md](../../../docs/assistant/corpus-coverage-expansion.md#operational-acceptance)                                         |
| Corpus coverage expansion plan-closure ([#47](https://github.com/mastermichaelt/portfolio/pull/47)) | **Shipped** — archived [2026-10-08-assistant-corpus-coverage-expansion.plan.md](2026-10-08-assistant-corpus-coverage-expansion.plan.md)                                          |
| Cross-repo sources (resumes, marketplace, savepoints, …)                                            | **Shipped** (2026-10-08) — PRs [#48](https://github.com/mastermichaelt/portfolio/pull/48)–[#52](https://github.com/mastermichaelt/portfolio/pull/52); eval findings linked above |
| RAG generation / chat UI                                                                            | **Out of scope** — after corpus + eval                                                                                                                                           |

## Architectural extension (minimal)

```text
source eligibility (file allowlist, default deny)
        ↓
content publication (reviewed public-safe excerpts → pinned snapshots + manifests)
        ↓
deterministic cross-repo producers (read snapshots only in CI) ──→ existing okf:build
        ↓
existing assistant:derive → assistant:ingest → pgvector  (ingest ≠ publication approval)
        ↓
retrieval-eval (+ new cases) — regression baselines preserved
```

### Career inventory — publication boundary (two controls)

Approving a private `resumes` source file does **not** authorize publishing its entire contents.

| Control                    | Question                                              | Default                                                                                                                                                                  | Portfolio artifacts (planned)                                                                                                                  |
| -------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------- |
| **1. Source eligibility**  | Which private files may be considered as inputs?      | **Deny** — only explicit `facts/<id>.yml`, individually listed `roles/<id>.yml` (when tied to allowlisted facts — not all 21), approved `meta/` on a committed allowlist | Source-eligibility manifest (per-path entries; no bulk `roles/*.yml`)                                                                          |
| **2. Content publication** | What public-safe text may enter the retrieval corpus? | **Deny** — only human-reviewed excerpts promoted to pinned snapshots                                                                                                     | Public snapshot files under `tests/fixtures/assistant-okf/career-inventory/` + publication manifest (snapshot hashes, approved fact/field ids) |

**Rules:**

- Produce **deterministic, reviewed public snapshots** — do not copy allowlisted private YAML wholesale into OKF bodies.
- **Exclude** from published snapshot text: private contact information, interview preparation (`prep`, `stories`, applications), recruiter feedback, performance-management detail, confidential employer/business information, and unverified or strengthened claims.
- **Provenance:** OKF may record stable inventory ids (e.g. fact id) for operator/debug alignment; **visitor-facing** `resource` URLs and concept bodies must not expose private repository paths or internal job-search metadata.
- **No auto-expansion:** new files and new fields in previously eligible sources do **not** become public until both controls are updated and snapshots refreshed.
- **Fail closed:** if eligibility, publication manifest, or snapshot freshness cannot be verified (hash mismatch, missing approval row, orphan snapshot), `okf:build` / coverage tests **stop** — do not silently ingest partial or stale private content.
- **Separation:** embedding and `assistant:ingest` run only on OKF already derived from **approved snapshots**; a green ingest is evidence of pipeline health, not a substitute for publication review.

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

Repo default: **Open PR only** ([planning-standards.md](../../standards/planning-standards.md)).

## Repository topology

Integration branch: `main`. Each implementation slice from latest `origin/main`; PR base `main`.

---

### Slice — `cross-repo-source-inventory`

**Status:** Completed in this research pass ([cross-repository-source-inventory.md](../../../docs/assistant/cross-repository-source-inventory.md)).

---

### Slice — `corpus-expansion-acceptance-gate`

**Status:** **Completed** (2026-10-08). Canonical acceptance record: [corpus-coverage-expansion.md § Operational acceptance](../../../docs/assistant/corpus-coverage-expansion.md#operational-acceptance). Do **not** repeat ingest for this gate — proceed to `career-inventory-producer` when ready.

**Type:** Operator prerequisite (not an agent implementation PR). Historical steps:

1. Merge PR #45 — **done**.
2. `npm run assistant:ingest` on intended `DATABASE_URL` — **done** (148 inserted, 5 updated, 56 skipped, 0 deleted).
3. Confirm **209** derived retrieval units / **89** OKF concepts — **done**.
4. `npm run test -- tests/assistant-retrieval-eval.test.ts` — **18/18** passed; **6/6** scored positives; two diagnostics observed only.
5. Corpus expansion plan-closure ([#47](https://github.com/mastermichaelt/portfolio/pull/47)) — **done**.

---

### Slice — `career-inventory-producer` (first measurable coverage)

**Purpose:** Close the largest evidence gap — `mastermichaelt/resumes` career inventory.

**Deliverables:**

- **Source eligibility** manifest — default deny; explicit paths only (allowlisted `facts/<id>.yml`, `roles/<id>.yml` referenced by those facts, approved `meta/` — not all 38 facts / 21 roles)
- **Content publication** manifest + **reviewed public snapshots** under `tests/fixtures/assistant-okf/career-inventory/` (deterministic excerpt format — not full private file copies)
- `career-inventory-producer.mjs` reading **snapshots only** (CI-safe), emitting **`career/`** concepts with **`source_class: career`**
- Coverage tests — eligibility ↔ publication manifest ↔ snapshot hashes; **fail closed** on mismatch or unapproved content
- Re-ingest only after publication artifacts merge; expect **+5** OKF concepts (`89` → `94`). **Retrieval units:** measure the delta after `assistant:derive` (structure-aware 1:N — not 1:1 with concepts); record derived total and ingest summary (ingest success does not retroactively approve publication)

**Does not include:** live private-repo fetch in CI; wholesale YAML mirroring; `applications/**`, `out/`, `stories/`, interview prep, recruiter notes; embedding or ingest as a publication approval step

**Depends on:** `corpus-expansion-acceptance-gate` (**required**)

**Design:** [career-inventory-corpus-direction.md](../../../docs/assistant/career-inventory-corpus-direction.md)

---

### Slice — `marketplace-public-docs`

**Purpose:** Answer visitor questions about Cursor Team Marketplace and team-harness.

**Source repo:** `multipliers-dev/cursor-team-marketplace` (verified name).

**Deliverables:** Pinned public paths only — `README.md`, `docs/engineering-invariants.md`, `plugins/team-harness/docs/layers.md` (and optionally `versioning.md`); OKF `tooling/` namespace. **Do not** ingest `SKILL.md` bodies in this slice unless a later retrieval-eval gap is documented.

**Depends on:** `career-inventory-producer` merged (recommended ordering, not hard)

---

### Slice — `savepoints-public-notes`

**Purpose:** Address retrieval-eval `agent-memory-corpus-gap` with approved public architecture notes.

**Deliverables:** **Human-reviewed excerpt** of `notes/architecture-direction.md` as pinned fixture(s) → OKF concept(s). Full note only in a follow-up after explicit publication-suitability review. Optional separate summary from `savepoints-6-pager.md` only if reviewed. Exclude `.cursor/plans/` and hook implementation detail.

**Depends on:** publication review sign-off

**Eval follow-up:** after this slice merges and index is re-ingested, **`retrieval-eval-expansion`** must **reclassify** `agent-memory-corpus-gap` from `corpus_gap` to a scored **`positive`** case (or replace it with `savepoints-architecture`) — do not leave it indefinitely as a known coverage gap once Savepoints evidence is indexed.

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
- **Reclassify** `agent-memory-corpus-gap` when `savepoints-public-notes` is indexed (see above)
- Run eval on fully re-ingested index; document results in findings doc
- Adjust fixtures only after reviewing ranking competition (do not weaken baselines preemptively)

**Depends on:** prior source slices merged and re-ingested (at minimum `savepoints-public-notes` before reclassifying agent-memory case)

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

**Acceptance criteria (retrieval-eval harness):**

The fixture file has **eight** cases: **six** `kind: positive` (scored) and **two** diagnostic (`agent-memory-corpus-gap` → `corpus_gap`; `nuclear-reactor-negative-inspection` → `negative_inspection`). Diagnostics are **not** pass/fail — the harness records observations only ([`assistant-retrieval-eval.test.ts`](../../../tests/assistant-retrieval-eval.test.ts)).

- **Regression:** all **six existing positive** cases must pass on the expanded index after each corpus-changing merge + re-ingest.
- **Diagnostics:** preserve both diagnostic cases; record observations (e.g. `memory_related_hits`, top-K inspection) in findings — do not treat diagnostic output as regression failure.
- **New positives:** draft cases below pass **or** failures are documented with parent-rank diagnostics; fixture edits only in a follow-up PR with rationale.
- **After Savepoints indexed:** reclassify `agent-memory-corpus-gap` to `positive` with `expected_parent_concepts` for Savepoints OKF concepts — remove permanent `corpus_gap` status for agent memory once evidence exists.

---

## Agent prompts (copy/paste for Cursor)

### corpus-expansion-acceptance-gate

```text
Completed 2026-10-08 — see corpus-coverage-expansion.md § Operational acceptance. Do not re-run ingest for this gate.
```

### career-inventory-producer

```text
@.cursor/plans/assistant-cross-repository-corpus.plan.md

Implement slice career-inventory-producer only. Prerequisite: corpus-expansion-acceptance-gate complete (recorded 2026-10-08).

Authority: Open PR only — do not merge. Topology: origin/main; base main.

Use docs/assistant/cross-repository-source-inventory.md and career-inventory-corpus-direction.md. Implement source eligibility + content publication (reviewed public snapshots, fail closed). Producer reads snapshots only — not wholesale private files. career/ namespace + source_class: career. Ingest does not imply publication approval.

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

Implement slice savepoints-public-notes only. Authority: Open PR only. Reviewed architecture excerpt as pinned fixture first; full architecture-direction.md only if publication review approves. Exclude .cursor/plans and hooks.

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

Implement slice retrieval-eval-expansion only. Authority: Open PR only. Add eval cases per plan; reclassify agent-memory-corpus-gap to positive after savepoints-public-notes is indexed; require six baseline positives to pass; preserve diagnostics with recorded observations. Do not weaken fixtures without documented regression analysis.

Mark retrieval-eval-expansion completed in frontmatter in the same PR.
```

### plan-closure

```text
@.cursor/plans/assistant-cross-repository-corpus.plan.md

Execute plan-closure only. Docs-only archive PR; Open PR only; do not merge.

Move plan to .cursor/plans/archive/2026-10-08-assistant-cross-repository-corpus.plan.md; add # Shipped note; mark plan-closure completed.
```
