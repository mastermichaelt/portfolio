---
title: Portfolio assistant prior art
subtitle: Reference implementations and normalization standards — useful patterns, not our architecture
status: draft
version: 0.2.0
updated: 2026-10-06
related:
  - docs/assistant/architecture-direction.md
---

# Portfolio assistant prior art

**Status:** prior-art note. This note does not change [architecture direction](./architecture-direction.md).

---

## nyaomaru-portfolio

[nyaomaru/nyaomaru-portfolio](https://github.com/nyaomaru/nyaomaru-portfolio) is a reference implementation studied for RAG mechanics, not a blueprint for michaeltruong.ai.

**Sources:** upstream repo — especially `features/terminal/server/make-profile-qa-chain.server.ts`, `features/terminal/server/profile-qa.ts`, `public/profile.json`, `app/routes/api.ask.ts`.

### Why this note exists

Before building a portfolio assistant, we studied a minimal open-source “ask about me” implementation. The useful question is not “should we copy it?” but **what did a tiny RAG pipeline already teach us**, and **what would be wrong to transplant** into a content-rich Next.js portfolio backed by typed modules and a repository abstraction.

### What the reference does

**Stack:** Remix (not Next.js), LangChain JS, OpenAI embeddings + `gpt-4o-mini`.

**Pipeline (simplified):**

```text
profile.json (one JSON blob)
      ↓
single LangChain Document (JSON.stringify entire profile)
      ↓
MemoryVectorStore built per request
      ↓
semantic retriever + hand-tuned keyword substring map
      ↓
merge context → ChatPromptTemplate → ChatOpenAI
      ↓
POST /api/ask { question } → answer string
```

### Observations worth keeping

| Pattern                           | Why it matters                                                                                                                                   |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Small LangChain stack             | Embeddings, in-memory vector store, chat model, prompt template — low ceremony                                                                   |
| Server-only API key               | Credentials never reach the browser                                                                                                              |
| Strict context-only system prompt | Simple grounding instruction without elaborate policy engines                                                                                    |
| Hybrid retrieval _idea_           | Semantic search plus lightweight keyword routing for explicit field questions (`who`, `where`, …) — worth revisiting **after** real chunks exist |
| Feature-folder separation         | Chain logic separated from HTTP route — maps cleanly to “library + route” in App Router                                                          |

### Patterns we probably would not copy

| Reference pattern                              | Why it fits poorly here                                                                                                                     |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| One `profile.json` document                    | Portfolio truth lives in many typed `content/` modules with rich structure                                                                  |
| Entire profile embedded as one vector document | Semantic search adds little when there is only one chunk; keywords do the work                                                              |
| Rebuild `MemoryVectorStore` on every request   | Wasteful at scale; our corpus will be larger and multi-chunk                                                                                |
| Keyword map over JSON key substrings           | Fragile; we prefer provenance metadata tied to real content units                                                                           |
| LangChain response shape leaked to API clients | We want a clean public contract when an API exists                                                                                          |
| Parallel content store                         | Would fork facts away from `PortfolioRepository` / `content/`                                                                               |
| No first-class citation contract               | We want provenance surfaced to visitors                                                                                                     |
| Remix UI / terminal UX                         | Our site has its own Next.js layout and design system                                                                                       |
| Single-file corpus                             | Our knowledge boundary is distributed across portfolio `content/`, selected project repositories, and published writing — not one JSON blob |

### Architectural lessons (non-normative)

1. **Monolithic embeddable text is a dead end** for this portfolio — the reference works only because the corpus is tiny and Q&A-shaped. Our direction is meaningful retrieval units with metadata across a distributed corpus.

2. **LangChain is a learning path, not a commitment** — the reference proves the JS toolchain is approachable; we may outgrow or replace it.

3. **Grounding can start minimal** — a context-only prompt is enough for early experiments; aggressive refusal machinery can wait for observed failure modes.

4. **Hybrid retrieval is optional future work** — the reference’s keyword pass is instructive but tied to a flat JSON key space; any hybrid approach here should follow corpus design, not substring hacks.

---

## Open Knowledge Format (OKF)

**Background only.** [Architecture direction](./architecture-direction.md) adopts OKF as the canonical normalized knowledge representation at the ingestion boundary. This section records why OKF is relevant prior art — not how to implement it.

### What OKF is

[Open Knowledge Format (OKF)](https://github.com/GoogleCloudPlatform/open-knowledge-format) is an open specification for representing structured knowledge in a portable, machine-readable format. Google announced v0.1 in June 2026; the [current specification](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) is v0.2 draft and explicitly evolving.

OKF sits at the **normalization / interchange** layer — between canonical source material and downstream consumers (retrieval-unit derivation, embeddings, RAG). It is not a vector database, embedding format, or storage engine.

### Why it matters here

| Consideration                 | Relevance                                                                                                                |
| ----------------------------- | ------------------------------------------------------------------------------------------------------------------------ |
| Multi-source corpus           | Portfolio `content/`, project repos, and published writing need a common normalized representation before retrieval      |
| Avoid reinventing interchange | A standard format lets us focus learning on RAG and retrieval, not on designing a proprietary `KnowledgeDocument` schema |
| Provenance and attribution    | OKF's `sources`, `resource`, and `generated.by` semantics align with our provenance requirements                         |
| Extensions over forks         | Portfolio-specific needs can be expressed as minimal OKF extensions rather than a parallel format                        |

### Maturity caveat

OKF is young (v0.1 announced June 2026; spec v0.2 draft). Adoption here is an architectural direction based on the specification's intent and fit, not on production battle-testing. Extensions policy and concrete normalization experiments will validate the choice.

### Primary references

- [Google Cloud blog — OKF introduction](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing) (June 2026)
- [OKF specification (current)](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) — v0.2 Draft
- [open-knowledge-format repo](https://github.com/GoogleCloudPlatform/open-knowledge-format)

---

## Changelog

| Date       | Change                                                                               |
| ---------- | ------------------------------------------------------------------------------------ |
| 2026-10-06 | Added OKF background section; nyaomaru note reframed for distributed corpus boundary |
| 2026-10-06 | Initial prior-art note (split from monolithic architecture doc)                      |
