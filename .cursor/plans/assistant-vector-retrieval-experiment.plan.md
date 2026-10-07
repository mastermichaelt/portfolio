---
name: Assistant vector retrieval experiment
overview: Multi-slice experiment to add retrieval-unit derivation, OpenAI embeddings, Postgres+pgvector persistence, idempotent ingestion/sync, and an inspectable retrieval CLI over a bounded expanded OKF corpus—without answer generation, chat UI, or RAG frameworks.
todos:
  - id: plan-review
    content: "Plan-only PR — commit plan artifact; open PR for review; do not implement"
    status: completed
  - id: doc-reconcile
    content: "PR 1: Reconcile architecture docs for Postgres+pgvector retrieval experiment (supersede in-memory-first; update current-state sections)"
    status: completed
  - id: corpus-expansion
    content: "PR 2: Expand OKF producers for About + experiment-measurement + codenames-ai (bounded, merge-safe)"
    status: completed
  - id: retrieval-units
    content: "PR 3: Retrieval-unit derivation from OKF concepts (stable IDs, content hashes, CLI inspect)"
    status: pending
  - id: db-foundation
    content: "PR 4: Postgres+pgvector schema, migrations, docker-compose, DATABASE_URL wiring"
    status: pending
  - id: embeddings-adapter
    content: "PR 5: Thin OpenAI embeddings adapter (batching, retries, fixed index config validation)"
    status: pending
  - id: ingest-sync
    content: "PR 6: Idempotent ingest pipeline (upsert/skip/delete stale, ingestion run metadata)"
    status: pending
  - id: retrieve-cli
    content: "PR 7: Inspectable retrieval CLI with documented cosine distance semantics"
    status: pending
  - id: retrieval-eval
    content: "PR 8: Representative eval cases with top-K assertions (skip without secrets)"
    status: pending
  - id: plan-closure
    content: "Docs-only PR: vector-retrieval-experiment findings + archive plan"
    status: pending
isProject: false
---

# Portfolio assistant vector retrieval experiment

## Recommended execution authority

| Slice              | Recommended authority | Agent instruction                                      |
| ------------------ | --------------------- | ------------------------------------------------------ |
| plan-review        | Plan-only PR          | Do not implement. Stop after opening the plan-only PR. |
| doc-reconcile      | Open PR only          | Do not merge. Stop after opening the PR.               |
| corpus-expansion   | Open PR only          | Do not merge. Stop after opening the PR.               |
| retrieval-units    | Open PR only          | Do not merge. Stop after opening the PR.               |
| db-foundation      | Open PR only          | Do not merge. Stop after opening the PR.               |
| embeddings-adapter | Open PR only          | Do not merge. Stop after opening the PR.               |
| ingest-sync        | Open PR only          | Do not merge. Stop after opening the PR.               |
| retrieve-cli       | Open PR only          | Do not merge. Stop after opening the PR.               |
| retrieval-eval     | Open PR only          | Do not merge. Stop after opening the PR.               |
| plan-closure       | Open PR only          | Do not merge. Stop after opening the PR.               |

Repo default: **Open PR only** ([planning-standards.md](.cursor/standards/planning-standards.md)).

## Repository topology (default)

Integration branch: `main`. Each slice starts from latest `origin/main`; branch diff represents only that slice; PR base is `main`.

---

## Architecture documentation reconciliation

### Documents inspected

| Document                   | Path                                                                                             | Role                                           |
| -------------------------- | ------------------------------------------------------------------------------------------------ | ---------------------------------------------- |
| Architecture direction     | [docs/assistant/architecture-direction.md](docs/assistant/architecture-direction.md)             | Primary intended-system doc                    |
| OKF experiment findings    | [docs/assistant/okf-normalization-experiment.md](docs/assistant/okf-normalization-experiment.md) | Shipped normalization evidence                 |
| Prior art                  | [docs/assistant/prior-art.md](docs/assistant/prior-art.md)                                       | Historical reference (nyaomaru); not normative |
| Site architecture overview | [docs/architecture/overview.md](docs/architecture/overview.md)                                   | Milestone 5 / Postgres note                    |
| Product constraints        | [PRODUCT.md](PRODUCT.md)                                                                         | Static MVP, no chatbot yet                     |

### Alignment assessment

**Already aligned with this experiment**

- Five-layer separation: canonical sources → OKF → storage → embeddings/index → RAG consumers
- OKF is a **normalization/interchange boundary**, not canonical storage or the vector index
- OKF concepts ≠ retrieval units; embeddings are **disposable projections** rebuildable from sources
- Corpus-only semantic retrieval before generation; inspectable pipeline; provenance-backed citations (future)
- Shipped OKF producers under [scripts/assistant/okf/](scripts/assistant/okf/); `npm run okf:build` → gitignored [generated/okf/](generated/okf/)
- No `app/api/` routes, no LangChain, no chat UI in current milestone

**Conflicts / stale assumptions to reconcile**

