---
title: Production Neon cutover runbook
status: operator
updated: 2026-10-28
related:
  - docs/assistant/assistant-database.md
  - db/migrations/
  - drizzle/0000_assistant_initial.sql
---

# Production Neon cutover runbook

One-time **initialization and data transfer** for **portfolio-assistant** Neon Primary. The public assistant is **not in active production use** today: schema is reproducible from repository migrations, and the validated **262** retrieval units live on **local Docker** until this procedure loads them on Neon.

Typical Primary state before cutover:

- Legacy migration history is **incomplete** (only `20261007100000_assistant_pgvector.sql` recorded).
- **`assistant_ingestion_runs`** is missing.
- **`assistant_api_rate_limit_counters`** exists (possibly without a matching `schema_migrations` row).
- **`assistant_retrieval_units`** is **empty** on Neon.
- Drizzle **baseline** has not run (`drizzle.__drizzle_migrations` absent).

This runbook does **not** replace [assistant-database.md](./assistant-database.md) Strategy A migration policy. It uses **manual SQL** for legacy reconciliation only — there is no second migration runner in the repository. Forward DDL remains **`npm run assistant:db:migrate`** after baseline.

**Agents must not run production steps without explicit operator approval.**

## Production safeguards

Apply on every write phase (R2, R3, B, T):

| Safeguard                  | Action                                                                                                                                                                           |
| -------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Correct target**         | Neon project **`portfolio-assistant`**, branch **`main` (Primary)**, database **`portfolio_assistant`**, **direct** endpoint (hostname must **not** contain `-pooler`).          |
| **Identity before writes** | Re-run V0 Console checklist + `current_database()` + `\conninfo` immediately before R2, B, and T.                                                                                |
| **Read-only inventory**    | Confirm table presence and row counts in R1/V0. **Stop** if `assistant_retrieval_units` is non-empty when initialization expects **0** rows, or if required objects are missing. |
| **No destructive reset**   | Do **not** `DROP` or `CREATE` replacement tables for retrieval or rate limits. R2 creates only the missing ingestion table; R3 records history only.                             |
| **Irreplaceable data**     | If Neon holds unexpected non-empty retrieval data (or other state that this runbook cannot reconcile without data loss), **stop** and resolve out of band — do not overwrite.    |
| **Rate-limit data**        | Do **not** import, truncate, or `UPDATE` `assistant_api_rate_limit_counters`. Import touches **`assistant_retrieval_units` only**.                                               |
| **Atomic import**          | Phase **T** uses one `psql` session (`BEGIN` … verification … `COMMIT`). Verification failures **`RAISE EXCEPTION`** before `COMMIT`.                                            |

**Failure recovery:** Errors inside an open transaction (R2, R3, T with `ON_ERROR_STOP=1`) leave the transaction uncommitted; PostgreSQL discards that work when the session ends. Re-run the failed phase after fixing the cause. This is **not** a live-traffic migration — no Neon branch backup procedure is required.

## Sequence overview

| Phase  | Purpose                                                                          |
| ------ | -------------------------------------------------------------------------------- |
| **V0** | Destination identity (before any write)                                          |
| **R1** | Read-only preflight                                                              |
| **R2** | Migration 2 DDL + `schema_migrations` (single transaction)                       |
| **R3** | Rate-limit schema parity verification + migration 3 history (single transaction) |
| **B**  | Drizzle baseline → verify → migrate → verify (**direct** URL)                    |
| **T0** | Source export + integrity digests (local Docker, read-only)                      |
| **T**  | Atomic data-only import of `assistant_retrieval_units` (single `psql` session)   |
| **V**  | Post-cutover verification (Neon retrieval eval / CLI)                            |

Repository commands referenced: `npm run assistant:db:baseline`, `assistant:db:verify`, `assistant:db:migrate` ([`scripts/assistant/db/`](../../scripts/assistant/db/)).

---

## V0 — Destination identity (before any write)

### Neon Console (human)

Confirm all of the following **before** exporting credentials into a shell:

