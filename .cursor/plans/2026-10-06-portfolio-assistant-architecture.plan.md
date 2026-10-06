---
name: Portfolio assistant architecture doc
overview: Add durable architecture documentation for the portfolio assistant RAG system at docs/architecture/portfolio-assistant.md. No assistant implementation.
todos:
  - id: slice-architecture-doc
    content: "PR: Add docs/architecture/portfolio-assistant.md, cross-links in overview and roadmap"
    status: completed
  - id: plan-closure
    content: "Docs-only PR after slice merges: add # Shipped note, move plan to .cursor/plans/archive/2026-10-06-portfolio-assistant-architecture.plan.md"
    status: pending
isProject: false
---

# Portfolio assistant architecture documentation

Scoped plan for **durable architecture documentation only**. Does not implement the assistant, LangChain, API routes, or UI.

**Architecture source of truth:** [`docs/architecture/portfolio-assistant.md`](../../docs/architecture/portfolio-assistant.md)

## Recommended execution authority

| Slice                  | Recommended authority | Agent instruction                        |
| ---------------------- | --------------------- | ---------------------------------------- |
| slice-architecture-doc | Open PR only          | Do not merge. Stop after opening the PR. |
| plan-closure           | Open PR only          | Do not merge. Stop after opening the PR. |

## Repository topology

Integration branch: `main`. This slice is documentation-only; branch represents only the architecture doc and cross-links.

---

## Slice — slice-architecture-doc

**Recommended authority:** Open PR only

**Goal:** Land durable assistant architecture documentation for review.

**Deliverables:**

- [`docs/architecture/portfolio-assistant.md`](../../docs/architecture/portfolio-assistant.md)
- Cross-link from [`docs/architecture/overview.md`](../../docs/architecture/overview.md) milestone 5
- Entry in [`docs/plans/portfolio-roadmap.plan.md`](../../docs/plans/portfolio-roadmap.plan.md)

**Acceptance:** Document covers product intent, RAG architecture, reference prior art, corpus sources, chunk/metadata model, flow, citations/observability, decisions/deferrals/hypotheses, boundaries, and implementation roadmap boundaries. No `app/` or `lib/assistant/` code.

---

## Plan closure (docs-only PR)

After slice-architecture-doc merges: add `# Shipped` note, archive to `.cursor/plans/archive/2026-10-06-portfolio-assistant-architecture.plan.md`, mark `plan-closure` completed.

---

## Agent prompts (copy/paste for Cursor)

### slice-architecture-doc

```text
@.cursor/plans/2026-10-06-portfolio-assistant-architecture.plan.md

Implement slice slice-architecture-doc only. Do not start plan-closure. Do not implement the assistant.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: docs/architecture/portfolio-assistant.md and cross-links. Mark slice-architecture-doc completed in plan frontmatter in this PR.

Verification: no app/ or lib/assistant/ code; document satisfies architecture doc acceptance in the plan.
```

### plan-closure

```text
@.cursor/plans/2026-10-06-portfolio-assistant-architecture.plan.md

Execute only plan-closure.

Authority: Open PR only — docs-only archive PR; do not merge.

Prerequisites: slice-architecture-doc merged and marked completed.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: verify slice todo, add # Shipped note, move plan to .cursor/plans/archive/2026-10-06-portfolio-assistant-architecture.plan.md, mark plan-closure completed.

Verification: architecture doc remains at docs/architecture/portfolio-assistant.md.
```
