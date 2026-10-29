# Assistant retrieval database

Postgres + pgvector backing store for the assistant retrieval index and **durable API rate-limit counters**. The production assistant generation route (`POST /api/assistant/generate`) reads the retrieval index and rate-limit tables via server-only `DATABASE_URL` on Vercel. Site `PortfolioRepository` persistence remains separate (future milestone).

## Two Postgres concerns (do not conflate)

| Concern                       | Role                                          | Connection config                                               | Migrations                                                       |
| ----------------------------- | --------------------------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------- |
| **Site content persistence**  | Future `PortfolioRepository` adapter          | Not implemented (future env var, e.g. `PORTFOLIO_DATABASE_URL`) | Future site schema                                               |
| **Assistant retrieval index** | Derived pgvector store for semantic retrieval | `DATABASE_URL` (assistant scripts only)                         | Drizzle Kit (`drizzle/`, journal `drizzle.__drizzle_migrations`) |

Both may use Neon as a hosted Postgres provider, but they must remain **separate databases or branches, schemas, connection strings, and migration lifecycles**. Do not point site persistence and assistant retrieval at the same `DATABASE_URL` or share migration runners.

## Deployment topology

```text
Local development / CI migration verification
  docker compose up -d
  DATABASE_URL → local Docker Postgres (pgvector/pgvector:pg16)

Hosted assistant retrieval index (persistent)
  Neon Postgres + pgvector
  DATABASE_URL → Neon connection string (env / secrets only)
```

Repository-owned **Drizzle ORM schema** (`db/schema.ts`) and **Drizzle Kit migrations** under `drizzle/` are the **sole migration authority** for assistant schema (Strategy A — shipped in `drizzle-foundation`). Historical SQL under `db/migrations/` remains in Git as a **read-only audit trail**; the legacy custom runner is **not** executed by `npm run assistant:db:migrate`.

Do not hand-create assistant tables in the Neon console.

The schema enables pgvector and creates assistant tables with `embedding vector(1536)` for `text-embedding-3-small`. Changing model or dimensionality requires a new Drizzle migration and full re-embed.

### Migration strategy (Strategy A — single authority)

Drizzle Kit is the **only** forward migration runner. Legacy SQL under `db/migrations/` is **read-only history** — not executed by repository commands.

| Command                             | Purpose                                                                                                  |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------- |
| **`npm run assistant:db:migrate`**  | Normal Drizzle migrator — fresh databases and forward migrations after adoption                          |
| **`npm run assistant:db:baseline`** | **One-time** adoption of an existing legacy-runner database into the Drizzle journal (operator approval) |

| Database state                                                                                                                           | `assistant:db:migrate`                                                            | `assistant:db:baseline`                                                                                 |
| ---------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| **Fresh** (no assistant tables)                                                                                                          | Applies `drizzle/0000_assistant_initial.sql` (extension + tables)                 | Refuses — not a legacy-complete database                                                                |
| **Legacy-complete** (all assistant tables, `vector`, every legacy file in `schema_migrations`; **empty** `drizzle.__drizzle_migrations`) | **Fails closed** (`LegacyAdoptionRequiredError`) — does **not** write the journal | Seeds **only** `0000_assistant_initial` in the journal (by tag + SQL hash) without replaying CREATE DDL |
| **Partial / ambiguous legacy**                                                                                                           | Fails closed if assistant tables exist without a journal                          | Refuses eligibility — **no** journal writes                                                             |
| **Already baselined / migrated**                                                                                                         | Idempotent forward migrate                                                        | Refuses — one-time only                                                                                 |

Journal location: **`drizzle.__drizzle_migrations`**. Legacy `schema_migrations` rows may remain as frozen history on Neon or local databases; verify and forward DDL use the Drizzle journal only.

#### Fresh database initialization (local Docker or empty Neon branch)

1. Set `DATABASE_URL` to the target database (direct connection for migrate).
2. `npm run assistant:db:migrate`
3. `npm run assistant:db:verify`

#### One-time adoption of an existing Neon (or local) legacy database