| Location                                                                                                       | Stale content                                                            | Required update                                                                                                                                                               |
| -------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [architecture-direction.md](docs/assistant/architecture-direction.md) § "Simple semantic RAG first" (line 232) | **In-memory vector store first**; pgvector deferred                      | Supersede for this experiment: **Postgres + pgvector is the retrieval backbone**; in-memory is no longer the target for this slice family                                     |
| [architecture-direction.md](docs/assistant/architecture-direction.md) (lines 248–254)                          | "Next experiment" still reads as OKF normalization                       | Mark OKF normalization **shipped**; next experiment is **vector retrieval**                                                                                                   |
| [architecture-direction.md](docs/assistant/architecture-direction.md) (line 234)                               | LangChain as reasonable learning path                                    | Record **explicit non-use** for this experiment (per prompt); keep as historical hypothesis only if mentioned                                                                 |
| [architecture-direction.md](docs/assistant/architecture-direction.md) "Current implementation"                 | Omits shipped OKF normalization                                          | Add OKF producers as current assistant infrastructure (dev tooling only)                                                                                                      |
| [docs/architecture/overview.md](docs/architecture/overview.md) (line 14)                                       | "no assistant implementation yet"                                        | Split: OKF normalization shipped; retrieval/embeddings/chat still future                                                                                                      |
| Neon references in overview / AGENTS.md                                                                        | Conflate site `PortfolioRepository` Postgres with assistant vector store | Clarify **two Postgres concerns**: (a) future site content persistence, (b) assistant embedding index (this experiment) — may share Neon provider, different schema/lifecycle |
| [okf-normalization-experiment.md](docs/assistant/okf-normalization-experiment.md)                              | Ends at "retrieval-unit derivation [future]"                             | Add pointer to this experiment; preserve OKF-as-transient finding                                                                                                             |

**Documentation slice:** `doc-reconcile` (slice 1) updates the above **before** implementation slices that depend on pgvector as the chosen store. Do not erase OKF experiment history; add a new experiment findings doc at closure.

---

## Decision inventory

### Established by existing architecture (keep)

- OKF v0.2 as normalization format; minimal extensions only
- Canonical knowledge remains at originating sources (`content/`, repos, published writing)
- `PortfolioRepository` / pages do not depend on retrieval infrastructure
- Assistant scripts live outside the Next.js app bundle (CLI/dev tooling pattern like `okf:build`)
- Just-in-time multi-PR plan under `.cursor/plans/` using [_template.plan.md](.cursor/plans/_template.plan.md)
- Vitest for unit/integration tests; coverage gate applies only to `repositories/**` today

### Established by this plan (non-negotiable)

- Real **Postgres + pgvector** (not in-memory similarity)
- Direct primitives only — **no LangChain, LlamaIndex, Pinecone, etc.**
- Thin **OpenAI embeddings** adapter; model validated against fixed index schema (not arbitrarily interchangeable dimensions)
- **Inspectable retrieval CLI**; no answer generation / chat UI / Responses API
- Idempotent ingestion with change detection; vector DB is **not** source of truth
- **Exact search only** — no ANN index in this experiment

### Still to decide during implementation (flagged, not silently chosen)

| Decision                                                               | Recommendation                                                                                                                        | Resolve in slice                       |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------- |
| Local Postgres vs Neon-only dev                                        | Commit a small `docker-compose.yml` for local pgvector + optional Neon for shared env                                                 | `db-foundation`                        |
| `pg` vs `postgres.js` driver                                           | `pg` (mature, straightforward migrations)                                                                                             | `db-foundation`                        |
| Embedding representation                                               | **`text-embedding-3-small` @ 1536 dimensions** — fixed in schema; model change = migration + full re-embed                            | `db-foundation` + `embeddings-adapter` |
| Distance metric                                                        | Cosine via pgvector `<=>` operator                                                                                                    | `retrieve-cli` + docs                  |
| CI without `DATABASE_URL`                                              | Skip pgvector integration tests when unset; unit tests always run                                                                     | `db-foundation`                        |
| 1:1 OKF→unit vs sub-splitting                                          | **Start 1:1** for all concepts; document split rules for dense concepts only if eval shows misses                                     | `retrieval-units`                      |
| Expanded OKF granularity for About/experiment-measurement/codenames-ai | Per-source producers with shape-correct body helpers (`CaseBlock.heading`, About entry bullets); shared infra only where fields match | `corpus-expansion`                     |

---

## Current baseline (from inspection)

```mermaid
flowchart TD
  subgraph canonical [Canonical sources]
    content["content/*.ts"]
    fixtures["tests/fixtures/assistant-okf/"]
  end
  subgraph shipped [Shipped today]
    producers["scripts/assistant/okf/*-producer.mjs"]
    build["npm run okf:build"]
    okf["generated/okf/ ephemeral"]
    manifest["manifest.json hashes"]
  end
  subgraph notBuilt [Not built]
    units[Retrieval units]
    embed[Embeddings]
    pg[(Postgres pgvector)]
    retrieve[Retrieve CLI]
  end
  content --> producers
  fixtures --> producers
  producers --> build --> okf --> manifest
  okf -.-> units --> embed --> pg --> retrieve
```

**Shipped OKF corpus today:** 15 concepts (Renovate portfolio case + repo runbook fixture + DEV article fixture).

**Corpus expansion prerequisite:** add bounded producers for **About**, **`experiment-measurement` project case**, and **`codenames-ai` project case** so evaluation can exercise heterogeneous shapes without full-site ingestion.

---

## Target architecture (this experiment)

```text
Canonical portfolio sources (content/ + fixtures)
        ↓
Existing + expanded OKF producers (okf:build)
        ↓
Retrieval-unit derivation
        ↓
OpenAI embeddings (thin adapter)
        ↓
Postgres + pgvector (derived index only)
        ↓
Vector similarity search (cosine distance, exact search)
        ↓
Inspectable top-K evidence + provenance (CLI)
```

**Canonical vs derived**

| Artifact                     | Canonical?     | Location                    |
| ---------------------------- | -------------- | --------------------------- |
| `content/`, repo/DEV sources | Yes            | Git                         |
| OKF concepts                 | No (transient) | `generated/okf/` gitignored |
| Retrieval units (in-memory)  | No             | Derived at ingest           |
| Embeddings / vector rows     | No             | Postgres (rebuildable)      |

---

## Retrieval unit design

### Derivation input