| Check                  | Expected                                                              |
| ---------------------- | --------------------------------------------------------------------- |
| Organization / project | **`portfolio-assistant`**                                             |
| Branch                 | **`main`** (shown as **Primary** in the UI)                           |
| Database name          | **`portfolio_assistant`**                                             |
| Connect string         | Copy the **direct** connection string (not **pooled** / not “pooler”) |

Do **not** commit connection strings, passwords, or tokens.

### SQL + psql identity (direct session, read-only)

Set `DATABASE_URL` in the shell to the **direct** Neon URL only (never commit it). Then:

```bash
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -c "SELECT current_database() AS database_name;"
psql "$DATABASE_URL" -c '\conninfo'
```

Operator checks (no secrets in logs shared publicly):

- `database_name` is **`portfolio_assistant`**.
- `\conninfo` host matches the Neon Console **direct** endpoint for branch **`main`** (compare hostname visually).
- Hostname must **not** contain **`-pooler`** (abort if pooled).
- Project name is **not** encoded in SQL — the Console checklist above is authoritative for project/branch.

Record baseline inventory on Primary (read-only). **Stop** if retrieval row count is not **0** for this initialization path:

```sql
SELECT COUNT(*) AS retrieval_rows FROM public.assistant_retrieval_units;
-- Expect: 0 for initialization; stop if non-zero

SELECT COUNT(*) AS rate_limit_rows FROM public.assistant_api_rate_limit_counters;
-- Informational only; do not modify rate-limit data in this runbook

SELECT filename FROM public.schema_migrations ORDER BY filename;
```

---

## R1 — Read-only preflight

Run on **Primary** direct connection. **Stop** if any check fails.

```sql
SELECT current_database() AS db;

SELECT filename FROM public.schema_migrations ORDER BY filename;
-- Expect exactly: 20261007100000_assistant_pgvector.sql

SELECT COUNT(*) AS retrieval_rows FROM public.assistant_retrieval_units;
-- Expect: 0 — stop if unexpected rows (irreplaceable without explicit operator decision)

SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'assistant_ingestion_runs'
) AS ingestion_runs_exists;
-- Expect: false

SELECT EXISTS (
  SELECT 1 FROM information_schema.tables
  WHERE table_schema = 'public' AND table_name = 'assistant_api_rate_limit_counters'
) AS rate_limit_exists;
-- Expect: true

SELECT extname FROM pg_extension WHERE extname = 'vector';
-- Expect: vector

SELECT format_type(a.atttypid, a.atttypmod) AS embedding_type
FROM pg_attribute a
JOIN pg_class c ON a.attrelid = c.oid
JOIN pg_namespace n ON c.relnamespace = n.oid
WHERE n.nspname = 'public'
  AND c.relname = 'assistant_retrieval_units'
  AND a.attname = 'embedding'
  AND NOT a.attisdropped;
-- Expect: vector(1536)

SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'assistant_retrieval_units'
ORDER BY indexname;
-- Expect: assistant_retrieval_units_okf_concept_id_idx, assistant_retrieval_units_source_class_idx
```

---

## R2 — Migration 2 (atomic DDL + history)

**Preconditions:** R1 passed; `assistant_ingestion_runs` absent; migration 2 not in `schema_migrations`.

Verbatim DDL from [`db/migrations/20261008100000_assistant_ingestion_runs.sql`](../../db/migrations/20261008100000_assistant_ingestion_runs.sql).

```sql
BEGIN;

DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'assistant_ingestion_runs'
  ) THEN
    RAISE EXCEPTION 'assistant_ingestion_runs already exists';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.schema_migrations
    WHERE filename = '20261008100000_assistant_ingestion_runs.sql'
  ) THEN
    RAISE EXCEPTION 'migration 2 already recorded in schema_migrations';
  END IF;
END $$;

CREATE TABLE assistant_ingestion_runs (
  run_id              uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  okf_bundle_sha256   text NOT NULL,
  embedding_model     text NOT NULL,
  inserted_count      integer NOT NULL DEFAULT 0,
  updated_count       integer NOT NULL DEFAULT 0,
  deleted_count       integer NOT NULL DEFAULT 0,
  skipped_count       integer NOT NULL DEFAULT 0,
  started_at          timestamptz NOT NULL,
  finished_at         timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX assistant_ingestion_runs_finished_at_idx
  ON assistant_ingestion_runs (finished_at DESC);

INSERT INTO public.schema_migrations (filename)
VALUES ('20261008100000_assistant_ingestion_runs.sql');

COMMIT;
```

