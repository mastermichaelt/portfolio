---
title: Cross-repository assistant source inventory
subtitle: Coverage gaps, publication boundaries, and ingestion recommendations (2026-10-08)
status: draft
version: 0.1.0
updated: 2026-10-08
related:
  - docs/assistant/architecture-direction.md
  - docs/assistant/career-inventory-corpus-direction.md
  - docs/assistant/corpus-coverage-expansion.md
  - docs/assistant/vector-retrieval-experiment.md
  - .cursor/plans/assistant-cross-repository-corpus.plan.md
  - .cursor/plans/archive/2026-10-08-assistant-corpus-coverage-expansion.plan.md
---

# Cross-repository assistant source inventory

Research artifact for **cross-repository knowledge coverage** before RAG generation. Findings are from **local workspace inspection** (Oct 2026) plus portfolio assistant code on `main` after PR [#45](https://github.com/mastermichaelt/portfolio/pull/45). Repositories not present locally are marked **unverified**.

**Corpus baseline (2026-10-08):** **89** OKF concepts and **209** indexed retrieval units after operator acceptance — canonical record [corpus-coverage-expansion.md § Operational acceptance](./corpus-coverage-expansion.md#operational-acceptance).

## Pipeline baseline (preserve — do not replace)

| Stage                                       | Status                     | Notes                                                                                                                                      |
| ------------------------------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| OKF producers (`scripts/assistant/okf/`)    | **Shipped**                | Namespace dirs: `portfolio/`, `about/`, `repo/`, `writing/`                                                                                |
| Structure-aware derive (`assistant:derive`) | **Shipped**                | 1..N units per concept; `unit_id` + `content_hash`                                                                                         |
| Embeddings + pgvector + ingest sync         | **Shipped**                | Idempotent upsert/skip/delete stale                                                                                                        |
| Retrieve CLI + retrieval-eval               | **Shipped**                | Fixture harness; exact cosine                                                                                                              |
| PR #45 corpus expansion (~89 concepts)      | **Shipped** on `main`      | [#45](https://github.com/mastermichaelt/portfolio/pull/45) merged                                                                          |
| Post-merge ingest + eval on expanded index  | **Completed** (2026-10-08) | [corpus-coverage-expansion.md](./corpus-coverage-expansion.md#operational-acceptance); [assistant-database.md](./assistant-database.md) §6 |
| Corpus expansion plan-closure               | **Shipped**                | [#47](https://github.com/mastermichaelt/portfolio/pull/47); archived plan under `.cursor/plans/archive/`                                   |
| RAG answer generation                       | **Not implemented**        | [rag-generation-direction.md](./rag-generation-direction.md)                                                                               |

**Indexed today (after PR #45 build):** ~89 OKF concepts → ~209 retrieval units (fresh derive). Pre-PR #45 baseline was ~35 concepts / ~61 units.

### Existing OKF coverage map (portfolio repo)

| Producer                | Source                                                     | OKF prefix              | Concepts (approx.) |
| ----------------------- | ---------------------------------------------------------- | ----------------------- | ------------------ |
| `portfolio-producer`    | `supporting-cases.ts`, `articles.ts` catalogs              | `portfolio/`            | 30                 |
| `project-case-producer` | `project-cases.ts`                                         | `portfolio/`            | 11                 |
| `ecosystem-producer`    | `ecosystem.ts`                                             | `portfolio/ecosystem-*` | 4                  |
| `about-producer`        | `about.ts`                                                 | `about/`                | 9                  |
| `repo-producer`         | Pinned `tests/fixtures/assistant-okf/renovate-workflow.md` | `repo/`                 | 5                  |
| `dev-producer`          | Pinned `tests/fixtures/assistant-okf/published/*.md` (15)  | `writing/`              | 30                 |

`content-source-registry.mjs` pins hashes for `about`, `articles`, `supporting-cases`, `project-cases`, `ecosystem` only.

---

## Source inventory by repository

Legend: **Coverage** = already represented in OKF (possibly thin). **Priority** = impact on realistic visitor questions. **Method** = recommended ingestion path.

### `mastermichaelt/portfolio` (this repo)

| Path / surface                                    | Knowledge                          | OKF coverage                       | Gap                                       | Canonical?                   | Public? | Recommendation                                                       | Method                    | Priority |
| ------------------------------------------------- | ---------------------------------- | ---------------------------------- | ----------------------------------------- | ---------------------------- | ------- | -------------------------------------------------------------------- | ------------------------- | -------- |
| `content/about.ts`                                | Public career narrative            | `about/*`                          | Thin vs inventory                         | Derived from résumé exemplar | Yes     | **Keep**; do not duplicate with inventory prose                      | Existing producer         | —        |
| `content/project-cases.ts`, `supporting-cases.ts` | Flagship + supporting case studies | `portfolio/*`                      | Strong for Codenames, Renovate, editorial | Canonical for **site**       | Yes     | **Keep**                                                             | Existing                  | —        |
| `content/ecosystem.ts`                            | Entity/workflow map                | `portfolio/ecosystem-*`            | No layout coords                          | Canonical for site           | Yes     | **Keep**                                                             | Existing                  | —        |
| `content/articles.ts` + DEV fixtures              | Article catalog + bodies           | `portfolio/*-catalog`, `writing/*` | Hub freshness not auto-checked            | Fixtures copy hub            | Yes     | **Keep**; operational sync                                           | Pinned fixtures           | —        |
| `docs/assistant/*`                                | Assistant architecture             | None                               | Meta; not visitor evidence                | Internal                     | Mixed   | **Exclude** from public corpus (or tiny “how assistant works” later) | —                         | Low      |
| `docs/architecture/overview.md`, `PRODUCT.md`     | Product architecture               | None                               | Could answer “how is site built”          | Canonical for product        | Yes     | **Optional** later slice                                             | Deterministic MD producer | Low      |

### `mastermichaelt/resumes` (private — local verified)

**Career inventory policy (aligned with [assistant-cross-repository-corpus.plan.md](../../.cursor/plans/assistant-cross-repository-corpus.plan.md)):** **source eligibility** and **content publication** are separate, both **default deny**. The repo contains 38 fact files and 21 role files — **none** are corpus-eligible until explicitly listed on the committed source allowlist. Listing a fact or role file authorizes consideration only; **ingestion reads reviewed public snapshots**, not wholesale private YAML. Eligibility does **not** imply publication approval.

| Path / surface                                      | Knowledge                                                                                                                                | OKF coverage                       | Gap                                                                              | Canonical?                    | Public?                          | Recommendation                                                                                                                                                                                                               | Method                                                                             | Priority |
| --------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- | -------------------------------------------------------------------------------- | ----------------------------- | -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------- | -------- |
| `facts/*.yml` (38 files)                            | Thematic evidence: metrics, scope, tech, outcomes                                                                                        | **None**                           | **Major** — Atlassian depth, Savepoints, Loom, admin hub, cross-flow attribution | **Canonical career evidence** | Private; selective public export | **Eligible only** via source allowlist; **publish** reviewed excerpts in snapshots → `career/`                                                                                                                               | Snapshot-backed deterministic producer (not wholesale YAML copy)                   | **P0**   |
| `roles/<id>.yml` (21 in repo; **default deny**)     | Employment timeline                                                                                                                      | Partial via `about/*` bullets only | Date/title/org detail                                                            | Canonical                     | Private                          | **Source:** allowlist `roles/<id>.yml` only when tied to allowlisted facts — **never** bulk-include all 21. **Publication:** reviewed public-safe role excerpts in snapshots only; optional compact `career/role-*` concepts | Snapshot-backed only; eligibility ≠ ingest without publication manifest            | P0       |
| `meta/education.yml`, `awards.yml`                  | Education, awards                                                                                                                        | None                               | Minor                                                                            | Canonical                     | Mostly public                    | **Eligible** if on meta allowlist; **publish** reviewed public-safe fields only                                                                                                                                              | Snapshot-backed                                                                    | P1       |
| `meta/profile.yml`                                  | Contact, links                                                                                                                           | Partial in site profile            | Phone/email                                                                      | Canonical                     | Partial                          | **Default exclude** contact fields; links only if already public and explicitly published in snapshot                                                                                                                        | Snapshot-backed; no phone/email in corpus                                          | P1       |
| `applications/**`, `out/`, `stories/`, `exemplars/` | Job search, interview, editorial refs                                                                                                    | None                               | Must stay out                                                                    | Derived / non-evidence        | Private                          | **Exclude**                                                                                                                                                                                                                  | —                                                                                  | —        |
| Example fact gaps vs About/cases                    | `admin-hub-experimentation`, `cross-flow-experiment-measurement`, `loom-acquisition`, `em-growth-delivery`, `savepoints-durable-capture` | Not in OKF                         | Explains eval reliance on thin `about/` + one case block                         | Canonical                     | Review per fact                  | **First snapshot set**                                                                                                                                                                                                       | See [career-inventory-corpus-direction.md](./career-inventory-corpus-direction.md) | P0       |

### `multipliers-dev/cursor-team-marketplace` (public — local verified)

Repository name confirmed: **`cursor-team-marketplace`** ([README](https://github.com/multipliers-dev/cursor-team-marketplace)).

| Path / surface                                         | Knowledge                          | OKF coverage | Gap                                             | Canonical?            | Public? | Recommendation                                                         | Method                    | Priority |
| ------------------------------------------------------ | ---------------------------------- | ------------ | ----------------------------------------------- | --------------------- | ------- | ---------------------------------------------------------------------- | ------------------------- | -------- |
| `README.md`                                            | Plugin purpose, three capabilities | None         | Marketplace / harness overview                  | Canonical             | Yes     | **Include** (1–2 concepts)                                             | Deterministic MD          | **P1**   |
| `docs/engineering-invariants.md`                       | Cross-repo engineering norms       | None         | Agent workflow philosophy                       | Canonical             | Yes     | **Include**                                                            | Deterministic MD          | P2       |
| `plugins/team-harness/docs/layers.md`, `versioning.md` | Hook layers, Cloud vs Husky        | None         | Developer infrastructure story                  | Canonical             | Yes     | **Include** bounded                                                    | Deterministic MD          | P1       |
| `plugins/team-harness/skills/**/SKILL.md`              | Planning, bootstrap, cloud-hooks   | None         | Operational detail; overlaps portfolio articles | Canonical for product | Yes     | **Selective** — top-level skill summaries only, not full agent prompts | Deterministic MD sections | P2       |
| `plugins/team-harness/scripts/*`, templates            | Implementation                     | None         | Low visitor value; high churn                   | Derived               | Yes     | **Exclude**                                                            | —                         | Low      |
| `.cursor/plans/**` (if any)                            | Execution plans                    | None         | Internal                                        | Internal              | Mixed   | **Exclude**                                                            | —                         | —        |

Portfolio mentions marketplace on homepage/ecosystem; **no OKF concepts** today → weak answers on “Cursor Team Marketplace” or harness design.

### `multipliers-dev/codenames-ai-guesser` (public — local verified)

| Path / surface                                               | Knowledge               | OKF coverage               | Gap                           | Canonical?            | Public? | Recommendation                             | Method                                           | Priority |
| ------------------------------------------------------------ | ----------------------- | -------------------------- | ----------------------------- | --------------------- | ------- | ------------------------------------------ | ------------------------------------------------ | -------- |
| Portfolio `project-cases` Codenames blocks                   | Product narrative       | `portfolio/codenames-ai-*` | Good for story                | Site canonical        | Yes     | **Keep**                                   | Existing                                         | —        |
| DEV articles (via portfolio fixtures)                        | Field reports           | `writing/*`                | Good                          | Hub canonical         | Yes     | **Keep**                                   | Existing                                         | —        |
| `docs/ai-pipeline-outcome.md`, `judge-ai-validation-flow.md` | AI pipeline, validation | None                       | Architecture depth            | Canonical engineering | Yes     | **Include** bounded (2–4 concepts)         | Deterministic MD sectioning (like repo-producer) | P2       |
| `docs/analytics-workflow.md`                                 | PostHog review          | Partial via articles       | Ops detail                    | Canonical             | Yes     | **Optional**                               | Deterministic                                    | P3       |
| `design/*`, `frontend/docs/styling.md`                       | UI authority            | None                       | Visitor-low                   | Reference             | Yes     | **Exclude** unless design questions matter | —                                                | Low      |
| `server/`, `.cursor/plans/`, `.agents/`                      | Code + agents           | None                       | Internal / duplicate articles | Mixed                 | Mixed   | **Exclude** wholesale                      | —                                                | —        |

### `multipliers-dev/savepoints` (public — local verified)

| Path / surface                                 | Knowledge                   | OKF coverage | Gap                              | Canonical?       | Public?                           | Recommendation                                       | Method                                | Priority |
| ---------------------------------------------- | --------------------------- | ------------ | -------------------------------- | ---------------- | --------------------------------- | ---------------------------------------------------- | ------------------------------------- | -------- |
| Portfolio / articles                           | Product mentions            | Thin         | Eval `agent-memory-corpus-gap`   | Secondary        | Yes                               | Need primary source                                  | —                                     | —        |
| `notes/architecture-direction.md`              | Memory/capture architecture | **None**     | **Gap** for Savepoints questions | Canonical intent | Public repo but product in motion | **Include** after editorial review (excerpt or full) | Deterministic MD; no `.cursor/plans/` | **P1**   |
| `notes/savepoints-6-pager.md`, prior-art notes | Thesis, positioning         | None         | Narrative depth                  | Canonical        | Public                            | **Include** selectively                              | Deterministic                         | P2       |
| `.cursor/plans/`, `src/`, hooks                | Implementation              | None         | Internal                         | Internal         | Public code                       | **Exclude** agent/plan paths                         | —                                     | —        |

### `multipliers-dev/renovate-workflow` (public — local verified)

| Path / surface                    | Knowledge        | OKF coverage                                 | Gap                              | Canonical?     | Public? | Recommendation                       | Method                                   | Priority |
| --------------------------------- | ---------------- | -------------------------------------------- | -------------------------------- | -------------- | ------- | ------------------------------------ | ---------------------------------------- | -------- |
| `docs/renovate-workflow.md`       | Operator runbook | **Partial** — 5 section concepts via fixture | Remaining sections not extracted | Canonical      | Yes     | **Optional** expand fixture sections | Deterministic extract (existing pattern) | P3       |
| Portfolio Renovate case + article | Governance story | Strong                                       | —                                | Site + writing | Yes     | **Keep**                             | Existing                                 | —        |
| `skills/`, `.agents/`             | Agent ladder     | None                                         | Overlap case study               | Internal ops   | Public  | **Exclude** default                  | —                                        | Low      |

### `multipliers-dev/editorial-workflow` (public — local verified)

| Path / surface                            | Knowledge             | OKF coverage                | Gap                                   | Canonical?    | Public? | Recommendation                                       | Method             | Priority |
| ----------------------------------------- | --------------------- | --------------------------- | ------------------------------------- | ------------- | ------- | ---------------------------------------------------- | ------------------ | -------- |
| `docs/dev.to/published/*.md`              | Article bodies        | **Via portfolio fixtures**  | 3 hub-only posts not in `articles.ts` | Hub canonical | Yes     | **No duplicate** unless added to portfolio inventory | Sync fixtures only | Low      |
| `docs/editorial-workflow.md`, `layers.md` | Pipeline architecture | Partial via supporting case | Hub operator detail                   | Canonical     | Yes     | **Optional** 1–2 concepts                            | Deterministic MD   | P3       |
| Hub drafts, `.env`, skills                | Ops                   | None                        | Private                               | Internal      | Mixed   | **Exclude**                                          | —                  | —        |

### `mastermichaelt/mastermichaelt` (local verified)

| Path        | Knowledge            | OKF coverage | Gap                     | Recommendation                        |
| ----------- | -------------------- | ------------ | ----------------------- | ------------------------------------- |
| `README.md` | GitHub profile links | None         | Duplicates public links | **Exclude** (no incremental evidence) |

### Other workspace repos

No additional Michael-owned engineering repos were present under `/Users/michaeltruong/code/` beyond the list above. **Unverified:** other GitHub org repos not checked out locally.

---

## Duplicate and canonicality rules

| Topic                            | Canonical for assistant                                             | Secondary (link, do not re-embed verbatim) |
| -------------------------------- | ------------------------------------------------------------------- | ------------------------------------------ |
| Career metrics / Atlassian depth | `resumes/facts/*` (after allowlist)                                 | `about/*`, LinkedIn                        |
| Codenames product story          | `portfolio/codenames-ai-*` + selected `docs/*`                      | DEV articles                               |
| Renovate governance              | `portfolio/renovate-*` + `repo/renovate-*`                          | renovate-workflow skills                   |
| DEV field reports                | `writing/*-article`                                                 | `portfolio/*-catalog` summaries            |
| Marketplace / harness            | `cursor-team-marketplace` docs (new `tooling/` or `repo/` concepts) | Portfolio ecosystem mentions               |
| Savepoints                       | `savepoints/notes/*` (approved)                                     | Portfolio mentions only                    |

Prefer **one OKF concept per canonical fact bundle**; use `sources:` chains for attribution, not duplicate bodies.

---

## Extraction strategy recommendation

| Approach                       | Fit                                                                                                  | Verdict                                                                                  |
| ------------------------------ | ---------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| **A. Deterministic producers** | `resumes` YAML; public Markdown with stable headings; existing repo-producer pattern                 | **Default for all v1 cross-repo work**                                                   |
| **B. LLM-assisted extraction** | Heterogeneous PDFs, slack exports, unschema’d notes                                                  | **Defer** — no such sources in priority tier; high publication risk                      |
| **C. Hybrid**                  | Deterministic discovery + allowlist; LLM only with human-reviewed intermediate JSON committed to git | **Only if** a later source fails deterministic parsing **and** passes publication review |

Embeddings remain the **separate** semantic index stage (`assistant:ingest`). Do not conflate embedding with knowledge extraction or with **content publication approval** — ingest runs only on OKF derived from approved public snapshots.

**LLM-generated intermediate artifacts:** if ever used, store under `generated/` or gitignored scratch only; **do not ingest** until reviewed and promoted to pinned fixtures or YAML snapshots in portfolio.

---

## Publication and security boundaries (default deny)

### Career inventory — two controls (`resumes`)

| Control                    | Purpose                                                            | Default                                                                                                                                                                        |
| -------------------------- | ------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **1. Source eligibility**  | Which private files may be considered when preparing corpus inputs | **Deny** — explicit per-path allowlist only (`facts/<id>.yml`, `roles/<id>.yml` listed individually when tied to allowlisted facts — not `roles/*.yml` bulk, approved `meta/`) |
| **2. Content publication** | What text may appear in the portfolio retrieval corpus             | **Deny** — only human-reviewed, public-safe facts or excerpts in **committed snapshots**                                                                                       |

Eligibility for a source file does **not** authorize copying its full contents. Producers in CI read **pinned public snapshots**, not live private checkouts.

**Always exclude from published snapshot text (non-exhaustive):**

- Private contact information (phone, personal email, addresses)
- Interview preparation (`prep.yml`, `stories/`, application research, lifecycle notes)
- Recruiter feedback, compensation, performance-management detail
- Confidential employer or business information
- Unverified claims or prose that strengthens beyond reviewed evidence

**Change control:** new inventory files and new content inside previously eligible files do **not** become public until eligibility, publication manifest, and snapshots are updated in a reviewed portfolio PR. Coverage tests **fail closed** when manifests and snapshot hashes diverge.

**Provenance:** retain stable inventory ids for operator alignment; **visitor-facing** OKF bodies and `resource` URLs must not expose private repository paths or internal job-search metadata.

### Cross-repo defaults

Exclude unless explicitly eligible and publication-reviewed:

- Secrets, credentials, `.env*`, tokens, connection strings
- `resumes/applications/**`, generated `out/`, `exemplars/`
- `.cursor/plans/`, `.agents/`, agent skills as operational runbooks (marketplace: public skills still **curated**, not bulk)
- Unverified or inferred claims (assistant must not strengthen beyond published source text)

**Visitor citations:** `resource` URLs should be **public** (site, DEV, public GitHub paths). Do not expose private repo URLs in OKF `resource` fields; use portfolio or public doc URLs as citation surface where needed.

---

## Visitor questions → sources (evaluation matrix)

| Question theme                           | Answerable today (PR #45 corpus)?                | Missing source                                                                             |
| ---------------------------------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------ |
| Atlassian experimentation infrastructure | Partial (`experiment-measurement` case, `about`) | `facts/admin-hub-experimentation`, `cross-flow-experiment-measurement`, `loom-acquisition` |
| Engineering leadership depth             | Partial (`about/atlassian-em-2020`)              | `facts/em-*`, `em-growth-delivery`, role scope                                             |
| Attribution / measurement                | Partial (one case block)                         | Cross-flow fact metrics                                                                    |
| Return to IC                             | Partial (`about/summary`)                        | Career narrative facts (optional)                                                          |
| AI products built                        | Good (Codenames case + writing)                  | —                                                                                          |
| Developer infrastructure / Renovate      | Good (case + repo fixture)                       | —                                                                                          |
| Cursor Team Marketplace / agent harness  | **Weak** (ecosystem mention only)                | marketplace README + layers.md                                                             |
| Savepoints / agent memory                | **Gap** (eval `corpus_gap`)                      | `savepoints/notes/architecture-direction.md` (+ fact bundle)                               |
| Editorial pipeline                       | Good (supporting case + articles)                | Optional hub `editorial-workflow.md`                                                       |
| Nuclear reactors (negative)              | N/A                                              | negative_inspection only                                                                   |

---

## Decisions (PR #46 review — locked)

| #   | Decision           | Resolution                                                                                                                                                                                                                                                                                                                                                                |
| --- | ------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | Career publication | **Two controls:** (1) **source eligibility** — explicit per-file allowlist, default deny (not all 38 facts / 21 roles); (2) **content publication** — only reviewed public-safe excerpts in pinned snapshots (not wholesale private files). **`career/`** + **`source_class: career`**. Fail closed on manifest/snapshot mismatch; ingest success ≠ publication approval. |
| 2   | Savepoints         | **Reviewed architecture excerpt first.** Promote to the full `notes/architecture-direction.md` only after a publication-suitability review.                                                                                                                                                                                                                               |
| 3   | Marketplace        | **Public README and engineering docs first** (`README.md`, `docs/engineering-invariants.md`, `plugins/team-harness/docs/layers.md`, optionally `versioning.md`). **Defer SKILL summaries** unless retrieval eval shows a gap.                                                                                                                                             |
| 4   | OKF `source_class` | Introduce **`source_class: career`** and **`career/`** namespace. Career evidence is a distinct retrieval category from About presentation (`about/`).                                                                                                                                                                                                                    |
| 5   | Merge order        | **PR #45 + operator ingest/eval complete** (2026-10-08). Next implementation slice: `career-inventory-producer` in [assistant-cross-repository-corpus.plan.md](../../.cursor/plans/assistant-cross-repository-corpus.plan.md).                                                                                                                                            |

**Still open (operational):** snapshot cadence — manual hub/resumes → portfolio fixture sync with manifest hashes; no live fetch in CI until a dedicated automation slice.

---

## Related plans

- [assistant-cross-repository-corpus.plan.md](../../.cursor/plans/assistant-cross-repository-corpus.plan.md) — **active** execution plan for this inventory
- [2026-10-08-assistant-corpus-coverage-expansion.plan.md](../../.cursor/plans/archive/2026-10-08-assistant-corpus-coverage-expansion.plan.md) — shipped PR #45 / #47 closure
- [assistant-career-inventory-corpus-superseded.plan.md](../../.cursor/plans/archive/assistant-career-inventory-corpus-superseded.plan.md) — superseded; career slice retained in cross-repository plan
