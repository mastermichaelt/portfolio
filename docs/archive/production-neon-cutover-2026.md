---
title: Production Neon cutover (2026)
status: archived
updated: 2026-10-29
related:
  - docs/assistant/assistant-database.md
  - drizzle/0000_assistant_initial.sql
  - db/schema.ts
---

# Production Neon cutover (archived)

> **Shipped 2026-10-29.** This document is a **historical record** of a one-time operator migration. It is **not** the ongoing schema workflow — use Drizzle migrations (`npm run assistant:db:migrate`) and `npm run assistant:db:verify` per [assistant-database.md](../assistant/assistant-database.md).

|                 |                                                                              |
| --------------- | ---------------------------------------------------------------------------- |
| **Completed**   | 2026-10-29                                                                   |
| **Source**      | Local Docker PostgreSQL (`portfolio_assistant`, 262 retrieval units)         |
| **Destination** | Neon PostgreSQL, project `portfolio-assistant`, Drizzle-managed schema       |
| **Result**      | 262 retrieval units migrated successfully                                    |
| **Integrity**   | Vector and full-row MD5 digests matched using `ORDER BY unit_id COLLATE "C"` |
| **Outcome**     | No embedding regeneration required                                           |

---

# Production Neon cutover runbook (original)

One-time **initialization and corpus transfer** for the **portfolio-assistant** Neon project.

**Context:** The public assistant is **not serving users** on Neon today. Primary holds a **partially initialized** schema (legacy artifacts possible), an **empty** retrieval table, and **no known irreplaceable data**. The validated **262** retrieval units (with existing embeddings) live on **local Docker**.

**Strategy:** Replace the Neon **`portfolio_assistant`** database with a **fresh empty** database, initialize schema with **`npm run assistant:db:migrate`** (Drizzle only — no legacy reconciliation, no baseline adoption), then **data-only import** of retrieval units from Docker.

This runbook does **not** replace [assistant-database.md](../assistant/assistant-database.md) Strategy A. It intentionally **discards** incomplete legacy state on Neon rather than repairing `schema_migrations` or running `assistant:db:baseline`.

**Agents must not run production steps without explicit operator approval.**

## Production safeguards

| Safeguard                                  | Action                                                                                                                                                               |
| ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Correct target**                         | Project **`portfolio-assistant`**, branch **`main` (Primary)**, database **`portfolio_assistant`**, **direct** connection (hostname must **not** contain `-pooler`). |
| **Inventory before destructive steps**     | Record schemas, application tables, and row counts. **Stop** if unexpected irreplaceable data appears.                                                               |
| **No recovery branch**                     | Not required — empty/replaceable Neon state; corpus preserved on Docker.                                                                                             |
| **No DROP/CREATE of tables during import** | Phase 5 imports into Drizzle-created tables only; do not hand-drop assistant tables to “fix” schema.                                                                 |
| **Database vs branch vs project**          | Recreate the **database** on Primary. Do **not** delete the Primary **branch** or entire **project** when database replacement suffices.                             |
| **Rate-limit data**                        | Not exported or imported. Fresh Drizzle schema creates an empty rate-limit table.                                                                                    |
| **Local corpus**                           | Do **not** drop or reset local Docker **`portfolio_assistant`** (262 rows).                                                                                          |

## Sequence overview

| Phase | Purpose                                                                    |
| ----- | -------------------------------------------------------------------------- |
| **1** | Production inventory (read-only)                                           |
| **2** | Recreate Neon `portfolio_assistant` database (destructive to that DB only) |
| **3** | Drizzle migrate + verify on empty database                                 |
| **4** | Export retrieval corpus from local Docker (T0)                             |
| **5** | Atomic data-only import into Neon (T)                                      |
| **6** | Production verification (V)                                                |

Repository commands: `npm run assistant:db:migrate`, `npm run assistant:db:verify` ([`scripts/assistant/db/`](../../scripts/assistant/db/)).

**Verified locally (2026-10-28):** Empty Postgres database `portfolio_assistant_fresh_init_test` on Docker pg16 → `assistant:db:migrate` → `assistant:db:verify --json` (`ok: true`, journal **1** row, three tables, `vector(1536)`, no `schema_migrations`) → second `migrate` idempotent. Disposable DB dropped after identity check. **Does not** prove Neon Console steps — operators must confirm branch/database names in Console before destructive work.

---

## Phase 1 — Production inventory

