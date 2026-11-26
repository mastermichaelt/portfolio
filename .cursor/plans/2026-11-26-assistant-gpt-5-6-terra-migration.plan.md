---
name: Assistant GPT-5.6 Terra migration
overview: Move the portfolio assistant's generation default from gpt-4o-mini (retiring 2027-01-14) to gpt-5.6-terra with reasoning_effort "none", drop temperature, send max_completion_tokens instead of max_tokens (2048 retained), add request-contract tests, and verify with standard checks plus a bounded three-question live CLI smoke. Plan review, then one implementation PR, then docs-only closure.
todos:
  - id: plan-review
    content: "Plan-only PR — commit plan artifact and open PR for review; do not implement"
    status: completed
  - id: terra-migration
    content: "PR 1: gpt-5.6-terra default, reasoning_effort none, max_completion_tokens, temperature removed, request-contract tests, display map + docs, bounded live smoke"
    status: completed
  - id: plan-closure
    content: "Docs-only PR after terra-migration: add # Shipped note, move plan to .cursor/plans/archive/YYYY-MM-DD-assistant-gpt-5-6-terra-migration.plan.md"
    status: pending
isProject: false
---

# Assistant GPT-5.6 Terra migration

Migrate assistant generation from `gpt-4o-mini` to `gpt-5.6-terra` ahead of the GPT-4o mini retirement on **14 January 2027**.

**Reused findings (not re-investigated):** the Codenames AI migration (GPT-5 mini to GPT-5.6 Terra) established that GPT-5.6 Terra is eligible for complimentary daily API tokens, supports Chat Completions and `response_format: { type: "json_object" }`, and with `reasoning_effort: "none"` gives good responsiveness and reliable structured output. `low` added substantial unnecessary latency.

**Out of scope:**

- enabling public or conversational generation (`ASSISTANT_PUBLIC_ENABLED` untouched)
- regenerating or publishing production content
- comparative model evaluation, fallback models, or additional reasoning configurations
- embeddings (`text-embedding-3-small` unchanged)
- monitoring infrastructure
- unrelated refactoring

---

## Recommended execution authority

| Slice           | Recommended authority | Agent instruction                                      |
| --------------- | --------------------- | ------------------------------------------------------ |
| plan-review     | Plan-only PR          | Do not implement. Stop after opening the plan-only PR. |
| terra-migration | Open PR only          | Do not merge. Stop after opening the PR.               |
| plan-closure    | Open PR only          | Do not merge. Stop after opening the PR.               |