Read OKF concept files from `generated/okf/{portfolio,repo,writing,about}/**/*.md` (parse YAML frontmatter + body using existing [yaml.mjs](scripts/assistant/okf/yaml.mjs)).

### Initial strategy: one retrieval unit per OKF concept

Rationale from [okf-normalization-experiment.md](docs/assistant/okf-normalization-experiment.md): concepts already follow source semantics (case blocks, runbook sections, article body). Fixed-token chunking is unnecessary for the current corpus size.

**Future split rule (document only unless eval proves need):** if a single concept body exceeds ~N tokens or eval shows partial hits, derive multiple units with stable suffix IDs (`{okf_id}#part-02`).

### Retrieval unit schema (in-memory / pre-persist)

```ts
// Conceptual — implement as plain objects in scripts/assistant/
{
  unit_id: string;           // stable, deterministic
  okf_concept_id: string;    // e.g. "portfolio/renovate-governance-b04"
  okf_version: string;
  source_class: "portfolio" | "repo" | "writing" | "about";
  type: string;              // from OKF frontmatter
  title: string;
  resource: string;          // canonical URL
  sources: Array<{id, title, resource}>;
  tags: string[];
  text: string;              // embedding input
  content_hash: string;      // sha256 of canonical text
  metadata: Record<string, unknown>; // filterable facets
}
```

### Stable `unit_id`

Deterministic: `unit/{okf_concept_id}` (URL-safe; no hash in ID so renames are explicit). Content changes detected via `content_hash`, not ID churn.

### Embedding text composition

Prefer evidence-bearing text, not raw frontmatter duplication:

```text
{title}

{body_markdown}
```

Store `type`, `tags`, `resource`, `sources` relationally / JSON for filtering — not repeated in embedding text unless eval shows benefit.

### Corpus expansion producer sketch (slice `corpus-expansion`)

| Source module                                                                 | Producer module                                                        | Proposed OKF concepts (bounded)                                                     |
| ----------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ----------------------------------------------------------------------------------- |
| [content/about.ts](content/about.ts)                                          | `about-producer.mjs`                                                   | `about/summary` + one concept per experience/independent entry (`about/{entry.id}`) |
| [content/project-cases.ts](content/project-cases.ts) `experiment-measurement` | `project-case-producer.mjs`                                            | `portfolio/experiment-measurement-case` + one concept per `CaseBlock`               |
| [content/project-cases.ts](content/project-cases.ts) `codenames-ai`           | `project-case-producer.mjs`                                            | `portfolio/codenames-ai-case` + one concept per `CaseBlock`                         |
| Existing Renovate corpus                                                      | [portfolio-producer.mjs](scripts/assistant/okf/portfolio-producer.mjs) | Unchanged                                                                           |

**Do not mechanically reuse [portfolio-producer.mjs](scripts/assistant/okf/portfolio-producer.mjs) block logic for project cases.** That producer targets `SupportingCase` blocks (`SupportingProseBlock` / `SupportingArchitectureBlock` with `type`, `lead`, and architecture-specific fields). [content/project-cases.ts](content/project-cases.ts) uses `ProjectCase` + `CaseBlock` — a different shape.

#### Project-case producer (`project-case-producer.mjs`)

Read `ProjectCase` values from `content/project-cases.ts` for slugs `experiment-measurement` and `codenames-ai`.

**OKF IDs** (reuse only the _naming_ pattern from portfolio-producer, not its block-type branching):

- Overview: `portfolio/{slug}-case`
- Block: `portfolio/{slug}-{block.id}-{block.category.toLowerCase()}` (e.g. `portfolio/experiment-measurement-b01-attribution`)

**Case overview body** — reuse the _overview composition_ idea (lead, aside, elsewhere) where `ProjectCase` fields match `SupportingCase` (`lead`, `aside`, `elsewhere`). Do **not** copy architecture-block handling; project cases have no `architecture` blocks. Include `artifacts` as a prose summary only if needed for inspectability; do not embed artifact row `id` values as canonical evidence.

**CaseBlock → OKF body** — implement a dedicated `caseBlockBody(block)` helper. Each `CaseBlock` is a single homogeneous block (no `type` discriminator). Preserve evidence-bearing fields in this order:

```text
{block.heading}          ← primary uncertainty sentence (required; must appear in body)

{block.body joined}      ← narrative paragraphs

Contract: {block.contract}

{optional CaseNote from block.note — label, lines, closing}

{optional figure lines — value, name, scope only; omit CaseFigure.source}
```

Do **not** call `proseBody()` from portfolio-producer (expects `lead`, not `heading`). Do **not** branch on `block.type === "prose"` / `"architecture"`.

**Frontmatter:** `type: "Project Case Block"` (or similar free-form OKF type); `resource: {SITE_URL}/projects/{slug}#{block.id}`; `sources` pointing at the project case route.

#### About producer (`about-producer.mjs`)

Read [content/about.ts](content/about.ts) — a career-record page, not a block-structured case study.

**OKF IDs:**

- `about/summary` — both `summary[]` paragraphs
- `about/{entry.id}` for each `experience.entries[]` and `independent.entries[]` entry (e.g. `about/atlassian-em-2020`, `about/codenames-ai`)

**About entry body** — dedicated `aboutEntryBody(entry)`:

```text
{role} · {org} ({dateRange})

{bullets joined}

{optional figure lines — value, name, scope only; omit source inventory}
```

Do not invent block ids or split a single entry into multiple concepts unless eval later proves retrieval misses.

**Frontmatter:** `type: "About Experience"` or `"About Independent Work"`; `resource: {SITE_URL}/about` (section-level provenance; entry identity carried in concept id + title).

#### Generated corpus hygiene (required in this slice)