Use when the database was created with the **retired custom runner** (`db/migrations/*.sql` + `schema_migrations`) and **`drizzle.__drizzle_migrations` is empty**.

**Operator sequence (explicit approval required — agents must not run against production without approval):**

1. Confirm target database and operator rollback plan (transaction rollback, or fresh database path — not necessarily a Neon branch backup).
2. Inspect legacy schema and migration history (`vector`, all three assistant tables, every legacy filename in `schema_migrations`).
3. Set `DATABASE_URL` to the **direct** (non-pooled) connection string for that branch.
4. Run **`npm run assistant:db:baseline`** once — expect `legacy baseline adoption complete`; no CREATE replay on existing tables or embeddings.
5. Run **`npm run assistant:db:verify`** — all checks pass, including `drizzle_migration_journal`.
6. Run **`npm run assistant:db:migrate`** — applies any pending Drizzle migrations after the initial baseline tag.
7. Run **`npm run assistant:db:verify`** again — confirm idempotent state.

If baseline refuses, **do not** hand-edit the Drizzle journal — fix eligibility (complete legacy history) or use a fresh database path instead.

#### Normal forward migrations after adoption

Edit `db/schema.ts`, run `npm run assistant:db:generate`, review SQL under `drizzle/`, commit, then operators run **`npm run assistant:db:migrate`** (and verify). Baseline is **not** re-run.

## Local development (default)

1. Start Postgres:

   ```bash
   docker compose up -d
   ```

2. Set `DATABASE_URL` in a gitignored `.env` or `.env.local` (see `.env.example` for the local default). Shell/CI-provided `DATABASE_URL` takes precedence over file values.

3. Apply migrations:

   ```bash
   npm run assistant:db:migrate
   ```

4. Verify schema:

   ```bash
   npm run assistant:db:verify
   ```

Integration tests in `tests/assistant-db.test.ts` use `DATABASE_URL` **read-only** (connectivity + `assistant:db:verify` checks; no migrate, baseline, or reset) and skip when unset. **`tests/assistant-db-migrate.test.ts`** covers fresh migrate, legacy refusal, explicit baseline, and journal safety using **`ASSISTANT_TEST_DATABASE_URL` only** (destructive resets). Ingest, retrieve, and API rate-limit Postgres integration call **`prepareAssistantIntegrationTestDatabase`** (reset + Drizzle migrate on the dedicated `*_test` database only; setup failures fail the suite — no silent skips). **`tests/assistant-api-rate-limit.test.ts`** Postgres integration also uses **`ASSISTANT_TEST_DATABASE_URL` only**.

**Ingest sync integration tests** (`tests/assistant-ingest.test.ts`) run full-corpus `runIngestSync()` semantics (including stale-row deletes). They use **`ASSISTANT_TEST_DATABASE_URL` only** — never `DATABASE_URL`. The database name must end in `_test` (for example `portfolio_assistant_test` on local Docker). Tests refuse Neon hosts unless `ASSISTANT_TEST_ALLOW_NEON=1` is set explicitly. Do not point ingest integration tests at the dev or hosted retrieval index.

## Hosted Neon deployment (operator workflow)

**Slice:** `neon-deployment` (prerequisite before `ingest-sync`).

Neon provisioning is an account/dashboard action. The repository does not store Neon credentials or connection strings.

### Production cutover (completed 2026-10-29)

The one-time **fresh Drizzle + corpus transfer** from local Docker to Neon **`portfolio-assistant`** / **`portfolio_assistant`** completed successfully (**262** retrieval units, Phase 6 verification passed). **Do not repeat** the database-recreation procedure for routine schema work — use **`npm run assistant:db:migrate`** and **`npm run assistant:db:verify`** per Strategy A above.

Historical operator record (phases 1–6, integrity digests, lessons learned): [`../archive/production-neon-cutover-2026.md`](../archive/production-neon-cutover-2026.md).

For databases still on the **retired custom runner** with complete legacy history and data you must preserve (not the completed cutover path), use **one-time baseline adoption** (above) instead.

### 0. Inventory before provisioning

