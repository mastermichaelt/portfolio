---
concept_slug: savepoints-architecture-direction
upstream_repo: multipliers-dev/savepoints
upstream_path: notes/architecture-direction.md
publication_kind: reviewed-excerpt
title: Savepoints architecture direction (public excerpt)
---

# Savepoints architecture (public excerpt)

Reviewed excerpt from Savepoints architecture direction for portfolio assistant retrieval. This is **not** the full architecture note — agent plans, hook implementation detail, and internal probe paths are omitted.

## Product intent

Savepoints captures **durable learnings** from agent work: insights that are useful, locally novel, specific, evidenced, and likely to matter later. Raw activity traces and operational telemetry are not canonical memory.

The current repo-local prototype (JSONL spools, local promotion, optional Postgres submit) proves the pipeline. It is **not** the long-term product boundary. Other repositories should not copy prototype observer code; capture should become an installable Savepoints agent runtime that delivers **candidate ingest payloads** through a Savepoints-owned network interface. Database credentials stay backend deployment configuration only — installed runtimes must not require direct Postgres access.

## Three product pieces

```text
agent runtime
    ↓
Savepoints-owned network ingestion interface
    ↓
Savepoints backend / domain
    ↓
product UI / MCP consumers
```

| Piece            | Owns                                                                                                                                |
| ---------------- | ----------------------------------------------------------------------------------------------------------------------------------- |
| Agent runtime    | Host adapters, normalization and redaction at the edge, local operational queue, offline fail-open delivery of candidate payloads   |
| Backend / domain | Ingestion, promotion policy, canonical schema, provenance, semantic lifecycle, durable storage, authz, Savepoints-owned API and MCP |
| Product UI       | Retrospective curation, browsing and search, project settings                                                                       |

**Ingest vs canonical:** the network boundary accepts durable **ingest** (candidate-shaped payloads). The backend applies promotion policy and writes **canonical Savepoints**. Runtimes do not submit pre-promoted canonical records across the network boundary.

## Capture and promotion

**Agent-owned semantic capture.** Working agents call `emit-learning` when a learning clears the bar, guided by project skills and agent instructions. A **completion backstop** requires one final semantic review before task end (mandatory on Cloud Agents). Rules and reminders reinforce the contract; they are not a substitute for lifecycle observability.

**Five-check promotion bar** (applied at canonical promotion time): useful, novel (beyond restating the activity trace — not global corpus novelty), specific, evidenced, will-it-matter. Working agents emit structurally valid learnings; automatic promotion is the safety net. Exact-text idempotency prevents duplicate processing; semantic deduplication belongs in downstream corpus operations.

**Infrastructure-owned capture review** (where the host supports it). Savepoints registers a **source run** for ordinary agent executions, accumulates a bounded **evidence span** from repo-owned file edits (not shell-only or MCP-only work without checkout-owned edits), and may open a **review opportunity** when execution ends. The agent then formulates a concrete candidate, runs the five-check assessment, and routes to emit, filtered retention, or a legitimate `no_capture` attestation when nothing concrete could be formulated.

## Capture review — architectural model

```text
host observations → bounded unreviewed evidence → safe review opportunity → semantic review → advance reviewed boundary
```

| Decision                   | Direction                                                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------- |
| Observations vs Savepoints | Host observations remain **distinct** from candidates and canonical Savepoints                                                     |
| Review state               | Savepoints owns durable review state (opportunity lifecycle, reviewed watermark)                                                   |
| Review trigger             | Host-specific lifecycle capabilities behind a portable adapter — not one vendor hook name                                          |
| Semantic judgment          | **Agent-owned** — infrastructure opens a review **opportunity**, not a Savepoint                                                   |
| Zero captures              | Valid after review when no concrete candidate could be formulated                                                                  |
| Fail-open                  | Adapter or hook failure must not block agent execution; missing infrastructure review is not a legitimate zero-capture attestation |

**Adapter capability levels** characterize what each host can prove:

| Level         | Infrastructure-observable capture review   | Semantic capture                                                |
| ------------- | ------------------------------------------ | --------------------------------------------------------------- |
| `supported`   | End-to-end under host contract             | Review opportunity plus agent emit or `no_capture`              |
| `narrowed`    | Partial with documented limits             | As contract specifies                                           |
| `unsupported` | Not provided — adapter reports degradation | Mandatory completion backstop; **`unsupported` ≠ `no_capture`** |

Cursor Desktop is characterized **`supported`** for infrastructure-observable capture review. Cursor Cloud is **`unsupported`** for that path today; semantic capture still runs via same-turn emit and completion backstop.

Portable **cross-host** capture-review claims depend on a later milestone (host abstraction) — separate from runtime install portability and repository portability on a supported host.

## Memory loop direction

Canonical product shape: **candidate ingestion → policy-driven promotion → canonical store → retrospective curation**. Working-agent reasoning is architecturally sufficient for capture and first retrospective synthesis; Savepoints does not require a second LLM on the capture path. Retrospective UI and agent-native retrospective skills consume canonical records later — not raw spool files.

## Follow-up publication

The upstream `notes/architecture-direction.md` note includes milestone sequencing, demo experiment evidence, filtered-candidate retention, and deferred backend capabilities. Promote additional sections only after explicit publication-suitability review — not via ingest alone.