[writer.mjs](scripts/assistant/okf/writer.mjs) `cleanGeneratedConcepts` currently removes only `portfolio/`, `repo/`, `writing/`. **This slice must extend cleanup to every generated namespace**, including `about/`, so removed or renamed concepts cannot leave stale `.md` files.

Also update in the same slice:

- [manifest.mjs](scripts/assistant/okf/manifest.mjs) `listConceptFiles` — include `about/`
- [build.mjs](scripts/assistant/okf/build.mjs) `renderIndex` — add an About concepts section; wire new producers into `buildOkfCorpus`
- [constants.mjs](scripts/assistant/okf/constants.mjs) — document new content-module inputs in manifest metadata if applicable

Exclude from all producers: `CaseFigure.source` / inventory fact ids, ecosystem graph, timeline, production-line (unless eval gap remains after expansion).

#### Corpus-expansion tests ([tests/okf-normalization.test.ts](tests/okf-normalization.test.ts))

Extend existing OKF tests with **specific** coverage for the failure modes above:

1. **CaseBlock evidence preservation** — for at least one `experiment-measurement` block concept, assert the rendered body contains that block's `heading` verbatim and at least one `body[]` paragraph; assert `contract` text is present when the source block has one.
2. **No orphaned About files** — build to a temp corpus with a stub/about concept, rebuild with that concept removed from the producer output, assert `about/` contains no leftover `.md` for the removed id.
3. **Deterministic rebuild across namespaces** — temp-dir build with fixed `generatedAt` still produces matching `bundle_sha256` after corpus expansion; `listConceptFiles` enumerates `portfolio/`, `repo/`, `writing/`, and `about/`.
4. **Producer boundaries** — minimum concept counts per namespace prefix (`about/`, `portfolio/experiment-measurement-*`, `portfolio/codenames-ai-*`, existing renovate/repo/writing counts unchanged).
5. **Render conformance** — every new concept has non-empty `type`, `sources`, `resource`, `generated`.

---

## Embedding boundary

New module: `scripts/assistant/embeddings/`

### Fixed index representation (explicit constraint)

This experiment indexes **`text-embedding-3-small` at 1536 dimensions**. That pairing is not an arbitrary runtime choice — it is the **configured embedding representation** baked into the pgvector column type (`vector(1536)`).

Changing embedding model or dimensionality is an **index/schema migration**: alter or recreate the vector column, rebuild the derived store from canonical sources, and re-embed everything. Do not imply that env vars can swap models/dimensions interchangeably while the schema stays `vector(1536)`.

| Concern       | Approach                                                                                                                                                                                            |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Provider      | OpenAI Embeddings API via `fetch` or minimal official SDK (add only if justified)                                                                                                                   |
| Config        | `OPENAI_API_KEY`; optional `ASSISTANT_EMBEDDING_MODEL` **validated at startup** against the supported index config (default and only supported value for this experiment: `text-embedding-3-small`) |
| Dimensions    | **1536 — constant**, matching `vector(1536)` in migration; not a separate env knob                                                                                                                  |
| Batching      | Batch requests (e.g. 32–64 texts) with size guard                                                                                                                                                   |
| Retries       | Transient errors: limited exponential backoff                                                                                                                                                       |
| Invalidation  | Store `embedding_model` on each row; re-embed when `content_hash` changes or when index representation changes (migration)                                                                          |
| Skip re-embed | Ingest compares `(content_hash, embedding_model)` before calling API                                                                                                                                |
| Startup guard | Fail fast if configured model ≠ supported index model, or if API returns wrong dimension count                                                                                                      |

No answer generation, no chat completions.

Update [.env.example](.env.example) with documented assistant vars (keys gitignored). Document the model/dimension migration constraint in architecture docs during `doc-reconcile`.

---

## Postgres + pgvector schema

New: `db/migrations/` (timestamped SQL, pattern from savepoints repo — no ORM required).

### Extension + table (minimum)

```sql
CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE assistant_retrieval_units (
  unit_id            text PRIMARY KEY,
  okf_concept_id     text NOT NULL,
  okf_version        text NOT NULL,
  source_class       text NOT NULL,
  type               text NOT NULL,
  title              text NOT NULL,
  resource           text NOT NULL,
  retrieval_text     text NOT NULL,
  content_hash       text NOT NULL,
  embedding_model    text NOT NULL,
  embedding          vector(1536) NOT NULL,  -- fixed index representation: text-embedding-3-small
  sources            jsonb NOT NULL DEFAULT '[]',
  metadata           jsonb NOT NULL DEFAULT '{}',
  embedded_at        timestamptz NOT NULL,
  created_at         timestamptz NOT NULL DEFAULT now(),
  updated_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX assistant_retrieval_units_source_class_idx
  ON assistant_retrieval_units (source_class);
CREATE INDEX assistant_retrieval_units_okf_concept_id_idx
  ON assistant_retrieval_units (okf_concept_id);
```

### Relational vs JSON

| Field                                                                                   | Storage            | Why                                         |
| --------------------------------------------------------------------------------------- | ------------------ | ------------------------------------------- |
| `unit_id`, `okf_concept_id`, `source_class`, `type`, `title`, `resource`, hashes, model | Relational columns | Stable filters, upsert keys, inspectability |
| `sources`                                                                               | `jsonb`            | OKF array shape; provenance display         |
| `tags`, block ids, eval hints                                                           | `metadata jsonb`   | Extensible without migrations               |
| `embedding`                                                                             | `vector(n)`        | pgvector native ops                         |

Optional `assistant_ingestion_runs` table for observability (run id, okf bundle hash, counts inserted/updated/deleted/skipped, timestamps) — recommended for experiment learning.

### Vector index strategy