In the Neon org, confirm there is **no existing project** already dedicated to the portfolio assistant retrieval index. Other Neon projects (for example Savepoints canonical storage or future site `PortfolioRepository` persistence) are **not** interchangeable — they use different schemas, migrations, and `DATABASE_URL` values.

If an appropriately isolated assistant project already exists, reuse it; do not create a second assistant database.

**Recommended hosted target (Multipliers Dev org):**

| Setting        | Value                 | Rationale                                                                   |
| -------------- | --------------------- | --------------------------------------------------------------------------- |
| Project name   | `portfolio-assistant` | Distinct from Savepoints and site persistence                               |
| Region         | `aws-ap-southeast-2`  | Align with operator region; adjust if needed                                |
| Postgres major | 16                    | Matches local `docker-compose` (`pg16`) image                               |
| Database name  | `portfolio_assistant` | Matches local Docker default database name                                  |
| Branch         | Project default       | See **Resolve the target branch** below — name is not fixed across projects |

**Resolve the target branch** (`BRANCH_NAME`) before copying connection strings or running `neonctl`. Neon assigns a default root branch per project; common examples include `production` or `main`, but the name is **not** guaranteed.

- **Neon Console:** open the project → **Branches** (or the branch selector on **Dashboard** / **Connect**) and note the default branch you will migrate.
- **Neon CLI:** list branches and read the default from project metadata, for example:

  ```bash
  neonctl branches list --project-id PROJECT_ID
  ```

Use that branch name everywhere below as `BRANCH_NAME`. `assistant:db:migrate` and `assistant:db:verify` apply to whichever database the connection string points at — direct and pooled strings must target the **same** `BRANCH_NAME` during deployment.

### 1. Provision or select a Neon target

**Neon Console**