Run on Neon **Primary**, **direct** URL only. **Stop** if inventory contradicts expectations below.

### Neon Console (human)

| Check      | Expected                  |
| ---------- | ------------------------- |
| Project    | **`portfolio-assistant`** |
| Branch     | **`main`** (Primary)      |
| Database   | **`portfolio_assistant`** |
| Connection | **Direct** (not pooler)   |

Do **not** commit connection strings or passwords.

### SQL identity (read-only)

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "SELECT current_database() AS database_name;"
psql "$DATABASE_URL" -c '\conninfo'
```

Confirm `database_name = portfolio_assistant`, host matches Console **direct** endpoint, no `-pooler` in hostname.

### Full inventory

```sql
SELECT schema_name FROM information_schema.schemata
WHERE schema_name NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
ORDER BY schema_name;

SELECT schemaname, relname AS table_name, n_live_tup AS approx_rows
FROM pg_stat_user_tables
ORDER BY schemaname, relname;

SELECT COUNT(*) AS retrieval_rows FROM public.assistant_retrieval_units;
-- Expect: 0 for this cutover path

SELECT filename FROM public.schema_migrations ORDER BY filename;
-- May show partial legacy rows; will be destroyed in phase 2

SELECT COUNT(*) AS drizzle_journal_rows
FROM drizzle.__drizzle_migrations;
-- May error if drizzle schema absent pre-recreate; note state
```

**Stop conditions:**

- Non-zero **`assistant_retrieval_units`** rows unless operator explicitly accepts overwrite after phase 2.
- Any other table row counts that look like **irreplaceable production data** (operator judgment).
- Local Docker source no longer has **262** retrieval rows (see phase 4 preflight).

### Local Docker source check (read-only)

```bash
docker exec portfolio-assistant-postgres-1 psql -U portfolio -d portfolio_assistant -v ON_ERROR_STOP=1 -t -A \
  -c "SELECT COUNT(*) FROM public.assistant_retrieval_units;"
```

Expect **`262`**. Password/user: [`docker-compose.yml`](../../docker-compose.yml) (`POSTGRES_USER=portfolio`, `POSTGRES_PASSWORD=portfolio_dev`).

---

## Phase 2 — Recreate the Neon database

**Goal:** An empty **`portfolio_assistant`** database on branch **`main`**, same name as today so connection strings keep the same database segment (verify role/host unchanged in Console after recreate).

**Not in scope:** Deleting the Neon **project**, resetting the **Primary branch** object, or creating a recovery branch.

### Wrong-database prevention (mandatory before delete)

Complete this checklist **before** Option A or B. **Stop** if any item fails.

| Step | Check                                                                                                                                    |
| ---- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| 1    | Neon Console URL / project picker shows **`portfolio-assistant`** (not Savepoints, site DB, or another project).                         |
| 2    | Branch selector shows **`main`** / **Primary** — not a child or preview branch.                                                          |
| 3    | **Databases** list: identify the row named exactly **`portfolio_assistant`**. Do **not** delete `neondb`, `postgres`, or any other name. |
| 4    | Write the target name on operator notes: **`portfolio_assistant`** @ **`main`** @ **`portfolio-assistant`**.                             |
| 5    | For SQL (Option B): parse `DATABASE_URL` — connected database name must **not** be `portfolio_assistant`.                                |
| 6    | After delete, **create** database **`portfolio_assistant`** only — do not point migrate/import at `neondb` by mistake.                   |

### Option A — Neon Console (preferred)

1. Console → project **`portfolio-assistant`** → branch **`main`** (re-check checklist).
2. **Databases** → delete **`portfolio_assistant`** only (read the row label; confirm dialog name matches **`portfolio_assistant`** exactly).
3. **Create database** → name **`portfolio_assistant`** (same as before).
4. Re-copy the **direct** connection string for the recreated database.

**Consequences:** All objects in the old database (legacy `schema_migrations`, partial tables, empty retrieval table, any rate-limit rows) are **permanently removed**. Branch compute, other databases on the branch, and the project remain.

**Permissions:** Project member with database manage rights (typically owner/admin).

### Option B — SQL (same branch, different database session)

Connect to another database on **`main`** (Neon default is often **`neondb`**) using a **direct** URL — **not** to `portfolio_assistant` while dropping it.

```sql
-- Session must be attached to neondb (or another non-target DB), never portfolio_assistant.
SELECT current_database() AS connected_db;
-- connected_db must NOT be portfolio_assistant

