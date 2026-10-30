---
name: Assistant TypeScript consolidation
overview: TypeScript-first RAG application services under lib/assistant with thin HTTP/CLI adapters, Zod structural validation, preserved evidence integrity and Phase 1 recovery behavior, and retired superseded interactive CLIs.
todos:
  - id: module-boundaries
    content: "PR: dependency map, baseline inventory, guard blocking new app/lib→scripts imports"
    status: pending
  - id: generation-services
    content: "PR: migrate generation orchestration to lib/assistant/generation; API imports services only"
    status: pending
  - id: zod-structural
    content: "PR: Zod owns structural model JSON; preserve evidence-integrity validators and recovery"
    status: pending
  - id: evaluation-and-supporting
    content: "PR: consolidate remaining production lib→scripts imports; providers/embeddings TS"
    status: pending
  - id: cli-retirement
    content: "PR: remove superseded CLIs; thin operational adapters; docs and package scripts"
    status: pending
  - id: architecture-verification
    content: "PR: dependency-direction verification, tests/build, architecture doc updates"
    status: pending
  - id: plan-closure
    content: "Docs-only PR — # Shipped note, archive plan, roadmap Phase 2 complete"
    status: pending
isProject: false
---

# Assistant TypeScript consolidation (Phase 2)

## Parent plan

