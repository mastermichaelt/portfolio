---
name: Portfolio assistant RAG
overview: Staged multi-PR implementation of a grounded portfolio assistant on michaeltruong.ai — corpus projection, LangChain JS + OpenAI embeddings, in-memory retrieval, ask API, and landing-page UI. Architecture source of truth is docs/architecture/portfolio-assistant.md.
todos:
  - id: plan-review
    content: "Plan-only PR — commit plan artifact and open PR for review; do not implement"
    status: completed
  - id: slice-corpus
    content: "PR: domain/assistant types + lib/assistant/build-corpus.ts projecting tier-1 content into KnowledgeChunks with citation metadata + Vitest"
    status: pending
  - id: slice-rag-core
    content: "PR: LangChain MemoryVectorStore, retrieve + ask pipeline, assistant:retrieve dev script, mocked tests, OPENAI_API_KEY in .env.example"
    status: pending
  - id: slice-ask-api
    content: "PR: POST app/api/ask/route.ts returning answer + citations + dev debug; API tests"
    status: pending
  - id: slice-landing-ui
    content: "PR: Homepage assistant UI (input, suggested questions, citations) integrated additively into app/page.tsx"
    status: pending
  - id: plan-closure
    content: "Docs-only PR after last slice: add # Shipped note, move plan to .cursor/plans/archive/2026-10-06-portfolio-assistant-rag.plan.md"
    status: pending
isProject: false
---

# Portfolio assistant RAG — implementation plan

> **Architecture (durable):** [`docs/architecture/portfolio-assistant.md`](../../docs/architecture/portfolio-assistant.md) — product intent, corpus model, retrieval flow, citations, deferrals, and roadmap boundaries. This file is the **execution plan** only.

## Recommended execution authority

| Slice            | Recommended authority | Agent instruction                                      |
| ---------------- | --------------------- | ------------------------------------------------------ |
| plan-review      | Plan-only PR          | Do not implement. Stop after opening the plan-only PR. |
| slice-corpus     | Open PR only          | Do not merge. Stop after opening the PR.               |
| slice-rag-core   | Open PR only          | Do not merge. Stop after opening the PR.               |
| slice-ask-api    | Open PR only          | Do not merge. Stop after opening the PR.               |
| slice-landing-ui | Open PR only          | Do not merge. Stop after opening the PR.               |
| plan-closure     | Open PR only          | Do not merge. Stop after opening the PR.               |

