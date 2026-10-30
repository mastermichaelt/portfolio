---
name: Assistant Phase 1 — Reliability & Observability
overview: Phase 1 child plan — shipped question-level evaluation observability on main plus outstanding generation validation recovery (PR #107). Production E2E verification stays Phase 4.
todos:
  - id: quality-observability
    content: "PR: evaluation table, API fail-open persistence, disclosure, CLI, tests, docs"
    status: completed
  - id: generation-recovery-pr107
    content: "PR #107: validation recovery, deterministic repair, bounded retry, graceful degradation, evidence integrity, diagnostics"
    status: pending
  - id: plan-closure
    content: "Docs-only when Phase 1 exit criteria met — roadmap Phase 1 complete; archive this child plan"
    status: pending
isProject: false
---

# Assistant Phase 1 — Reliability & Observability

**Filename date:** 2026-10-29 (original quality observability milestone). **Phase assignment:** 2026-10-30 roadmap IA.

## Parent plan

| | |
| --- | --- |
| **Parent roadmap** | [2026-10-30-assistant-roadmap.plan.md](./2026-10-30-assistant-roadmap.plan.md) |
| **Phase** | **1** — Reliability & Observability |
| **Phase objective** | Confirm evaluation observability on `main`; merge generation validation recovery ([PR #107](https://github.com/mastermichaelt/portfolio/pull/107)); preserve evidence integrity and diagnostic compatibility with observability. |
| **Entry criteria** | Phase 0 shipped (recommended before production deploy of #107). |
| **Dependencies** | Phase 0 maintenance policy; **#107 must merge before Phase 2** generation work. |
| **Completion criteria** | Phase 1 exit criteria below; then `plan-closure` and roadmap Phase 1 marked complete. |

## Phase 1 exit criteria

Phase 1 is **complete** when all of the following hold (production reopening **not** required):

1. **`quality-observability`** implementation confirmed **shipped** on `main` (table, fail-open API persist, disclosure, review/cleanup CLIs, tests).
2. **[PR #107](https://github.com/mastermichaelt/portfolio/pull/107) merged** on `main`.
3. **Recovery and evidence-integrity tests pass** — including `tests/assistant-generation-recovery.test.ts`, contract/service/API generation tests.
4. **Generation diagnostics remain compatible** with evaluation observability (PostHog generation events + evaluation row writes; no prompts or answer text in telemetry).
5. **No known blocking generation reliability regression** remains for progression to Phase 2.

**Not in Phase 1 scope:** production evaluation persistence verification, production ingest/E2E, or public reopen — owned by [Phase 4 production reopening](./2026-10-30-assistant-04-production-reopening.plan.md).

## Obligations owned elsewhere (do not duplicate)

| Topic | Owner | Reference |
| --- | --- | --- |
| Production evaluation persistence + disclosure verification | **Phase 4** | [04-production-reopening](./2026-10-30-assistant-04-production-reopening.plan.md) — observability checklist + `operational-acceptance` |
| Grounded RAG operational acceptance | **Phase 4** | Same plan — transferred from [archived grounded RAG](./archive/2026-10-08-assistant-grounded-rag-generation.plan.md) |
| Composer retention disclosure polish; visitor feedback API | **Phase 5** | [evaluation-observability.md](../../docs/assistant/evaluation-observability.md) |

**Historical transfer (2026-10-30 consolidation):** Production verification obligations moved to Phase 4 **unchanged** when this plan was briefly archived; restoration as Phase 1 does **not** reverse those transfers.

## Implementation history — quality-observability (shipped)

**Merged on `main`:** evaluation table `assistant_generation_evaluations`, terminal fail-open API persistence, composer disclosure, `assistant:evaluation:review` / cleanup CLIs, tests, [evaluation-observability.md](../../docs/assistant/evaluation-observability.md).

Architecture summary:

- **Terminal write** after generation outcome (success, abstention, or failure) — no pending rows.
- **Same Postgres** as retrieval/rate limits (`DATABASE_URL`); dedicated table, not corpus schema.
- **Fail-open** persistence; public API contract unchanged.
- **PostHog unchanged** — no question/answer text in generation telemetry events.
- **Retention:** manual `assistant:evaluation:cleanup` with explicit age window.

## Recommended execution authority

| Slice | Recommended authority | Agent instruction |
| --- | --- | --- |
| quality-observability | Open PR only | **Shipped** — no further implementation unless regression fix. |
| generation-recovery-pr107 | Open PR only | Do not merge. Stop after opening the PR (track [PR #107](https://github.com/mastermichaelt/portfolio/pull/107)). |
| plan-closure | Open PR only | Do not merge. Stop after opening the PR. |

Repo default: **Open PR only** ([planning-standards.md](../standards/planning-standards.md#repo-default-when-no-plan-slice-applies)).

## Repository topology (default)

Integration branch: **`main`**. Each slice: fresh branch from `origin/main`; PR base **`main`**; diff only that slice.

---

## Slice — quality-observability

**Recommended authority:** Open PR only

**Rationale:**

- Backend observability only; no RAG, API contract, or conversational UI redesign.

**Agent instruction:** **Historical — shipped.** Do not reopen unless fixing a regression.

**Goal:** Question-level evaluation rows, privacy disclosure, operator review/cleanup CLIs, tests, and docs.

**Acceptance:** Per [evaluation-observability.md](../../docs/assistant/evaluation-observability.md); CI green on `main`.

**Status:** **Completed** on `main`.

---

## Slice — generation-recovery-pr107

**Recommended authority:** Open PR only

**Rationale:**

- Recoverable structural validation failures should return valid public envelopes (200 / abstention) instead of spurious HTTP 502 while preserving citation and evidence-integrity rules.

**Agent instruction:** Do not merge. Stop after opening the PR. Implementation tracked in **[PR #107](https://github.com/mastermichaelt/portfolio/pull/107)** (`assistant-generation-validation-recovery`).

**Goal:** Generation validation recovery on `POST /api/assistant/generate` and shared service path:

- Validation issue taxonomy and bounded recovery after model JSON parse/repair.
- **Deterministic repair** (citation / presentation fixes where safe).
- **Bounded model retry** (single corrective retry; ordered retry policy).
- **Graceful degradation** including safe abstention when claims cannot be supported.
- **Evidence-integrity preservation** — no unsupported evidence-backed claims; existing contract validators remain authoritative.
- **Cumulative token accounting** across repair + retry paths.
- **Regression tests** (`assistant-generation-recovery`, service/API suites).
- **Diagnostic compatibility** — extend generation diagnostics, operator recovery logs, and PostHog `assistant_generation_completed` recovery metadata without prompts or answer text; evaluation fail-open unchanged.

**Acceptance:**

- PR #107 merged to `main`.
- `npm test` — recovery, contract, service, API, and `assistant-evaluation` tests pass.
- No known blocking regression for Phase 2 entry.

**Verification:**

```bash
npm test -- tests/assistant-generation-recovery.test.ts tests/assistant-generation-service.test.ts tests/assistant-evaluation.test.ts
npm run lint && npm run typecheck && npm run build
```

**Out of scope this slice:** Zod structural migration (Phase 2); production E2E eval verification (Phase 4).

---

## Slice — plan-closure

**Recommended authority:** Open PR only

**Rationale:**

- Docs-only closure after Phase 1 exit criteria; keeps active `.cursor/plans/` aligned with roadmap status.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Prerequisites:** Phase 1 exit criteria met; `generation-recovery-pr107` marked **completed** in frontmatter.

**Deliverables:** `# Shipped` note on this plan; move to `.cursor/plans/archive/2026-10-29-assistant-01-quality-observability.plan.md`; mark `plan-closure` completed; update [2026-10-30-assistant-roadmap.plan.md](./2026-10-30-assistant-roadmap.plan.md) Phase 1 **complete**.

---

## Explicit follow-ups (Phase 5 — not Phase 1)

- **Claude Design:** polish composer retention disclosure layout/copy.
- **Visitor feedback integration:** [evaluation-observability.md](../../docs/assistant/evaluation-observability.md#future-feedback-explicit-integration-task).

---

## Agent prompts (copy/paste for Cursor)

### generation-recovery-pr107

```text
@.cursor/plans/2026-10-29-assistant-01-quality-observability.plan.md

Track slice generation-recovery-pr107 via open PR #107 only. Do not start plan-closure or Phase 2 work in the same PR unless explicitly scoped.

Authority: Open PR only — complete PR #107 and open for review; do not merge unless Merge granted.

Topology: PR #107 branch targets main; verify diff is recovery-only per PR scope.

Deliverables: merge PR #107 when authorized; mark generation-recovery-pr107 completed in this plan frontmatter in the merge PR or a follow-up docs PR if plan file updated separately.

Verification: npm test (assistant-generation-recovery, generation-service, generation-api, assistant-evaluation); lint, typecheck, build.
```

### plan-closure

```text
@.cursor/plans/2026-10-29-assistant-01-quality-observability.plan.md

Execute only plan-closure after Phase 1 exit criteria met. Do not implement product code in this PR.

Authority: Open PR only — docs-only; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: # Shipped note; archive plan to .cursor/plans/archive/2026-10-29-assistant-01-quality-observability.plan.md; roadmap Phase 1 complete; mark plan-closure completed.

Verification: confirm PR #107 merged and exit criteria checklist; plan-validator passes.
```
