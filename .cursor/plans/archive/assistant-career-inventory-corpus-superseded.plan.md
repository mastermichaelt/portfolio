---
name: Assistant career inventory corpus (superseded)
overview: "Superseded 2026-10-08 — not completed. Execute career inventory via assistant-cross-repository-corpus.plan.md (slice career-inventory-producer)."
todos:
  - id: publication-policy-and-producer-design
    content: "Allowlist, snapshot strategy, OKF career/ namespace + source_class design doc"
    status: pending
  - id: career-inventory-okf-producer
    content: "Implement career inventory producer, snapshots, coverage tests, re-ingest"
    status: pending
  - id: plan-closure
    content: "Docs-only PR: findings + archive plan"
    status: pending
isProject: false
---

# Superseded

**Superseded 2026-10-08** — this plan was **not completed** and is **not** an active execution plan.

| Item           | Resolution                                                                                                                                                                                                 |
| -------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Canonical plan | [assistant-cross-repository-corpus.plan.md](../assistant-cross-repository-corpus.plan.md)                                                                                                                  |
| Career slice   | `career-inventory-producer` in the cross-repository plan                                                                                                                                                   |
| Research       | [cross-repository-source-inventory.md](../../../docs/assistant/cross-repository-source-inventory.md), [career-inventory-corpus-direction.md](../../../docs/assistant/career-inventory-corpus-direction.md) |

Do not execute slices from this file. Retained for historical context only.

---

# Assistant career inventory corpus

**Prerequisite:** [corpus coverage expansion](../../../docs/assistant/corpus-coverage-expansion.md) shipped ([#45](https://github.com/mastermichaelt/portfolio/pull/45)) with operator acceptance **completed** on the expanded index ([findings § Operational acceptance](../../../docs/assistant/corpus-coverage-expansion.md#operational-acceptance); [assistant-database.md](../../../docs/assistant/assistant-database.md) §6).

**Direction:** [docs/assistant/career-inventory-corpus-direction.md](../../../docs/assistant/career-inventory-corpus-direction.md)

## Recommended execution authority

| Slice                                  | Recommended authority        | Agent instruction                                          |
| -------------------------------------- | ---------------------------- | ---------------------------------------------------------- |
| publication-policy-and-producer-design | Plan-only PR or Open PR only | Docs + allowlist artifact; no ingest until policy reviewed |
| career-inventory-okf-producer          | Open PR only                 | Do not merge. Stop after opening the PR.                   |
| plan-closure                           | Open PR only                 | Do not merge. Stop after opening the PR.                   |

## Repository topology (default)

Integration branch: `main`. Each slice from latest `origin/main`; PR base is `main`.

---

### Slice — `publication-policy-and-producer-design`

**Purpose:** Lock publication boundary and producer contract before YAML enters OKF.

**Deliverables:**

- Committed allowlist (fact ids + meta files approved for public assistant)
- Snapshot sync rule (resumes → `tests/fixtures/assistant-okf/career-inventory/`)
- `source_class: career` + `listConceptFiles` / derive-units wiring spec
- Update [career-inventory-corpus-direction.md](../../../docs/assistant/career-inventory-corpus-direction.md) with decisions

**Does not include:** full fact ingestion, embedding spend, eval fixture changes

---

### Slice — `career-inventory-okf-producer`

**Purpose:** Ship producer + coverage tests; re-ingest; retrieval-eval on expanded index.

**Depends on:** `publication-policy-and-producer-design`

**Stop:** Career inventory in OKF; eval regressions documented before fixture edits

---

### Slice — `plan-closure`

**Depends on:** `career-inventory-okf-producer` merged

---

## Agent prompts (copy/paste for Cursor)

> **Historical only** — use prompts in [assistant-cross-repository-corpus.plan.md](../assistant-cross-repository-corpus.plan.md).

### publication-policy-and-producer-design

```text
@.cursor/plans/assistant-career-inventory-corpus.plan.md

Execute slice publication-policy-and-producer-design only. Authority: Open PR only — stop after opening the PR; do not merge.

Topology: latest origin/main; PR base main.

Deliverables: public allowlist, snapshot strategy, career/ OKF + source_class design; update docs/assistant/career-inventory-corpus-direction.md. Do not implement full producer or ingest.

Mark publication-policy-and-producer-design completed in plan frontmatter in this PR.
```

### career-inventory-okf-producer

```text
@.cursor/plans/assistant-career-inventory-corpus.plan.md

Execute slice career-inventory-okf-producer only. Prerequisite: publication-policy-and-producer-design merged.

Authority: Open PR only — stop after opening the PR; do not merge.

Implement career inventory OKF producer per allowlist; coverage tests; okf:build + re-ingest guidance. Mark career-inventory-okf-producer completed in frontmatter.
```

### plan-closure

```text
@.cursor/plans/assistant-career-inventory-corpus.plan.md

Execute plan-closure only. Docs-only archive PR; Open PR only; do not merge.
```
