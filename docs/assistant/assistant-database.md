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

2. Set `DATABASE_URL` in a gitignored `.env` (see `.env.example` for the local default).

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

Neon provisioning requires a human/account action. The repository does not store Neon credentials.

### 1. Provision or select a Neon target

Create or select a **dedicated** Neon project, branch, or database for the **assistant retrieval index** — not the future site `PortfolioRepository` store.

pgvector must be available on the target (Neon supports the `vector` extension).

### 2. Obtain a connection string

- **Migrations:** prefer a direct (non-pooled) connection string when Neon documents one for DDL/extension setup.
- **Runtime (`assistant:ingest`, `assistant:retrieve`):** pooled connection strings are acceptable for application-style read/write workloads.

Store the chosen URL only in gitignored `.env`, shell env, or a secrets manager — never commit it.

### 3. Configure `DATABASE_URL`

Export or set `DATABASE_URL` to the Neon assistant retrieval connection string. Assistant scripts read **only** this variable; they do not read site persistence configuration.

### 4. Apply repository migrations

```bash
npm run assistant:db:migrate
```

This runs the same portable migration runner used for local Docker. All DDL comes from `db/migrations/*.sql`.

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

### 7. Later ingest / retrieve configuration

`assistant:ingest` and `assistant:retrieve` (future slices) use the same `DATABASE_URL` assistant retrieval connection — local Docker for development, Neon for persistent hosted index. They do not introduce a second assistant database configuration surface.

## Commands

| Command                        | Purpose                                                 |
| ------------------------------ | ------------------------------------------------------- |
| `npm run assistant:db:migrate` | Apply `db/migrations/*.sql` in order via `DATABASE_URL` |
| `npm run assistant:db:verify`  | Schema + connectivity verification                      |

Both commands are provider-neutral: they work against local Docker Postgres or hosted Neon depending solely on `DATABASE_URL`.
