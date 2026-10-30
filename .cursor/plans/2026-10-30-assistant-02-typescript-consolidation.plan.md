---
name: Assistant TypeScript consolidation
overview: Migrate reusable assistant application logic from scripts/assistant/*.mjs to lib/assistant TypeScript, introduce Zod for structural validation, retire obsolete test-only CLIs, and preserve plain-Node DB operational scripts.
todos:
  - id: cli-retirement
    content: "PR: retire redundant test-only CLIs; document operator commands; update tests/docs"
    status: pending
  - id: foundations-ts
    content: "PR: embeddings, vector format, unit types, shared errors/config in lib/assistant"
    status: pending
  - id: generation-ts
    content: "PR: migrate generation pipeline to TypeScript; API imports lib only"
    status: pending
  - id: zod-structural
    content: "PR: Zod schemas replace handwritten structural parsers; keep evidence-integrity validators"
    status: pending
  - id: compat-cleanup
    content: "PR: remove obsolete mjs shims/loaders where unused; keep plain-Node db scripts"
    status: pending
  - id: plan-closure
    content: "Docs-only PR — # Shipped note, archive plan, pointer in 2026-10-30-assistant-roadmap.plan.md"
    status: pending
isProject: false
---

# Assistant TypeScript consolidation

## Parent plan

| | |
| --- | --- |
| **Parent roadmap** | [2026-10-30-assistant-roadmap.plan.md](./2026-10-30-assistant-roadmap.plan.md) |
| **Phase** | **2** — TypeScript consolidation |
| **Phase objective** | TS-first reusable assistant logic; Zod structural validation; retire obsolete test CLIs; preserve operational ingest/DB. |
| **Entry criteria** | Phase 1 (PR #107) merged on `main`. |
| **Dependencies** | Phase 0 shipped (policy); Phase 1 before `generation-ts` / `zod-structural` slices. |
| **Completion criteria** | All implementation slices + `plan-closure`; roadmap Phase 2 exit criteria met. |

**Prerequisites:**

- **Phase 0** maintenance mode merged (public generation disabled during consolidation — policy).
- **Phase 1** [PR #107](https://github.com/mastermichaelt/portfolio/pull/107) **merged** before **`generation-ts`** or **`zod-structural`** (same files).

**Investigation summary (Oct 2026):** Production API imports `scripts/assistant/generation/*.mjs`; `lib/assistant/db/*.ts` already owns Drizzle queries with thin `.mjs` re-exports; operational `assistant:db:*` uses plain Node without `@/` (contract in `tests/assistant-db-cli.test.ts`). Recommended approach: **incremental hybrid** — TS in `lib/assistant/**`, no separate `tsc` emit pipeline; CLIs use existing `node --experimental-strip-types` + `register-tsconfig-paths.mjs` or import compiled-via-Next modules only from tests/API.

**Non-goals:** Migrating every OKF producer in one PR; replacing plain-Node migrate/verify/baseline; coupling to conversational UI redesign.

## Recommended execution authority

| Slice | Recommended authority | Agent instruction |
| --- | --- | --- |
| cli-retirement | Open PR only | Do not merge. Stop after opening the PR. |
| foundations-ts | Open PR only | Do not merge. Stop after opening the PR. |
| generation-ts | Open PR only | Do not merge. Stop after opening the PR. |
| zod-structural | Open PR only | Do not merge. Stop after opening the PR. |
| compat-cleanup | Open PR only | Do not merge. Stop after opening the PR. |
| plan-closure | Open PR only | Do not merge. Stop after opening the PR. |

Repo default: **Open PR only** ([planning-standards.md](../standards/planning-standards.md#repo-default-when-no-plan-slice-applies)).

## Repository topology (default)

Each slice: fresh branch from `origin/main`; PR base **`main`**; diff only that slice.

---

## Slice — cli-retirement

**Recommended authority:** Open PR only

**Rationale:**

- Retire redundant test-only CLIs before TS migration to avoid maintaining duplicate entry points.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Goal:** Remove CLI entry points that exist only for manual testing when Vitest already covers the same behavior; keep operator-meaningful commands.

**Inventory (starting point):**

| Command | Keep / retire | Rationale |
| --- | --- | --- |
| `assistant:db:migrate`, `verify`, `baseline` | **Keep** (plain Node) | Operational contract |
| `okf:build`, `assistant:derive`, `assistant:ingest` | **Keep** | Corpus + index ops |
| `assistant:retrieve` | **Keep** (unless replaced) | Operator retrieval smoke; `assistant-retrieval-eval` uses modules directly |
| `assistant:answer` | **Retire or demote** | Duplicates API + extensive Vitest (`assistant-generation-*`); optional thin debug script documented for operators |
| `assistant:evaluation:review`, `cleanup` | **Keep** | Operator observability |

**Acceptance:** No required CI workflow invokes retired scripts; docs (`assistant-database.md`, `.env.example`) updated; test coverage unchanged or improved.

**Verification:** `npm test`; grep repo for removed script names.

**Rollback:** Restore `package.json` script + entry file.

**Complexity:** **S**

---

## Slice — foundations-ts

**Recommended authority:** Open PR only

**Rationale:**

- Shared embeddings and retrieval types should live in `lib/assistant/` before migrating generation orchestration.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Goal:** Move low-level shared modules into TypeScript under `lib/assistant/` without changing generation orchestration.

**Scope (illustrative):**

- `embeddings/index-config`, `embedding-config`, `openai-embeddings` (or split client vs config)
- `ingest/vector-format`
- `retrieval/unit-schema`
- Shared `generation/errors`, `generation-config`, `validate-query`, `openai-request-headers`

**Pattern:** Follow `lib/assistant/db/search.ts` ← `retrieve/search.mjs` re-export; migrate importers (`ingest-sync.ts`, tests) to `@/lib/assistant/...` then shrink shims.

**Acceptance:** `npm run typecheck`, `npm test`; ingest and retrieve tests pass; API behavior unchanged.

**Complexity:** **M**

---

## Slice — generation-ts

**Recommended authority:** Open PR only

**Rationale:**

- API and tests should import generation from TypeScript after PR #107 stabilizes recovery behavior.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Goal:** `runRagGeneration` and dependencies live in `lib/assistant/generation/`; `handle-generate-post.ts` imports TS only.

**Scope:** evidence packet, approved URLs, prompts, OpenAI chat adapter, telemetry, classify failure, repair/recovery (**post-#107** code), response build helpers, `run-generation` entry.

**Out of scope this slice:** Zod (next slice); OKF producers.

**Acceptance:** `npm run build`; generation API and service tests pass; optional retained `assistant:answer` shim imports lib.

**Complexity:** **L**

---

## Slice — zod-structural

**Recommended authority:** Open PR only

**Rationale:**

- Structural model JSON belongs in Zod; evidence-integrity rules stay as explicit validators.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Goal:** Add **`zod`** dependency; structural model JSON validated via schemas; remove redundant hand-rolled shape checks in former `response-schema` / `parseAssistantModelGenerationResponse` where superseded.

**Keep separate (not Zod-only):**

- Evidence-integrity rules (citation IDs vs packet, URL allowlists, attribution vs evidence)
- Recovery/degradation policy from #107 — map Zod issues into existing taxonomy where possible

**Acceptance:** Contract + recovery tests pass; no duplicate structural frameworks; types inferred from Zod where practical.

**Complexity:** **M**

---

## Slice — compat-cleanup

**Recommended authority:** Open PR only

**Rationale:**

- Remove obsolete shims only after TS imports settle to avoid breaking operator DB scripts.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Goal:** Delete obsolete `.mjs` shims and unused loaders after imports settle; **retain** `scripts/assistant/db/*.mjs` operational stack and any OKF paths not yet migrated.

**Acceptance:** Grep shows no dead `@/scripts/assistant/generation` imports from `lib/`; `assistant-db-cli.test.ts` still passes.

**Complexity:** **M**

---

## Slice — plan-closure

**Recommended authority:** Open PR only

**Rationale:**

- Archive completed Phase 2 plan after all slices merge; update roadmap status.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Prerequisites:** All implementation slices merged.

**Deliverables:** Archive to `.cursor/plans/archive/2026-10-30-assistant-02-typescript-consolidation.plan.md`; update [2026-10-30-assistant-roadmap.plan.md](./2026-10-30-assistant-roadmap.plan.md) Phase 2; refresh stale assistant docs mentioning CLI-only generation.

---

## Agent prompts (copy/paste for Cursor)

### cli-retirement

```text
@.cursor/plans/2026-10-30-assistant-02-typescript-consolidation.plan.md

Implement slice cli-retirement only. Do not start foundations-ts or later slices.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: retire redundant test-only CLIs per plan inventory; preserve operator ingest/retrieve/DB/evaluation commands; update docs and tests. Mark cli-retirement completed in plan frontmatter in this PR.

Verification: npm run lint, typecheck, test, format:check.
```

### foundations-ts

```text
@.cursor/plans/2026-10-30-assistant-02-typescript-consolidation.plan.md

Implement slice foundations-ts only. Prerequisite: cli-retirement merged. Do not start generation-ts.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: move foundational modules to lib/assistant per plan; preserve behavior; update tests/importers. Mark foundations-ts completed in plan frontmatter in this PR.

Verification: npm run typecheck; npm test (assistant-ingest, assistant-retrieve, embeddings tests).
```

### generation-ts

```text
@.cursor/plans/2026-10-30-assistant-02-typescript-consolidation.plan.md

Implement slice generation-ts only. Prerequisites: foundations-ts merged; PR #107 merged to main. Do not start zod-structural.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: migrate generation pipeline to lib/assistant/generation; handle-generate-post imports TS; npm run build passes. Mark generation-ts completed in plan frontmatter in this PR.

Verification: npm run test (assistant-generation-*); npm run build.
```

### zod-structural

```text
@.cursor/plans/2026-10-30-assistant-02-typescript-consolidation.plan.md

Implement slice zod-structural only. Prerequisite: generation-ts merged. Do not start compat-cleanup.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: Zod for structural validation; evidence-integrity validators preserved; remove redundant handwritten structural parsers. Mark zod-structural completed in plan frontmatter in this PR.

Verification: npm test (assistant-generation-contract, recovery, repair, eval tests).
```

### compat-cleanup

```text
@.cursor/plans/2026-10-30-assistant-02-typescript-consolidation.plan.md

Implement slice compat-cleanup only. Prerequisites: zod-structural merged.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: remove obsolete shims/loaders; keep plain-Node db scripts. Mark compat-cleanup completed in plan frontmatter in this PR.

Verification: npm test; assistant-db-cli tests; npm run build.
```

### plan-closure

```text
@.cursor/plans/2026-10-30-assistant-02-typescript-consolidation.plan.md

Execute only plan-closure.

Authority: Open PR only — docs-only; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Prerequisites: all implementation slices merged and marked completed.

Deliverables: # Shipped note; archive plan; update 2026-10-30-assistant-roadmap.plan.md Phase 2 status.

Verification: npm run validate:plans (or CI Validate plans job equivalent).
```