DO $$
BEGIN
  IF current_database() = 'portfolio_assistant' THEN
    RAISE EXCEPTION 'refusing DROP: connect to neondb (or another database) first';
  END IF;
END $$;

SELECT pg_terminate_backend(pid)
FROM pg_stat_activity
WHERE datname = 'portfolio_assistant'
  AND pid <> pg_backend_pid();

DROP DATABASE portfolio_assistant;
CREATE DATABASE portfolio_assistant;
```

The `DROP` / `CREATE` names are literal — change them only if phase 1 inventory used a different **approved** database name (this runbook assumes **`portfolio_assistant`**).

### After recreate (verification)

New direct `DATABASE_URL` pointing at **`portfolio_assistant`**, then:

```sql
SELECT current_database() AS db;

SELECT COUNT(*) AS table_count
FROM information_schema.tables
WHERE table_schema = 'public';
-- Expect: 0

SELECT EXISTS (
  SELECT 1 FROM information_schema.schemata WHERE schema_name = 'drizzle'
) AS drizzle_schema_exists;
-- Expect: false
```

**Connection strings:** Database name unchanged → pooled and direct URLs usually need **no path change**; still re-copy from Console after recreate in case host/credentials rotated.

---

## Phase 3 — Initialize with Drizzle

**Preconditions:** Phase 2 complete; public schema empty; V0 identity reconfirmed.

From repository root, **direct** Neon URL only:

```bash
cd /path/to/portfolio
export DATABASE_URL='…direct neon…'   # never commit

