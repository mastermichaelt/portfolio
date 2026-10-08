---
name: Assistant corpus coverage expansion
overview: Follow-on to the vector retrieval experiment — expand OKF producers and coverage tests so the assistant index reflects production portfolio content, reusing okf:build and assistant:ingest. Start only after the experiment plan is archived and findings document retrieval-unit granularity.
todos:
  - id: corpus-coverage-expansion
    content: "Expand OKF producers, granularity decision, coverage tests, re-ingest beyond ~35-unit experiment index"
    status: pending
  - id: plan-closure
    content: "Docs-only PR: corpus expansion findings + archive plan"
    status: pending
isProject: false
---

# Assistant corpus coverage expansion

**Follow-on milestone** — not part of [assistant-vector-retrieval-experiment.plan.md](assistant-vector-retrieval-experiment.plan.md). That experiment validates retrieval machinery on a **bounded ~35-unit** index; this plan decides **what content** to index at **what granularity** for production assistant retrieval.

## Prerequisites

- Vector retrieval experiment **archived** (see `.cursor/plans/archive/` for `assistant-vector-retrieval-experiment`)
- [docs/assistant/vector-retrieval-experiment.md](docs/assistant/vector-retrieval-experiment.md) shipped with retrieval-unit granularity recommendation
- `retrieve-cli`, `retrieval-eval`, and `ingest-sync` merged on `main`

Ingestion machinery is content-agnostic: new OKF concepts → derive → embed → upsert on `npm run assistant:ingest`.

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

**Purpose:** Expand what the assistant indexes after retrieval quality and **retrieval-unit granularity** are validated on the bounded experiment corpus.

**Planned work (may split into multiple PRs within this slice if merge-safe):**

| Area                         | Intent                                                                                                                                   |
| ---------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Published technical articles | All published articles in the index, not only the current two `writing/` units                                                           |
| Remaining portfolio content  | Producers for portfolio surfaces not yet represented (ecosystem, timeline, additional cases/repos as bounded)                            |
| Long-document granularity    | Evaluate whether 1 OKF concept = 1 retrieval unit is too coarse for long articles; document decision before mass re-embed                |
| Coverage tests               | Assert newly published / in-repo content paths are represented in OKF output (fail when content modules change without producer updates) |

**Files (indicative):** OKF producers under `scripts/assistant/okf/`, `content/` module coverage, `tests/okf-normalization.test.ts` or dedicated coverage tests; optional eval fixture updates after re-ingest

**Does not include (unless findings mandate a dedicated migration slice):** embedding model change, `vector(1536)` schema change, ingest sync semantics change, retrieve CLI rewrite

**Tests:** Producer + coverage tests; re-run retrieval eval when fixtures change

**Depends on:** archived vector retrieval experiment + findings doc

**Stop:** Expanded OKF build + ingest increases unit count beyond experiment baseline; coverage tests guard drift; architecture-direction updated with production corpus scope

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

Implement slice corpus-coverage-expansion only. Prerequisites: vector retrieval experiment archived and docs/assistant/vector-retrieval-experiment.md on main. Do not start plan-closure. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: expanded OKF producers and coverage tests per plan; re-ingest via npm run assistant:ingest when secrets configured; update architecture-direction with production corpus scope. Mark corpus-coverage-expansion completed in plan frontmatter in this PR.

Do not: embedding model/schema changes or ingest sync rewrites unless findings require a separate migration plan.

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