**Do not add an ANN index during this experiment.** Use **exact search** — sequential scan + `ORDER BY embedding <=> $query` — to establish the retrieval-quality baseline. At ~30–80 units after corpus expansion, exact search is expected to be fast enough; the learning goal is understanding what pgvector returns, not optimizing query latency yet.

Document in experiment findings (closure slice):

- **Storing vectors in pgvector** = typed `vector` column + distance operators
- **Exact search** = our baseline for this experiment; every query compares against all stored vectors
- **ANN index (HNSW / IVFFlat)** = a later **optimization** with a recall/performance trade-off — not a milestone tied to an arbitrary row-count threshold. Whether ANN pays off depends on dimensions, hardware, filtering, workload, recall requirements, and measured query latency — evaluate only after exact-search baseline and real workload data exist

Do **not** add HNSW or IVFFlat in any slice of this experiment. Closure doc should describe HNSW/IVFFlat as scaling options and state that the decision to experiment with ANN should be driven by **measured corpus size, query latency, and future workload requirements**.

### Connection / migrations

- `scripts/assistant/db/client.mjs` — `pg` Pool from `DATABASE_URL`
- `scripts/assistant/db/migrate.mjs` — apply `db/migrations/*.sql` in order
- `npm run assistant:db:migrate`
- Local: `docker-compose.yml` with `pgvector/pgvector:pg16` (committed, assistant-dev only)

**CI:** integration tests run when `DATABASE_URL` is set; otherwise skip with explicit message (keeps default CI green).

---

## Ingestion and synchronization

### Pipeline

```text
npm run okf:build
  → deriveRetrievalUnits(generated/okf/)
  → for each unit:
        if DB row missing OR content_hash/model mismatch:
            embed(text) → upsert
        else: skip (count as unchanged)
  → delete DB rows whose unit_id ∉ derived set
  → record ingestion run metadata
```

CLI: `npm run assistant:ingest` (wraps `node scripts/assistant/ingest.mjs`).

### Sync cases

| Case                                                 | Behavior                                                       |
| ---------------------------------------------------- | -------------------------------------------------------------- |
| New unit                                             | Insert + embed                                                 |
| Unchanged `(unit_id, content_hash, embedding_model)` | Skip API call                                                  |
| Changed content                                      | Re-embed + update row                                          |
| Removed OKF concept                                  | Delete row (hard delete; corpus is bounded)                    |
| Failed embedding                                     | Fail run with unit_id surfaced; do not partial-delete siblings |
| Safe rerun                                           | Idempotent upserts; deterministic derived set                  |

### Provenance chain

Log in ingestion output: `canonical source → okf_concept_id → unit_id → content_hash → embedding_model`.

Attach OKF `manifest.json` `bundle_sha256` to ingestion run record.

---

## Retrieval CLI

`npm run assistant:retrieve -- "question text"`

Flow:

1. Embed question (same model as corpus)
2. SQL:

```sql
SELECT
  unit_id,
  title,
  resource,
  retrieval_text,
  sources,
  metadata,
  (embedding <=> $1::vector) AS cosine_distance
FROM assistant_retrieval_units
ORDER BY embedding <=> $1::vector
LIMIT $2;
```

3. Print JSON or formatted table: `rank`, `cosine_distance`, `similarity = 1 - cosine_distance` (document that pgvector cosine distance is in `[0, 2]` for normalized vectors; OpenAI embeddings are unit-normalized so interpret accordingly)

**No LLM.** Purpose is to inspect what pgvector returns.

Optional flags: `--top-k 5`, `--filter-source-class portfolio`, `--json`.

---

## Retrieval evaluation

New: `tests/assistant-retrieval-eval.test.ts` + `tests/fixtures/assistant-retrieval/eval-cases.json`

### Eval fixture contract

Matchers operate on **`unit_id`** (the persisted primary key), not bare `okf_concept_id`. Per the retrieval-unit contract: `unit_id = unit/{okf_concept_id}`.

Fixture fields:

- `expected_any_of`: array of `unit_id` values or prefix globs (e.g. `unit/portfolio/experiment-measurement-b04-onboarding`, `unit/about/atlassian-em-*`)
- `min_rank` (optional): highest acceptable rank for any `expected_any_of` match (1-based)
- `kind`: `positive` | `negative_inspection` | `corpus_gap`

Implement prefix matching against `unit_id` only. Do not match against `okf_concept_id` without the `unit/` prefix.

### Refined eval cases (post corpus expansion)

| Question                                                              | `expected_any_of` (`unit_id` prefix or exact)                                                                                         | Exercises                                            |
| --------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| What experimentation infrastructure did Michael work on at Atlassian? | `unit/portfolio/experiment-measurement-b04-onboarding`, `unit/about/atlassian-swe-2024`, `unit/portfolio/experiment-measurement-case` | experiment-measurement blocks + about experience     |
| Has Michael managed engineers?                                        | `unit/about/atlassian-em-2020`                                                                                                        | about experience entry (`id: atlassian-em-2020`)     |
| Why did Michael return to individual-contributor engineering?         | `unit/about/summary`                                                                                                                  | about summary concept                                |
| What experience does Michael have with attribution?                   | `unit/portfolio/experiment-measurement-b01-attribution`, `unit/about/atlassian-em-2020`                                               | experiment-measurement attribution block + EM bullet |
| What has Michael built with AI?                                       | `unit/portfolio/codenames-ai-case`, `unit/portfolio/codenames-ai-b01-validation`, `unit/about/codenames-ai`                           | codenames-ai case + about independent entry          |
| What developer infrastructure has Michael worked on?                  | `unit/portfolio/renovate-governance-*`, `unit/repo/renovate-workflow-*`                                                               | existing renovate portfolio + repo runbook concepts  |
| What has Michael written about agent memory?                          | _(none — `kind: corpus_gap`)_                                                                                                         | document weak/absent evidence; not a hard pass/fail  |

