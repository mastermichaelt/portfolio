---
name: Assistant grounded RAG generation
overview: Multi-slice milestone for dev-only grounded answers (bounded full-parent evidence assembly → gpt-4o-mini → citation integrity + generation-eval citation support) on the shipped retrieve/pgvector stack — no public API or chat UI.
todos:
  - id: plan-only-pr
    content: "Plan-only PR — commit plan artifact and rag-generation-direction pointer; do not implement"
    status: completed
  - id: generation-contract
    content: "PR: evidence packet (full_parent default, top_k_only baseline), EvidenceBudgetExceeded fail-closed, citation-integrity validators, contract tests"
    status: pending
  - id: generation-cli
    content: "PR: openai-chat fetch adapter, assistant:answer CLI, usage/timeouts, assistant-database + .env.example"
    status: pending
  - id: generation-eval
    content: "PR: generation eval harness (citation-support + assembly-mode comparison), deterministic + skipIf integration, findings stub"
    status: pending
  - id: operational-acceptance
    content: "Manual verification gate — ~12–15 assistant:answer runs, operator sign-off, generation-eval-findings.md"
    status: pending
  - id: plan-closure
    content: "Docs-only PR — # Shipped note, archive plan, update architecture-direction + rag-generation-direction"
    status: pending
isProject: false
---

# Assistant grounded RAG generation

**Goal:** Turn visitor questions into **grounded, attributable answers** using the indexed OKF corpus (101 concepts; 12/12 scored retrieval-eval positives on current index). **Generation quality and correctness first** — not visitor-facing chat UX.

**Direction (design background):** [rag-generation-direction.md](../../docs/assistant/rag-generation-direction.md)

**Prerequisites (shipped):** OKF + structure-aware derive/ingest/retrieve; cross-repository corpus + retrieval-eval — [cross-repository-corpus-eval-findings.md](../../docs/assistant/cross-repository-corpus-eval-findings.md)

**Non-goals (milestone):** corpus expansion, retrieval-eval baseline changes, `app/api/`, chat UI, streaming, web search, LangChain, DB schema changes, automatic bulk generation.

## Locked decisions (plan review 2026-10-08)

| Topic                  | Decision                                                                                                                    |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Chat model             | `gpt-4o-mini` (`ASSISTANT_GENERATION_MODEL` override); fetch-based Chat Completions (mirror embeddings adapter)             |
| Default assembly       | **Bounded full-parent** at **OKF concept** boundary (`okf_concept_id`); load all indexed units per hit parent from Postgres |
| Eval baseline assembly | `top_k_only` via `--assembly-mode` (non-default)                                                                            |
| Generation retrieve K  | Default **10** (`--top-k`); retrieve CLI default **5** unchanged                                                            |
| Budget                 | Truncate **unmatched** chunks only, or **`EvidenceBudgetExceeded`** — never silently drop top-K matched units               |
| Citations              | **Integrity** in contract; **support** in generation-eval                                                                   |
| Neighbour ±1 expansion | **Deferred**                                                                                                                |

## Recommended execution authority

| Slice                  | Recommended authority    | Agent instruction                          |
| ---------------------- | ------------------------ | ------------------------------------------ |
| generation-contract    | Open PR only             | Do not merge. Stop after opening the PR.   |
| generation-cli         | Open PR only             | Do not merge. Stop after opening the PR.   |
| generation-eval        | Open PR only             | Do not merge. Stop after opening the PR.   |
| operational-acceptance | Manual verification gate | No commit/PR; gitignored run notes allowed |
| plan-closure           | Open PR only             | Do not merge. Stop after opening the PR.   |

Repo default: **Open PR only** ([planning-standards.md](../standards/planning-standards.md)).

## Repository topology (default)

Multi-slice plans stack **execution order**, not Git branches. Integration branch: **`main`**.

**Before each implementation slice:** `git fetch` → fresh branch from `origin/main`.

**Before opening a PR:** branch contains **only** that slice’s changes.

**After opening:** PR base is `main`; diff has no prior-slice work except through merged `main`.

---

## Architectural summary

