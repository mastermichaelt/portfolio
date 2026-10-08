# Assistant retrieval database

Postgres + pgvector backing store for the assistant retrieval experiment. **Dev tooling only** — not used by `app/` routes or the Vercel deploy.

## Two Postgres concerns (do not conflate)

| Concern                       | Role                                          | Connection config                                               | Migrations                    |
| ----------------------------- | --------------------------------------------- | --------------------------------------------------------------- | ----------------------------- |
| **Site content persistence**  | Future `PortfolioRepository` adapter          | Not implemented (future env var, e.g. `PORTFOLIO_DATABASE_URL`) | Future site schema            |
| **Assistant retrieval index** | Derived pgvector store for semantic retrieval | `DATABASE_URL` (assistant scripts only)                         | `db/migrations/` in this repo |

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

Repository-owned SQL under `db/migrations/` is the **only** source of truth for assistant schema creation. Do not hand-create `assistant_retrieval_units` in the Neon console.

The initial migration enables pgvector and creates `assistant_retrieval_units` with `embedding vector(1536)` for `text-embedding-3-small`. Changing model or dimensionality requires a new migration and full re-embed.

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

Integration tests in `tests/assistant-db.test.ts` use the same `DATABASE_URL` and skip when unset.

## Hosted Neon deployment (operator workflow)

**Slice:** `neon-deployment` (prerequisite before `ingest-sync`).

Neon provisioning is an account/dashboard action. The repository does not store Neon credentials or connection strings.

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

This runs the same portable migration runner used for local Docker. All DDL comes from `db/migrations/*.sql` and is recorded on that branch's database only.

### 5. Verify schema

```bash
npm run assistant:db:verify
```

Confirms connectivity, `CREATE EXTENSION vector`, migration state, `assistant_retrieval_units`, `vector(1536)`, and absence of ANN indexes.

JSON output for automation:

```bash
npm run assistant:db:verify -- --json
```

### 6. Manual SQL verification (optional)

Equivalent checks without the CLI:

```sql
SELECT extname FROM pg_extension WHERE extname = 'vector';

SELECT filename
FROM schema_migrations
WHERE filename = '20261007100000_assistant_pgvector.sql';

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
- `schema_migrations` and `20261007100000_assistant_pgvector.sql` recorded
- `assistant_retrieval_units` with `embedding` type `vector(1536)`
- no ANN vector index on `assistant_retrieval_units`

CI does not require Neon; this verification is operator-run with secrets.

### 8. Ingest / retrieve configuration

`assistant:ingest` and `assistant:retrieve` (later slice) use the same `DATABASE_URL` assistant retrieval connection — local Docker for development, Neon (direct or pooled) for persistent hosted index. They do not introduce a second assistant database configuration surface.

Optional: use the **pooled** Neon connection string for long-running ingest/retrieve while keeping the **direct** string for migrations after schema changes.

## OpenAI Embeddings API (operator workflow)

**Prerequisite:** complete hosted Neon migrate/verify above before the first **live** ingest that calls OpenAI.

**Separation from Codenames:** use a dedicated OpenAI API **project** named `portfolio-assistant`. Do not reuse the OpenAI **Default** project (or its keys) used by Codenames AI — separate billing, usage visibility, and blast radius.

### 1. Create or select the OpenAI project

1. Sign in to the [OpenAI platform](https://platform.openai.com/).
2. Create or open the **`portfolio-assistant`** API project.

### 2. Issue a project-scoped Embeddings key

1. In that project, create an API key with access to the **Embeddings** API.
2. Store the key only in gitignored `.env.local` (local) or runtime secrets (Cursor Cloud / CI when explicitly configured) as `OPENAI_API_KEY`.
3. **Never commit** the key, key IDs, or secret values. Do not paste secrets into PRs or issues.

### 3. Budget and alerts

Configure a modest **project budget** and **usage alerts** on `portfolio-assistant` before bulk ingest experiments.

### 4. Confirm model access (smoke test)

The assistant index is fixed to **`text-embedding-3-small` at 1536 dimensions** (`vector(1536)` in Postgres). Before the first full ingest:

1. Ensure `OPENAI_API_KEY` is set (portfolio-assistant project).
2. Run a one-off embeddings smoke (any of):
   - `node --input-type=module -e "import { embedTexts } from './scripts/assistant/embeddings/openai-embeddings.mjs'; const v = await embedTexts(['smoke']); console.log(v[0].length);"`
   - Or run `npm run assistant:ingest` only after this passes.
3. Expect vector length **1536**. Fail closed if Embeddings access is missing or dimensions differ.

Optional override `ASSISTANT_EMBEDDING_MODEL` is validated against the supported index model only — changing model requires a schema migration and full re-embed (see migration comments).

### 5. First live ingest acceptance

With `DATABASE_URL` pointing at migrated assistant retrieval Postgres (local Docker or Neon) and `OPENAI_API_KEY` from `portfolio-assistant`:

```bash
npm run assistant:db:migrate   # includes assistant_ingestion_runs when present
npm run assistant:db:verify
npm run assistant:ingest
```

Ingest is idempotent: unchanged `(unit_id, content_hash, embedding_model)` rows skip the Embeddings API. Logs include provenance (`canonical source → okf_concept_id → unit_id → content_hash → embedding_model`) and summary counts; each run records metadata in `assistant_ingestion_runs` with the OKF `manifest.json` `bundle_sha256`.

CI does not require `OPENAI_API_KEY`; unit tests mock embeddings.

## Commands

| Command                        | Purpose                                                 |
| ------------------------------ | ------------------------------------------------------- |
| `npm run assistant:db:migrate` | Apply `db/migrations/*.sql` in order via `DATABASE_URL` |
| `npm run assistant:db:verify`  | Schema + connectivity verification                      |
| `npm run assistant:ingest`     | OKF build → derive → embed → upsert → delete stale      |

Database commands are provider-neutral: they work against local Docker Postgres or hosted Neon depending solely on `DATABASE_URL`.
