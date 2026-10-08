---
inventory_fact_id: savepoints-durable-capture
inventory_role_id: independent-savepoints-2026
title: Savepoints durable capture pipeline
source_eligibility:
  - facts/savepoints-durable-capture.yml
  - roles/independent-savepoints-2026.yml
approved_entry_ids:
  - savepoints-pipeline-plain
  - savepoints-postgres-store
  - savepoints-dual-runtime
  - savepoints-prototype-scope
  - savepoints-tech
---

## Actions

- Built a durable learning-capture pipeline from activity observation through validated emit, quality checks, and optional cloud persistence.
- Implemented a Postgres-backed canonical store with fail-open submit worker, atomic ack state, and first-write-wins idempotency on SHA-256 ingestion keys.

## Scope

Scoped repo-local spool as prototype boundary; deferred packaging, MCP, and retrospective UI per architecture direction.

## Outcomes

Verified durable submit on both desktop Cursor and fresh Cloud Agent runtimes with provenance intact.

## Technologies

TypeScript, Vitest, Supabase/Postgres, Cursor hooks
