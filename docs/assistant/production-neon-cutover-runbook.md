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

One-time operator procedure for **portfolio-assistant** Neon Primary when:

- Legacy migration history is **incomplete** (only `20261007100000_assistant_pgvector.sql` recorded).
- **`assistant_ingestion_runs`** is missing.
- **`assistant_api_rate_limit_counters`** exists (possibly without a matching `schema_migrations` row).
- **`assistant_retrieval_units`** is empty on Neon but populated on **local Docker** (validated corpus, including run `cc94272f-0572-434e-b835-b5649dacbba7`).
- Drizzle **baseline** has not run (`drizzle.__drizzle_migrations` absent).

This runbook does **not** replace [assistant-database.md](./assistant-database.md) Strategy A migration policy. It uses **manual SQL** for legacy reconciliation only — there is no second migration runner in the repository. Forward DDL remains **`npm run assistant:db:migrate`** after baseline.

**Agents must not run production steps without explicit operator approval.**

## Sequence overview

| Phase  | Purpose                                                                        |
| ------ | ------------------------------------------------------------------------------ |
| **V0** | Destination identity + recovery branch (before any write)                      |
| **R1** | Read-only preflight                                                            |
| **R2** | Migration 2 DDL + `schema_migrations` (single transaction)                     |
| **R3** | Rate-limit parity check + migration 3 history (single transaction)             |
| **B**  | Drizzle baseline → verify → migrate → verify (**direct** URL)                  |
| **T0** | Source export + integrity digests (local Docker, read-only)                    |
| **T**  | Atomic data-only import of `assistant_retrieval_units` (single `psql` session) |
| **V**  | Post-cutover verification (Neon retrieval eval / CLI)                          |

Repository commands referenced: `npm run assistant:db:baseline`, `assistant:db:verify`, `assistant:db:migrate` ([`scripts/assistant/db/`](../../scripts/assistant/db/)).

---

## V0 — Destination identity and recovery (before any write)

### Neon Console (human)

Confirm all of the following **before** exporting credentials into a shell:

| Check                  | Expected                                                              |
| ---------------------- | --------------------------------------------------------------------- |
| Organization / project | **`portfolio-assistant`**                                             |
| Branch                 | **`main`** (shown as **Primary** in the UI)                           |
| Database name          | **`portfolio_assistant`**                                             |
| Connect string         | Copy the **direct** connection string (not **pooled** / not “pooler”) |

Do **not** commit connection strings, passwords, or tokens.

### Recovery branch

1. In Neon Console → **Branches**, create a branch from **`main` (Primary)** (e.g. `pre-cutover-YYYY-MM-DD`).
2. Record branch name and creation time in operator notes.
3. Optional verification: connect to the **recovery branch** read-only and confirm `SELECT COUNT(*) FROM public.assistant_retrieval_units` matches Primary **before** cutover (expect **0** on Primary today).

**Recovery semantics (read this before cutover):**

| Situation                                                                           | Action                                                                                                                                                                    |
| ----------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Error **during** an open transaction (R2, R3, T import script with `ON_ERROR_STOP`) | PostgreSQL **rolls back** that transaction automatically. No branch restore needed.                                                                                       |
| Error **after** `COMMIT` (wrong data or wrong target committed)                     | Use the **recovery branch** or Neon restore/point-in-time — **not** a mere re-run of R2/R3.                                                                               |
| **Full Primary database replacement**                                               | Promote/reset branch in Neon Console — **last resort**; affects rate-limit counters and all schemas. Prefer transaction rollback when the failure happened before commit. |

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

Record baseline counts on Primary (read-only):

```sql
SELECT COUNT(*) AS retrieval_rows FROM public.assistant_retrieval_units;
SELECT COUNT(*) AS rate_limit_rows FROM public.assistant_api_rate_limit_counters;
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
-- Expect: 0

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

Execute with `psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f r2.sql` (or paste in Neon SQL Editor with autocommit off equivalent — prefer single script + `ON_ERROR_STOP`).

---

## R3 — Rate-limit parity + migration 3 history only

**Preconditions:** R2 committed; rate-limit table exists; migration 3 **not** recorded.

### R3a — Parity (read-only)

```sql
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns
WHERE table_schema = 'public' AND table_name = 'assistant_api_rate_limit_counters'
ORDER BY ordinal_position;
-- Expect 3 columns: bucket_key (text), count (integer, NOT NULL, default 1), window_ends_at (timestamptz)