```mermaid
flowchart LR
  question[VisitorQuestion]
  retrieve[runAssistantRetrieve]
  assemble[assembleEvidencePacket]
  generate[openaiChatStructured]
  validateIntegrity[validateCitationIntegrity]
  question --> retrieve
  retrieve --> assemble
  assemble --> generate
  generate --> validateIntegrity
```

### Evidence assembly (`full_parent` default)

1. Retrieve top-K (default 10); record `matched_hits[]` (rank, distance, `unit_id`, `okf_concept_id`).
2. Distinct parents ordered by best hit rank.
3. Per parent: fetch **all** `assistant_retrieval_units` rows for that `okf_concept_id`; order by `chunk_index`, `unit_id`.
4. Dedupe `content_hash`; stable `evidence_id` registry.
5. **Budget:** include all matched units, then unmatched chunks in section order until cap; else throw **`EvidenceBudgetExceeded`** (no LLM). Never omit a matched unit silently.
6. **`top_k_only`:** retrieved rows only (comparison / eval baseline).

### Citation layers

| Layer                  | Slice                             | Purpose                                |
| ---------------------- | --------------------------------- | -------------------------------------- |
| **Citation integrity** | `generation-contract`, CLI        | IDs/URLs refer to supplied packet only |
| **Citation support**   | `generation-eval`, slice 4 review | Cited text backs the claim             |

### Response contract (illustrative)

Structured JSON: `answer_text`, `support_level` (`full` \| `partial` \| `none`), `citations[]` (`evidence_id`, `unit_id`), optional `diagnostics` (`assembly_mode`, `truncated`).

### Deferred

Public API, chat UI, streaming, rate limits, neighbour expansion, tokenizer-exact budgets, LLM-as-judge in CI, live web search.

---

## Slice — `generation-contract`

**Recommended authority:** Open PR only

**Rationale:** Typed packet + fail-closed budget + integrity validators are prerequisites for any LLM call; testable without API spend.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Goal:** `full_parent` + `top_k_only` assembly, `EvidenceBudgetExceeded`, response schema, **citation-integrity** validation only.

**Non-goals:** `assistant:answer` CLI, live OpenAI chat, citation-support scoring, corpus/DB changes.

**Likely files:** `scripts/assistant/generation/evidence-packet.mjs`, `fetch-parent-units.mjs`, `response-schema.mjs`, `validate-response.mjs`, `prompt-templates.mjs`, `tests/assistant-generation-contract.test.ts`

**Dependencies:** Retrieval stack on `main`.

**Acceptance:**

- Matched-unit invariant enforced or `EvidenceBudgetExceeded`.
- Unmatched-only truncation tests; OKF-boundary tests (no whole-repo expansion).
- Integrity validator unit tests.
- `npm run test -- tests/assistant-generation-contract.test.ts`, `npm run lint`, `npm run typecheck`, `npm run format:check`.

**PR boundary:** Contract modules + tests only.

---

## Slice — `generation-cli`

**Recommended authority:** Open PR only

**Rationale:** Proves end-to-end operator path before eval investment.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Goal:** `npm run assistant:answer` — retrieve → assemble → gpt-4o-mini → integrity validate; `--assembly-mode`, `--top-k`, `--json`, `--dry-run-retrieval`.

**Dependencies:** `generation-contract` merged.

**Acceptance:**

- Grounded sample question with valid citations when secrets set.
- Non-zero exit on `EvidenceBudgetExceeded`, validation failure, API errors.
- Mocked `fetch` tests; docs in [assistant-database.md](../../docs/assistant/assistant-database.md); `.env.example` for `ASSISTANT_GENERATION_MODEL`.

**PR boundary:** CLI + chat adapter + docs; no generation-eval fixtures.

---

## Slice — `generation-eval`

**Recommended authority:** Open PR only

**Rationale:** Separate harness from retrieval-eval; citation-support prevents “valid ID, wrong claim” false positives.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Goal:** `tests/assistant-generation-eval.test.ts`, fixtures, `scripts/assistant/generation/eval.mjs`, stub [generation-eval-findings.md](../../docs/assistant/generation-eval-findings.md).

**Dependencies:** `generation-cli` merged.

**Acceptance:**