npm run assistant:db:migrate
npm run assistant:db:verify -- --json
npm run assistant:db:migrate
npm run assistant:db:verify -- --json
```

**Do not run:**

- `npm run assistant:db:baseline`
- Legacy SQL under `db/migrations/`
- Manual `INSERT` into `public.schema_migrations`

**Expected after first migrate** (matches [`drizzle/0000_assistant_initial.sql`](../../drizzle/0000_assistant_initial.sql)):

- `CREATE EXTENSION vector` (via migration)
- Tables: `assistant_retrieval_units`, `assistant_ingestion_runs`, `assistant_api_rate_limit_counters`
- `embedding` column **`vector(1536)`**
- Primary keys and indexes from migration (including rate-limit window index, ingestion `finished_at`, retrieval `source_class` / `okf_concept_id`)
- `drizzle.__drizzle_migrations` records **1** migration
- No requirement for legacy `schema_migrations`

**Fresh-database guard in code:** [`runMigrations`](../../scripts/assistant/db/migrate.mjs) only refuses when assistant tables exist **without** a Drizzle journal (`LegacyAdoptionRequiredError`). Empty database → normal migrate.

Second **`migrate`** + **`verify`** confirms idempotency.

---

## Canonical integrity digest (phase 4 and 5)

Use the **identical** SQL on **local Docker (phase 4)** and **Neon inside phase 5** before `COMMIT`.

**Collation:** Every ordered aggregate must use `ORDER BY unit_id COLLATE "C"`. Default database collations differ between local Docker Postgres and Neon (and can differ from JavaScript sort order), so plain `ORDER BY unit_id` produces environment-local MD5 digests even when row data is identical. Explicit `"C"` sort makes source, dump-import, and destination fingerprints comparable.

| Rule         | Detail                                                                                   |
| ------------ | ---------------------------------------------------------------------------------------- |
| Shape        | One **JSON array of 16 values** per row (`jsonb_build_array`), then `md5(payload::text)` |
| NULL         | SQL `NULL` → JSON `null` (distinct from `""` or empty arrays/objects)                    |
| Text         | Scalar columns passed through unchanged (no `coalesce` to `''`)                          |
| JSONB        | `sources` and `metadata` embedded as JSON values (not flattened strings)                 |
| Timestamps   | UTC text: `to_char(col AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')`             |
| Vector       | `embedding::text` (pgvector storage literal)                                             |
| Table digest | `md5(string_agg(row_digest, E'\n' ORDER BY unit_id COLLATE "C"))`                        |
| Failure      | `RAISE EXCEPTION` in phase 5 before `COMMIT`                                             |

**Column order in the array (16):** `unit_id`, `okf_concept_id`, `okf_version`, `source_class`, `type`, `title`, `resource`, `retrieval_text`, `content_hash`, `embedding_model`, `embedding::text`, `sources`, `metadata`, `embedded_at` (UTC text), `created_at` (UTC text), `updated_at` (UTC text).

**Per-row digest** — copy verbatim into phase 4 and phase 5:

```sql
md5(
  jsonb_build_array(
    unit_id,
    okf_concept_id,
    okf_version,
    source_class,
    type,
    title,
    resource,
    retrieval_text,
    content_hash,
    embedding_model,
    embedding::text,
    sources,
    metadata,
    to_char(embedded_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
    to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
  )::text
)
```

**Vector fingerprint** (secondary; embeddings also covered in the JSON array):

```sql
md5(string_agg(
  unit_id || '|' || content_hash || '|' || embedding::text,
  E'\n' ORDER BY unit_id COLLATE "C"
))
```

**Full-table digest:**

```sql
SELECT md5(string_agg(row_digest, E'\n' ORDER BY unit_id COLLATE "C")) AS expected_full_row_fp
FROM (
  SELECT
    unit_id,
    md5(
      jsonb_build_array(
        unit_id,
        okf_concept_id,
        okf_version,
        source_class,
        type,
        title,
        resource,
        retrieval_text,
        content_hash,
        embedding_model,
        embedding::text,
        sources,
        metadata,
        to_char(embedded_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
        to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
        to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
      )::text
    ) AS row_digest
  FROM public.assistant_retrieval_units
) s;
```

---

## Phase 4 — Export retrieval corpus (local Docker)

**Source:** `localhost:5433`, database **`portfolio_assistant`**, container **`portfolio-assistant-postgres-1`**.

**Do not export:** legacy `schema_migrations`, `drizzle.*`, rate-limit counters, ingestion-run history.

### Integrity (immediately before export)

Recompute constants for phase 5. Example from **2026-10-28** local Docker:

| Constant               | Example                            |
| ---------------------- | ---------------------------------- |
| `expected_rows`        | `262`                              |
| `expected_vector_fp`   | `93b7730bc543b9dd498005a5d66aba9f` |
| `expected_full_row_fp` | `c298f24809625b9f6894822656e7945a` |

```sql
SELECT COUNT(*)::bigint FROM public.assistant_retrieval_units;
-- plus canonical digest queries above
```

### Data-only export

```bash
export PGPASSWORD='…'   # POSTGRES_PASSWORD from docker-compose; do not commit

pg_dump \
  -h localhost -p 5433 -U portfolio -d portfolio_assistant \
  --data-only \
  --table=public.assistant_retrieval_units \
  --no-owner --no-privileges \
  -f assistant_retrieval_units_data.sql
```

File must contain **`COPY public.assistant_retrieval_units`** (or equivalent) and **must not** contain `CREATE TABLE`.

---

## Phase 5 — Atomic import (single `psql` session)

**Preconditions:** Phase 3 complete; Neon **`assistant_retrieval_units`** empty; export + digests ready; direct URL.

Create **`import_atomic.sql`** beside the dump. Set `expected_*` from phase 4.

```sql
-- import_atomic.sql — psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f import_atomic.sql

BEGIN;

LOCK TABLE public.assistant_retrieval_units IN EXCLUSIVE MODE;

DO $$
DECLARE
  existing_rows bigint;
BEGIN
  SELECT COUNT(*) INTO existing_rows FROM public.assistant_retrieval_units;
  IF existing_rows <> 0 THEN
    RAISE EXCEPTION 'assistant_retrieval_units must be empty before import (found % rows)', existing_rows;
  END IF;
END $$;

\i assistant_retrieval_units_data.sql

DO $$
DECLARE
  row_count bigint;
  vector_fp text;
  full_row_fp text;
  expected_rows bigint := 262;
  expected_vector_fp text := '93b7730bc543b9dd498005a5d66aba9f';
  expected_full_row_fp text := 'c298f24809625b9f6894822656e7945a';
BEGIN
  SELECT COUNT(*) INTO row_count FROM public.assistant_retrieval_units;
  IF row_count <> expected_rows THEN
    RAISE EXCEPTION 'row count after import (%) <> expected (%)', row_count, expected_rows;
  END IF;

  SELECT md5(string_agg(
    unit_id || '|' || content_hash || '|' || embedding::text,
    E'\n' ORDER BY unit_id COLLATE "C"
  ))
  INTO vector_fp
  FROM public.assistant_retrieval_units;

  IF vector_fp IS DISTINCT FROM expected_vector_fp THEN
    RAISE EXCEPTION 'vector fingerprint mismatch (got %, expected %)', vector_fp, expected_vector_fp;
  END IF;

  SELECT md5(string_agg(row_digest, E'\n' ORDER BY unit_id COLLATE "C"))
  INTO full_row_fp
  FROM (
    SELECT
      unit_id,
      md5(
        jsonb_build_array(
          unit_id,
          okf_concept_id,
          okf_version,
          source_class,
          type,
          title,
          resource,
          retrieval_text,
          content_hash,
          embedding_model,
          embedding::text,
          sources,
          metadata,
          to_char(embedded_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
          to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'),
          to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')
        )::text
      ) AS row_digest
    FROM public.assistant_retrieval_units
  ) ordered;

  IF full_row_fp IS DISTINCT FROM expected_full_row_fp THEN
    RAISE EXCEPTION 'full-row integrity digest mismatch (got %, expected %)', full_row_fp, expected_full_row_fp;
  END IF;
END $$;

COMMIT;
```

```bash
cd /path/to/directory/containing/sql/files
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f import_atomic.sql
```

Embeddings are preserved via `pg_dump` / `COPY` — **no** embedding API calls.

All row-count, vector, and full-row checks run **inside the same transaction** before `COMMIT`; any mismatch aborts the import with no committed rows.

---

## Transaction semantics (`psql`)

Use **`psql -v ON_ERROR_STOP=1`** for phase 5 (and optional phase 2 SQL).

| Behavior                | Detail                                                                          |
| ----------------------- | ------------------------------------------------------------------------------- |
| **Single session**      | `BEGIN`, empty check, `\i`, verification, `COMMIT` in one file — do not split.  |
| **On error**            | `psql` exits non-zero; **`COMMIT` is not run**.                                 |
| **Rollback**            | Failed transaction rolls back on disconnect; no partial corpus committed.       |
| **After failed import** | Reconnect; confirm retrieval table **empty**; fix dump/digests; re-run phase 5. |
| **Lock**                | `EXCLUSIVE` on `assistant_retrieval_units` until commit or rollback.            |

---

## Phase 6 — Verify production

1. Re-run phase 1 identity queries (read-only).
2. `npm run assistant:db:verify -- --json` on Neon direct URL — `"ok": true`.
3. Optional SQL:

```sql
SELECT COUNT(*) FROM public.assistant_retrieval_units;
```

4. Retrieval eval (requires `OPENAI_API_KEY`):

```bash
export DATABASE_URL='…direct neon…'
npm run test -- tests/assistant-retrieval-eval.test.ts
```

5. CLI smoke:

```bash
npm run assistant:retrieve -- "experimentation infrastructure" --top-k 3
```

6. **Vercel / production app:** Confirm existing **`DATABASE_URL`** still targets the same Neon project, branch, and database name after recreate. **Do not** change Vercel env vars in this runbook without explicit approval — only verify whether Console recreate invalidated secrets or hostnames.

**Stop if:** verify fails, digest mismatch on re-check, or eval regressions without review.

---

## Unresolved operational risks

| Risk                                 | Mitigation                                                                              |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| Wrong Neon project/branch/database   | Phase 1 Console + `\conninfo` before every destructive step                             |
| `DROP DATABASE` on wrong session     | Connect to `neondb` (or other), not `portfolio_assistant`                               |
| Stale digest constants               | Recompute in phase 4 immediately before phase 5                                         |
| Local corpus drift                   | Re-export if Docker rows ≠ 262                                                          |
| Active connections block drop        | `pg_terminate_backend` before `DROP DATABASE`                                           |
| Committed bad import                 | Manual delete rows or repeat phase 2+ (destructive) — prevention via pre-commit digests |
| `gen_random_uuid()` on fresh migrate | Required by Drizzle migration; Neon provides it (via `pgcrypto`)                        |

---

## After cutover (historical — completed 2026-10-29)

- Cutover phases 1–6 completed; hosted index holds **262** units with verified retrieval eval and CLI smoke against Neon.
- Ongoing schema changes: **`npm run assistant:db:migrate`** + **`npm run assistant:db:verify`** only — not database recreation.
- First Neon **`npm run assistant:ingest`** (operator-approved direct URL) will populate `assistant_ingestion_runs` when you choose to sync OKF on the hosted index.
