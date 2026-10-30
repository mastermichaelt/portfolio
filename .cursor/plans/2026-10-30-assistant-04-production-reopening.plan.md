---
name: Assistant production reopening
overview: Checklist and manual verification gate to re-enable public assistant generation after maintenance, #107, and TypeScript/Zod consolidation — absorbs grounded-plan operational-acceptance.
todos:
  - id: reopening-checklist
    content: "PR: env flag default-on path, doc checklist, test hooks for enabled mode"
    status: pending
  - id: operational-acceptance
    content: "Manual verification gate — Neon/index, smoke, deployed E2E, operator sign-off"
    status: pending
  - id: plan-closure
    content: "Docs-only PR — archive this plan; update architecture/rag-generation docs + generation-eval-findings; roadmap Phase 4 complete"
    status: pending
isProject: false
---

# Assistant production reopening

## Parent plan

|                         |                                                                                |
| ----------------------- | ------------------------------------------------------------------------------ |
| **Parent roadmap**      | [2026-10-30-assistant-roadmap.plan.md](./2026-10-30-assistant-roadmap.plan.md) |
| **Phase**               | **4** — Production reopening                                                   |
| **Phase objective**     | Re-enable public generation after verification and operator approval.          |
| **Entry criteria**      | Phases 0–2 complete; Phase 3 UI verification pass.                             |
| **Dependencies**        | Prior phases; grounded-plan operational acceptance absorbed here.              |
| **Completion criteria** | `operational-acceptance` pass + re-enable; roadmap Phase 4 exit criteria met.  |

**Prerequisites:**

- **Today (pre–Phase 0):** Public assistant generation remains **enabled** on `/assistant` and `POST /api/assistant/generate` (see [roadmap](./2026-10-30-assistant-roadmap.plan.md)).
- **Phase 4 entry (after Phases 0–3):** Phase 0 maintenance mode **shipped** — public generation **disabled** until this phase re-enables it.
- Phase 1 PR #107 merged.
- Phase 2 TypeScript consolidation complete (including Zod structural validation).
- Phase 3 conversational UI verified against API (UI already on `main`; regression pass only unless API changed).

**Maintenance and public-access timeline**

| Window                                          | Public generation                                                                            |
| ----------------------------------------------- | -------------------------------------------------------------------------------------------- |
| **Now (before Phase 0 ships)**                  | **On** — visitors can use `/assistant` and the generate API.                                 |
| **After Phase 0 ships → through Phase 4 entry** | **Off** — maintenance mode; API returns unavailable response per Phase 0.                    |
| **After Phase 4 exit**                          | **On again** — operator re-enable after `operational-acceptance` pass and explicit approval. |