Repo default: **Open PR only** ([planning-standards.md](../standards/planning-standards.md#repo-default-when-no-plan-slice-applies)).

## Repository topology

Multi-slice plans stack execution order, not Git branches. Integration branch: `main`. Each implementation slice starts from latest `origin/main`; the PR branch must represent only that slice.

**Prerequisite:** [`docs/architecture/portfolio-assistant.md`](../../docs/architecture/portfolio-assistant.md) merged before slice-corpus (or in the same merge window as this plan).

---

## Slice — slice-corpus

**Recommended authority:** Open PR only

**Prerequisite:** Architecture doc on `main`.

**Goal:** Deterministic, testable corpus from `PortfolioRepository` with real chunk boundaries and citation metadata.

**Deliverables:**

- [`domain/assistant.ts`](../../domain/assistant.ts) — `KnowledgeDocument`, `KnowledgeChunk`, `KnowledgeSourceType`, `AssistantCitation`
- [`lib/assistant/build-corpus.ts`](../../lib/assistant/build-corpus.ts) — `buildCorpus(repo): Promise<KnowledgeChunk[]>`
- [`lib/assistant/serialize.ts`](../../lib/assistant/serialize.ts) — RichText, blocks, articles, entities
- [`tests/assistant-corpus.test.ts`](../../tests/assistant-corpus.test.ts) — stable `sourceId`s, URL shapes, tier-1 coverage, no inventory `source` in embeddable text

**Acceptance:** `npm test` passes; every tier-1 module in architecture doc represented; no `app/api/` or LangChain deps yet.

---

## Slice — slice-rag-core

**Recommended authority:** Open PR only

**Prerequisite:** slice-corpus merged.

**Goal:** Embedding + retrieval observable without UI.

**Deliverables:**

- LangChain deps: `@langchain/openai`, `@langchain/core`, `langchain`
- [`lib/assistant/vector-index.ts`](../../lib/assistant/vector-index.ts) — lazy singleton `MemoryVectorStore`, `retrieve(question, k)` with scores
- [`lib/assistant/ask.ts`](../../lib/assistant/ask.ts) — `ask(question)` → answer + citations
- [`scripts/assistant-retrieve.mjs`](../../scripts/assistant-retrieve.mjs) + `npm run assistant:retrieve`
- [`tests/assistant-retrieve.test.ts`](../../tests/assistant-retrieve.test.ts) — mocked embeddings in CI
- [`.env.example`](../../.env.example) — `OPENAI_API_KEY`, `ASSISTANT_DEBUG`

**Acceptance:** Dev script returns ranked chunks; CI passes without live OpenAI key.

---

## Slice — slice-ask-api

**Recommended authority:** Open PR only

**Prerequisite:** slice-rag-core merged.

**Goal:** First curl-able vertical slice.

**Deliverables:**

- [`app/api/ask/route.ts`](../../app/api/ask/route.ts) — POST `{ question }` → `{ answer, citations, debug? }`
- [`tests/assistant-ask-api.test.ts`](../../tests/assistant-ask-api.test.ts) — mocked `ask()`, citation shape

**Acceptance:**

1. Atlassian question cites `/about` from retrieved metadata.
2. "What is Savepoints?" cites ecosystem or project URL from metadata.
3. Citation URLs come from chunk metadata only (test allowlist).
4. `debug.retrieved` visible when `NODE_ENV=development` or `ASSISTANT_DEBUG=true`.

---

## Slice — slice-landing-ui

**Recommended authority:** Open PR only

**Prerequisite:** slice-ask-api merged.

**Goal:** Additive homepage assistant without displacing MethodReveal or route grid.

**Deliverables:**

- [`components/assistant/`](../../components/assistant/) — input, suggested questions, answer + citations
- [`app/page.tsx`](../../app/page.tsx) — additive integration only
- Optional PostHog events; Playwright extension with mocked API

**Acceptance:** Mobile + desktop per design tokens; citations link to portfolio URLs; no full-page chat or conversation history.

---

## Plan closure (docs-only PR)

After all implementation slices merge:

1. Verify slice todos `completed`
2. Add `# Shipped` closure note
3. Move to `.cursor/plans/archive/2026-10-06-portfolio-assistant-rag.plan.md`
4. Mark `plan-closure` completed

---

## Agent prompts (copy/paste for Cursor)

### plan-review

```text
@.cursor/plans/2026-10-06-portfolio-assistant-rag.plan.md

Execute only plan-review. Do not start implementation slices.

Authority: Plan-only PR — commit the plan artifact only; do not implement. Stop after opening the plan-only PR.

Topology: start from latest origin/main; branch represents only the plan artifact; PR base must be main.

Deliverables: plan file under .cursor/plans/; mark plan-review completed in frontmatter in the same PR.

Verification: plan satisfies repo planning standards; no implementation changes included.
```

### slice-corpus

```text
@.cursor/plans/2026-10-06-portfolio-assistant-rag.plan.md

Implement slice slice-corpus only. Do not start slice-rag-core or later slices. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: domain/assistant.ts, lib/assistant/build-corpus.ts, lib/assistant/serialize.ts, tests/assistant-corpus.test.ts. Mark slice-corpus completed in plan frontmatter in this PR.

Verification: npm test passes; tier-1 corpus per docs/architecture/portfolio-assistant.md; no LangChain or app/api/ask yet.
```

### slice-rag-core

```text
@.cursor/plans/2026-10-06-portfolio-assistant-rag.plan.md

Implement slice slice-rag-core only. Prerequisite: slice-corpus merged. Do not start slice-ask-api or later slices. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: LangChain deps, lib/assistant/vector-index.ts, lib/assistant/ask.ts, scripts/assistant-retrieve.mjs, tests/assistant-retrieve.test.ts, .env.example updates. Mark slice-rag-core completed in plan frontmatter in this PR.

Verification: npm test passes without OPENAI_API_KEY in CI; assistant:retrieve works locally with key.
```

### slice-ask-api

```text
@.cursor/plans/2026-10-06-portfolio-assistant-rag.plan.md

Implement slice slice-ask-api only. Prerequisite: slice-rag-core merged. Do not start slice-landing-ui or plan-closure. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: app/api/ask/route.ts, tests/assistant-ask-api.test.ts. Mark slice-ask-api completed in plan frontmatter in this PR.

Verification: curl POST /api/ask returns answer + citations; debug payload in development; acceptance criteria in plan slice section pass.
```

### slice-landing-ui

```text
@.cursor/plans/2026-10-06-portfolio-assistant-rag.plan.md

Implement slice slice-landing-ui only. Prerequisite: slice-ask-api merged. Do not start plan-closure. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: components/assistant/, additive app/page.tsx integration, optional PostHog + Playwright. Mark slice-landing-ui completed in plan frontmatter in this PR.

Verification: mobile + desktop layout; suggested questions; citations link to portfolio URLs; existing homepage flow preserved outside assistant region.
```

### plan-closure

```text
@.cursor/plans/2026-10-06-portfolio-assistant-rag.plan.md

Execute only plan-closure.

Authority: Open PR only — docs-only archive PR; do not merge.

Prerequisites: all implementation slices merged and marked completed in frontmatter.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: verify slice todos, add # Shipped note, move plan to .cursor/plans/archive/2026-10-06-portfolio-assistant-rag.plan.md, mark plan-closure completed.

Verification: confirm all prerequisite implementation PRs are merged before archiving.
```
