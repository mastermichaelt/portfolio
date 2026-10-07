---
title: OKF normalization experiment findings
status: shipped
updated: 2026-10-06
related:
  - docs/assistant/architecture-direction.md
  - .cursor/plans/archive/2026-10-06-assistant-okf-normalization-experiment.plan.md
---

# OKF normalization experiment findings

Experiment slice for Renovate governance knowledge across three representative source classes. Producers live under `scripts/assistant/okf/`; `npm run okf:build` writes an inspectable OKF bundle to `generated/okf/` (gitignored, ephemeral).

This document records **experiment evidence and architectural conclusions**. It is not a specification for production ingestion, retrieval, or assistant runtime behavior.

## Experiment conclusion

| Finding                                        | Result                                                                                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| Three representative source classes normalized | **Yes** — portfolio content, repository runbook, and published DEV writing each produced conformant OKF concepts                     |
| OKF v0.2 sufficient                            | **Yes** — no schema extensions required for these examples                                                                           |
| OKF extensions required                        | **No** — standard `type`, `resource`, `sources`, `generated.by`, and `tags` sufficed                                                 |
| Concept granularity                            | Followed **source semantics**, not heading structure or retrieval-sized chunks                                                       |
| Initial committed generated OKF                | Useful to make the experiment **inspectable during development**                                                                     |
| Production persistence model                   | **Not** committing generated normalized knowledge — inspection showed Git/source control is wrong for a duplicated production corpus |
| Canonical knowledge location                   | Remains at the **originating source** (portfolio `content/`, project repositories, published writing)                                |
| OKF role going forward                         | **Transient normalized intermediate representation** used during indexing — not an independent system of record                      |
| Retrieval / embeddings / vector index          | **Disposable downstream projections**, rebuildable from canonical sources through normalization                                      |
| Persistent OKF storage                         | **Not needed now** — reconsider only if a concrete future requirement justifies it                                                   |
| Second normalization experiment                | **Optional** — pursue `CaseFigure` / ecosystem graph shapes only if they become a concrete blocker                                   |

## Architectural decision (from this experiment)

```text
canonical sources
      ↓
source-specific acquisition / input
      ↓
OKF normalization                    ← this experiment (producers + build)
      ↓
transient OKF concepts               ← generated/okf/ (gitignored)
      ↓
retrieval-unit derivation            [next — vector retrieval experiment]
      ↓
embeddings                           [next — vector retrieval experiment]
      ↓
vector index (Postgres + pgvector)   [next — vector retrieval experiment]
```

**Follow-on experiment:** [assistant-vector-retrieval-experiment.plan.md](../../.cursor/plans/assistant-vector-retrieval-experiment.plan.md) — retrieval units, OpenAI embeddings, pgvector persistence, idempotent ingest, and inspectable retrieval CLI. OKF remains a transient normalization boundary; the vector store is a disposable derived index, not source of truth.

**Future runtime (not implemented; evidence only):**

```text
question → query embedding → vector search → retrieved text + provenance → LLM → answer + citations
```

Git/source control holds canonical portfolio content, representative test fixtures, producer code, and these findings — not generated OKF concept documents, retrieval units, embeddings, or vector indexes.

## Source inputs

| Source class              | Normalization input                                                   | Notes                               |
| ------------------------- | --------------------------------------------------------------------- | ----------------------------------- |
| Portfolio supporting case | `content/supporting-cases.ts` (`renovateGovernance`)                  | Read directly; no duplicate fixture |
| Portfolio article catalog | `content/articles.ts` row `evidence-driven-dependency-upgrades`       | Metadata-only catalog row           |
| Repo runbook              | `tests/fixtures/assistant-okf/renovate-workflow.md`                   | Representative test input only      |
| DEV field report          | `tests/fixtures/assistant-okf/evidence-driven-dependency-upgrades.md` | Representative test input only      |

## Concept granularity decisions

### Portfolio (`portfolio/`)

**Chosen:** one case overview concept, one concept per supporting block (five prose + one architecture), plus one article catalog entry.

| Alternative considered                   | Why not chosen                                                               |
| ---------------------------------------- | ---------------------------------------------------------------------------- |
| Single case-level concept only           | Loses block-level provenance anchors (`#b04`) and mixes unrelated categories |
| One concept per sentence / paragraph     | Fragments contracts and gutter notes that belong with their block            |
| Merge article catalog into case overview | Catalog metadata is a different source shape with its own `resource`         |

**Boundary feel:** Natural. Supporting-case blocks are already knowledge units with stable ids (`b01`–`b06`).

### Repository runbook (`repo/`)

**Chosen:** five semantic concepts — overview, prerequisites, operator ladder, automation/policy, troubleshooting (+ merge policy table).

| Alternative considered                | Why not chosen                                                  |
| ------------------------------------- | --------------------------------------------------------------- |
| One whole-document concept            | Hides section boundaries useful for provenance                  |
| One concept per `##` heading          | Several headings are reference tables, not standalone knowledge |
| Split operator steps 1–6 individually | Steps share one routing narrative                               |

**Boundary feel:** Mostly natural. Headings guided cuts but did not dictate them.

### Published writing (`writing/`)

**Chosen:** metadata concept (YAML frontmatter) + single narrative concept for the article body (HTML comments stripped).

| Alternative considered                       | Why not chosen                                             |
| -------------------------------------------- | ---------------------------------------------------------- |
| One whole-file concept including frontmatter | Mixes editorial sync metadata with reader-facing narrative |
| One concept per `##` section                 | Sequential argument, not independent reference pages       |
| Preserve HTML comments in body               | Drafting notes, not published knowledge                    |

**Boundary feel:** Natural for this article shape.

## Per-source mapping summary

| Source                | Preserved                                                                                | Lost or dropped                                                                | Awkward                                                             |
| --------------------- | ---------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ | ------------------------------------------------------------------- |
| Portfolio case        | Block leads, bodies, contracts, notes, aside, elsewhere links, artifact hrefs            | `navLabel`, `ordinal`, category rail ordering; interactive architecture canvas | Architecture block requires explicit “link out” prose               |
| Portfolio catalog row | Title, summary, year, tags, URL, `relatedProjectSlug`, `line`                            | `featured` flag (unset for this row)                                           | None — catalog is metadata-only                                     |
| Repo runbook          | Operator ladder, agent roles, prerequisites, troubleshooting tables, mermaid in overview | Relative skill links to sibling repo paths                                     | Long Workflow section is dense in one concept                       |
| DEV article           | Full public narrative, checklist, editor's note                                          | HTML comments; draft URL from frontmatter                                      | Metadata vs body split requires two concepts sharing one `resource` |

## OKF extensions

**Required:** none.

## Per-class verdict

| Source class      | Concepts produced | Verdict      |
| ----------------- | ----------------- | ------------ |
| Portfolio         | 8                 | **OKF fits** |
| Repository        | 5                 | **OKF fits** |
| Published writing | 2                 | **OKF fits** |

## Architecture direction recommendation

**Proceed** with OKF as the normalization layer. Run a **second experiment** later if figure-bearing portfolio content (`CaseFigure` + inventory `source`) or ecosystem graph normalization becomes the primary open question.

Production acquisition/ingestion across project repositories and DEV has **not** been designed. This experiment intentionally does not establish that architecture.

## Inspecting generated output

```bash
npm run okf:build
# → generated/okf/ (concepts, index.md, manifest.json)
```

Read concept documents and `manifest.json` locally for spot-checks. Generated output is disposable and excluded from version control.