**Relationship:** Grounded RAG **`operational-acceptance`** and milestone **`plan-closure`** obligations were **transferred** to this plan on 2026-10-30 (see [Transferred obligations](#transferred-obligations-historical-plans)). The historical plan is archived at [archive/2026-10-08-assistant-grounded-rag-generation.plan.md](./archive/2026-10-08-assistant-grounded-rag-generation.plan.md) — **not** an active execution authority.

**Policy (Phase 4 scope):** While maintenance mode is active (post–Phase 0), public generation stays disabled until **`operational-acceptance`** completes and an operator explicitly approves re-enable in this phase.

## Recommended execution authority

| Slice                  | Recommended authority    | Agent instruction                                 |
| ---------------------- | ------------------------ | ------------------------------------------------- |
| reopening-checklist    | Open PR only             | Do not merge. Stop after opening the PR.          |
| operational-acceptance | Manual verification gate | Do not commit or open a PR. Report verdict; stop. |
| plan-closure           | Open PR only             | Do not merge. Stop after opening the PR.          |

Repo default: **Open PR only** ([planning-standards.md](../standards/planning-standards.md#repo-default-when-no-plan-slice-applies)).

---

## Reopening checklist (reference)

Use for operator sign-off; expand in PR / gitignored notes as needed.

### Build and code quality

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm test` (full suite)
- [ ] `npm run build`
- [ ] `npm run test:e2e` (or CI-equivalent) when UI/routes touched in Phase 4 PR

### TypeScript and validation

- [ ] Generation hot path imports `lib/assistant/generation/*` (TS)
- [ ] Zod structural validation active; recovery path from #107 still exercised in tests
- [ ] Evidence-integrity tests green (`assistant-generation-contract`, recovery, eval fixtures)

### Data and retrieval

- [ ] `npm run assistant:db:verify` against production `DATABASE_URL` (operator, direct connection for migrate if needed)
- [ ] Retrieval index populated; `bundle_sha256` matches intended corpus
- [ ] `npm run assistant:retrieve -- "<question>"` returns relevant hits (operator)
- [ ] Idempotent `assistant:ingest` if corpus changed (operator approval)

### Generation and recovery

- [ ] Local or staging POST `/api/assistant/generate` — grounded answer with citations
- [ ] Unsupported personal question → abstention without fabricated citations
- [ ] Recoverable validation issues do not spuriously 502 (post-#107 behavior)
- [ ] Rate limit and fail-closed storage errors still safe (429/503 semantics)

### Observability

- [ ] Evaluation persistence fail-open on success/failure paths (when enabled)
- [ ] PostHog generation events acceptable after re-enable (no PII in events)
- [ ] `npm run assistant:evaluation:review -- failed` reviewed for open issues

### Conversational UI

- [ ] `/assistant` transcript, composer, citations, abstention copy, mobile sticky composer
- [ ] Maintenance mode **off** — full experience restored
- [ ] Evaluation disclosure copy correct

### Production configuration

- [ ] Vercel `DATABASE_URL`, OpenAI key, maintenance flag **off** / public enabled
- [ ] `ASSISTANT_EVALUATION_ENABLED` as intended
- [ ] Smoke on production URL after deploy

---

## Slice — reopening-checklist

**Recommended authority:** Open PR only

**Rationale:**

- Re-enable must be a documented config toggle after maintenance mode, not an ad hoc deploy step.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Goal:** Code/docs PR that makes re-enable a **config toggle** (inverse of Phase 0), removes or bypasses maintenance UI when enabled, and documents the checklist above in repo docs (e.g. `docs/assistant/production-reopening.md`).

**Acceptance:** Flag off → maintenance; flag on → full assistant; tests cover both.

**Verification:** CI green; manual toggle locally.

**Rollback:** Set maintenance flag on in Vercel without revert.

**Complexity:** **S**

---

## Transferred obligations (historical plans)

Outstanding work from archived plans owns **exactly one** successor below. Do not treat historical frontmatter `pending` todos as active — they were **transferred**, not completed, on **2026-10-30**.

| Original plan                                                                                                                                                                           | Original id / slice                                                                                                                                   | Successor                                                              | Acceptance (unchanged)                                                                                                                                                                                           | Status       |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------ |
| [2026-10-08-assistant-grounded-rag-generation](./archive/2026-10-08-assistant-grounded-rag-generation.plan.md)                                                                          | `operational-acceptance`                                                                                                                              | **`operational-acceptance`** slice (this plan)                         | Phase A + Phase B below; operator sign-off; [generation-eval-findings.md](../../docs/assistant/generation-eval-findings.md) updated                                                                              | **Pending**  |
| [2026-10-08-assistant-grounded-rag-generation](./archive/2026-10-08-assistant-grounded-rag-generation.plan.md)                                                                          | `plan-closure`                                                                                                                                        | **`plan-closure`** slice (this plan)                                   | `# Shipped` on this plan when Phase 4 done; update [architecture-direction.md](../../docs/assistant/architecture-direction.md) + [rag-generation-direction.md](../../docs/assistant/rag-generation-direction.md) | **Pending**  |
| [2026-10-29-assistant-01-quality-observability](./2026-10-29-assistant-01-quality-observability.plan.md) (historical **quality observability** milestone; filename restored 2026-10-30) | Production evaluation **persistence**, **disclosure**, and **operational verification** (transferred from quality observability production checklist) | **Reopening checklist — Observability** + **`operational-acceptance`** | Fail-open evaluation persist on success/failure paths; disclosure copy; `assistant:evaluation:review`; per [evaluation-observability.md](../../docs/assistant/evaluation-observability.md)                       | **Pending**  |
| [2026-10-29-assistant-01-quality-observability](./2026-10-29-assistant-01-quality-observability.plan.md) (historical **quality observability** milestone; filename restored 2026-10-30) | Explicit follow-ups (composer polish, visitor feedback)                                                                                               | **Roadmap Phase 5**                                                    | Evidence-driven; no speculative backlog                                                                                                                                                                          | **Deferred** |

**Not transferred to Phase 4:** Phase 1 child **`plan-closure`** — docs-only archive of [01-quality-observability](./2026-10-29-assistant-01-quality-observability.plan.md#slice--plan-closure) after [Phase 1 exit criteria](./2026-10-29-assistant-01-quality-observability.plan.md#phase-1-exit-criteria) (including #107 merged). Phase 4 does **not** own that milestone archive.

**Implementation evidence (historical, already on `main`):** All completed slices in grounded RAG plan through `generation-ui`; `quality-observability` slice (table, API persist, CLIs, tests).

---

## Slice — operational-acceptance

**Recommended authority:** Manual verification gate

**Rationale:**

- Production ingest and deployed E2E require operator approval; criteria transferred from archived grounded RAG plan.

**Agent instruction:** Do not commit or open a PR. Run only the verification below; write allowed gitignored notes under `.agent-runs/assistant-reopening/` if needed; report verdict; stop.

**Absorbs:** Grounded RAG **`operational-acceptance`** (Phase A + Phase B). Full criteria preserved from [archived grounded plan — operational-acceptance](./archive/2026-10-08-assistant-grounded-rag-generation.plan.md#slice--operational-acceptance).

**Prerequisites (roadmap + grounded plan — all required before production Phase A):**

- **Phase 0:** Maintenance mode **shipped** (public generation off per Phase 0 exit criteria).
- **Phase 1:** [Phase 1 exit criteria](./2026-10-29-assistant-01-quality-observability.plan.md#phase-1-exit-criteria) met on `main` — observability confirmed; **[PR #107](https://github.com/mastermichaelt/portfolio/pull/107) merged**; recovery and evidence-integrity tests pass.
- **Phase 2:** TypeScript consolidation complete on `main` (including Zod structural validation per child plan).
- **Phase 3:** Conversational UI **verification pass** against live API ([03-conversational-ui](./2026-10-29-assistant-03-conversational-ui.plan.md)).
- Drizzle foundation + queries on `main`; migration cutover gate satisfied (`drizzle-migration-cutover` cancelled — Strategy A).
- `generation-api`, `/assistant` UI, and conversational UX on `main`.
- **Operator approval** still required before production `assistant:ingest` (Phase A) and before public re-enable (Phase B / reopen).

### Phase A — Production Neon corpus ingestion and verification

**Operator approval required:** Do not run `assistant:ingest` against production until the operator confirms target database and approves the run.

| Step | Action                                                                                                                         |
| ---- | ------------------------------------------------------------------------------------------------------------------------------ |
| 1    | Confirm Neon target (`portfolio-assistant` / branch / `portfolio_assistant`); `DATABASE_URL` is assistant scope only           |
| 2    | `npm run assistant:db:migrate` + `npm run assistant:db:verify` (direct connection for migrate) — single-authority Drizzle path |
| 3    | `npm run okf:build` (or verify corpus manifest for release)                                                                    |
| 4    | `npm run assistant:ingest` (operator session; no secrets in repo)                                                              |
| 5    | Post-ingest verify: non-zero `assistant_retrieval_units`; `assistant_ingestion_runs` + `bundle_sha256`; sample provenance      |
| 6    | Retrieval smoke: `npm run assistant:retrieve --` ≥2 known portfolio questions                                                  |
| 7    | Idempotent re-ingest: high skip count; stable row count                                                                        |
| 8    | Generation smoke on hosted index: grounded + abstention cases (API and/or operator debug command)                              |

**Phase A acceptance (measurable):**

- Single-authority migrate/verify; populated index; documented corpus parity vs reference baseline.
- Relevant retrieval for ≥2 recorded questions; valid grounded answers and safe abstentions without structural validation failures.
- No accidental index loss on re-ingest.

### Phase B — Local and deployed E2E acceptance

**Prerequisites:** Phase A signed off; maintenance off when testing public surface.

- **Local / staging:** Assembly-mode spot checks; resource bounds; citation-support and attribution checks (Vitest + targeted manual runs as needed).
- **Deployed:** Multi-turn `/assistant` smoke; citations; abstention; usage footer; rate limits; errors; mobile layout; latency/cost sanity.
- **Observability (from quality observability plan):** Evaluation rows persist fail-open on success/failure paths when enabled; review CLI usable; disclosure copy correct.
- **Sign-off:** Operator approval recorded; update [generation-eval-findings.md](../../docs/assistant/generation-eval-findings.md) with Phase A + Phase B notes.

**Verdict:** Pass / fail with blockers. **Do not** re-enable public flag without operator approval.

**Complexity:** **Operator time (L)**

---

## Slice — plan-closure

**Recommended authority:** Open PR only

**Rationale:**

- Docs-only archival after operational acceptance passes and public generation is re-enabled.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Prerequisites:** `reopening-checklist` merged; `operational-acceptance` verdict **pass**; public re-enabled by operator.

**Deliverables:**

- Archive this plan to `.cursor/plans/archive/2026-10-30-assistant-04-production-reopening.plan.md`
- Update [architecture-direction.md](../../docs/assistant/architecture-direction.md) and [rag-generation-direction.md](../../docs/assistant/rag-generation-direction.md) (active orchestration → [roadmap](./2026-10-30-assistant-roadmap.plan.md); remove stale “no UI” claims)
- Reconcile pre-existing drift in [cross-repository-source-inventory.md](../../docs/assistant/cross-repository-source-inventory.md) (RAG generation status) with shipped `main`
- Update [generation-eval-findings.md](../../docs/assistant/generation-eval-findings.md) with operational acceptance notes
- Update [2026-10-30-assistant-roadmap.plan.md](./2026-10-30-assistant-roadmap.plan.md) Phase 4 complete

(Historical grounded RAG and quality observability plans were archived with responsibility transfer on **2026-10-30** — do not re-archive them in this slice.)

---

## Agent prompts (copy/paste for Cursor)

### reopening-checklist

```text
@.cursor/plans/2026-10-30-assistant-04-production-reopening.plan.md

Implement slice reopening-checklist only. Do not run operational-acceptance or plan-closure.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Prerequisites: Phases 0–3 complete on main per roadmap (Phase 0 maintenance shipped; Phase 1 exit including #107 merged; Phase 2 consolidation; Phase 3 UI verification pass).

Deliverables: documented reopening checklist; config path to disable maintenance; tests. Mark reopening-checklist completed in plan frontmatter in this PR.

Verification: npm run lint, typecheck, test, build.
```

### operational-acceptance

```text
@.cursor/plans/2026-10-30-assistant-04-production-reopening.plan.md

Run manual verification gate operational-acceptance only.

Authority: Manual verification gate — no commit, no PR.

Topology: N/A — manual verification only; do not open a PR for this slice.

Do not re-enable public assistant without explicit operator approval in session.

Prerequisites: Phases 0–3 complete on main (Phase 0 maintenance shipped; Phase 1 exit including #107 merged; Phase 2 consolidation; Phase 3 UI verification pass). Operator approval required for production ingest (Phase A) and public re-enable.

Deliverables: execute Phase A + Phase B checklist in plan; optional notes in .agent-runs/assistant-reopening/; report pass/fail and blockers.

Verification: operator sign-off recorded; Phase A + Phase B checklist complete per plan.
```

### plan-closure

```text
@.cursor/plans/2026-10-30-assistant-04-production-reopening.plan.md

Execute only plan-closure after operational-acceptance pass and public re-enable approved.

Authority: Open PR only — docs-only; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: archive reopening plan; update architecture-direction, rag-generation-direction, generation-eval-findings; roadmap Phase 4 complete. Do not re-archive historical plans (already transferred 2026-10-30).

Verification: npm run validate:plans (or CI Validate plans job equivalent).
```