Execute with `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f r2.sql`.

See [Transaction semantics (`psql`)](#transaction-semantics-psql) below.

---

## R3 — Rate-limit schema parity + migration 3 history only

**Preconditions:** R2 committed; rate-limit table exists; migration 3 **not** recorded.

Authoritative DDL: [`db/migrations/20261016100000_assistant_api_rate_limits.sql`](../../db/migrations/20261016100000_assistant_api_rate_limits.sql).

### R3a — Schema parity (read-only; must pass before R3b)

Run **`r3a_verify.sql`** on Primary. **Do not run R3b** unless this script completes with no error.

```sql
-- r3a_verify.sql — psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f r3a_verify.sql
DO $$
DECLARE
  col_type text;
  col_notnull boolean;
  col_default text;
  idxdef text;
  pkdef text;
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'assistant_api_rate_limit_counters'
  ) THEN
    RAISE EXCEPTION 'assistant_api_rate_limit_counters missing';
  END IF;

  IF (SELECT count(*) FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'assistant_api_rate_limit_counters') <> 3 THEN
    RAISE EXCEPTION 'expected exactly 3 columns on assistant_api_rate_limit_counters';
  END IF;

  SELECT format_type(a.atttypid, a.atttypmod), a.attnotnull, pg_get_expr(d.adbin, d.adrelid)
  INTO col_type, col_notnull, col_default
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
  WHERE n.nspname = 'public' AND c.relname = 'assistant_api_rate_limit_counters'
    AND a.attname = 'bucket_key' AND NOT a.attisdropped;
  IF col_type IS NULL OR col_type <> 'text' OR NOT col_notnull THEN
    RAISE EXCEPTION 'bucket_key must be text NOT NULL (got %, notnull %)', col_type, col_notnull;
  END IF;

  SELECT format_type(a.atttypid, a.atttypmod), a.attnotnull, pg_get_expr(d.adbin, d.adrelid)
  INTO col_type, col_notnull, col_default
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  LEFT JOIN pg_attrdef d ON d.adrelid = a.attrelid AND d.adnum = a.attnum
  WHERE n.nspname = 'public' AND c.relname = 'assistant_api_rate_limit_counters'
    AND a.attname = 'count' AND NOT a.attisdropped;
  IF col_type IS NULL OR col_type <> 'integer' OR NOT col_notnull OR col_default IS DISTINCT FROM '1' THEN
    RAISE EXCEPTION 'count must be integer NOT NULL DEFAULT 1 (got type %, default %)', col_type, col_default;
  END IF;

  SELECT format_type(a.atttypid, a.atttypmod), a.attnotnull
  INTO col_type, col_notnull
  FROM pg_attribute a
  JOIN pg_class c ON c.oid = a.attrelid
  JOIN pg_namespace n ON n.oid = c.relnamespace
  WHERE n.nspname = 'public' AND c.relname = 'assistant_api_rate_limit_counters'
    AND a.attname = 'window_ends_at' AND NOT a.attisdropped;
  IF col_type IS NULL OR col_type <> 'timestamp with time zone' OR NOT col_notnull THEN
    RAISE EXCEPTION 'window_ends_at must be timestamptz NOT NULL';
  END IF;

  SELECT pg_get_constraintdef(con.oid)
  INTO pkdef
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
  WHERE nsp.nspname = 'public'
    AND rel.relname = 'assistant_api_rate_limit_counters'
    AND con.contype = 'p';
  IF pkdef IS DISTINCT FROM 'PRIMARY KEY (bucket_key)' THEN
    RAISE EXCEPTION 'primary key mismatch (got %)', pkdef;
  END IF;

  SELECT indexdef INTO idxdef
  FROM pg_indexes
  WHERE schemaname = 'public'
    AND tablename = 'assistant_api_rate_limit_counters'
    AND indexname = 'assistant_api_rate_limit_counters_window_ends_at_idx';
  IF idxdef IS DISTINCT FROM
    'CREATE INDEX assistant_api_rate_limit_counters_window_ends_at_idx ON public.assistant_api_rate_limit_counters USING btree (window_ends_at)' THEN
    RAISE EXCEPTION 'index assistant_api_rate_limit_counters_window_ends_at_idx mismatch (got %)', idxdef;
  END IF;
END $$;
```

If R3a raises, **stop**. Repair drift manually (outside this runbook’s automated steps) until parity matches the migration file, then re-run R3a.

### R3b — History insert (only after R3a passes)

```sql
BEGIN;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = 'assistant_api_rate_limit_counters'
  ) THEN
    RAISE EXCEPTION 'assistant_api_rate_limit_counters missing';
  END IF;
  IF EXISTS (
    SELECT 1 FROM public.schema_migrations
    WHERE filename = '20261016100000_assistant_api_rate_limits.sql'
  ) THEN
    RAISE EXCEPTION 'migration 3 already recorded';
  END IF;
END $$;

INSERT INTO public.schema_migrations (filename)
VALUES ('20261016100000_assistant_api_rate_limits.sql');

COMMIT;
```

Execute with `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f r3b.sql`.

### Baseline eligibility check

```sql
SELECT filename FROM public.schema_migrations
WHERE filename IN (
  '20261007100000_assistant_pgvector.sql',
  '20261008100000_assistant_ingestion_runs.sql',
  '20261016100000_assistant_api_rate_limits.sql'
)
ORDER BY filename;
-- Expect 3 rows
```

Matches [`assessLegacyBaselineEligibility`](../../scripts/assistant/db/legacy-baseline.mjs) table + history requirements.

---

## B — Drizzle baseline (direct URL only)

**Preconditions:** R1–R3 complete; `drizzle.__drizzle_migrations` empty; V0 identity checks passed.

```bash
cd /path/to/portfolio
export DATABASE_URL='…direct neon…'   # never commit

npm run assistant:db:baseline
npm run assistant:db:verify -- --json
npm run assistant:db:migrate
npm run assistant:db:verify -- --json
```

**Expected:**

- Baseline: `legacy baseline adoption complete`
- Verify: `"ok": true`, `drizzle_migration_journal` records **1** migration
- Migrate: `drizzle migrate complete` (no-op if journal already current)
- Vercel **pooled** `DATABASE_URL` is unchanged; only operator shell uses direct for B.

If `LegacyBaselineIneligibleError` or `LegacyAdoptionRequiredError`, stop and re-read R1–R3.

---

## Canonical integrity digest (T0 and T)

Use the **same** expressions on **local Docker (T0)** and **Neon inside phase T** before `COMMIT`.

Rules:

- **All 16 columns** on `assistant_retrieval_units` (see migration 1).
- **NULL text fields:** `coalesce(..., '')`.
- **JSONB (`sources`, `metadata`):** `coalesce(column::text, '')` — PostgreSQL emits canonical JSON text for `jsonb`.
- **Timestamps (`embedded_at`, `created_at`, `updated_at`):** UTC-normalized via `to_char(col AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"')` so digest does not depend on session `TimeZone`.
- **Vector (`embedding`):** `embedding::text` — exact pgvector literal form used in storage.
- **Ordering:** aggregate with `ORDER BY unit_id`.
- **Failure:** `RAISE EXCEPTION` in phase T if row count, vector fingerprint, or full-row digest does not match T0 constants (never reach `COMMIT`).

**Per-row digest** (inner `md5`):

```sql
md5(
  coalesce(unit_id, '') || E'\x1e' ||
  coalesce(okf_concept_id, '') || E'\x1e' ||
  coalesce(okf_version, '') || E'\x1e' ||
  coalesce(source_class, '') || E'\x1e' ||
  coalesce(type, '') || E'\x1e' ||
  coalesce(title, '') || E'\x1e' ||
  coalesce(resource, '') || E'\x1e' ||
  coalesce(retrieval_text, '') || E'\x1e' ||
  coalesce(content_hash, '') || E'\x1e' ||
  coalesce(embedding_model, '') || E'\x1e' ||
  coalesce(embedding::text, '') || E'\x1e' ||
  coalesce(sources::text, '') || E'\x1e' ||
  coalesce(metadata::text, '') || E'\x1e' ||
  coalesce(to_char(embedded_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'), '') || E'\x1e' ||
  coalesce(to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'), '') || E'\x1e' ||
  coalesce(to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'), '')
)
```

**Vector fingerprint** (secondary check; embedding preserved via `::text`):

```sql
md5(string_agg(
  unit_id || '|' || content_hash || '|' || embedding::text,
  E'\n' ORDER BY unit_id
))
```

**Full-table digest:**

```sql
md5(string_agg(row_digest, E'\n' ORDER BY unit_id))
-- where row_digest is the per-row md5 above
```

---

## T0 — Source export and digests (local Docker)

Source: `localhost:5433`, database `portfolio_assistant`, user `portfolio`, container `portfolio-assistant-postgres-1` ([`docker-compose.yml`](../../docker-compose.yml)).

### Integrity queries (run on source immediately before export)

Replace constants in phase **T** with these results. Example values from **2026-10-28** local Docker (recompute every cutover):

| Constant               | Example (2026-10-28)               |
| ---------------------- | ---------------------------------- |
| `expected_rows`        | `262`                              |
| `expected_vector_fp`   | `b98ec06f8ebfee83f81b8beae40cfd24` |
| `expected_full_row_fp` | `593f2edc79f138fc6960f33dc7e13033` |

**Row count:**

```sql
SELECT COUNT(*)::bigint AS expected_rows FROM public.assistant_retrieval_units;
```

Run the [canonical integrity digest](#canonical-integrity-digest-t0-and-t) queries for `expected_vector_fp` and `expected_full_row_fp`.

### Data-only export

```bash
export PGPASSWORD='…'   # local Docker: see docker-compose POSTGRES_PASSWORD; do not commit

pg_dump \
  -h localhost -p 5433 -U portfolio -d portfolio_assistant \
  --data-only \
  --table=public.assistant_retrieval_units \
  --no-owner --no-privileges \
  -f assistant_retrieval_units_data.sql
```

Inspect the file: must contain `COPY public.assistant_retrieval_units` (or equivalent data statements) and **must not** contain `CREATE TABLE`.

---

## T — Atomic data import (single `psql` session)

**Preconditions:** Phase B complete; Neon retrieval table empty; export file present; digests recorded; V0 identity reconfirmed.

Create **`import_atomic.sql`** in the **same directory** as `assistant_retrieval_units_data.sql`. Set the three `expected_*` constants from T0.

```sql
-- import_atomic.sql — run: psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f import_atomic.sql
-- DATABASE_URL must be Neon DIRECT (non-pooler).

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
  expected_vector_fp text := 'b98ec06f8ebfee83f81b8beae40cfd24';
  expected_full_row_fp text := '593f2edc79f138fc6960f33dc7e13033';
BEGIN
  SELECT COUNT(*) INTO row_count FROM public.assistant_retrieval_units;
  IF row_count <> expected_rows THEN
    RAISE EXCEPTION 'row count after import (%) <> expected (%)', row_count, expected_rows;
  END IF;

  SELECT md5(string_agg(
    unit_id || '|' || content_hash || '|' || embedding::text,
    E'\n' ORDER BY unit_id
  ))
  INTO vector_fp
  FROM public.assistant_retrieval_units;

  IF vector_fp IS DISTINCT FROM expected_vector_fp THEN
    RAISE EXCEPTION 'vector fingerprint mismatch (got %, expected %)', vector_fp, expected_vector_fp;
  END IF;

  SELECT md5(string_agg(row_digest, E'\n' ORDER BY unit_id))
  INTO full_row_fp
  FROM (
    SELECT
      unit_id,
      md5(
        coalesce(unit_id, '') || E'\x1e' ||
        coalesce(okf_concept_id, '') || E'\x1e' ||
        coalesce(okf_version, '') || E'\x1e' ||
        coalesce(source_class, '') || E'\x1e' ||
        coalesce(type, '') || E'\x1e' ||
        coalesce(title, '') || E'\x1e' ||
        coalesce(resource, '') || E'\x1e' ||
        coalesce(retrieval_text, '') || E'\x1e' ||
        coalesce(content_hash, '') || E'\x1e' ||
        coalesce(embedding_model, '') || E'\x1e' ||
        coalesce(embedding::text, '') || E'\x1e' ||
        coalesce(sources::text, '') || E'\x1e' ||
        coalesce(metadata::text, '') || E'\x1e' ||
        coalesce(to_char(embedded_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'), '') || E'\x1e' ||
        coalesce(to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'), '') || E'\x1e' ||
        coalesce(to_char(updated_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"'), '')
      ) AS row_digest
    FROM public.assistant_retrieval_units
  ) ordered;

  IF full_row_fp IS DISTINCT FROM expected_full_row_fp THEN
    RAISE EXCEPTION 'full-row integrity digest mismatch (got %, expected %)', full_row_fp, expected_full_row_fp;
  END IF;
END $$;

COMMIT;
```

**Execution:**

```bash
cd /path/to/directory/containing/sql/files
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f import_atomic.sql
```

**Out of scope for import:** `schema_migrations`, `assistant_ingestion_runs`, `drizzle.*`, and **`assistant_api_rate_limit_counters`** (no reads or writes in this transaction).

---

## Transaction semantics (`psql`)

Use **`psql -v ON_ERROR_STOP=1`** for R2, R3b, and T scripts.

| Behavior               | Detail                                                                                                                                                                                |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Single session (T)** | Empty check, `\i` data file, and digest verification share one `BEGIN` … `COMMIT`. Do not split across separate `psql` invocations.                                                   |
| **On error**           | `ON_ERROR_STOP=1` makes `psql` exit immediately with a non-zero status on the first SQL error or `RAISE EXCEPTION`. Remaining script lines (including `COMMIT`) are **not** executed. |
| **Rollback**           | The transaction stays **aborted** until the session ends. Uncommitted work (including a failed `COPY`) is **discarded** when the connection closes — nothing is partially committed.  |
| **After a failed T**   | Reconnect read-only; confirm `assistant_retrieval_units` is still **empty** (or empty again). Fix export/digest/constants; re-run **T** from a clean empty table.                     |
| **Lock (T)**           | `LOCK TABLE … IN EXCLUSIVE MODE` blocks concurrent writes to `assistant_retrieval_units` until `COMMIT` or session rollback.                                                          |
| **Success path**       | `COMMIT` runs only after all verification `DO` blocks complete without raising.                                                                                                       |

---

## V — Post-cutover verification

1. Re-run V0 identity queries (read-only) — confirm still Primary direct DB.
2. `npm run assistant:db:verify -- --json` on Neon direct URL — expect `"ok": true`.
3. Optional SQL:

```sql
SELECT COUNT(*) FROM public.assistant_retrieval_units;
SELECT md5(string_agg(unit_id, ',' ORDER BY unit_id)) AS unit_id_set_hash
FROM public.assistant_retrieval_units;
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

**Stop conditions:** verify fails; eval regressions without review; fingerprint mismatch on re-check.

---

## Unresolved operational risks

| Risk                                         | Mitigation                                                                                   |
| -------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Rate-limit DDL drift on Primary              | R3a parity script; no migration 3 row until it passes                                        |
| Wrong Neon branch / pooler URL               | V0 Console + `\conninfo` pooler check before every write phase                               |
| Stale digest constants                       | Re-run T0 immediately before T; UTC + JSONB rules must match exactly                         |
| Local Docker corpus changes after T0         | Re-export and recompute digests                                                              |
| Failed import mid-transaction                | Session rollback leaves empty table; re-run T (no backup branch required)                    |
| Committed import with wrong constants        | Operator must deliberately repair (e.g. delete rows) before re-import — avoid by matching T0 |
| `gen_random_uuid()` unavailable on Neon      | R2 fails before commit if `pgcrypto`/function missing                                        |
| Production API empty index until T completes | Expected for initialization; validate in V before pointing traffic                           |

---

## After cutover

- Resume **`drizzle-queries`** implementation on `main` (test DB / local Docker).
- Schedule **operational-acceptance** only after Neon corpus + verify + eval pass.
- Future ingests on Neon: run `npm run assistant:ingest` with operator-approved direct `DATABASE_URL` after schema is complete (ingestion runs table empty until first Neon ingest).
