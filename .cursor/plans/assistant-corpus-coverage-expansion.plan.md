---
name: Assistant corpus coverage expansion
overview: Follow-on to the vector retrieval experiment — expand OKF producers and coverage tests for production portfolio content. Reuses okf:build, structure-aware retrieval-unit derivation, and assistant:ingest from the archived experiment. Start only after experiment closure; do not reopen 1:1 vs 1:N mapping.
todos:
  - id: corpus-coverage-expansion
    content: "Expand OKF producers, coverage tests, re-ingest with structure-aware derivation"
    status: completed
  - id: plan-closure
    content: "Docs-only PR: corpus expansion findings + archive plan"
    status: pending
isProject: false
---

# Assistant corpus coverage expansion

**Follow-on milestone** — not part of the archived [vector retrieval experiment](archive/2026-10-07-assistant-vector-retrieval-experiment.plan.md) ([findings](../../docs/assistant/vector-retrieval-experiment.md)). That experiment validated retrieval machinery and **structure-aware 1:N retrieval units** on a bounded corpus; this plan expands **what** gets indexed (published articles, remaining portfolio surfaces) using the **same derivation strategy**.

## Prerequisites

- Vector retrieval experiment **archived** (`.cursor/plans/archive/` + [docs/assistant/vector-retrieval-experiment.md](docs/assistant/vector-retrieval-experiment.md))
- `structure-aware-chunking`, `retrieve-cli`, `retrieval-eval`, and `ingest-sync` merged on `main`

**Ingestion is granularity-agnostic:** expand OKF concepts → `assistant:derive` (structure-aware) → `npm run assistant:ingest`. **Do not re-litigate 1:1 vs chunking** — structure-aware derivation is the production strategy established by the experiment.

## Recommended execution authority

| Slice                     | Recommended authority | Agent instruction                        |
| ------------------------- | --------------------- | ---------------------------------------- |
| corpus-coverage-expansion | Open PR only          | Do not merge. Stop after opening the PR. |
| plan-closure              | Open PR only          | Do not merge. Stop after opening the PR. |

Repo default: **Open PR only** ([planning-standards.md](../standards/planning-standards.md)).

## Repository topology (default)

Integration branch: `main`. Each slice starts from latest `origin/main`; PR base is `main`.

---

### Slice — `corpus-coverage-expansion`

**Purpose:** Expand indexed content to production-relevant portfolio coverage using **structure-aware retrieval-unit derivation** and existing ingest/sync.

**Planned work (may split into multiple merge-safe PRs within this slice):**

| Area                         | Intent                                                                                                                       |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| Published technical articles | All published articles represented in OKF, not only current `writing/` fixtures                                              |
| Remaining portfolio content  | Producers for surfaces not yet in OKF (ecosystem, timeline, additional cases/repos — bounded)                                |
| Coverage tests               | Fail when `content/` modules change without corresponding OKF producer updates                                               |
| Re-ingest                    | Full `okf:build` → `assistant:derive` → `assistant:ingest` after expansion; expect unit count growth from content + chunking |

**Files (indicative):** OKF producers under `scripts/assistant/okf/`, `content/` module coverage, `tests/okf-normalization.test.ts` or dedicated coverage tests; optional retrieval-eval fixture updates after re-ingest

**Does not include:** reopening 1:1 vs 1:N retrieval mapping, embedding model change, `vector(1536)` migration, ANN indexes, LangChain/LlamaIndex, OKF normalization changes for chunking convenience, generative answers, ingest sync semantics change, retrieve CLI rewrite

**Tests:** Producer + coverage tests; optional retrieval-eval fixture updates if new content adds eval cases

**Depends on:** archived vector retrieval experiment + findings doc

**Stop:** Expanded OKF + ingest beyond experiment baseline; coverage tests guard drift; architecture-direction updated with production corpus scope

---

### Slice — `plan-closure`

**Purpose:** Document corpus expansion outcomes and archive this plan.

**Files:** update [docs/assistant/architecture-direction.md](docs/assistant/architecture-direction.md); move plan to `.cursor/plans/archive/`

**Depends on:** `corpus-coverage-expansion` merged

**Stop:** Closure PR opened; all todos in this plan `completed`

---

## Agent prompts (copy/paste for Cursor)

### corpus-coverage-expansion

```text
@.cursor/plans/assistant-corpus-coverage-expansion.plan.md

Implement slice corpus-coverage-expansion only. Prerequisites: vector retrieval experiment archived; docs/assistant/vector-retrieval-experiment.md on main. Do not start plan-closure. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: expanded OKF producers and coverage tests; structure-aware assistant:derive + assistant:ingest; update architecture-direction with production corpus scope. Mark corpus-coverage-expansion completed in plan frontmatter in this PR.

Do not: reopen 1:1 vs chunking, change structure-aware derivation rules unless findings require a dedicated slice, embedding model/schema changes, or ingest-sync rewrites.

Verification: npm run okf:build; npm run test; npm run format:check.
```

### plan-closure

```text
@.cursor/plans/assistant-corpus-coverage-expansion.plan.md

Execute only plan-closure.

Authority: Open PR only — docs-only archive PR; do not merge.

Prerequisites: corpus-coverage-expansion merged and marked completed in frontmatter.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: verify slice todos; add # Shipped note; move plan to .cursor/plans/archive/YYYY-MM-DD-assistant-corpus-coverage-expansion.plan.md; mark plan-closure completed.

Verification: confirm prerequisite implementation PR is merged before archiving.
```