SELECT indexname, indexdef
FROM pg_indexes
WHERE schemaname = 'public' AND tablename = 'assistant_api_rate_limit_counters';
-- Expect index assistant_api_rate_limit_counters_window_ends_at_idx on (window_ends_at)
```

Compare to [`db/migrations/20261016100000_assistant_api_rate_limits.sql`](../../db/migrations/20261016100000_assistant_api_rate_limits.sql). **Stop** if columns or index do not match — repair DDL manually, then record history.

### R3b — History insert (do not re-CREATE table)

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

## T0 — Source export and digests (local Docker)

Source: `localhost:5433`, database `portfolio_assistant`, container `portfolio-assistant-postgres-1`.

### Integrity queries (run on source immediately before export)

Replace constants in phase **T** with these results. Example values from **2026-10-28** local Docker (recompute every cutover):

| Constant               | Example (2026-10-28)               |
| ---------------------- | ---------------------------------- |
| `expected_rows`        | `262`                              |
| `expected_vector_fp`   | `b98ec06f8ebfee83f81b8beae40cfd24` |
| `expected_full_row_fp` | `88afae91910b060039572c7168555599` |

**Row count:**

```sql
SELECT COUNT(*)::bigint AS expected_rows FROM public.assistant_retrieval_units;
```

**Vector fingerprint** (content hash + embedding text):

```sql
SELECT md5(string_agg(
  unit_id || '|' || content_hash || '|' || coalesce(embedding::text, ''),
  E'\n' ORDER BY unit_id
)) AS expected_vector_fp
FROM public.assistant_retrieval_units;
```

**Full-row integrity digest** (all 16 columns, deterministic NULL handling, ordered by `unit_id`):

```sql
SELECT md5(string_agg(row_digest, E'\n' ORDER BY unit_id)) AS expected_full_row_fp
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
      coalesce(embedded_at::text, '') || E'\x1e' ||
      coalesce(created_at::text, '') || E'\x1e' ||
      coalesce(updated_at::text, '')
    ) AS row_digest
  FROM public.assistant_retrieval_units
) s;
```

### Data-only export

```bash
export PGPASSWORD='…'   # local Docker only; do not commit

pg_dump \
  -h localhost -p 5433 -U portfolio -d portfolio_assistant \
  --data-only \
  --table=public.assistant_retrieval_units \
  --no-owner --no-privileges \
  -f assistant_retrieval_units_data.sql
```

Inspect the file: must contain `COPY public.assistant_retrieval_units` (or equivalent data statements) and **must not** contain `CREATE TABLE`.

Record `pre_import_rate_limit_rows` on Neon Primary (from V0).

---

## T — Atomic data import (single `psql` session)

**Preconditions:** Phase B complete; Neon retrieval table empty; export file present; digests recorded; V0 identity reconfirmed.

Create **`import_atomic.sql`** in the **same directory** as `assistant_retrieval_units_data.sql`. Update the three `expected_*` constants and `pre_import_rate_limit_rows` to match T0/V0.

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
  rate_limit_rows bigint;
  expected_rows bigint := 262;
  expected_vector_fp text := 'b98ec06f8ebfee83f81b8beae40cfd24';
  expected_full_row_fp text := '88afae91910b060039572c7168555599';
  pre_import_rate_limit_rows bigint := 0;  -- set from V0
BEGIN
  SELECT COUNT(*) INTO row_count FROM public.assistant_retrieval_units;
  IF row_count <> expected_rows THEN
    RAISE EXCEPTION 'row count after import (%) <> expected (%)', row_count, expected_rows;
  END IF;

  SELECT md5(string_agg(
    unit_id || '|' || content_hash || '|' || coalesce(embedding::text, ''),
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
        coalesce(embedded_at::text, '') || E'\x1e' ||
        coalesce(created_at::text, '') || E'\x1e' ||
        coalesce(updated_at::text, '')
      ) AS row_digest
    FROM public.assistant_retrieval_units
  ) ordered;

  IF full_row_fp IS DISTINCT FROM expected_full_row_fp THEN
    RAISE EXCEPTION 'full-row integrity digest mismatch (got %, expected %)', full_row_fp, expected_full_row_fp;
  END IF;

  SELECT COUNT(*) INTO rate_limit_rows FROM public.assistant_api_rate_limit_counters;
  IF rate_limit_rows <> pre_import_rate_limit_rows THEN
    RAISE EXCEPTION 'assistant_api_rate_limit_counters row count changed during import (% vs %)',
      rate_limit_rows, pre_import_rate_limit_rows;
  END IF;
END $$;

COMMIT;
```

**Execution:**

```bash
cd /path/to/directory/containing/sql/files
psql "$DATABASE_URL" -v ON_ERROR_STOP=1 -f import_atomic.sql
```

**Transactional behavior:**

- One session: `BEGIN` … `COMMIT`.
- `LOCK TABLE … IN EXCLUSIVE MODE` blocks concurrent writes to `assistant_retrieval_units` during import.
- `\i assistant_retrieval_units_data.sql` runs **inside** the transaction (PostgreSQL `COPY FROM stdin` from `pg_dump` is transactional).
- Any `RAISE EXCEPTION` or syntax error with **`ON_ERROR_STOP=1`** aborts the script; PostgreSQL **rolls back** the whole transaction (no partial corpus).
- Do **not** split empty-check and `\i` across separate `psql` invocations.

**Out of scope for import:** `schema_migrations`, `assistant_ingestion_runs`, `drizzle.*`, rate-limit data (only verified unchanged).

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

| Risk                                         | Mitigation                                                     |
| -------------------------------------------- | -------------------------------------------------------------- |
| Rate-limit DDL drift on Primary              | R3a parity; do not insert migration 3 row until match          |
| Wrong Neon branch / pooler URL               | V0 Console + `\conninfo` pooler check                          |
| Stale digest constants                       | Re-run T0 immediately before T                                 |
| Local Docker corpus changes after T0         | Re-export and recompute digests                                |
| Committed bad import                         | Recovery branch / Neon restore — not transaction rollback      |
| Production API empty index until T completes | Expected; Vercel pooled URL unchanged until operator validates |

---

## After cutover

- Resume **`drizzle-queries`** implementation on `main` (test DB / local Docker).
- Schedule **operational-acceptance** only after Neon corpus + verify + eval pass.
- Future ingests on Neon: run `npm run assistant:ingest` with operator-approved direct `DATABASE_URL` after schema is complete (ingestion runs table empty until first Neon ingest).
