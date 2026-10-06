---
name: Assistant corpus OKF architecture
overview: Broaden the assistant corpus boundary beyond portfolio content/, adopt OKF as the canonical normalized knowledge representation, and update durable architecture docs — docs-only implementation slice after plan review.
todos:
  - id: plan-review
    content: "Plan-only PR — commit plan artifact; open PR for review; do not implement architecture doc updates"
    status: completed
  - id: docs-assistant-corpus-okf
    content: "PR: Update architecture-direction.md, prior-art.md, and overview.md for corpus boundary + OKF adoption"
    status: pending
  - id: plan-closure
    content: "Docs-only PR after docs-assistant-corpus-okf merges: add # Shipped note, move plan to .cursor/plans/archive/"
    status: pending
isProject: false
---

# Assistant corpus OKF architecture

## Recommended execution authority

| Slice                     | Recommended authority | Agent instruction                                      |
| ------------------------- | --------------------- | ------------------------------------------------------ |
| plan-review               | Plan-only PR          | Do not implement. Stop after opening the plan-only PR. |
| docs-assistant-corpus-okf | Open PR only          | Do not merge. Stop after opening the PR.               |
| plan-closure              | Open PR only          | Do not merge. Stop after opening the PR.               |

Repo default: **Open PR only** ([planning-standards.md](../standards/planning-standards.md#repo-default-when-no-plan-slice-applies)).

## Repository topology (default)

The repository integration branch is `main`. Each slice starts from latest `origin/main`. The PR branch must represent only that slice; previous work arrives through merged `main`, not branch ancestry. PR base must be `main`.

---

## Goal

Correct the portfolio-assistant architecture before the first corpus implementation:

1. **Corpus boundary** — deliberately selected published knowledge across portfolio `content/`, selected project repositories, and full published writing (e.g. DEV articles), not `content/` alone.
2. **Normalization representation** — adopt **Open Knowledge Format (OKF)** as the canonical normalized knowledge representation; do not invent a parallel proprietary `KnowledgeDocument` model.

Learning focus: RAG, retrieval, corpus construction, ingestion, provenance, and assistant behaviour — not designing a competing knowledge interchange specification.

**Supersedes:** the `content/`-only corpus assumption in [`docs/assistant/architecture-direction.md`](../../docs/assistant/architecture-direction.md) (v0.1.0, 2026-10-06).

**Does not revive:** [PR #14](https://github.com/mastermichaelt/portfolio/pull/14) master plan.

---

## Architectural shape

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

**Five layers (do not conflate):**

| Layer                     | Role                                                                                                      |
| ------------------------- | --------------------------------------------------------------------------------------------------------- |
| Canonical sources         | Where published material originates                                                                       |
| OKF                       | Normalized knowledge representation/interchange                                                           |
| Storage                   | Where normalized/indexing/application data may physically live (no new persistence decision in this plan) |
| Embeddings / vector index | Retrieval representation                                                                                  |
| RAG                       | One consumer of retrieved knowledge                                                                       |

Neon remains a likely future Postgres provider where Postgres is appropriate. OKF ≠ Postgres.

---

## Architectural decision (record in architecture-direction.md)

> OKF is the canonical normalized knowledge representation for the assistant corpus. Source-specific ingestion converts deliberately selected source material into OKF-compatible knowledge. Portfolio-specific requirements should be expressed through minimal extensions to OKF rather than through a parallel proprietary knowledge-document model.

Mark as **Architectural direction (decision)**. Do not design an alternative generic `KnowledgeDocument` format alongside OKF.

---

## Corpus boundary

**New principle:**

> The assistant corpus is bounded to deliberately selected, attributable source material representing Michael's published work and technical reasoning. Portfolio `content/` is one high-quality curated source, not necessarily the entire knowledge corpus.

**Source classes:**

1. **Curated portfolio content** — about, case studies, summaries, ecosystem, article metadata. Canonical for portfolio **presentation**.
2. **Selected project repositories** — architecture notes, READMEs, design decisions, published technical explanations across ~7 repos. **Not** whole-repo automatic ingestion. Exclude agent docs, plans, secrets, gitignored artifacts, private operational material.
3. **Published writing** — full DEV article bodies (not just portfolio summaries). Ingestion mechanism deferred.
4. **Comments/discussions** — open corpus-policy question. No decision in this plan.

---

## OKF extensions policy

**OKF + extensions** approach. Before adding any extension:

1. Verify base OKF does not already represent the requirement (`resource`, `sources`, `generated.by`, `tags`, etc.)
2. Prefer standard OKF semantics where sufficient
3. Add the smallest portfolio-specific extension necessary
4. Keep extensions clearly distinguishable from standard OKF
5. Document why each extension exists
6. Avoid extensions that encode retrieval-engine implementation details

Do not invent speculative extensions in the docs slice. Extensions emerge from concrete ingestion/retrieval needs.

**Primary OKF references (read before documenting):**

- [Google Cloud blog — OKF introduction](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing) (June 2026; introduces v0.1)
- [OKF specification (current)](https://github.com/GoogleCloudPlatform/knowledge-catalog/blob/main/okf/SPEC.md) — **v0.2 Draft**
- [open-knowledge-format repo](https://github.com/GoogleCloudPlatform/open-knowledge-format)

Document OKF maturity accurately: v0.1 announced June 2026; spec now v0.2 draft; explicitly evolving.

---

## First implementation milestone (directional — not this plan)

**Resolved:** "What generic knowledge representation should we invent?" → **OKF**.

**Next experiment (future just-in-time plan, not created here):**

> Can representative sources from the portfolio, a project repository, and published writing be faithfully normalized into OKF, using minimal extensions only where demonstrated necessary?

Produce an **inspectable OKF corpus** before semantic retrieval is added.

---

## Slice — plan-review

**Recommended authority:** Plan-only PR

**Rationale:**

- Architecture correction spans corpus boundary, OKF adoption, and layer separation — plan review before doc edits reduces rework.

**Agent instruction:** Do not implement. Stop after opening the plan-only PR.

**Goal:** Land this plan artifact for review.

**Acceptance:** Plan file committed; PR opened targeting `main`; no changes to `docs/assistant/` or other implementation files.

---

## Slice — docs-assistant-corpus-okf

**Recommended authority:** Open PR only

**Rationale:**

- Single docs-only concern: durable architecture correction aligned with this plan.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Prerequisite:** `plan-review` merged.

**Goal:** Update durable assistant architecture documentation.

**Scope (only):**

| File                                                                                         | Changes                                                                                                                                                    |
| -------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`docs/assistant/architecture-direction.md`](../../docs/assistant/architecture-direction.md) | Corpus boundary, OKF adoption decision, extensions policy, layer diagrams, provenance, boundaries reframing, first-milestone direction, learning/changelog |
| [`docs/assistant/prior-art.md`](../../docs/assistant/prior-art.md)                           | nyaomaru note (distributed corpus); OKF background section (architecture adopts OKF at normalization boundary)                                             |
| [`docs/architecture/overview.md`](../../docs/architecture/overview.md)                       | Optional one-line milestone 5 alignment                                                                                                                    |

**Do not:**

- Implement OKF producers, OKF files, ingestion, DEV fetch, embeddings, vector storage, LangChain, RAG, APIs, or assistant UI
- Invent speculative OKF extensions
- Create the OKF normalization implementation plan

**Acceptance:**

- Corpus boundary corrected; OKF recorded as architectural decision
- Layers separated (canonical source / OKF / storage / retrieval)
- Grep clean: no stale `sole corpus`, `single content truth`, or parallel `KnowledgeDocument` format
- `docs-assistant-corpus-okf` marked `completed` in plan frontmatter in same PR

**Verification:**

- Read updated `architecture-direction.md` end-to-end
- Grep assistant docs for stale `content/`-only assumptions
- CI docs-only path (e2e skip expected)

---

## Plan closure (docs-only PR)

**Recommended authority:** Open PR only

**Rationale:** Docs-only archival after implementation slice merges.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Prerequisite:** `docs-assistant-corpus-okf` merged.

After the implementation slice merges:

1. Verify `docs-assistant-corpus-okf` is `completed`
2. Add `# Shipped` closure note
3. Move this file to `.cursor/plans/archive/2026-10-06-assistant-corpus-okf-architecture.plan.md`
4. Mark `plan-closure` `completed` and update agent prompt references to the archived path

---

## Agent prompts (copy/paste for Cursor)

### plan-review

```text
@.cursor/plans/assistant-corpus-okf-architecture.plan.md

Execute only plan-review. Do not start docs-assistant-corpus-okf or later slices.

Authority: Plan-only PR — commit the plan artifact only; do not implement. Stop after opening the plan-only PR.

Topology: start from latest origin/main; branch represents only the plan artifact; PR base must be main.

Deliverables: plan file under .cursor/plans/; mark plan-review completed in frontmatter in the same PR.

Verification: plan satisfies repo planning standards; no implementation changes included.
```

### docs-assistant-corpus-okf

```text
@.cursor/plans/assistant-corpus-okf-architecture.plan.md

Implement slice docs-assistant-corpus-okf only. Prerequisite: plan-review merged. Do not start plan-closure. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: update docs/assistant/architecture-direction.md, docs/assistant/prior-art.md, and optionally docs/architecture/overview.md per the plan. Mark docs-assistant-corpus-okf completed in plan frontmatter in this PR.

Do not: implement OKF producers, create OKF files, ingest repositories, fetch DEV articles, add embeddings/vector storage/LangChain/RAG/APIs/UI, or create the OKF normalization implementation plan.

Verification: read architecture-direction.md end-to-end; grep assistant docs for stale content/-only corpus wording; confirm OKF is a decision not a hypothesis; confirm no conflation of OKF with storage/embeddings.
```

### plan-closure

```text
@.cursor/plans/assistant-corpus-okf-architecture.plan.md

Execute only plan-closure.

Authority: Open PR only — docs-only archive PR; do not merge.

Prerequisites: docs-assistant-corpus-okf merged and marked completed in frontmatter.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: verify slice todos, add # Shipped note, move plan to .cursor/plans/archive/2026-10-06-assistant-corpus-okf-architecture.plan.md, mark plan-closure completed, update agent prompt references to the archived path.

Verification: confirm docs-assistant-corpus-okf PR is merged before archiving.
```
