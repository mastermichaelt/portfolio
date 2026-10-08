---
title: Career inventory corpus direction
subtitle: Resumes repo as curated OKF source — before grounded answer generation
status: draft
version: 0.1.0
updated: 2026-10-08
related:
  - docs/assistant/architecture-direction.md
  - docs/assistant/rag-generation-direction.md
  - .cursor/plans/archive/2026-10-08-assistant-cross-repository-corpus.plan.md
  - .cursor/plans/archive/assistant-career-inventory-corpus-superseded.plan.md
---

# Career inventory corpus direction

The portfolio assistant indexes `content/about.ts` as public career narrative. That is **not** equivalent to indexing the **career inventory** in the private [`mastermichaelt/resumes`](https://github.com/mastermichaelt/resumes) repository. This note identifies canonical inventory layers, defines a **publication boundary**, and sketches an OKF producer — implementation shipped as slice `career-inventory-producer` ([#48](https://github.com/mastermichaelt/portfolio/pull/48)) in the [archived cross-repository corpus plan](../../.cursor/plans/archive/2026-10-08-assistant-cross-repository-corpus.plan.md) (supersedes the archived [career-only plan](../../.cursor/plans/archive/assistant-career-inventory-corpus-superseded.plan.md)).

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

The resumes repository is **private** and mixes **public-evidence inventory** with **job-search operations**. The assistant corpus must not ingest the whole repo. Use **two separate controls** (both default deny):

| Control                 | Question                               | Portfolio artifact (planned)                                                                                                                  |
| ----------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| **Source eligibility**  | Which private files may be considered? | Committed source-eligibility manifest (explicit `facts/`, matching `roles/`, approved `meta/` paths only)                                     |
| **Content publication** | What may visitors retrieve?            | Reviewed **public snapshots** + publication manifest (hashes, approved fact/field ids) under `tests/fixtures/assistant-okf/career-inventory/` |

Allowlisting a source file does **not** authorize publishing its entire YAML. Producers emit OKF from **deterministic, reviewed snapshots** — not wholesale copies of approved private files. **`assistant:ingest` success does not imply publication approval**; publication is complete only when eligibility, manifest, and snapshots align in a merged portfolio PR.

**Never eligible (non-negotiable):**

- `applications/**` — `brief.yml`, `include.yml`, `research.md`, `lifecycle.yml`, `prep.yml`, communications
- `applications/**/out/**` — generated résumé/PDF prose (variants, not canonical evidence)
- `stories/**` — interview hard-lesson layer (explicitly not résumé claims)
- `exemplars/**` — editorial quality reference, not career evidence
- Agent/planning paths under either repo

**Source eligibility (default deny):**

- Allowlisted `facts/<id>.yml` only (not all 38 fact files)
- `roles/<id>.yml` only for roles referenced by allowlisted facts (not all 21 roles)
- Selected `meta/` paths only when explicitly listed

**Content publication (default deny):**

- Only public-safe fields/excerpts promoted into snapshots after human review
- Exclude private contact information, interview prep, recruiter feedback, performance-management detail, confidential business information, and unverified or strengthened claims
- New files and new content in previously eligible sources require a fresh publication review — no automatic promotion
- **Fail closed** if eligibility, publication manifest, or snapshot freshness cannot be verified

**Structural vs content review:** `assertCareerInventoryPublicationIntegrity()` (see `career-inventory-manifest.mjs`) verifies hashes, allowlists, path safety, and `approved_entry_ids` alignment between manifest and snapshot frontmatter. It does **not** validate snapshot **bodies** against inventory claims — operators must content-review each `snapshots/*.md` file before merge ([fixture README](../../tests/fixtures/assistant-okf/career-inventory/README.md)).

**Provenance:** OKF may carry stable inventory fact ids for operator/debug use; visitor-facing bodies and `resource` URLs must not expose private repo paths or internal metadata.

Near-identical résumé variants must **not** create parallel OKF concepts — one published line per reviewed inventory excerpt, not per application slug.

## OKF producer design (sketch)

**Namespace:** `career/` (new OKF prefix; requires `source_class` extension in retrieval derivation — e.g. `career` alongside `about` / `portfolio`).

**Granularity (recommended):**

- One OKF concept per **published** fact excerpt — title and body from reviewed snapshot content (preserve inventory ids for provenance; no claim strengthening).
- Optional compact `career/role-<id>` concepts from published role excerpts for date-range questions.
- Do **not** emit one concept per generated résumé or per application.

**Cross-repo input strategy (CI-safe):**

| Mode                                  | Use                                                                                                                                                                                          |
| ------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Pinned snapshot** (required for CI) | Commit **reviewed public excerpts** (not full private YAML) into `tests/fixtures/assistant-okf/career-inventory/` with publication manifest hashes — same discipline as DEV `published/*.md` |
| **Sibling checkout**                  | `RESUMES_REPO_ROOT` for local `okf:build` when `../resumes` exists — optional ergonomics only                                                                                                |

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