- Deterministic: mock outputs → integrity + **support** scorers; mis-citation case (integrity pass, support fail).
- Integration `skipIf` without secrets.
- **Do not** modify [eval-cases.json](../../tests/fixtures/assistant-retrieval/eval-cases.json).

**PR boundary:** Eval harness + stub doc only.

---

## Slice — `operational-acceptance`

**Recommended authority:** Manual verification gate

**Rationale:** Model quality and cost require operator review before closure.

**Agent instruction:** Do not commit or open a PR. Optional `.agent-runs/assistant-generation/**`.

**Prerequisites:** Slices `generation-contract` through `generation-eval` merged; ingested index for 101-concept corpus.

**Procedure:** ~12–15 `assistant:answer` runs (`full_parent`); 3–4 `top_k_only` comparisons; record support-level, citations, tokens, `EvidenceBudgetExceeded`; operator citation-support review.

**Acceptance:** Findings doc updated; operator sign-off; no fabricated metrics in samples.

---

## Slice — `plan-closure`

**Recommended authority:** Open PR only

**Agent instruction:** Do not merge. Stop after opening the PR.

**Deliverables:** `# Shipped` note; move plan to `.cursor/plans/archive/2026-10-08-assistant-grounded-rag-generation.plan.md`; update [architecture-direction.md](../../docs/assistant/architecture-direction.md) and [rag-generation-direction.md](../../docs/assistant/rag-generation-direction.md); mark `plan-closure` completed.

---

## Agent prompts (copy/paste for Cursor)

### generation-contract

```text
@.cursor/plans/2026-10-08-assistant-grounded-rag-generation.plan.md

Implement slice generation-contract only. Do not start generation-cli or later slices. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: full_parent + top_k_only evidence assembly, EvidenceBudgetExceeded fail-closed, response schema, citation-integrity validators, tests/assistant-generation-contract.test.ts. Mark generation-contract completed in plan frontmatter in this PR.

Verification: npm run test -- tests/assistant-generation-contract.test.ts; npm run lint; npm run typecheck; npm run format:check.
```

### generation-cli

```text
@.cursor/plans/2026-10-08-assistant-grounded-rag-generation.plan.md

Implement slice generation-cli only. Prerequisite: generation-contract merged. Do not start generation-eval or later. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: assistant:answer CLI, openai-chat fetch adapter, generation-config, assistant-database + .env.example docs. Mark generation-cli completed in plan frontmatter in this PR.

Verification: npm run test; npm run format:check; manual assistant:answer with DATABASE_URL + OPENAI_API_KEY when available.
```

### generation-eval

```text
@.cursor/plans/2026-10-08-assistant-grounded-rag-generation.plan.md

Implement slice generation-eval only. Prerequisite: generation-cli merged. Do not start operational-acceptance or plan-closure. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: generation eval fixtures/harness with citation-support checks; tests/assistant-generation-eval.test.ts; docs/assistant/generation-eval-findings.md stub. Do not change assistant-retrieval eval-cases.json. Mark generation-eval completed in plan frontmatter in this PR.

Verification: npm run test -- tests/assistant-generation-eval.test.ts; npm run lint; npm run typecheck; npm run format:check.
```

### operational-acceptance

```text
@.cursor/plans/2026-10-08-assistant-grounded-rag-generation.plan.md

Run the manual verification gate (operational-acceptance) only. Prerequisites: generation-contract, generation-cli, generation-eval merged and marked completed. Do not start plan-closure.

Authority: Manual verification gate.

Topology: no tracked-file changes unless operator chooses to commit findings doc in a follow-up; optional gitignored .agent-runs/assistant-generation/**.

Deliverables: execute plan operational-acceptance procedure; report verdict and paths to any gitignored notes.
```

### plan-closure

```text
@.cursor/plans/2026-10-08-assistant-grounded-rag-generation.plan.md

Execute only plan-closure.

Authority: Open PR only — docs-only archive PR; do not merge.

Prerequisites: all implementation slices and operational-acceptance complete; slice todos marked completed in frontmatter.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: verify slice todos, add # Shipped note, move plan to .cursor/plans/archive/2026-10-08-assistant-grounded-rag-generation.plan.md, mark plan-closure completed, update architecture-direction and rag-generation-direction.

Verification: confirm prerequisite PRs merged before archiving.
```