Example fixture entry:

```json
{
  "id": "attribution-experience",
  "question": "What experience does Michael have with attribution?",
  "kind": "positive",
  "top_k": 5,
  "expected_any_of": [
    "unit/portfolio/experiment-measurement-b01-attribution",
    "unit/about/atlassian-em-2020"
  ],
  "min_rank": 3
}
```

### Positive eval assertions (avoid brittle floats)

- At least one retrieved `unit_id` matches an entry in `expected_any_of` (exact or prefix glob) within `top_k`
- Optional `min_rank` caps how far down the ranked list an acceptable hit may appear
- Skip entire eval suite when `DATABASE_URL` / `OPENAI_API_KEY` unset (prefer skip + manual gate for this experiment)

### Negative / out-of-corpus eval (inspect scores, do not assert absence)

Vector search **always returns the nearest vectors** for a top-K query — even when none are actually relevant. A nonsense or unsupported question does not naturally produce "no results" unless a similarity threshold is introduced (deferred to a later experiment).

Include an explicit **negative inspection case**, not a `must_not_include` assertion:

```text
"What is Michael's experience designing nuclear reactors?"
        ↓
pgvector still returns top-K
        ↓
inspect cosine_distance / similarity per hit
        ↓
are the results obviously irrelevant to the question?
```

**Eval approach for this case:**

- Run retrieve; capture top-K with distances
- Record observations in eval output (manual review or soft assertion: e.g. best-hit distance is worse than positive-case baselines, or top hits are semantically unrelated by title/resource inspection)
- **Do not** assert that particular `unit_id`s are absent from top-K — that would be misleading

**Architectural follow-on (closure doc, not implemented here):** does grounded answer generation need a **retrieval confidence / distance threshold** before passing evidence to an LLM?

Run after `assistant:ingest` in dev/CI-with-secrets.

---

## Experiment closure deliverables

New doc: `docs/assistant/vector-retrieval-experiment.md` answering closure questions (storage model, pgvector representation, sync, cosine meaning, metadata filtering, **exact search as baseline vs ANN as later optimization**, embedding model/dimension as schema constraint, dedicated vector DB tradeoffs, OKF boundary, eval results including negative-query distance inspection, readiness for grounded generation and retrieval thresholds).

Archive plan to `.cursor/plans/archive/` per repo convention.

---

## Implementation slices (merge-safe PRs)

### Slice — `doc-reconcile`

**Purpose:** Align architecture docs with Postgres+pgvector retrieval experiment before code builds on stale in-memory-first guidance.

**Files:** [docs/assistant/architecture-direction.md](docs/assistant/architecture-direction.md), [docs/architecture/overview.md](docs/architecture/overview.md), [docs/assistant/okf-normalization-experiment.md](docs/assistant/okf-normalization-experiment.md) (pointer only)

**Approach:** Update sections listed in reconciliation table; add "Vector retrieval experiment (in progress)" subsection with target pipeline diagram; preserve prior in-memory hypothesis in changelog as superseded.

**Tests:** Docs-only; `npm run format:check`

**Depends on:** plan-review merged

**Stop:** PR opened; no implementation code

---

### Slice — `corpus-expansion`

**Purpose:** Bounded OKF producers for About + `experiment-measurement` + `codenames-ai` so retrieval eval has heterogeneous content — with shape-correct mapping per source type.

**Files:**

- New [scripts/assistant/okf/about-producer.mjs](scripts/assistant/okf/about-producer.mjs)
- New [scripts/assistant/okf/project-case-producer.mjs](scripts/assistant/okf/project-case-producer.mjs) — **separate from** [portfolio-producer.mjs](scripts/assistant/okf/portfolio-producer.mjs); do not extend renovate producer for `CaseBlock` shapes
- [scripts/assistant/okf/build.mjs](scripts/assistant/okf/build.mjs) — wire producers; extend index grouping
- [scripts/assistant/okf/manifest.mjs](scripts/assistant/okf/manifest.mjs) — `listConceptFiles` includes `about/`
- [scripts/assistant/okf/writer.mjs](scripts/assistant/okf/writer.mjs) — `cleanGeneratedConcepts` cleans `about/` (and any other new namespace) before rewrite
- [scripts/assistant/okf/constants.mjs](scripts/assistant/okf/constants.mjs) — manifest input metadata for new content modules
- [tests/okf-normalization.test.ts](tests/okf-normalization.test.ts)

**Approach:**

- `CaseBlock` bodies via dedicated `caseBlockBody()` preserving `heading`, `body[]`, `contract`, optional `note` / figure lines — **not** `proseBody()` or `block.type` branching
- About entries via dedicated `aboutEntryBody()` — no faux block structure
- Reuse shared infrastructure only where shapes match: `renderConcept`, `writeConcepts`, `SITE_URL` helpers, manifest hashing, overview-level fields shared between `ProjectCase` and `SupportingCase` (`lead`, `aside`, `elsewhere`)
- Extend generated-corpus cleanup and enumeration to all namespaces

**Tests:** CaseBlock heading preservation; About orphan cleanup on rebuild; deterministic `bundle_sha256` across all namespaces; producer boundaries; render conformance (see Corpus expansion producer sketch above)

**Depends on:** `doc-reconcile` merged

**Stop:** `npm run okf:build` produces expanded inspectable corpus; tests green; no stale files under `generated/okf/about/` after concept removal

---

### Slice — `retrieval-units`

**Purpose:** Derive stable retrieval units from OKF concepts (no DB, no API).

**Files:** `scripts/assistant/retrieval/derive-units.mjs`, `scripts/assistant/retrieval/unit-schema.mjs` (JSDoc typedefs), `npm run assistant:derive` (inspect JSON to stdout or `generated/retrieval-units.json` gitignored)