Repo default: **Open PR only** ([planning-standards.md](../standards/planning-standards.md#repo-default-when-no-plan-slice-applies)).

---

## Repository topology (default)

This invariant prevents accidental stacked PRs. Multi-slice plans stack execution order, not Git branches.

The repository integration branch is `main`. Every slice starts from and targets `main`.

**Before implementation:** `git fetch`, then a fresh branch from `origin/main`.

**Before opening the PR:** verify the branch represents only this slice — previous-slice work is present through `main`, not through branch ancestry.

**After opening the PR:** verify the GitHub PR base branch is `main` and the diff does not include previous-slice work except through merged `main`.

---

## Context — current implementation

- **Single request builder:** `requestChatCompletionJson` in [`scripts/assistant/generation/openai-chat.mjs`](../../scripts/assistant/generation/openai-chat.mjs) is the only Chat Completions call site. `runCompletionPass` in [`run-generation.mjs`](../../scripts/assistant/generation/run-generation.mjs) uses it for both the initial pass and the corrective retry pass. The API route, the `assistant:answer` CLI, and the evaluation flow all reach it through `runRagGeneration`.
- **Model default:** `DEFAULT_GENERATION_MODEL = "gpt-4o-mini"` in [`generation-config.mjs`](../../scripts/assistant/generation/generation-config.mjs). The `ASSISTANT_GENERATION_MODEL` override (`?.trim() || default`) is retained unchanged.
- **Temperature:** only a hardcoded `temperature: 0.2` in the request body. There is no env var, config field, or parameter plumbing, so removal is a one-line delete.
- **Output tokens:** `ASSISTANT_GENERATION_MAX_OUTPUT_TOKENS` (default 2048) flows from config to `maxOutputTokens` to the wire key `max_tokens`. Only the wire key changes. The internal name `maxOutputTokens`, the env var, and the telemetry/diagnostic property `max_output_tokens` stay, so the PostHog schema is unchanged.
- **Keep 2048:** no evidence supports changing it. With `reasoning_effort: "none"`, reasoning tokens are negligible, and the existing `finish_reason=length` guard already maps to `output_truncated`.
- **JSON mode:** `response_format: { type: "json_object" }` and the existing prompts are unchanged. They already satisfy the requirement that the messages mention JSON.
- **Visitor-facing display:** [`lib/assistant/ui/format-usage-footer.ts`](../../lib/assistant/ui/format-usage-footer.ts) maps only `gpt-4o-mini` and `gpt-4o`. `completion.model` echoes the requested alias, so Terra would render as the raw `gpt-5.6-terra` without a new entry.
- **Tests:** no existing test asserts the request body, the model default, or the override. All chat tests use mocked `fetch`.
- **Overlapping active plans (non-blocking):**
  - [`2026-10-30-assistant-02-typescript-consolidation.plan.md`](2026-10-30-assistant-02-typescript-consolidation.plan.md) (pending) will later port `requestChatCompletionJson` to `lib/assistant/providers/llm.ts`, and the new request body moves with it.
  - [`2026-10-30-assistant-04-production-reopening.plan.md`](2026-10-30-assistant-04-production-reopening.plan.md) remains the gate for re-enabling public generation.

---

## Plan review (pre-slice)

**Recommended authority:** Plan-only PR

**Rationale:**

- The plan lands for human review before any runtime change
- Expected diff is this plan artifact only

**Agent instruction:** Do not implement. Stop after opening the plan-only PR.

---

## Slice — terra-migration

**Recommended authority:** Open PR only

**Rationale:**

- Production runtime config change (default generation model and request parameters)
- One operator check is needed before merge (Vercel env, see Residual risks), and a human should review the smoke evidence

**Agent instruction:** Do not merge. Stop after opening the PR.

**Live inference:** authorised (2026-11-26) for exactly the three smoke questions under Verification. Report any material issue the smoke surfaces in the PR description (Verification or Risks). Do not widen scope, add questions, re-run with other models or settings, or start follow-up investigations.

**Goal:** `gpt-5.6-terra` is the generation default and every chat request uses the GPT-5.6 parameter set, with no compatibility branches or new abstractions.

### Changes

1. [`scripts/assistant/generation/generation-config.mjs`](../../scripts/assistant/generation/generation-config.mjs): `DEFAULT_GENERATION_MODEL = "gpt-5.6-terra"` (alias, not a dated snapshot).
2. [`scripts/assistant/generation/openai-chat.mjs`](../../scripts/assistant/generation/openai-chat.mjs): change the request body to:

   ```js
   const body = JSON.stringify({
     model,
     messages: [/* unchanged */],
     response_format: { type: "json_object" },
     reasoning_effort: "none",
     max_completion_tokens: maxOutputTokens,
   });
   ```

   `reasoning_effort` is a literal: no config, env var, or per-model branch.

3. [`lib/assistant/ui/format-usage-footer.ts`](../../lib/assistant/ui/format-usage-footer.ts): replace the `gpt-4o-mini` and `gpt-4o` entries with `"gpt-5.6-terra": "GPT-5.6 Terra"`. Unmapped ids still fall back to the raw id.
4. [`tests/assistant-generation-service.test.ts`](../../tests/assistant-generation-service.test.ts), in the "OpenAI chat adapter" describe block: add request-contract tests that capture the `fetch` body and assert the following.
   - With `ASSISTANT_GENERATION_MODEL` stubbed to `""`: `model === "gpt-5.6-terra"`, `reasoning_effort === "none"`, `max_completion_tokens === 2048`, and `response_format` is `json_object`. The body has no `temperature` and no `max_tokens`.
   - With `ASSISTANT_GENERATION_MODEL` set to a custom value: that value is sent as `model` (override retained).
   - Explicit `maxOutputTokens: 512` maps to `max_completion_tokens: 512`.
   - Use `vi.stubEnv` plus `resetEnvFileLoader()`, following [`tests/assistant-openai-request-headers.test.ts`](../../tests/assistant-openai-request-headers.test.ts), so `.env.local` cannot leak into the test.
5. [`tests/assistant-ui.test.ts`](../../tests/assistant-ui.test.ts) ("format usage footer" describe block): update the display-name and footer-line expectations to `gpt-5.6-terra` / `GPT-5.6 Terra`.
6. [`.env.example`](../../.env.example): change the commented `ASSISTANT_GENERATION_MODEL` default to `gpt-5.6-terra` and add a one-line note that an override must accept `reasoning_effort` and `max_completion_tokens`.
7. [`docs/assistant/assistant-database.md`](../../docs/assistant/assistant-database.md), env table: the default becomes `gpt-5.6-terra` (reasoning effort `none`), and the max-output row describes "Chat `max_completion_tokens`".
8. [`docs/assistant/rag-generation-direction.md`](../../docs/assistant/rag-generation-direction.md):
   - The milestone's "Locked for the current milestone" `gpt-4o-mini` line stays as history, with "superseded by `gpt-5.6-terra` (`reasoning_effort: none`), Nov 2026" appended.
   - The usage-footer example becomes `GPT-5.6 Terra · …`.
9. This plan: mark `terra-migration` `completed` in frontmatter.

**Intentionally unchanged:**

- archived plans
- [`docs/assistant/prior-art.md`](../../docs/assistant/prior-art.md) (an external project's stack)
- the OKF fixture article that mentions `gpt-4o-mini` (historical content)
- `"gpt-4o-mini"` strings used as opaque fixture data in the telemetry, API, envelope, and evaluation tests (not tied to runtime behaviour)
- `maxOutputTokens` / `max_output_tokens` naming and the telemetry schema
- embeddings code

### Verification

**Standard checks** (Node 24):

- `npm run lint`
- `npm run typecheck`
- `npm run format:check`
- `npm test`
- `npm run test:coverage`
- `npm run build`

CI also runs e2e.

**Pre-smoke check:** confirm `.env.local` does not pin `ASSISTANT_GENERATION_MODEL`.

**Bounded live smoke:** at most 3 questions, each at most 2 model passes. Run through the existing operator CLI with telemetry off. This writes no evaluation rows (those are API-only), regenerates no content, and leaves public generation disabled.

```bash
ASSISTANT_GENERATION_TELEMETRY=false npm run assistant:answer -- --json "How does Savepoints capture agent learnings?"
ASSISTANT_GENERATION_TELEMETRY=false npm run assistant:answer -- --json "Where did Michael go to university?"
ASSISTANT_GENERATION_TELEMETRY=false npm run assistant:answer -- --json --no-retrieval "What is a merge commit in Git?"
```

The questions come from [`tests/fixtures/assistant-generation/eval-cases.json`](../../tests/fixtures/assistant-generation/eval-cases.json) and cover three response shapes:

- grounded `full_parent` with citations
- abstention, which exercises the `abstained` / `abstention_reason` schema
- `general_knowledge` attribution without the database

**Pass criteria, per call:**

- **Request accepted:** exit 0 and no HTTP 400, which proves request-parameter compatibility.
- **Correct model:** `diagnostics.model === "gpt-5.6-terra"`.
- **Valid structured output:** the runtime parse plus `validateGenerationResponse` pass. This is implicit in exit 0, because failures throw.
- **No recovery path:** `model_retry_attempted` is false, and ideally `deterministic_repair_applied` is false too.
- **Quality, manual read:**
  - citations point to relevant Savepoints evidence
  - the university question abstains honestly
  - the merge-commit answer is attributed as `general_knowledge`, with no fabricated personal claims
- **Latency and tokens:** record `generation_latency_ms`, `prompt_tokens`, and `completion_tokens` in the PR description.
- **Flag in the PR, do not investigate further (not hard gates):**
  - `finish_reason=length`
  - completion tokens near 2048
  - generation latency in the tens of seconds, at odds with the Codenames `none` results

**Optional, free:** `node scripts/assistant/generation/eval.mjs` (deterministic mock-response scorers) to show the eval harness is unaffected.

**Acceptance:** standard checks green; the three smoke calls meet the pass criteria, or any material deviation is reported in the PR; `terra-migration` marked `completed` in frontmatter.

### Residual risks

- **The env override can break requests:** `reasoning_effort` and `max_completion_tokens` are always sent, so pointing `ASSISTANT_GENERATION_MODEL` at a model that rejects them (e.g. `gpt-4o-mini` before retirement) returns a 400. This is accepted per the no-compatibility-branches constraint and documented in `.env.example`. **Operator check before merge:** confirm Vercel Production and Preview do not set `ASSISTANT_GENERATION_MODEL=gpt-4o-mini`, and remove it if they do.
- **Complimentary-token eligibility is per OpenAI org/project:** confirm the `portfolio-assistant` project (`OPENAI_PROJECT_ID`) is enrolled, as the Codenames project was. Otherwise usage is billed normally.
- **Sampling variance:** dropping `temperature: 0.2` means default sampling, so output may vary slightly between runs. Structural validation and the existing recovery path bound the impact.
- **Small smoke sample:** three live questions cannot rule out regressions on less common question types. Full production E2E remains in the `04-production-reopening` gate.

---

## Plan closure (docs-only PR)

**Recommended authority:** Open PR only

**Rationale:**

- Docs-only archival; human review of closure checklist

**Agent instruction:** Do not merge. Stop after opening the PR.

After `terra-migration` merges, open a final docs-only closure PR:

1. Verify the `terra-migration` PR is merged to `main` and its todo is `completed`
2. Add a `# Shipped` closure note at the top of the plan body (date, PR links, deferred work)
3. Move this file to `.cursor/plans/archive/YYYY-MM-DD-assistant-gpt-5-6-terra-migration.plan.md`
4. Mark `plan-closure` `completed` and update agent prompt references to the archived path

Do not archive inside the implementation PR.

---

## Agent prompts (copy/paste for Cursor)

Use a **fresh Agent-mode chat** per slice. Each frontmatter todo has exactly one `### <todo-id>` heading.

### plan-review

```text
@.cursor/plans/2026-11-26-assistant-gpt-5-6-terra-migration.plan.md

Execute only plan-review. Do not start terra-migration or plan-closure.

Authority: Plan-only PR — commit the plan artifact only; do not implement. Stop after opening the plan-only PR.

Topology: start from latest origin/main; branch represents only the plan artifact; PR base must be main.

Deliverables: this plan file under .cursor/plans/; mark plan-review completed in frontmatter in the same PR.

Verification: plan-validator passes; no implementation changes included.
```

### terra-migration

```text
@.cursor/plans/2026-11-26-assistant-gpt-5-6-terra-migration.plan.md

Implement slice terra-migration only. Prerequisite: plan-review merged. Do not start plan-closure. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge. Live inference is authorised for the three smoke questions in the plan only; report material issues in the PR and do not expand scope or start further investigations.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: the Changes list in the terra-migration slice (default model, request body with reasoning_effort none and max_completion_tokens, temperature removed, request-contract tests, display map, .env.example, docs). Mark terra-migration completed in plan frontmatter in this PR. PR description records smoke latency/tokens/recovery flags, quality read, and the Vercel ASSISTANT_GENERATION_MODEL operator check.

Verification: npm run lint, typecheck, format:check, test, test:coverage, build; bounded three-question assistant:answer --json smoke with ASSISTANT_GENERATION_TELEMETRY=false per the plan's pass criteria.
```

### plan-closure

```text
@.cursor/plans/2026-11-26-assistant-gpt-5-6-terra-migration.plan.md

Execute only plan-closure.

Authority: Open PR only — docs-only archive PR; do not merge.

Prerequisites: terra-migration merged and already marked completed in frontmatter.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: verify slice todos, add # Shipped note, move plan to .cursor/plans/archive/YYYY-MM-DD-assistant-gpt-5-6-terra-migration.plan.md, mark plan-closure completed, update agent prompt references to the archived path.

Verification: confirm the terra-migration PR is merged and its todo is completed before archiving.
```