|                         |                                                                                                                                                                                                                                            |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Parent roadmap**      | [2026-10-30-assistant-roadmap.plan.md](./2026-10-30-assistant-roadmap.plan.md)                                                                                                                                                             |
| **Phase**               | **2** — TypeScript consolidation                                                                                                                                                                                                           |
| **Phase objective**     | Shared TypeScript application services; correct dependency direction; Zod structural validation; preserve behavior (including Phase 1 recovery).                                                                                           |
| **Entry criteria**      | **Phase 0 complete** (maintenance shipped); **Phase 1 complete** on `main` ([01-quality-observability](./2026-10-29-assistant-01-quality-observability.plan.md#phase-1-exit-criteria), including **#107 merged**).                         |
| **Dependencies**        | **Merged #107 recovery baseline on `main`** before `generation-services` / `zod-structural`. Phase 0 before **any Phase 2 implementation** PRs. Phase 0 policy recommended before **production deploy** of migration PRs (deploy ≠ merge). |
| **Completion criteria** | [Phase 2 exit criteria](#phase-2-exit-criteria) and all slices through `architecture-verification`.                                                                                                                                        |

**Non-goals:** Prompt-quality experiments; retrieval tuning; OKF producer rewrites in one PR; replacing plain-Node `assistant:db:migrate` / `verify` / `baseline`; DI frameworks; separate backend `tsc` emit pipeline.

---

## 1. Current architecture (repository evidence)

**As of `origin/main` (Oct 2026):** Production generation is implemented in `scripts/assistant/generation/*.mjs`. The Next.js API **imports those modules directly** — inverted dependency direction.

**PR #107** ([open](https://github.com/mastermichaelt/portfolio/pull/107), not merged): adds `recover-generation-response.mjs`, bounded model retry, graceful degradation, recovery diagnostics, and extended tests on the **same branch**. Phase 2 **must not reimplement** recovery; **port the merged Phase 1 baseline** during `generation-services` / `zod-structural`.

### Entry points

| Layer           | Location                                                                   | Role today                                                                                   |
| --------------- | -------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| HTTP            | `app/api/assistant/generate/route.ts`                                      | Thin — delegates to `handleAssistantGeneratePost`                                            |
| HTTP handler    | `lib/assistant/api/handle-generate-post.ts`                                | Rate limit, validation, **`runRagGeneration` from scripts**, evaluation persist              |
| HTTP envelope   | `lib/assistant/api/public-envelope.ts`, `errors.ts`, `citation-display.ts` | Public JSON; imports generation types/helpers from **scripts**                               |
| Client UI       | `lib/assistant/client/*`, `lib/assistant/ui/*`                             | Browser-only; no RAG orchestration                                                           |
| Operational CLI | `scripts/assistant/*.mjs` + `package.json`                                 | Ingest, retrieve, OKF, DB ops, evaluation review                                             |
| Interactive CLI | `assistant:answer`                                                         | Duplicates API generation path for manual experiments                                        |
| Tests           | `tests/assistant-*.test.ts`                                                | Heavy direct imports from **scripts** (acceptable during migration; target **lib services**) |

### Already TypeScript (keep / extend)

| Module              | Location                                                 | Notes                                                            |
| ------------------- | -------------------------------------------------------- | ---------------------------------------------------------------- |
| Drizzle schema      | `db/schema.ts`, `db/client.ts`                           | Single authority                                                 |
| Vector search       | `lib/assistant/db/search.ts`                             | Used via `retrieve/search.mjs` re-export                         |
| Ingest sync         | `lib/assistant/db/ingest-sync.ts`                        | Used via `ingest/sync.mjs` re-export                             |
| Parent fetch        | `lib/assistant/db/fetch-parent-units.ts`                 | Used via `generation/fetch-parent-units.mjs` re-export           |
| Rate limits         | `lib/assistant/db/rate-limit.ts`, `rate-limit-policy.ts` | API uses TS                                                      |
| Evaluation persist  | `lib/assistant/evaluation/*`                             | TS; still imports generation **types/classify from scripts**     |
| App Drizzle factory | `scripts/assistant/db/app-client.mjs`                    | Re-exports `@/db/client.ts` (requires strip-types + path loader) |

### Still JavaScript (production-critical)

| Area                     | Key files                                                                              |
| ------------------------ | -------------------------------------------------------------------------------------- |
| Generation orchestration | `generation/run-generation.mjs`, `prompt-templates.mjs`, `openai-chat.mjs`             |
| Response contract        | `generation/response-schema.mjs`, `validate-response.mjs`, `repair-model-response.mjs` |
| Recovery (#107)          | `generation/recover-generation-response.mjs`, `validation-issues.mjs`                  |
| Evidence assembly        | `generation/evidence-packet.mjs`, `approved-urls.mjs`, `generation-config.mjs`         |
| Embeddings               | `embeddings/openai-embeddings.mjs`, configs                                            |
| Ingest helpers           | `ingest/vector-format.mjs`, `ingest/manifest.mjs`                                      |
| Unit types               | `retrieval/unit-schema.mjs`                                                            |
| Shared errors            | `generation/errors.mjs`, `classify-generation-failure.mjs`, telemetry                  |

### Operational-only JavaScript (may stay `.mjs`)

Plain-Node DB scripts **without** `@/` path loader (contract: `tests/assistant-db-cli.test.ts`): `db/migrate.mjs`, `verify.mjs`, `baseline.mjs`, `client.mjs`, `load-env.mjs`, migration meta, integration test DB helpers.

OKF corpus pipeline (`scripts/assistant/okf/**`) remains CLI-oriented; not in Next bundle. Phase 2 **does not** require moving producers to `lib/`.

---

## 2. Target architecture

### Dependency invariant

```text
             ENTRY POINTS
      ┌──────────┬───────────┐
      │ HTTP API │ CLI / Job │
      └────┬─────┴─────┬─────┘
           │           │
           ▼           ▼
     ┌─────────────────────┐
     │ APPLICATION SERVICES│  lib/assistant/{generation,evaluation,…}
     │                     │
     │  (no imports from     │
     │   scripts entry     │
     │   points)           │
     └──────────┬──────────┘
                │
                ▼
     ┌─────────────────────┐
     │ INFRASTRUCTURE      │
     │ db/ + Drizzle       │
     │ providers/ (LLM,    │
     │   embeddings)       │
     │ telemetry hooks     │
     └─────────────────────┘
```

- **`lib/assistant/**`** owns production RAG behavior.
- **`app/api/assistant/**`** and **`lib/assistant/api/**`** are HTTP adapters only.
- **`scripts/assistant/**`** holds **operational entry points** (and OKF tooling), each a thin wrapper calling `lib/`.
- **Tests** should import **services** from `lib/assistant/**`, not from CLI files.

No DI container — enforce via module boundaries, baseline import guard (slice A), and review.

### Service boundaries (preserve during migration)

**`lib/assistant/generation/`** owns **orchestration** and the **model response contract** (prompt assembly, LLM call, structural + evidence validation, recovery). It must **not** absorb cross-cutting infrastructure used outside generation.

| Concern                         | Home                                                                           | Rationale                                                                                                                                                          |
| ------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Embeddings                      | **`lib/assistant/providers/embeddings.ts`**                                    | Shared by **ingestion**, **retrieval**, and generation — not a generation-only concern                                                                             |
| LLM chat JSON                   | **`lib/assistant/providers/llm.ts`**                                           | Provider boundary; generation orchestrates calls                                                                                                                   |
| Vector search / ranking         | **`lib/assistant/db/search.ts`**                                               | Already TS; retrieval service surface                                                                                                                              |
| Ingest sync                     | **`lib/assistant/db/ingest-sync.ts`**                                          | Ingestion service surface                                                                                                                                          |
| Evaluation persist              | **`lib/assistant/evaluation/*`**                                               | **Independently callable** — HTTP handler composes `runRagGeneration` + evaluation persist; generation orchestration must not hard-require evaluation side effects |
| Evidence integrity vs structure | **`generation/validate-response.ts`** vs **`generation/structural-schema.ts`** | Structural Zod vs application evidence rules (see §6)                                                                                                              |

Generation may **call** providers and retrieval; evaluation may **import shared types** (e.g. failure classification) from generation modules without living inside the orchestrator.

### Target module layout (illustrative)

Prefer **evolve existing TS** over rename-only moves.

| Target                                          | Responsibility         | Public surface (conceptual)                                                           |
| ----------------------------------------------- | ---------------------- | ------------------------------------------------------------------------------------- |
| `lib/assistant/generation/`                     | RAG orchestration      | `runRagGeneration`, config, prompts, recovery pipeline                                |
| `lib/assistant/generation/evidence-packet.ts`   | Assembly               | `assembleEvidencePacket`, modes                                                       |
| `lib/assistant/generation/response-schema.ts`   | Public + model shapes  | `AssistantGenerationResponse`, builders                                               |
| `lib/assistant/generation/validate-response.ts` | **Evidence integrity** | `validateGenerationResponse`, citation rules                                          |
| `lib/assistant/generation/structural-schema.ts` | **Zod structural**     | parse model JSON → typed object                                                       |
| `lib/assistant/generation/recovery.ts`          | Phase 1 recovery       | `resolveValidatedModelResponse`, diagnostics                                          |
| `lib/assistant/providers/llm.ts`                | OpenAI chat JSON       | `requestChatCompletionJson`                                                           |
| `lib/assistant/providers/embeddings.ts`         | OpenAI embeddings      | `embedTexts`, batch helpers                                                           |
| `lib/assistant/db/*`                            | Postgres + pgvector    | **Keep** search, ingest-sync, fetch-parent, rate-limit                                |
| `lib/assistant/evaluation/*`                    | Rows + persist         | **Keep**; remove script imports; **remain independently invocable** from HTTP adapter |
| `lib/assistant/retrieval/unit-schema.ts`        | Derived unit types     | Move from `scripts/retrieval/unit-schema.mjs`                                         |

Retrieval **search/ranking** stays in `lib/assistant/db/search.ts` (already TS). No separate `retrieval/ranking.ts` unless a future split adds clarity.

Ingestion **sync** stays `lib/assistant/db/ingest-sync.ts`; chunking/derive remain under `scripts/assistant/retrieval/` (operator pipeline).

---

## 3. Existing → target mapping

| Current                                                                                                | Target                                                                               | Action                                                                                                |
| ------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------- |
| `scripts/assistant/generation/run-generation.mjs`                                                      | `lib/assistant/generation/run-generation.ts`                                         | **Migrate** (port #107 recovery with behavior parity)                                                 |
| `prompt-templates.mjs`, `openai-chat.mjs`                                                              | `lib/assistant/generation/prompt.ts`, `providers/llm.ts`                             | **Migrate**                                                                                           |
| `response-schema.mjs`                                                                                  | `response-schema.ts` + `structural-schema.ts` (Zod)                                  | **Migrate / split** in `zod-structural`                                                               |
| `validate-response.mjs`                                                                                | `validate-response.ts`                                                               | **Migrate**; structural checks delegate to Zod                                                        |
| `repair-model-response.mjs`, `recover-generation-response.mjs`                                         | `recovery.ts`                                                                        | **Migrate** after #107 on `main`                                                                      |
| `evidence-packet.mjs`, `approved-urls.mjs`, `generation-config.mjs`, `errors.mjs`, telemetry, classify | `lib/assistant/generation/*`                                                         | **Migrate** with orchestration                                                                        |
| `embeddings/*.mjs`, `openai-request-headers.mjs`                                                       | `lib/assistant/providers/*`                                                          | **Migrate** in `evaluation-and-supporting`                                                            |
| `ingest/vector-format.mjs`, `retrieval/unit-schema.mjs`                                                | `lib/assistant/ingest/vector-format.ts` or `db/` helpers; `retrieval/unit-schema.ts` | **Migrate**                                                                                           |
| `lib/assistant/db/search.ts` etc.                                                                      | Same                                                                                 | **No change** (remove `.mjs` re-exports when safe)                                                    |
| `lib/assistant/evaluation/*`                                                                           | Same                                                                                 | **Rewire imports** to `lib/` shared modules; **do not** fold evaluation into generation orchestration |
| `lib/assistant/api/handle-generate-post.ts`                                                            | Same                                                                                 | **Rewire** to `lib/assistant/generation` only                                                         |
| `scripts/assistant/answer.mjs`                                                                         | —                                                                                    | **Retire** (`cli-retirement`)                                                                         |
| `scripts/assistant/retrieve.mjs`                                                                       | Thin CLI                                                                             | **Keep**; call `lib` search + embed                                                                   |
| `scripts/assistant/ingest.mjs`, `okf/**`, `retrieval/derive-units.mjs`                                 | Operational                                                                          | **Keep** entry points; import TS services where useful                                                |
| `scripts/assistant/db/{migrate,verify,baseline}.mjs`                                                   | Plain Node                                                                           | **Keep** `.mjs`                                                                                       |
| `generation/eval.mjs`, `retrieve/eval.mjs`                                                             | Test/dev harness                                                                     | **Move** imports to `lib` or keep as test-only utilities; not `package.json` scripts                  |

---

## 4. CLI classification

| npm script                                   | Decision              | Rationale                                                                         |
| -------------------------------------------- | --------------------- | --------------------------------------------------------------------------------- |
| `okf:build`                                  | **Keep**              | Corpus construction                                                               |
| `assistant:derive`                           | **Keep**              | Operator derivation                                                               |
| `assistant:ingest`                           | **Keep**              | Production index sync                                                             |
| `assistant:retrieve`                         | **Keep**              | Operator retrieval smoke                                                          |
| `assistant:db:migrate`, `verify`, `baseline` | **Keep** (plain Node) | Operational contract                                                              |
| `assistant:db:generate`, `studio`            | **Keep**              | Drizzle Kit                                                                       |
| `assistant:evaluation:review`, `cleanup`     | **Keep**              | Operator observability                                                            |
| `assistant:answer`                           | **Retire**            | Superseded by API + Vitest (`assistant-generation-*`, `assistant-generation-api`) |

**Retiring `assistant:answer` (with `cli-retirement`):**

- Remove `answer.mjs`, the `assistant:answer` npm script, and docs/env references.
- **Do not** preserve `parseAnswerArgs` (or move it into `lib/`) — it exists only for the retired CLI.
- **Remove tests** that assert the obsolete CLI argument interface; keep coverage by exercising **`runRagGeneration`** (and API tests) for the same behavioral guarantees.
- Retain shared argument-parsing helpers **only** if another **supported** operational CLI still uses them.

---

## 5. TypeScript execution strategy

**Recommendation:** Continue **noEmit TypeScript** consumed by:

1. **Next.js production API** — webpack/turbopack resolves `@/lib/assistant/**/*.ts` (existing).
2. **Vitest** — `@/` paths; primary verification for services.
3. **Operational CLIs that need `@/`** — `node --experimental-strip-types --import ./scripts/assistant/okf/register-tsconfig-paths.mjs` (Node **24.x** per repo `.nvmrc`); same pattern as today for ingest/retrieve/review.

**Do not add** `tsx` or a standalone `tsc` build for assistant services unless a concrete blocker appears.

**Plain-Node DB scripts** stay `.mjs` without path loader — do not force them through `@/db/client.ts` unless migrate/verify contract is updated deliberately.

**Limitations to document:**

- `register-tsconfig-paths.mjs` + strip-types is required for CLI entry points importing `@/lib/**`.
- Operational scripts must not assume Next.js bundling.
- CI uses same Node floor as `package.json` engines.

---

## 6. Zod vs evidence-integrity

| Concern                                                                                                                | Owner                        | Current                                                                                | Target                                                                             |
| ---------------------------------------------------------------------------------------------------------------------- | ---------------------------- | -------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| **Structural** — JSON shape, enums, required fields, claim array bounds                                                | **Zod** (authoritative)      | Hand-rolled `parseAssistantModelGenerationResponse`, `validateStructuralModelResponse` | `structural-schema.ts`; types inferred via `z.infer`                               |
| **Evidence integrity** — citation IDs ↔ packet, unit_id match, URL allowlist, unsupported claims, abstention semantics | **Application logic**        | `validate-response.mjs` (`validateGenerationResponse`, citation validators)            | Same module in TS; **unchanged rules**                                             |
| **Recovery** — repair, retry order, degradation, token totals                                                          | **Application logic** (#107) | `recover-generation-response.mjs`                                                      | `recovery.ts`; map Zod failures into existing validation taxonomy where applicable |

**Preserve:** structurally valid output is **not** automatically trustworthy; eval and contract tests remain.

**Migration:** Port existing parse/validate behavior test-for-test (`assistant-generation-contract`, `repair`, `recovery`, `eval` fixtures) before deleting handwritten structural parsers.

---

## 7. Phase 1 / PR #107 dependency

| State                                                               | Implication for Phase 2                                                                                                        |
| ------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **#107 open** on `assistant-generation-validation-recovery`         | `generation-services` starts from **`main` + merge #107`**; do not port recovery from unmerged branch assumptions in isolation |
| **`recover-generation-response.mjs` absent on `origin/main` today** | Slice B blocked until recovery lands on integration branch                                                                     |
| **Evaluation fail-open**                                            | Already TS; must remain compatible with recovery diagnostics and PostHog fields                                                |

---

## 8. Migration invariants (all slices)

- Public API JSON envelope unchanged unless a separate coordinated change is approved.
- Retrieval ranking, filters, and pgvector queries unchanged.
- Prompt text unchanged in migration PRs (copy changes are out of scope).
- Citation and evidence-integrity rules unchanged.
- Phase 1 recovery behavior preserved post-merge.
- Evaluation persistence fail-open unchanged.
- Failure classification and operator diagnostics preserved.
- Drizzle schema and migration history untouched.
- Documented operational commands remain runnable.
- Privacy boundaries (no question/answer text in PostHog) unchanged.

---

## 9. Migration slices (PR sequence)

Dependency order: **A → B → C → D → E → F → plan-closure**.

## Slice — module-boundaries

**Recommended authority:** Open PR only

**Rationale:**

- Establishes the migration map and **early architectural safeguard** before large moves.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Goal:**

1. Document dependency rules (this plan §2–3).
2. **Inventory** every production import from `app/**` and `lib/**` into `scripts/assistant/**` (including re-exports where practical). Classify each as:
   - **CLI entry** — importing a script meant as a command entry point; must disappear.
   - **Shared implementation under scripts/** — primary migration target (generation, embeddings, validators, etc.).
3. **Baseline guard:** commit a machine-readable baseline (e.g. JSON list of allowed import paths or a Vitest/Node script with frozen allowlist). CI fails when **new** violations appear; **existing** baseline entries remain allowed until removed in later slices.

| Stage      | Enforcement                                                                          |
| ---------- | ------------------------------------------------------------------------------------ |
| Slice A    | Inventory + baseline; **block new** `app/` / `lib/` → `scripts/assistant/**` imports |
| Slices B–E | Migrate modules; **shrink** baseline each PR                                         |
| Slice F    | **Remove baseline**; enforce **zero** production imports from `scripts/assistant/**` |

**Implementation preference:** existing lint or a **lightweight static check** (grep + test, or `eslint-plugin-import` `no-restricted-paths` with generated allowlist) — **not** a dependency-analysis framework.

**Acceptance:** Baseline guard runs in CI (or pre-commit if repo convention fits); migration map verified; no new violations without baseline update.

**Verification:** `npm test`; PR documents inventory counts (CLI entry vs shared impl).

---

## Slice — generation-services

**Recommended authority:** Open PR only

**Rationale:**

- Fixes the primary architectural inversion (API → scripts generation).

**Agent instruction:** Do not merge. Stop after opening the PR.

**Prerequisites:** `module-boundaries` merged; **PR #107 merged to `main`**.

**Goal:** Move `runRagGeneration` and **generation-scoped** dependencies to `lib/assistant/generation/**` (not embeddings — those belong in `providers/` per §2). Update `handle-generate-post.ts` and tests to import generation from `@/lib/assistant/generation/**` only (no `@/scripts/assistant/generation` from `lib/` or `app/`). **Shrink** import baseline.

**Acceptance:** `npm run build`; `assistant-generation-*` + API tests pass; behavior parity with pre-migration + #107 recovery.

**Verification:** `npm test -- tests/assistant-generation-*.ts tests/assistant-generation-api.test.ts`; `npm run build`.

**Rollback:** Revert PR; restore script imports.

---

## Slice — zod-structural

**Recommended authority:** Open PR only

**Rationale:**

- Single authoritative structural validator reduces drift between types and runtime checks.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Prerequisites:** `generation-services` merged.

**Goal:** Add `zod` dependency; implement structural schemas; wire into parse/recovery path; keep evidence-integrity in `validate-response.ts`.

**Acceptance:** Contract, repair, recovery, eval tests pass; no duplicate structural validation frameworks.

**Verification:** `npm test` (generation contract/recovery/repair/eval); `npm run typecheck`.

---

## Slice — evaluation-and-supporting

**Recommended authority:** Open PR only

**Rationale:**

- Clears remaining `lib/**` → `scripts/**` imports for embeddings, vector format, and evaluation typing.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Prerequisites:** `generation-services` merged (prefer after `zod-structural` if types colocated).

**Goal:** Migrate **`lib/assistant/providers/`** (embeddings, shared HTTP headers) and remaining shared types (`unit-schema`, vector format); rewire ingest/search/evaluation to providers + `lib/` only. **Evaluation modules stay independently callable.** **Shrink** import baseline.

**Acceptance:** Ingest/retrieve/evaluation tests pass; no production imports from generation scripts.

**Verification:** `npm test` (assistant-ingest, assistant-retrieve, assistant-evaluation, embeddings).

---

## Slice — cli-retirement

**Recommended authority:** Open PR only

**Rationale:**

- Removes superseded interactive workflows; reduces confusion with production API.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Prerequisites:** `generation-services` merged; tests no longer depend on `assistant:answer` or `parseAnswerArgs`.

**Goal:** Remove `assistant:answer`, `answer.mjs`, and CLI-specific tests; update docs; keep operational commands; thin `retrieve`/`ingest`/`evaluation` CLIs calling `lib/`. **Shrink** import baseline.

**Acceptance:** `package.json` has no `assistant:answer`; docs updated; CI green.

**Verification:** `npm test`; grep for removed command.

---

## Slice — architecture-verification

**Recommended authority:** Open PR only

**Rationale:**

- Confirms the target architecture is enforced before plan closure.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Prerequisites:** Prior slices merged.

**Goal:** Final audit — **remove import baseline** and enforce **zero** `app/` / `lib/` → `scripts/assistant/**` production imports; update `docs/assistant/architecture-direction.md` (and related) with TS-first diagram and service boundaries; remove obsolete shims only when unused.

**Acceptance:** [Phase 2 exit criteria](#phase-2-exit-criteria) met.

**Verification:** `npm run lint`, `typecheck`, `test`, `build`; manual note on operational CLI smoke paths.

---

## Slice — plan-closure

**Recommended authority:** Open PR only

**Rationale:**

- Archives completed Phase 2 plan per planning standards.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Prerequisites:** `architecture-verification` merged.

**Goal:** `# Shipped` note; archive to `.cursor/plans/archive/`; roadmap Phase 2 complete.

**Acceptance:** Plan validator passes; roadmap updated.

**Verification:** `validate:plans` on archived file if applicable.

---

## Phase 2 exit criteria

Phase 2 is **complete** when:

1. Production generation orchestration is **TypeScript** under `lib/assistant/generation/`.
2. Production RAG services live **outside** CLI entry points; HTTP adapters call `lib/` only.
3. **Zod** is authoritative for **structural** model JSON validation.
4. **Evidence-integrity** validation remains separate and unchanged in intent.
5. **Phase 1 recovery** behavior is preserved on `main`.
6. **`assistant:answer`** and other superseded interactive CLIs are **removed**.
7. **Operational** commands (`ingest`, `retrieve`, `okf:build`, `derive`, DB ops, evaluation review/cleanup) remain functional.
8. Retrieval, ranking, evaluation persist, and public API contracts preserved.
9. `npm run lint`, `typecheck`, `test`, `build` pass.
10. No obsolete **production** shims (`lib/` or `app/` importing `scripts/assistant/**`); **import guard** at zero violations (baseline removed).
11. Architecture docs reflect the implementation.

---

## Risks and rollback

| Risk                                  | Mitigation                                                                            |
| ------------------------------------- | ------------------------------------------------------------------------------------- |
| Large generation move breaks API      | Slice B only; exhaustive generation test suite; feature flag not required — revert PR |
| #107 merge conflicts with migration   | Start slice B from latest `main` after #107; do not parallel reimplement recovery     |
| Zod changes error messages / taxonomy | Golden tests; map Zod issues to existing codes for API/telemetry                      |
| CLI strip-types regressions           | Keep plain-Node DB scripts untouched; test operational scripts in PR E                |
| Accidental prompt/retrieval change    | Migration invariants; separate PRs for quality experiments                            |

---

## Recommended execution authority

| Slice                     | Recommended authority | Agent instruction                        |
| ------------------------- | --------------------- | ---------------------------------------- |
| module-boundaries         | Open PR only          | Do not merge. Stop after opening the PR. |
| generation-services       | Open PR only          | Do not merge. Stop after opening the PR. |
| zod-structural            | Open PR only          | Do not merge. Stop after opening the PR. |
| evaluation-and-supporting | Open PR only          | Do not merge. Stop after opening the PR. |
| cli-retirement            | Open PR only          | Do not merge. Stop after opening the PR. |
| architecture-verification | Open PR only          | Do not merge. Stop after opening the PR. |
| plan-closure              | Open PR only          | Do not merge. Stop after opening the PR. |

Repo default: **Open PR only** ([planning-standards.md](../standards/planning-standards.md#repo-default-when-no-plan-slice-applies)).

## Repository topology (default)

Each slice: fresh branch from `origin/main`; PR base **`main`**; diff only that slice.

---

## Agent prompts (copy/paste for Cursor)

### module-boundaries

```text
@.cursor/plans/2026-10-30-assistant-02-typescript-consolidation.plan.md

Implement slice module-boundaries only. Do not start generation-services.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: dependency audit, migration map alignment, **baseline import guard** (block new app/lib→scripts violations). Mark module-boundaries completed in plan frontmatter in this PR.

Verification: npm test; document inventory (CLI entry vs shared impl); guard fails on synthetic new violation.
```

### generation-services

```text
@.cursor/plans/2026-10-30-assistant-02-typescript-consolidation.plan.md

Implement slice generation-services only. Prerequisites: module-boundaries merged; PR #107 merged to main. Do not start zod-structural.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: lib/assistant/generation/* with runRagGeneration; handle-generate-post and tests import lib only; port Phase 1 recovery from merged main. Mark generation-services completed in plan frontmatter in this PR.

Verification: npm test (assistant-generation-*); npm run build.
```

### zod-structural

```text
@.cursor/plans/2026-10-30-assistant-02-typescript-consolidation.plan.md

Implement slice zod-structural only. Prerequisite: generation-services merged.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: Zod structural schemas; evidence-integrity validators unchanged in behavior; recovery compatibility. Mark zod-structural completed in plan frontmatter in this PR.

Verification: npm test (assistant-generation-contract, recovery, repair, eval).
```

### evaluation-and-supporting

```text
@.cursor/plans/2026-10-30-assistant-02-typescript-consolidation.plan.md

Implement slice evaluation-and-supporting only. Prerequisite: generation-services merged.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: providers/embeddings TS; clear lib→scripts imports for production paths. Mark evaluation-and-supporting completed in plan frontmatter in this PR.

Verification: npm test (assistant-ingest, assistant-retrieve, assistant-evaluation, embeddings).
```

### cli-retirement

```text
@.cursor/plans/2026-10-30-assistant-02-typescript-consolidation.plan.md

Implement slice cli-retirement only. Prerequisite: generation-services merged.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: remove assistant:answer and parseAnswerArgs; drop CLI-specific tests; update docs; keep operational commands. Mark cli-retirement completed in plan frontmatter in this PR.

Verification: npm test; grep for assistant:answer and parseAnswerArgs.
```

### architecture-verification

```text
@.cursor/plans/2026-10-30-assistant-02-typescript-consolidation.plan.md

Implement slice architecture-verification only. Prerequisites: prior slices merged.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: final dependency audit; remove import baseline; enforce zero violations; docs/assistant architecture updates; shim cleanup. Mark architecture-verification completed in plan frontmatter in this PR.

Verification: npm run lint, typecheck, test, build.
```

### plan-closure

```text
@.cursor/plans/2026-10-30-assistant-02-typescript-consolidation.plan.md

Execute only plan-closure after architecture-verification merges.

Authority: Open PR only — docs-only; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: # Shipped note; archive plan; roadmap Phase 2 complete. Mark plan-closure completed.

Verification: plan-validator passes on this plan file.
```