**Approach:** Parse OKF corpus; emit unit objects with `content_hash`; 1:1 mapping initially.

**Tests:** `tests/assistant-retrieval-units.test.ts` — deterministic IDs/hashes, required provenance fields, counts match OKF concepts

**Depends on:** `corpus-expansion`

**Stop:** CLI prints derived units from live `okf:build` output

---

### Slice — `db-foundation`

**Purpose:** Postgres + pgvector schema, migrations, local docker compose, connection helper.

**Files:** `db/migrations/20261007100000_assistant_pgvector.sql`, `docker-compose.yml`, `scripts/assistant/db/*`, [.env.example](.env.example), `npm run assistant:db:migrate`

**Approach:** Enable extension; create table with `vector(1536)` (fixed index representation); add btree indexes on filter columns only — **no ANN index**; migration runner; document `DATABASE_URL` and the model/dimension migration constraint.

**Tests:** `tests/assistant-db.test.ts` — migration applies, extension exists (skip if no `DATABASE_URL`)

**Depends on:** `doc-reconcile` merged

**Stop:** `docker compose up` + migrate succeeds locally

---

### Slice — `embeddings-adapter`

**Purpose:** Thin OpenAI embedding client with batching/retries; validate model against fixed index config (`text-embedding-3-small`, 1536 dims).

**Files:** `scripts/assistant/embeddings/openai-embeddings.mjs`, `scripts/assistant/embeddings/index-config.mjs` (supported model + dimension constants), config reader

**Tests:** `tests/assistant-embeddings.test.ts` — mock `fetch`; batching splits; error propagation; reject unsupported model; reject wrong dimension count (no live API in CI)

**Depends on:** `doc-reconcile` merged

**Stop:** Unit tests pass; manual smoke with API key optional

---

### Slice — `ingest-sync`

**Purpose:** End-to-end `okf:build → derive → embed → upsert → delete stale`.

**Files:** `scripts/assistant/ingest.mjs`, optional `ingestion-runs` migration, `npm run assistant:ingest`

**Tests:** `tests/assistant-ingest.test.ts` — mock embeddings; verify skip on unchanged hash, update on change, delete orphan; integration path with real DB when `DATABASE_URL` set

**Depends on:** `retrieval-units`, `db-foundation`, `embeddings-adapter`

**Stop:** Repeatable ingest with skip counts logged

---

### Slice — `retrieve-cli`

**Purpose:** Inspectable semantic search over pgvector.

**Files:** `scripts/assistant/retrieve.mjs`, `npm run assistant:retrieve`

**Tests:** `tests/assistant-retrieve.test.ts` — seeded vectors (fixed small embeddings) assert ordering/rank fields; document `<=>` meaning in script `--help` and doc comment

**Depends on:** `ingest-sync`

**Stop:** CLI returns ranked JSON for a query against ingested corpus

---

### Slice — `retrieval-eval`

**Purpose:** Representative question suite with top-K assertions.

**Files:** `tests/fixtures/assistant-retrieval/eval-cases.json`, `tests/assistant-retrieval-eval.test.ts`

**Approach:** Run retrieve for positive cases with top-K evidence assertions; run negative inspection case (nuclear-reactor query) capturing distances for manual/soft review; document known corpus gaps (agent memory). No `must_not_include` assertions.

**Tests:** Self-contained eval test file; skipped without secrets + DB

**Depends on:** `retrieve-cli`

**Stop:** Eval documents pass/fail per case with actionable output

---

### Slice — `plan-closure`

**Purpose:** Experiment findings doc + plan archive.

**Files:** `docs/assistant/vector-retrieval-experiment.md`, move plan to `.cursor/plans/archive/`

**Approach:** Answer closure questions with measured results from `retrieval-eval`; update architecture-direction "What we have learned so far"

**Tests:** Docs-only

**Depends on:** all implementation slices merged

**Stop:** Closure PR opened

---

## Suggested npm scripts (cumulative)

```json
"okf:build": "...",
"assistant:derive": "node scripts/assistant/retrieval/derive-units.mjs",
"assistant:db:migrate": "node scripts/assistant/db/migrate.mjs",
"assistant:ingest": "node scripts/assistant/ingest.mjs",
"assistant:retrieve": "node scripts/assistant/retrieve.mjs"
```

---

## Explicit non-goals (this plan)

- Chatbot UI, answer generation, Responses API, conversation memory, agents, tool calling
- Reranking, hybrid lexical+semantic search
- LangChain / LlamaIndex / dedicated vector SaaS
- ANN indexes (HNSW / IVFFlat) — exact search only in this experiment
- Retrieval distance/confidence thresholds (observed in negative eval; implemented later)
- Vercel API routes, public assistant endpoints
- Full portfolio ingestion (ecosystem, timeline, all articles/repos)

**Next experiment (out of scope):** question → retrieval → evidence assembly → OpenAI Responses API → grounded answer + citations

---

## Risk notes

- **Eval depends on OpenAI + Postgres in dev** — acceptable for learning experiment; CI remains green via skips
- **Agent-memory question may lack corpus evidence** — record as retrieval gap, not a test failure to paper over
- **Embedding cost** — small corpus; ingest skip logic keeps reruns cheap
- **Do not import assistant scripts into `app/`** — keeps static Vercel deploy secret-free

---

## Agent prompts (copy/paste for Cursor)

### plan-review

```text
@.cursor/plans/assistant-vector-retrieval-experiment.plan.md

Execute only plan-review. Do not start doc-reconcile or later slices.

Authority: Plan-only PR — commit the plan artifact only; do not implement. Stop after opening the plan-only PR.

Topology: start from latest origin/main; branch represents only the plan artifact; PR base must be main.

Deliverables: plan file under .cursor/plans/; mark plan-review completed in frontmatter in the same PR.

Verification: plan satisfies repo planning standards; no implementation changes included.
```

