---
name: Assistant development roadmap
overview: Authoritative orchestration plan for the assistant initiative (phases 0–5). Child numbered plans hold implementation detail; historical milestones archived with transferred obligations.
todos:
  - id: phase-execution
    content: "Implementation in child plans (phases 0–4); Phase 1 = 01-quality-observability + PR #107; no parent implementation slices"
    status: cancelled
  - id: plan-closure
    content: "Docs-only PR when phases 0–4 complete and Phase 5 is ongoing — archive roadmap and update references"
    status: pending
isProject: false
---

# Assistant development roadmap

**Role:** **Parent orchestration plan** for the portfolio assistant initiative. Single source of truth for **execution order**, **phase status**, **dependencies**, and **entry/exit gates**. Child plans are independently executable; historical plans in `archive/` are **not** active execution authorities.

**Created:** 2026-10-30 (filename date = plan authorship, not last edit).

**Current phase:** **Phase 0 — Maintenance mode** (**complete**, 2026-10-30 — [PR #109](https://github.com/mastermichaelt/portfolio/pull/109)); **Phase 1 — Reliability & Observability** (**in progress** — [PR #107](https://github.com/mastermichaelt/portfolio/pull/107) open).
**Public generation:** Maintenance gate **shipped** on `main` (`ASSISTANT_PUBLIC_ENABLED`; default enabled until operator sets `false`). Operator policy while Phases 1–4 run: keep public generation off via env — [maintenance-mode.md](../../docs/assistant/maintenance-mode.md).

## Child implementation plans

| Phase | Child plan                                                                                                             | PR / other                                                                                                                   |
| ----- | ---------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| 0     | [archive/2026-10-30-assistant-00-maintenance-mode.plan.md](./archive/2026-10-30-assistant-00-maintenance-mode.plan.md) | [PR #109](https://github.com/mastermichaelt/portfolio/pull/109) merged 2026-10-30                                            |
| 1     | [2026-10-29-assistant-01-quality-observability.plan.md](./2026-10-29-assistant-01-quality-observability.plan.md)       | [PR #107](https://github.com/mastermichaelt/portfolio/pull/107) — generation recovery (**in progress**)                      |
| 2     | [2026-10-30-assistant-02-typescript-consolidation.plan.md](./2026-10-30-assistant-02-typescript-consolidation.plan.md) | —                                                                                                                            |
| 3     | [2026-10-29-assistant-03-conversational-ui.plan.md](./2026-10-29-assistant-03-conversational-ui.plan.md)               | verify/reconcile (UI shipped)                                                                                                |
| 4     | [2026-10-30-assistant-04-production-reopening.plan.md](./2026-10-30-assistant-04-production-reopening.plan.md)         | —                                                                                                                            |
| 5     | —                                                                                                                      | Ongoing iteration (see Phase 5); ops runbook [evaluation-observability.md](../../docs/assistant/evaluation-observability.md) |

```text
Assistant Roadmap
│
├── Phase 0 — Maintenance Mode (shipped)
│   └── archive/2026-10-30-assistant-00-maintenance-mode.plan.md
│
├── Phase 1 — Reliability & Observability
│   └── 2026-10-29-assistant-01-quality-observability.plan.md
│       └── PR #107 — Generation Recovery
│
├── Phase 2 — TypeScript Consolidation
│   └── 2026-10-30-assistant-02-typescript-consolidation.plan.md
│
├── Phase 3 — Conversational UI
│   └── 2026-10-29-assistant-03-conversational-ui.plan.md
│
├── Phase 4 — Production Reopening
│   └── 2026-10-30-assistant-04-production-reopening.plan.md
│
└── Phase 5 — Quality Iteration
    └── Ongoing, evidence-driven work
```

## Archived predecessors (historical only)

| Plan                                                                                                                           | Implementation                                   | Outstanding work owner                                                                                             |
| ------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------ |
| [archive/2026-10-08-assistant-grounded-rag-generation.plan.md](./archive/2026-10-08-assistant-grounded-rag-generation.plan.md) | **Shipped** (RAG API, UI, Drizzle, eval harness) | Phase 4 — [04-production-reopening](./2026-10-30-assistant-04-production-reopening.plan.md)                        |
| [archive/2026-10-30-assistant-00-maintenance-mode.plan.md](./archive/2026-10-30-assistant-00-maintenance-mode.plan.md)         | **Shipped** (public maintenance gate, PR #109)   | Phase 4 — operator re-enable via [04-production-reopening](./2026-10-30-assistant-04-production-reopening.plan.md) |

**Quality observability (2026-10-29):** Implementation shipped on `main`. Plan was briefly archived during 2026-10-30 consolidation; **restored** as active Phase 1 child [01-quality-observability](./2026-10-29-assistant-01-quality-observability.plan.md). Production verification obligations remain Phase 4 (unchanged).

**Closure transfer date (grounded RAG):** 2026-10-30. Transferred todos on archived grounded plan were **not** marked completed.

---

## Historical obligation migration (summary)

| Original plan         | Original task                                                       | Disposition             | Successor                                                                                         | Status       |
| --------------------- | ------------------------------------------------------------------- | ----------------------- | ------------------------------------------------------------------------------------------------- | ------------ |
| Maintenance mode      | `maintenance-mode` + `plan-closure`                                 | **Complete** on `main`  | —                                                                                                 | Done         |
| Grounded RAG          | All implementation slices (`generation-contract` … `generation-ui`) | **Complete** on `main`  | —                                                                                                 | Done         |
| Grounded RAG          | `operational-acceptance`                                            | **Transferred**         | Phase 4 `operational-acceptance`                                                                  | Pending      |
| Grounded RAG          | `plan-closure` (docs + archive)                                     | **Transferred**         | Phase 4 `plan-closure` (docs); plan archive **done** 2026-10-30                                   | Docs pending |
| Quality observability | `quality-observability`                                             | **Complete** on `main`  | Phase 1 child [01-quality-observability](./2026-10-29-assistant-01-quality-observability.plan.md) | Done         |
| Quality observability | `generation-recovery-pr107`                                         | **Outstanding**         | Phase 1 — [PR #107](https://github.com/mastermichaelt/portfolio/pull/107)                         | In progress  |
| Quality observability | `plan-closure` (milestone archive)                                  | **Pending**             | Phase 1 child `plan-closure` after exit criteria                                                  | Pending      |
| Quality observability | Plan archived 2026-10-30                                            | **Restored** 2026-10-30 | Active Phase 1 child (not in `archive/`)                                                          | Restored     |
| Quality observability | Production eval verification                                        | **Transferred**         | Phase 4 observability checklist                                                                   | Pending      |
| Quality observability | Follow-ups (composer polish, visitor feedback)                      | **Deferred**            | Phase 5                                                                                           | Deferred     |

Detail and acceptance criteria: [04-production-reopening — Transferred obligations](./2026-10-30-assistant-04-production-reopening.plan.md#transferred-obligations-historical-plans).

---

## Current state (repository evidence)

| Area                     | Evidence on `main`                                                                                                                                                   |
| ------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| RAG generation service   | `scripts/assistant/generation/*`, API `lib/assistant/api/handle-generate-post.ts`, route `app/api/assistant/generate/route.ts`                                       |
| Public maintenance gate  | `ASSISTANT_PUBLIC_ENABLED`, [maintenance-mode.md](../../docs/assistant/maintenance-mode.md) — merged [PR #109](https://github.com/mastermichaelt/portfolio/pull/109) |
| Visitor UI               | `/assistant` + `AssistantExperience` (conversational transcript shipped)                                                                                             |
| Drizzle / pgvector       | `db/schema.ts`, `drizzle/`, `lib/assistant/db/*`, operator `assistant:db:*`                                                                                          |
| Ingest / retrieve ops    | `assistant:ingest`, `assistant:retrieve`, `okf:build`, `assistant:derive`                                                                                            |
| Evaluation observability | `assistant_generation_evaluations`, `lib/assistant/evaluation/*`, review/cleanup CLIs                                                                                |
| Tests                    | 27+ `tests/assistant-*.test.ts`, Vitest imports `.mjs` modules heavily                                                                                               |
| Open reliability work    | [PR #107](https://github.com/mastermichaelt/portfolio/pull/107) — validation recovery (**open**, not merged)                                                         |

**Architecture docs:** [architecture-direction.md](../../docs/assistant/architecture-direction.md) and [rag-generation-direction.md](../../docs/assistant/rag-generation-direction.md) were reconciled with shipped RAG in this PR (2026-10-30). No further alignment work is tracked here unless a later phase exposes a concrete gap.

---

## Phase sequence (execution order)

```text
Phase 0 → Phase 1 (01-quality-observability + #107) → Phase 2 (TS/Zod) → Phase 3 (UI verify) → Phase 4 (reopen) → Phase 5 (iterate)
```

| Phase | Name                           | Status                    | Implementation                                                                                                                                              |
| ----- | ------------------------------ | ------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **0** | Maintenance mode               | **Complete** (2026-10-30) | [archive/00-maintenance-mode](./archive/2026-10-30-assistant-00-maintenance-mode.plan.md) — [PR #109](https://github.com/mastermichaelt/portfolio/pull/109) |
| **1** | Reliability & Observability    | **In progress**           | [01-quality-observability](./2026-10-29-assistant-01-quality-observability.plan.md) + [PR #107](https://github.com/mastermichaelt/portfolio/pull/107)       |
| **2** | TypeScript consolidation       | Queued                    | [02-typescript-consolidation](./2026-10-30-assistant-02-typescript-consolidation.plan.md)                                                                   |
| **3** | Conversational UI verification | **Largely shipped**       | [03-conversational-ui](./2026-10-29-assistant-03-conversational-ui.plan.md)                                                                                 |
| **4** | Production reopening           | Queued                    | [04-production-reopening](./2026-10-30-assistant-04-production-reopening.plan.md)                                                                           |
| **5** | Quality iteration              | Ongoing after reopen      | Evidence-driven; no numbered child plan until scoped                                                                                                        |

---

## Phase 0 — Maintenance mode

|                    |                                                                                                                             |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------- |
| **Objective**      | Temporarily disable public assistant generation; preserve internal tests, ingest, DB, and evaluation data.                  |
| **Status**         | **Complete** (2026-10-30 — [PR #109](https://github.com/mastermichaelt/portfolio/pull/109))                                 |
| **Implementation** | [archive/2026-10-30-assistant-00-maintenance-mode.plan.md](./archive/2026-10-30-assistant-00-maintenance-mode.plan.md)      |
| **Entry criteria** | Roadmap adopted; operator approves taking public generation offline.                                                        |
| **Dependencies**   | None (first active phase).                                                                                                  |
| **Exit criteria**  | Public cannot generate; maintenance page correct; API returns expected unavailable response; re-enable without code revert. |

---

## Phase 1 — Reliability & Observability

|                    |                                                                                                                                                                                                                                                                                                                                                                           |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Objective**      | Confirm evaluation observability shipped; complete generation validation recovery ([PR #107](https://github.com/mastermichaelt/portfolio/pull/107)); preserve evidence integrity and diagnostic compatibility with observability.                                                                                                                                         |
| **Status**         | **In progress** (`quality-observability` shipped; `#107` open)                                                                                                                                                                                                                                                                                                            |
| **Implementation** | [2026-10-29-assistant-01-quality-observability.plan.md](./2026-10-29-assistant-01-quality-observability.plan.md) — slice `generation-recovery-pr107` tracks **PR #107**                                                                                                                                                                                                   |
| **Entry criteria** | Observability shipped on `main`; [PR #107](https://github.com/mastermichaelt/portfolio/pull/107) open or in review. Phase 0 **not** required to merge #107. **Recommend** Phase 0 before **production deploy** of recovery (merge ≠ deploy).                                                                                                                              |
| **Dependencies**   | **#107 merged on `main`** before Phase 2 generation migration (recovery baseline). Phase 0 maintenance policy applies to **public** generation timing; it does **not** gate #107 merge. Phase 1 **complete** when [exit criteria](./2026-10-29-assistant-01-quality-observability.plan.md#phase-1-exit-criteria) met (including #107 on `main`).                          |
| **Exit criteria**  | See [Phase 1 exit criteria](./2026-10-29-assistant-01-quality-observability.plan.md#phase-1-exit-criteria): observability confirmed on `main`; #107 merged; recovery + evidence-integrity tests pass; diagnostics compatible with evaluation persist; no blocking reliability regression. **Production E2E eval verification is Phase 4, not required to close Phase 1.** |

Detail: [01-quality-observability — generation-recovery-pr107](./2026-10-29-assistant-01-quality-observability.plan.md#slice--generation-recovery-pr107).

---

## Phase 2 — TypeScript consolidation

|                    |                                                                                                                                                                                                                                                                                                                                          |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Objective**      | TS-first reusable logic; Zod structural validation; retire obsolete test-only CLIs; keep operational ingest/DB tooling.                                                                                                                                                                                                                  |
| **Status**         | Queued                                                                                                                                                                                                                                                                                                                                   |
| **Implementation** | [2026-10-30-assistant-02-typescript-consolidation.plan.md](./2026-10-30-assistant-02-typescript-consolidation.plan.md)                                                                                                                                                                                                                   |
| **Entry criteria** | **Phase 0 complete** (maintenance shipped); **Phase 1 complete** on `main` ([exit criteria](./2026-10-29-assistant-01-quality-observability.plan.md#phase-1-exit-criteria), including **#107 merged**).                                                                                                                                  |
| **Dependencies**   | Phase 0 before **any Phase 2 implementation** PRs; **merged #107 recovery baseline on `main`** before `generation-services` / `zod-structural` (port, do not reimplement).                                                                                                                                                               |
| **Exit criteria**  | Child plan [exit criteria](./2026-10-30-assistant-02-typescript-consolidation.plan.md#phase-2-exit-criteria): TS generation under `lib/assistant/`; HTTP→lib only; Zod structural + separate evidence integrity; Phase 1 recovery preserved; `assistant:answer` retired; operational CLIs work; lint/typecheck/test/build; docs updated. |

---

## Phase 3 — Conversational UI verification

|                    |                                                                                                                                                                                                                                                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Objective**      | Reconcile and verify existing conversational UI against consolidated backend — **not** a full rebuild.                                                                                                                                              |
| **Status**         | Implementation on `main`; verification queued after Phase 2 if API changes                                                                                                                                                                          |
| **Implementation** | [2026-10-29-assistant-03-conversational-ui.plan.md](./2026-10-29-assistant-03-conversational-ui.plan.md)                                                                                                                                            |
| **Entry criteria** | Phase 2 complete (prefer verify after Phase 2 if API changes).                                                                                                                                                                                      |
| **Dependencies**   | Phase 2 if generation envelope or errors change.                                                                                                                                                                                                    |
| **Exit criteria**  | **Functional verification pass** against live API (grounding, citations, abstention, observability preserved). **`plan-closure`** (required docs-only archive PR) may follow verification — Phase 3 is not archived until `plan-closure` completes. |

---

## Phase 4 — Production reopening

|                    |                                                                                                                                                                                                        |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Objective**      | End-to-end verification, **operational acceptance** (from archived grounded RAG plan), evaluation persistence verification (from archived quality plan), explicit approval; restore public generation. |
| **Status**         | Queued                                                                                                                                                                                                 |
| **Implementation** | [2026-10-30-assistant-04-production-reopening.plan.md](./2026-10-30-assistant-04-production-reopening.plan.md)                                                                                         |
| **Entry criteria** | Phases 0–2 complete; Phase 3 verification pass.                                                                                                                                                        |
| **Dependencies**   | All prior phases; operator sign-off for re-enable.                                                                                                                                                     |
| **Exit criteria**  | Reopening checklist complete; maintenance off; operational acceptance pass; production smoke passed.                                                                                                   |

**Owns transferred acceptance:** grounded `operational-acceptance`; grounded `plan-closure` doc updates; quality observability production verification.

**Public access (timeline):** Maintenance gate **shipped** on `main` (Phase 0). While Phases 1–4 run, operators set `ASSISTANT_PUBLIC_ENABLED=false` for public-off policy. **After Phase 4** operational acceptance and explicit re-enable, public generation is **on** again via env.

---

## Phase 5 — Quality iteration

|                    |                                                                                                                                                                                                                                                              |
| ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Objective**      | Evidence-driven improvements from evaluation rows and telemetry — not speculative infrastructure.                                                                                                                                                            |
| **Status**         | Ongoing after Phase 4                                                                                                                                                                                                                                        |
| **Implementation** | `assistant:evaluation:review`, PostHog, [evaluation-observability.md](../../docs/assistant/evaluation-observability.md); Phase 1 child [01-quality-observability](./2026-10-29-assistant-01-quality-observability.plan.md) for shipped observability history |
| **Entry criteria** | Phase 4 complete; evaluation data accumulating.                                                                                                                                                                                                              |
| **Dependencies**   | None blocking earlier phases.                                                                                                                                                                                                                                |
| **Exit criteria**  | N/A (continuous workstream).                                                                                                                                                                                                                                 |

**Deferred from quality plan (Phase 5 only when evidence warrants):** composer retention disclosure polish; visitor feedback API ([evaluation-observability.md](../../docs/assistant/evaluation-observability.md#future-feedback-explicit-integration-task)).

---

## Execution rules

1. **Sequencing and parallel work** — **Phase 0 complete** on `main` ([archive/00-maintenance-mode](./archive/2026-10-30-assistant-00-maintenance-mode.plan.md)). **[PR #107](https://github.com/mastermichaelt/portfolio/pull/107)** may be **reviewed and merged independently**; default agent authority remains **Open PR only** — **merge #107 only with explicit user authorization (Merge granted)**. **Do not conflate merging #107 with deploying recovery to production** (production deploy should follow Phase 0 maintenance policy when public generation is involved). **Phase 1 complete** when [Phase 1 exit criteria](./2026-10-29-assistant-01-quality-observability.plan.md#phase-1-exit-criteria) are satisfied, including **#107 merged on `main`**. **Phase 2 implementation** cannot begin until **Phase 0 is complete** and **Phase 1 is complete on `main`**; Phase 2 generation migration **must port the merged #107 recovery baseline** (no parallel reimplementation). At most one phase owns **new implementation PRs** to `main` at a time; later phases stay planned, not implemented early.
2. **Small PRs** — clear objective, verification, rollback per slice.
3. **Explicit dependencies** — prerequisites in child plans and above.
4. **No automatic merging** — default **Open PR only**.
5. **Verification before progression** — phase exit criteria before next phase.
6. **Roadmap stays concise** — detail in child plans.
7. **Living plans** — update phase status here; archive completed child plans with `# Shipped` per [planning-standards.md](../standards/planning-standards.md).

---

## What we're working on now

|                                |                                                                                                                                                                       |
| ------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Now**                        | Phase 1 — [01-quality-observability](./2026-10-29-assistant-01-quality-observability.plan.md) / [PR #107](https://github.com/mastermichaelt/portfolio/pull/107)       |
| **Completed (recent)**         | Phase 0 — [archive/00-maintenance-mode](./archive/2026-10-30-assistant-00-maintenance-mode.plan.md) ([PR #109](https://github.com/mastermichaelt/portfolio/pull/109)) |
| **Next after Phase 1**         | Phase 2 entry (Phase 0 + Phase 1 complete on `main`, including #107 merged)                                                                                           |
| **Parallel (allowed)**         | Phase 1 / **#107** while operator maintains public-off env from Phase 0 gate (**Merge granted** required to merge #107; merge ≠ production deploy)                    |
| **Blocked**                    | Phase 2 until Phase 0 **and** Phase 1 complete on `main`; Phase 4 public reopen until Phases 0–2 complete and Phase 3 verification pass                               |
| **Active execution authority** | This roadmap + **one** child plan **implementation** slice at a time on `main` (default **Open PR only**; no duplicate recovery PR alongside #107)                    |

**Active implementation focus:** Phase 1 `generation-recovery-pr107` ([01-quality-observability](./2026-10-29-assistant-01-quality-observability.plan.md)) — no duplicate recovery PR alongside #107.

---

## Recommended execution authority

Orchestration only — each child `.plan.md` defines per-slice authority (default **Open PR only**).

| Slice        | Recommended authority | Agent instruction                        |
| ------------ | --------------------- | ---------------------------------------- |
| plan-closure | Open PR only          | Do not merge. Stop after opening the PR. |

Repo default: **Open PR only** ([planning-standards.md](../standards/planning-standards.md#repo-default-when-no-plan-slice-applies)).

---

## Slice — plan-closure

**Recommended authority:** Open PR only

**Rationale:**

- Parent roadmap closes when **phases 0–4** are complete and accepted and **Phase 5** has transitioned into **ongoing operation** (not a finite milestone). Finite child plans are closed or archived per planning standards.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Goal:** Archive this roadmap with a `# Shipped` note and update any remaining references after phases **0–4** complete. **Do not** mark Phase 5 completed merely to close the roadmap — Phase 5 continues as an evidence-driven workstream.

**Acceptance:** Phase **0–4** exit criteria met; finite child plans (`00`–`04`, Phase 1 `01-quality-observability`) archived with `# Shipped`; Phase 5 documented as **ongoing** in [evaluation-observability.md](../../docs/assistant/evaluation-observability.md); no active duplicate execution authority.

---

## Agent prompts (copy/paste for Cursor)

### plan-closure

```text
@.cursor/plans/2026-10-30-assistant-roadmap.plan.md

Execute only plan-closure after phases 0–4 complete and accepted, finite child plans archived, and Phase 5 transitioned to ongoing operation (do not mark Phase 5 completed merely to close the roadmap).

Authority: Open PR only — docs-only; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: # Shipped note; move roadmap to .cursor/plans/archive/; update references.

Verification: plan-validator passes; confirm no active child plan duplicates orchestration authority.
```
