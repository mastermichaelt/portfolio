-- Ingestion run metadata for assistant retrieval sync observability.

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