1. Sign in to [Neon](https://console.neon.tech/) and open the target organization.
2. **Create project** (or open the existing `portfolio-assistant` project).
3. Set region and Postgres version per the table above; name the initial database `portfolio_assistant` when prompted.
4. Confirm pgvector is supported on the project (Neon enables the `vector` extension via SQL migrations — no separate toggle required for this experiment).
5. Note the project's default branch name from **Branches** or **Connect** (for example `production` on some projects) — this is your `BRANCH_NAME` for migrate/verify.

**Optional: Neon CLI** (`neonctl`, after `neonctl auth`)

```bash
neonctl projects create \
  --name portfolio-assistant \
  --region-id aws-ap-southeast-2 \
  --database portfolio_assistant \
  --pg-version 16
```

Use `--org-id` when the CLI prompts for an organization. Do not commit CLI output or connection strings.

### 2. Obtain a connection string

From the project **Connect** UI or `neonctl connection-string`:

| Use case                                                      | Neon setting        | Notes                                                                                                   |
| ------------------------------------------------------------- | ------------------- | ------------------------------------------------------------------------------------------------------- |
| **Migrations** (`assistant:db:migrate`)                       | Direct / non-pooled | DDL and `CREATE EXTENSION vector`; use `sslmode=require` (or `verify-full` if your driver documents it) |
| **Runtime** (future `assistant:ingest`, `assistant:retrieve`) | Pooled              | Acceptable for read/write ingest and similarity queries                                                 |

`neonctl` examples (replace `PROJECT_ID` and `BRANCH_NAME` — use the branch you resolved above, not a hardcoded name):

```bash
# Direct — migrations and verify (same BRANCH_NAME as deployment acceptance)
neonctl connection-string BRANCH_NAME --project-id PROJECT_ID --database-name portfolio_assistant --pooled false --ssl require

# Pooled — optional for later ingest/retrieve sessions (same BRANCH_NAME)
neonctl connection-string BRANCH_NAME --project-id PROJECT_ID --database-name portfolio_assistant --pooled --ssl require
```

From **Connect**, pick the same branch in the UI before copying the direct or pooled string.

Store URLs only in gitignored `.env` / `.env.local`, shell `export`, Cursor Cloud **Runtime Secrets**, or another secrets manager — **never** commit them or paste them into PR descriptions.

The Node `pg` driver reads SSL mode from the connection string query string. Neon-issued URLs should include `sslmode=require` (or stricter) for hosted connections.

### 3. Configure `DATABASE_URL`

Set `DATABASE_URL` to the **direct** Neon connection string for the first migrate/verify cycle. Assistant scripts read **only** this variable; they do not read site persistence configuration.

Local example (gitignored `.env.local` — do not commit):

```bash
# Assistant retrieval index only — hosted Neon direct connection
DATABASE_URL='postgresql://…'  # from Neon Connect; include sslmode=require
```

Shell override (useful for one-off operator runs without editing files):

```bash
export DATABASE_URL='postgresql://…'
npm run assistant:db:migrate
npm run assistant:db:verify
```

For day-to-day local development, keep Docker as the default in `.env.local` and export a Neon `DATABASE_URL` only when validating hosted deployment or running ingest against Neon (later slices).

### 4. Apply repository migrations

Ensure `DATABASE_URL` is the **direct** connection string for `BRANCH_NAME` on `portfolio_assistant` (the branch you identified in step 0 / Connect). Then:

```bash
npm run assistant:db:migrate
```

This runs the **Drizzle Kit migrator** (Strategy A). All forward DDL comes from `drizzle/*.sql` and is recorded in `drizzle.__drizzle_migrations` on that branch's database only. Legacy files under `db/migrations/` are not executed.

### 5. Verify schema

```bash
npm run assistant:db:verify
```

Confirms connectivity, `CREATE EXTENSION vector`, Drizzle journal state (`drizzle.__drizzle_migrations`), all assistant tables (`assistant_retrieval_units`, `assistant_ingestion_runs`, `assistant_api_rate_limit_counters`), `vector(1536)`, and absence of ANN indexes.

JSON output for automation:

```bash
npm run assistant:db:verify -- --json
```

### 6. Manual SQL verification (optional)

Equivalent checks without the CLI:

```sql
SELECT extname FROM pg_extension WHERE extname = 'vector';

SELECT hash, created_at FROM drizzle.__drizzle_migrations ORDER BY created_at;

SELECT format_type(a.atttypid, a.atttypmod) AS embedding_type
FROM pg_attribute a
JOIN pg_class c ON a.attrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname = 'assistant_retrieval_units'
  AND a.attname = 'embedding'
  AND NOT a.attisdropped;
```

Expected `embedding_type`: `vector(1536)`.

### 7. Deployment acceptance

Hosted deployment is complete when `npm run assistant:db:verify` reports **ok** for all checks against the Neon `DATABASE_URL`:

- connectivity
- `vector` extension
- `drizzle.__drizzle_migrations` journal matches committed Drizzle migration(s)
- `assistant_retrieval_units`, `assistant_ingestion_runs`, `assistant_api_rate_limit_counters`
- `assistant_retrieval_units.embedding` type `vector(1536)`
- no ANN vector index on `assistant_retrieval_units`

CI does not require Neon; this verification is operator-run with secrets.

### 8. Ingest / retrieve configuration

`assistant:ingest` and `assistant:retrieve` use the same `DATABASE_URL` assistant retrieval connection — local Docker for development, Neon (direct or pooled) for persistent hosted index. They do not introduce a second assistant database configuration surface.

Optional: use the **pooled** Neon connection string for long-running ingest/retrieve while keeping the **direct** string for migrations after schema changes.

**Retrieve CLI:** after ingesting the corpus, inspect semantic search with:

```bash
npm run assistant:retrieve -- "your question"
```

Options: `--top-k <n>` (default 5), `--filter-source-class <id>`, `--json` for machine-readable output. The CLI embeds the question with the same model as ingest (`text-embedding-3-small`), then runs exact pgvector cosine search using the `<=>` operator. Each hit reports `cosine_distance` (lower = more similar; OpenAI embeddings are unit-normalized so distance is typically in `[0, 2]`) and `similarity = 1 - cosine_distance` as a diagnostic only. Requires `OPENAI_API_KEY` from the `portfolio-assistant` project.

### 9. RAG generation CLI (`assistant:answer`)

**Slice:** `generation-cli` — shared RAG generation service + thin CLI adapter (no App Router API yet).

After ingest, run evidence-aware generation (retrieve → assemble → OpenAI Chat Completions → structural validation):

```bash
npm run assistant:answer -- "your question"
```

Requires `DATABASE_URL` (retrieval index) and `OPENAI_API_KEY` (`portfolio-assistant` project) unless `--no-retrieval` or `--dry-run-retrieval` with `--no-retrieval`.

| Flag                          | Purpose                                                                          |
| ----------------------------- | -------------------------------------------------------------------------------- |
| `--assembly-mode full_parent` | Default production assembly at OKF concept boundary                              |
| `--assembly-mode top_k_only`  | Eval baseline — matched hits only                                                |
| `--top-k <n>`                 | Retrieval width before assembly (default **10**; retrieve CLI default remains 5) |
| `--filter-source-class <id>`  | Same filter as `assistant:retrieve`                                              |
| `--dry-run-retrieval`         | Retrieve + assemble only; no chat call                                           |
| `--no-retrieval`              | Skip retrieval (model-only / eval baseline)                                      |
| `--json`                      | Full structured response (claims, derived `answer_text`, citations, diagnostics) |

**Response contract:** the model returns canonical `claims[]` + `support_level` + `abstained` / `abstention_reason`. The service derives `answer_text` and deduped `citations[]` and runs deterministic citation-integrity checks. Evidence-backed links in `evidence_supported` / `evidence_inferred` claim text must appear in the evidence packet URL registry; `general_knowledge` and `uncertain` claims must not introduce arbitrary HTTP(S) URLs (prose-only explanations). `finish_reason=length` is a **hard generation failure** (`output_truncated`) — truncated JSON is never parsed or salvaged. Internal diagnostics are returned only on the service result object (not on the public `response`); CLI `--json` merges diagnostics for operators; the future API adapter will expose the public contract only.

**Server-side telemetry (PostHog):** `runRagGeneration` emits operational events when a project token is configured. Reuses `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` / `NEXT_PUBLIC_POSTHOG_HOST` or overrides via `ASSISTANT_GENERATION_POSTHOG_*`. Set `ASSISTANT_GENERATION_TELEMETRY=false` to disable. Events use a stable operational `distinct_id` (`assistant_generation_cli` by default) — not site visitor identity. **Never** includes raw questions, evidence, answers, citation text, API keys, or exception messages (only bounded `failure_category` values). Delivery is fail-open; inject `telemetry` in tests. CLI calls `flushTelemetry()` after success; failures flush before rethrow.

| Event                            | When                                                                                                          | Key properties                                                                                                               |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------- |
| `assistant_retrieval_completed`  | After retrieve + assemble (once per run; skipped for `--no-retrieval` and injected `evidencePacket` fixtures) | `assembly_mode`, `top_k`, `evidence_entry_count`, `evidence_character_count`, `retrieval_latency_ms`, `assembly_latency_ms`  |
| `assistant_generation_completed` | Successful chat + validation                                                                                  | `model`, latencies, token usage, `support_level`, `abstained`, `claim_count`, `attribution_*`, evidence counts               |
| `assistant_generation_failed`    | Any generation failure                                                                                        | `failure_category`, `model`, `assembly_mode`, latencies, `max_output_tokens`, optional `finish_reason` / `completion_tokens` |
| `assistant_generation_truncated` | `finish_reason=length` only (paired with failed event, category `output_truncated`)                           | `finish_reason`, `max_output_tokens`, `completion_tokens`                                                                    |

Verify in PostHog: filter `analytics_environment = assistant_generation_tooling` and `execution_context` (`cli` / `eval` / `api`). Property `telemetry_schema_version` is `1`.

**Resource bounds** (optional env overrides — see `.env.example`):

| Variable                                       | Default (dev) | Role                                                                                |
| ---------------------------------------------- | ------------- | ----------------------------------------------------------------------------------- |
| `ASSISTANT_GENERATION_MODEL`                   | `gpt-4o-mini` | Chat model                                                                          |
| `ASSISTANT_GENERATION_TOP_K`                   | `10`          | Generation retrieve K                                                               |
| `ASSISTANT_EVIDENCE_CHARACTER_BUDGET`          | `120000`      | Evidence packet char cap (`EvidenceBudgetExceeded` when exceeded)                   |
| `ASSISTANT_GENERATION_PROMPT_TOKEN_BUDGET`     | `28000`       | Heuristic prompt cap (chars ÷ 4)                                                    |
| `ASSISTANT_GENERATION_MAX_OUTPUT_TOKENS`       | `2048`        | Chat `max_tokens`                                                                   |
| `ASSISTANT_GENERATION_TIMEOUT_MS`              | `120000`      | End-to-end OpenAI chat budget (all attempts, retry backoff, and response body read) |
| `ASSISTANT_GENERATION_MAX_QUESTION_LENGTH`     | `4000`        | Question validation                                                                 |
| `ASSISTANT_GENERATION_MAX_RESPONSE_JSON_CHARS` | `24000`       | Reject overlong model JSON                                                          |

Implementation entrypoint: `scripts/assistant/generation/run-generation.mjs` (imported by `scripts/assistant/answer.mjs` and `app/api/assistant/generate/route.ts`).

### 10. Generation API (`POST /api/assistant/generate`)

**Slice:** `generation-api` — App Router adapter over the same `runRagGeneration` service (no CLI shell-out).

| Concern             | Detail                                                                                                                                                                                                                                                                  |
| ------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Route**           | `POST /api/assistant/generate` — JSON body `{ "question": "…" }` only                                                                                                                                                                                                   |
| **Runtime**         | Node.js (Fluid Compute); `maxDuration` 120s (aligns with default `ASSISTANT_GENERATION_TIMEOUT_MS`)                                                                                                                                                                     |
| **Secrets**         | Server-only `DATABASE_URL`, `OPENAI_API_KEY`, optional `OPENAI_PROJECT_ID` (recommended for `sk-proj-*` keys), generation env overrides — never `NEXT_PUBLIC_*`                                                                                                         |
| **Success body**    | `{ "answer": { claims, answer_text, citations, support_level, abstained, abstention_reason? }, "usage"?: { model?, prompt_tokens?, completion_tokens?, total_tokens? } }` — `usage` only when OpenAI reported at least one token count (never zero-filled placeholders) |
| **Errors**          | Stable `{ "error": { "code", "message" } }` — no stack traces, packets, prompts, or `diagnostics`; **no `usage` on failures**                                                                                                                                           |
| **Rate limits**     | Durable Postgres counters in `assistant_api_rate_limit_counters` (migration `20261016100000_assistant_api_rate_limits.sql`) — **single transaction** admits or rejects all windows; shared across instances; defaults in `.env.example`                                 |
| **Client identity** | Rate-limit key uses the first `x-forwarded-for` hop. On Vercel, that header is set/overwritten with the connecting client IP (external visitor values are not trusted as identity). Local dev without a proxy may fall back to `ip:unknown`.                            |

**Deploy checklist (operator):**

1. Apply migrations on the assistant `DATABASE_URL` (`npm run assistant:db:migrate`) so `assistant_api_rate_limit_counters` exists.
2. Set Vercel production/preview env: `DATABASE_URL` (pooled Neon acceptable), `OPENAI_API_KEY` (`portfolio-assistant` project), `OPENAI_PROJECT_ID` when using a project-scoped key, optional generation bounds from `.env.example`.
3. Smoke test locally:

   ```bash
   npm run dev
   curl -sS -X POST http://localhost:3000/api/assistant/generate \
     -H 'Content-Type: application/json' \
     -d '{"question":"What projects has Michael shipped?"}' | jq .
   ```

4. Expect `200` with `answer.claims[]` when secrets and index are configured; `429` when rate limits trip; `503` if rate-limit storage is unreachable (fail-closed).

**Manual verification:** run the curl above against local dev with `DATABASE_URL` + `OPENAI_API_KEY` in gitignored `.env.local`.

### Production Neon corpus (hosted assistant prerequisite)

Before **deployed** assistant end-to-end acceptance on michaeltruong.ai, operators must populate the **production** Neon retrieval index (project `portfolio-assistant`, database `portfolio_assistant`) using operator-approved `okf:build` → `assistant:ingest`. **Deployments do not run ingest automatically.** Requires explicit operator approval before pointing ingest at production `DATABASE_URL`. Checklist and measurable acceptance criteria: [RAG generation plan — operational-acceptance Phase A](../../.cursor/plans/2026-10-08-assistant-grounded-rag-generation.plan.md#phase-a--production-neon-corpus-ingestion-and-verification-before-deployed-e2e).

**Future direction (not authorized today).** Unattended synchronization between source repositories and the production index is deferred architectural intent only — see [architecture-direction — Corpus synchronization](./architecture-direction.md#future-direction--corpus-synchronization). Until a dedicated plan ships, all production corpus updates remain manual operator ingest.

## OpenAI Embeddings API (operator workflow)

**Prerequisite:** complete hosted Neon migrate/verify above before the first **live** ingest that calls OpenAI.

**Separation from Codenames:** use a dedicated OpenAI API **project** named `portfolio-assistant`. Do not reuse the OpenAI **Default** project (or its keys) used by Codenames AI — separate billing, usage visibility, and blast radius.

### 1. Create or select the OpenAI project

1. Sign in to the [OpenAI platform](https://platform.openai.com/).
2. Create or open the **`portfolio-assistant`** API project.

### 2. Issue a project-scoped Embeddings key

1. In that project, create an API key with access to the **Embeddings** API.
2. Store the key only in gitignored `.env.local` (local) or runtime secrets (Cursor Cloud / CI when explicitly configured) as `OPENAI_API_KEY`.
3. For **project-scoped** keys (`sk-proj-…`), also set `OPENAI_PROJECT_ID` to that project’s ID (e.g. `proj_…` from the OpenAI dashboard). Assistant chat and embeddings clients send it as the `OpenAI-Project` header when set; omitting it can cause intermittent `403` / `model_not_found` on Chat Completions even when the model is allowlisted.
4. **Never commit** the key, key IDs, or secret values. Do not paste secrets into PRs or issues.

### 3. Project ID for sk-proj keys

When using a project-scoped API key, set `OPENAI_PROJECT_ID` alongside `OPENAI_API_KEY` in `.env.local` or deployment secrets. The value is the OpenAI project identifier (`proj_…`), not the display name `portfolio-assistant`.

### 4. Budget and alerts

Configure a modest **project budget** and **usage alerts** on `portfolio-assistant` before bulk ingest experiments.

### 5. Confirm model access (smoke test)

The assistant index is fixed to **`text-embedding-3-small` at 1536 dimensions** (`vector(1536)` in Postgres). Before the first full ingest:

1. Ensure `OPENAI_API_KEY` is set (portfolio-assistant project).
2. Run a one-off embeddings smoke (any of):
   - `node --input-type=module -e "import { embedTexts } from './scripts/assistant/embeddings/openai-embeddings.mjs'; const v = await embedTexts(['smoke']); console.log(v[0].length);"`
   - Or run `npm run assistant:ingest` only after this passes.
3. Expect vector length **1536**. Fail closed if Embeddings access is missing or dimensions differ.

Optional override `ASSISTANT_EMBEDDING_MODEL` is validated against the supported index model only — changing model requires a schema migration and full re-embed (see migration comments).

### 6. First live ingest acceptance

With `DATABASE_URL` pointing at migrated assistant retrieval Postgres (local Docker or Neon) and `OPENAI_API_KEY` from `portfolio-assistant`:

```bash
npm run assistant:db:migrate   # includes assistant_ingestion_runs when present
npm run assistant:db:verify
npm run assistant:ingest
```

Ingest is idempotent: unchanged `(unit_id, content_hash, embedding_model)` rows skip the Embeddings API. Logs include provenance (`canonical source → okf_concept_id → unit_id → content_hash → embedding_model`) and summary counts; each run records metadata in `assistant_ingestion_runs` with the OKF `manifest.json` `bundle_sha256`.

CI does not require `OPENAI_API_KEY`; unit tests mock embeddings.

### 6. Post corpus-expansion re-ingest acceptance

After [corpus coverage expansion](./corpus-coverage-expansion.md) ([#45](https://github.com/mastermichaelt/portfolio/pull/45)), the indexed corpus grows (**89** OKF concepts and **209** structure-aware retrieval units vs the prior bounded experiment’s **~61** units). Passing retrieval-eval on the old index does **not** guarantee passing on the expanded index — more units compete in top-K.

**Status (2026-10-08):** Operator acceptance **completed** for corpus expansion — ingest + retrieval eval on the portfolio-expanded index. Recorded figures: [corpus-coverage-expansion.md § Operational acceptance](./corpus-coverage-expansion.md#operational-acceptance). **Cross-repository corpus shipped** the same day — producers merged ([#48](https://github.com/mastermichaelt/portfolio/pull/48)–[#52](https://github.com/mastermichaelt/portfolio/pull/52)); eval acceptance: [cross-repository-corpus-eval-findings.md](./cross-repository-corpus-eval-findings.md). Archived plan: [2026-10-08-assistant-cross-repository-corpus.plan.md](../../.cursor/plans/archive/2026-10-08-assistant-cross-repository-corpus.plan.md).

**Operator sequence** (against the intended assistant `DATABASE_URL`, not `ASSISTANT_TEST_DATABASE_URL`) — repeat after future corpus or chunking changes:

1. **Ingest** — `npm run assistant:ingest` (runs `okf:build`, derives units in memory, embeds, syncs).
2. **Confirm index shape** — read ingest summary (upsert/skip/delete counts) and `assistant_ingestion_runs` / row count; expect unit count well above the prior ~61-unit experiment baseline.
3. **Retrieval eval** — with `DATABASE_URL` and `OPENAI_API_KEY` set:

   ```bash
   npm run test -- tests/assistant-retrieval-eval.test.ts
   ```

4. **Record outcomes** — if rankings regress, document in [corpus-coverage-expansion.md](./corpus-coverage-expansion.md) before weakening `tests/fixtures/assistant-retrieval/eval-cases.json`. Expanded competition is expected signal, not noise to fixture away without review.

### 7. Post career-inventory producer re-ingest

After [career-inventory snapshots](../../tests/fixtures/assistant-okf/career-inventory/README.md) ship (`career/*` OKF concepts):

1. **Concept count** — `npm run okf:build` → **94** concepts (was **89**; **+5** career concepts).
2. **Retrieval units** — run `npm run assistant:derive --write` and record the derived total. Structure-aware chunking means the unit delta is **not** equal to the concept delta (measure, do not assume one unit per new concept). Compare to the last accepted derive baseline (**209** units after corpus expansion).
3. **Ingest** — `npm run assistant:ingest`; use ingest summary counts. Ingest success does not substitute for publication review of snapshot bodies.

## Commands

| Command                         | Purpose                                                               |
| ------------------------------- | --------------------------------------------------------------------- |
| `npm run assistant:db:migrate`  | Apply Drizzle Kit migrations via `DATABASE_URL` (Strategy A)          |
| `npm run assistant:db:baseline` | One-time legacy database adoption into `drizzle.__drizzle_migrations` |
| `npm run assistant:db:verify`   | Schema + connectivity verification                                    |
| `npm run assistant:db:generate` | Generate SQL from `db/schema.ts` (Drizzle Kit)                        |
| `npm run assistant:db:studio`   | Optional Drizzle Studio (local schema inspection)                     |
| `npm run assistant:ingest`      | OKF build → derive → embed → upsert → delete stale                    |
| `npm run assistant:retrieve`    | Embed question + pgvector search (inspect retrieval)                  |
| `npm run assistant:answer`      | Shared RAG generation service (CLI adapter)                           |
| `POST /api/assistant/generate`  | Same service via App Router (production visitor API)                  |

Database commands are provider-neutral: they work against local Docker Postgres or hosted Neon depending solely on `DATABASE_URL`.