### doc-reconcile

```text
@.cursor/plans/assistant-vector-retrieval-experiment.plan.md

Implement slice doc-reconcile only. Prerequisite: plan-review merged. Do not start corpus-expansion or later slices. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: architecture doc updates per plan reconciliation table. Mark doc-reconcile completed in plan frontmatter in this PR.

Do not: OKF producers, retrieval units, embeddings, pgvector schema, ingest/retrieve CLIs, or assistant runtime code.

Verification: npm run format:check.
```

### corpus-expansion

```text
@.cursor/plans/assistant-vector-retrieval-experiment.plan.md

Implement slice corpus-expansion only. Prerequisite: doc-reconcile merged. Do not start retrieval-units or later slices. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: about-producer.mjs and project-case-producer.mjs (CaseBlock-aware, not portfolio-producer block.type reuse); writer.mjs cleanGeneratedConcepts extended for about/; manifest listConceptFiles + build index updated; okf tests covering CaseBlock heading preservation, About orphan cleanup, and deterministic rebuild across all namespaces. Mark corpus-expansion completed in plan frontmatter in this PR.

Do not: retrieval units, embeddings, pgvector, ingest/retrieve, or full portfolio ingestion.

Verification: npm run okf:build; npm run test; npm run typecheck; npm run lint; npm run format:check; confirm rebuild removes stale about/ concepts.
```

### retrieval-units

```text
@.cursor/plans/assistant-vector-retrieval-experiment.plan.md

Implement slice retrieval-units only. Prerequisite: corpus-expansion merged. Do not start db-foundation or later slices (except db-foundation may proceed in parallel after doc-reconcile). Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: retrieval-unit derivation from OKF concepts, assistant:derive CLI, unit tests. Mark retrieval-units completed in plan frontmatter in this PR.

Do not: OpenAI API calls, Postgres/pgvector, ingest pipeline, or retrieve CLI.

Verification: npm run okf:build; npm run assistant:derive; npm run test; npm run typecheck; npm run lint; npm run format:check.
```

### db-foundation

```text
@.cursor/plans/assistant-vector-retrieval-experiment.plan.md

Implement slice db-foundation only. Prerequisite: doc-reconcile merged. Do not start ingest-sync or later slices. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: pgvector migration (vector(1536), no ANN index), docker-compose, migrate CLI, DATABASE_URL in .env.example, db tests (skip without DATABASE_URL). Mark db-foundation completed in plan frontmatter in this PR.

Do not: embeddings API, ingest, retrieve, or app/ routes.

Verification: docker compose up; npm run assistant:db:migrate; npm run test; npm run format:check.
```

### embeddings-adapter

```text
@.cursor/plans/assistant-vector-retrieval-experiment.plan.md

Implement slice embeddings-adapter only. Prerequisite: doc-reconcile merged. Do not start ingest-sync or later slices. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: OpenAI embeddings adapter with fixed index config validation (text-embedding-3-small, 1536 dims), unit tests with mocked fetch. Mark embeddings-adapter completed in plan frontmatter in this PR.

Do not: Postgres writes, ingest pipeline, retrieve CLI, or answer generation.

Verification: npm run test; npm run typecheck; npm run lint; npm run format:check.
```

### ingest-sync

```text
@.cursor/plans/assistant-vector-retrieval-experiment.plan.md

Implement slice ingest-sync only. Prerequisites: retrieval-units, db-foundation, embeddings-adapter merged. Do not start retrieve-cli or later slices. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: idempotent assistant:ingest pipeline (derive → embed → upsert → delete stale), ingestion run metadata, tests. Mark ingest-sync completed in plan frontmatter in this PR.

Do not: retrieve CLI, eval suite, chat UI, or answer generation.

Verification: npm run assistant:ingest (with DATABASE_URL + OPENAI_API_KEY); npm run test; npm run format:check.
```

### retrieve-cli

```text
@.cursor/plans/assistant-vector-retrieval-experiment.plan.md

Implement slice retrieve-cli only. Prerequisite: ingest-sync merged. Do not start retrieval-eval or plan-closure. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: assistant:retrieve CLI with inspectable top-K output and documented cosine distance (<=>). Mark retrieve-cli completed in plan frontmatter in this PR.

Do not: answer generation, eval suite (next slice), or app/ API routes.

Verification: npm run assistant:retrieve -- "test query"; npm run test; npm run format:check.
```

### retrieval-eval

```text
@.cursor/plans/assistant-vector-retrieval-experiment.plan.md

Implement slice retrieval-eval only. Prerequisite: retrieve-cli merged. Do not start plan-closure. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: eval fixtures and tests with top-K assertions for positive cases; negative nuclear-reactor inspection case (distances, no must_not_include). Mark retrieval-eval completed in plan frontmatter in this PR.

Do not: answer generation, ANN indexes, or plan archive.

Verification: npm run test (with DATABASE_URL + OPENAI_API_KEY when running eval integration); npm run format:check.
```

### plan-closure

```text
@.cursor/plans/assistant-vector-retrieval-experiment.plan.md

Execute only plan-closure.

Authority: Open PR only — docs-only archive PR; do not merge.

Prerequisites: all implementation slices merged and marked completed in frontmatter.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: docs/assistant/vector-retrieval-experiment.md; verify slice todos; add # Shipped note; move plan to .cursor/plans/archive/2026-10-07-assistant-vector-retrieval-experiment.plan.md; mark plan-closure completed.

Verification: confirm all prerequisite implementation PRs are merged before archiving.
```
