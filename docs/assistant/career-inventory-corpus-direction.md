---
title: Career inventory corpus direction
subtitle: Resumes repo as curated OKF source — before grounded answer generation
status: draft
version: 0.1.0
updated: 2026-10-08
related:
  - docs/assistant/architecture-direction.md
  - docs/assistant/rag-generation-direction.md
  - .cursor/plans/assistant-career-inventory-corpus.plan.md
---

# Career inventory corpus direction

The portfolio assistant indexes `content/about.ts` as public career narrative. That is **not** equivalent to indexing the **career inventory** in the private [`mastermichaelt/resumes`](https://github.com/mastermichaelt/resumes) repository. This note identifies canonical inventory layers, defines a **publication boundary**, and sketches an OKF producer — implementation is a separate plan slice ([assistant-career-inventory-corpus.plan.md](../../.cursor/plans/assistant-career-inventory-corpus.plan.md)).

**Milestone placement:** address curated career-inventory indexing **before** visitor-facing RAG generation ([rag-generation-direction.md](./rag-generation-direction.md)). Retrieval-eval questions about Atlassian experimentation, engineering leadership, and developer infrastructure should hit inventory-backed evidence, not only condensed About copy.

## Three layers (do not conflate)

| Layer                | Location                                                     | What the assistant would learn                                        | Indexed today?      |
| -------------------- | ------------------------------------------------------------ | --------------------------------------------------------------------- | ------------------- |
| **Portfolio About**  | `portfolio/content/about.ts`                                 | Public career narrative — selected roles, bullets, figures            | Yes (`about/*` OKF) |
| **Resume variants**  | `resumes/applications/<slug>/` + `out/`                      | Role-specific positioning, emphasis, omitted facts                    | No — must stay out  |
| **Career inventory** | `resumes/facts/`, `resumes/roles/`, selected `resumes/meta/` | Projects, responsibilities, technologies, outcomes, metrics, evidence | **No — gap**        |

About copy is transcribed from a résumé exemplar and aligned to public presentation; it does not carry the full fact graph (for example thematic bundles such as `cross-flow-experiment-measurement`, `admin-hub-experimentation`, or independent-work facts that never appear on the About page).

## Canonical career inventory (resumes repo)

**Authoritative evidence** (per resumes [AGENTS.md](https://github.com/mastermichaelt/resumes/blob/main/AGENTS.md) and [facts-vs-prose](https://github.com/mastermichaelt/resumes/blob/main/.cursor/rules/facts-vs-prose.mdc)):

| Path                                    | Role                                                                                                | Scale (2026-10) |
| --------------------------------------- | --------------------------------------------------------------------------------------------------- | --------------- |
| `facts/*.yml`                           | Thematic fact bundles — `action`, `outcome`, `metric`, `scope`, `technology`, linked to `role:` ids | 38 files        |
| `roles/*.yml`                           | Employment timeline — company, dates, org, title                                                    | 21 files        |
| `meta/education.yml`, `meta/awards.yml` | Stable public-adjacent metadata                                                                     | small           |
| `meta/skills*.yml`                      | Capability tags (optional; lower priority than facts)                                               | 4 files         |

Facts reference roles by id (e.g. `role: atlassian-em-2020`); roles provide chronology; facts provide answer depth (attribution formulas, experiment infrastructure, leadership scope).

## Publication boundary (job-search vs public assistant)

The resumes repository is **private** and mixes **public-evidence inventory** with **job-search operations**. The assistant corpus must not ingest the whole repo.

**Never index (non-negotiable):**

- `applications/**` — `brief.yml`, `include.yml`, `research.md`, `lifecycle.yml`, `prep.yml`, communications
- `applications/**/out/**` — generated résumé/PDF prose (variants, not canonical evidence)
- `stories/**` — interview hard-lesson layer (explicitly not résumé claims)
- `exemplars/**` — editorial quality reference, not career evidence
- Agent/planning paths under either repo

**Index only with an explicit public allowlist** (to be committed in portfolio):

- Approved `facts/<id>.yml` ids (default: all inventory facts unless tagged otherwise in a future `assistant_public: false` convention)
- Matching `roles/<id>.yml` for referenced roles
- Selected `meta/` files with **PII stripped at producer** (e.g. omit phone; keep education/awards)

Near-identical résumé variants must **not** create parallel OKF concepts — one vector line per inventory fact bundle, not per application slug.

## OKF producer design (sketch)

**Namespace:** `career/` (new OKF prefix; requires `source_class` extension in retrieval derivation — e.g. `career` alongside `about` / `portfolio`).

**Granularity (recommended):**

- One OKF concept per `facts/<id>.yml` — title from fact file `title`, body from structured fact entries (preserve ids for provenance; no claim strengthening).
- Optional compact `career/role-<id>` concepts from `roles/*.yml` for date-range questions.
- Do **not** emit one concept per generated résumé or per application.

**Cross-repo input strategy (CI-safe):**

| Mode                                     | Use                                                                                                                                  |
| ---------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| **Pinned snapshot** (recommended for CI) | Copy approved YAML into `tests/fixtures/assistant-okf/career-inventory/` (or manifest hashes) — same pattern as DEV `published/*.md` |
| **Sibling checkout**                     | `RESUMES_REPO_ROOT` for local `okf:build` when `../resumes` exists — optional ergonomics only                                        |

Portfolio CI must not depend on a private clone unless snapshots are committed or supplied as a gated secret artifact.

**Coverage tests:** pin hashes of allowlisted snapshot files; fail when resumes inventory changes without refreshing portfolio snapshots and producer output.

## Questions this unlocks

Examples that should rank inventory concepts after ingest (many already appear in [retrieval eval fixtures](../../tests/fixtures/assistant-retrieval/eval-cases.json)):

- What experimentation infrastructure did you build at Atlassian?
- How much engineering leadership experience do you have?
- What evidence supports developer infrastructure / Renovate governance work?
- Why return from engineering management to IC work?

About concepts remain useful for narrative; inventory concepts supply **evidence depth** and metrics.

## Related portfolio docs

- [architecture-direction.md](./architecture-direction.md) — corpus boundary table
- [vector-retrieval-experiment.md](./vector-retrieval-experiment.md) — structure-aware derivation unchanged
- [assistant-database.md](./assistant-database.md) — re-ingest after corpus growth
