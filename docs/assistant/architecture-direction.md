---
title: Portfolio assistant architecture direction
subtitle: Another view over published knowledge — not a site redesign
status: draft
version: 0.2.0
updated: 2026-10-06
related:
  - docs/assistant/prior-art.md
  - docs/architecture/overview.md
  - PRODUCT.md
---

# Portfolio assistant architecture direction

Architectural intent for a future conversational assistant on [michaeltruong.ai](https://michaeltruong.ai). This note does **not** prescribe implementation file layout, TypeScript interfaces, API contracts, retrieval parameters, or a multi-slice execution plan. Those belong in just-in-time `.cursor/plans/` artifacts written when a specific experiment is ready to ship.

**Prior art:** [nyaomaru-portfolio](./prior-art.md) — studied, not normative.

Sections are labeled **current implementation**, **architectural direction**, **future acceptance milestone**, or **experimental hypothesis** where useful.

## Planning process

```text
architecture direction (this note)
      ↓
choose next smallest useful experiment
      ↓
write a fresh Cursor plan for that experiment only
      ↓
ship it
      ↓
observe what happened
      ↓
update this note if needed
      ↓
decide what to plan next
```

Individual `.cursor/plans/*.plan.md` files are temporary execution handoffs. They are archived after shipping and do not govern future work.

**Superseded master-planning pass.** A staged implementation plan covering corpus → RAG core → API → landing UI was opened in [PR #14](https://github.com/mastermichaelt/portfolio/pull/14) and **abandoned before implementation**. It prematurely prescribed later milestones. Do **not** merge that plan or revive it as governing structure. Future implementation plans should be authored from this architecture direction and shipped evidence available at that time.

## What we are trying to build

**Architectural direction.** A landing-page assistant that lets visitors ask questions about Michael Truong's published work, experience, projects, and writing — with answers grounded in the same evidence the browsable site already presents, and links back into portfolio routes where possible.

**Architectural direction.** The assistant is **another view** over the portfolio knowledge system. The browsable site remains primary:

- Routes (`/`, `/about`, `/projects`, `/articles`, `/ecosystem`) stay independently useful.
- Navigation, case studies, articles, and the ecosystem map are not subordinated to chat.
- The assistant UX (when built) is **additive** — prominent on the landing page, not a replacement for structured browsing.

**Architectural direction.** Evidence for retrieval comes from deliberately selected, attributable published material — consistent with [PRODUCT.md](../../PRODUCT.md). Portfolio `content/` is one high-quality curated source, not the entire knowledge corpus. The initial assistant should use retrieved material as its context; stricter unsupported-claim or refusal behaviour remains an empirical follow-up rather than an architectural gate.

**Architectural direction.** This is partly a **learning project**. We want to observe real retrieval and generation behaviour before committing to refusal machinery, hybrid retrieval, or persistent vector infrastructure.

## Why it belongs in the portfolio

The portfolio already presents evidence-backed narrative across case studies, articles, about, and an ecosystem map. Visitors evaluating senior engineering work often want a fast path from question to proof. A grounded assistant compresses that path without replacing the structured site — similar to how Savepoints separates durable learning from raw retrieval, but here the “learning” is the published portfolio itself.

The feature also exercises RAG mechanics in the same Next.js codebase that hosts the content, which keeps experiments honest about corpus quality and citation fidelity.

## Current implementation

**Current implementation.** No assistant exists. The production app is a static-first Next.js site:

- Pages read through `PortfolioRepository` → typed modules under `content/`.
- No `app/api/` routes, no embeddings, no vector store, no chat UI.
- Optional client-side PostHog only; orthogonal to content.

```text
app/ pages → PortfolioRepository → content/ modules
```

The assistant, when built, should be a **read projection** on top of this stack — not a redesign of it.

## Corpus boundary

**Architectural direction (decision).** The assistant corpus is bounded to deliberately selected, attributable source material representing Michael's published work and technical reasoning. Portfolio `content/` is one high-quality curated source, not necessarily the entire knowledge corpus.

**Source classes:**

| Class                             | Role                                                                            | Notes                                                                                                                                    |
| --------------------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Curated portfolio content**     | Canonical for portfolio **presentation**                                        | About, case studies, summaries, ecosystem, article metadata under `content/`                                                             |
| **Selected project repositories** | Architecture notes, READMEs, design decisions, published technical explanations | ~7 repos; **not** whole-repo automatic ingestion. Exclude agent docs, plans, secrets, gitignored artifacts, private operational material |
| **Published writing**             | Full DEV article bodies (not just portfolio summaries)                          | Ingestion mechanism deferred                                                                                                             |
| **Comments / discussions**        | Open corpus-policy question                                                     | No decision yet                                                                                                                          |

**Architectural direction (decision).** Exclude agent docs, planning artifacts, private sibling-repo references, and internal review provenance (e.g. `CaseFigure.source` / inventory fact ids used only for editorial verification).

**Future acceptance milestone.** Additional modules (timeline, workflow canvases, production-line metaphor) may enter the corpus only if experiments show retrieval gaps.

## Architectural direction — pipeline shape

We are currently exploring a **bounded-corpus semantic RAG** pipeline over a multi-source knowledge base:

```text
canonical published sources
        │
        ├── portfolio content
        ├── selected project repositories
        ├── DEV / published writing
        └── future deliberately selected sources
        ↓
source-specific producers / adapters
        ↓
              OKF
     + minimal extensions
        ↓
retrieval-unit derivation
        ↓
embeddings / retrieval index
        ↓
retrieval
        ↓
RAG and other future consumers
```

**Producer fidelity:**

```text
DEV article ───────→ DEV producer ──────┐
                                        │
repo document ─────→ repo producer ─────┼→ OKF corpus
                                        │
portfolio content ─→ portfolio producer ┘
```

**Knowledge vs retrieval:**

```text
OKF knowledge → retrieval-unit derivation → embedding → vector index
```

Multiple retrieval chunks may derive from one OKF concept. Chunks are retrieval artifacts, not canonical knowledge objects.

### Five layers (do not conflate)

| Layer                         | Role                                                                                                          |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------- |
| **Canonical sources**         | Where published material originates                                                                           |
| **OKF**                       | Normalized knowledge representation / interchange                                                             |
| **Storage**                   | Where normalized / indexing / application data may physically live (no new persistence decision in this note) |
| **Embeddings / vector index** | Retrieval representation                                                                                      |
| **RAG**                       | One consumer of retrieved knowledge                                                                           |

Neon remains a likely future Postgres provider where Postgres is appropriate. **OKF ≠ Postgres.** OKF is not an embedding format, a vector index, or a storage engine.

This is **directional**. It is not a commitment to LangChain, OpenAI, in-memory vectors, or any particular API shape forever.

### OKF as canonical normalized representation

**Architectural direction (decision).** [Open Knowledge Format (OKF)](https://github.com/GoogleCloudPlatform/open-knowledge-format) is the canonical normalized knowledge representation for the assistant corpus. Source-specific ingestion converts deliberately selected source material into OKF-compatible knowledge. Portfolio-specific requirements should be expressed through minimal extensions to OKF rather than through a parallel proprietary knowledge-document model.

Do not design an alternative generic `KnowledgeDocument` format alongside OKF. Learning focus: RAG, retrieval, corpus construction, ingestion, provenance, and assistant behaviour — not designing a competing knowledge interchange specification.

**OKF maturity (as of 2026-10):** v0.1 announced June 2026; [specification](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) now v0.2 draft; explicitly evolving.

**Primary references:**

- [Google Cloud blog — OKF introduction](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing) (June 2026; introduces v0.1)
- [OKF specification (current)](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) — v0.2 Draft
- [open-knowledge-format repo](https://github.com/GoogleCloudPlatform/open-knowledge-format)

### OKF extensions policy

**OKF + extensions** approach. Before adding any extension:

1. Verify base OKF does not already represent the requirement (`resource`, `sources`, `generated.by`, `tags`, etc.)
2. Prefer standard OKF semantics where sufficient
3. Add the smallest portfolio-specific extension necessary
4. Keep extensions clearly distinguishable from standard OKF
5. Document why each extension exists
6. Avoid extensions that encode retrieval-engine implementation details

Extensions emerge from concrete ingestion / retrieval needs — not from speculative design in this note.

### Dependencies on the current site

| Existing piece        | Role for the assistant                                                        |
| --------------------- | ----------------------------------------------------------------------------- |
| `content/`            | One curated corpus source; canonical for portfolio **presentation**           |
| `domain/`             | Presentation models that should inform retrieval unit boundaries              |
| `PortfolioRepository` | How pages access content today; portfolio producer should read the same truth |
| `lib/site.ts`         | Canonical on-site URLs for provenance links                                   |
| Browsable routes      | Citation targets; remain useful without the assistant                         |

**Architectural direction.** `PortfolioRepository` and page components should not depend on retrieval or LLM infrastructure. The assistant layer imports toward content / repository and corpus producers, not the reverse.

### Meaningful retrieval units

**Architectural direction (decision).** Do not embed the entire corpus as one document (contrast [prior art](./prior-art.md)). Units should align with how evidence is already structured — e.g. an experience entry, a case-study block, an article body, an ecosystem entity, a repo README section — so retrieval returns inspectable slices.

**Experimental hypothesis.** Optimal unit size and whether long narratives need sub-splitting will be learned from retrieval behaviour, not specified here.

### Source provenance and citations

**Architectural direction (decision).** Retrieved units carry enough metadata to identify their source: stable identity, human-readable title, canonical URL (portfolio route or external published URL), and section context where useful.

**Architectural direction (decision).** Visitor-visible citations should be derived from **retrieval provenance**, not URLs invented by the model.

**Future acceptance milestone.** Landing-page UI presents answers with links back into the portfolio and, where applicable, published writing.

### Retrieval observability

**Architectural direction (decision).** Development should make the pipeline inspectable: question, retrieved units, relevance signals where available, provenance metadata, generated answer, and mapped citations. This is essential because early milestones are learning exercises.

**Experimental hypothesis.** How observability is exposed (debug responses, CLI, logs) is an implementation choice per experiment.

### Simple semantic RAG first

**Architectural direction (decision).** Start with straightforward semantic retrieval over derived units rather than prematurely building the “final” architecture.

**Architectural direction (hypothesis).** An in-memory vector store is a reasonable **first experimental direction** for a small bounded corpus. Persistent storage (pgvector, hosted vector DB, etc.) is a future acceptance milestone only if behaviour and deployment justify it.

**Architectural direction (hypothesis).** LangChain JS is a reasonable way to **learn** RAG mechanics (see prior art). It is not necessarily a permanent dependency.

**Architectural direction (hypothesis).** OpenAI embeddings and a small chat model are a plausible first provider pairing; provider choice remains swappable.

### Grounding posture

**Architectural direction (decision).** **Bounded retrieval corpus** is an architectural commitment. **Strict epistemic enforcement is not.**

The first experiments should use a lightweight grounding prompt (e.g. answer from supplied context and cite relevant sources). Do **not** introduce strong refusal gates, confidence thresholds, unsupported-claim rejection, or elaborate biographical inference filters before observing actual failure modes.

**Future acceptance milestone.** Grounding, evaluation, and refusal policies may be added after retrieval and generation behaviour are understood.

## First implementation milestone (directional)

**Resolved:** “What generic knowledge representation should we invent?” → **OKF**.

**Next experiment (future just-in-time plan):**

> Can representative sources from the portfolio, a project repository, and published writing be faithfully normalized into OKF, using minimal extensions only where demonstrated necessary?

Produce an **inspectable OKF corpus** before semantic retrieval is added.

## Boundaries that should remain true

1. **Additive UX** — assistant does not replace or block existing navigation and page content.
2. **Single presentation truth** — no parallel hand-maintained `profile.json` or biography database forked from `content/` for the browsable site; corpus normalization flows through OKF, not a competing proprietary document model.
3. **Published corpus only** — bounded to deliberate, attributable published material across the source classes above.
4. **Provenance-backed citations** — links trace to retrieved source metadata.
5. **Observe before gating** — no aggressive filtering until behaviour is understood.
6. **Repository independence** — browsable site stays coherent if the assistant is removed.
7. **Just-in-time planning** — no master multi-slice implementation plan prescribing all future work.
8. **Layer separation** — do not conflate canonical sources, OKF normalization, storage, embeddings, and RAG consumers.

## Likely future capabilities (directional only)

These are **not** scheduled slices. They name areas future experiments may touch after earlier work ships:

- Source-specific producers normalizing portfolio content, repo docs, and published writing into OKF
- Inspectable OKF corpus before embeddings
- Retrieval-unit derivation from OKF knowledge
- First end-to-end semantic RAG experiment (server-side, credentials required)
- Citation / source presentation in responses and UI
- Landing-page interaction (suggested questions, additive placement)
- Retrieval and corpus tuning driven by observed misses
- Possible persistence, hybrid retrieval, reranking, evaluation harnesses, cost/latency work
- Possible grounding or refusal policy **after** behaviour is observed

We may adopt pgvector, hybrid retrieval, reranking, or strict grounding **only if** usage and failure analysis justify them. This note does not prescribe those technologies.

## What we have learned so far

**Experimental evidence (2026-10-06).**

- A single monolithic profile document (nyaomaru pattern) is a poor fit for this content-rich portfolio; meaningful units and metadata matter for citations.
- Prescribing all implementation slices upfront (PR #14) created planning weight without shipped evidence; the Savepoints-style split — durable direction + just-in-time plans — is the preferred process.
- The site's existing `PortfolioRepository` / `content/` split is the right seam for portfolio presentation; a read projection for `content/` does not require a new content store to start learning.
- The corpus spans more than `content/` alone — project repositories and published writing are part of the knowledge boundary; OKF provides a standard normalization layer so we do not invent a parallel knowledge format.

## Changelog

| Date       | Change                                                                                                                                                                                       |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 2026-10-06 | Corpus boundary broadened beyond `content/` alone; OKF adopted as canonical normalized representation; five-layer separation documented; supersedes v0.1.0 `content/`-only corpus assumption |
| 2026-10-06 | Initial direction note; split from monolithic architecture doc; recorded abandoned PR #14 master plan                                                                                        |
