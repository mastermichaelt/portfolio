-- Assistant retrieval index: Postgres + pgvector (exact search baseline).
-- Fixed index representation: text-embedding-3-small @ 1536 dimensions.
-- No ANN index (HNSW / IVFFlat) in this experiment.

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
  embedding          vector(1536) NOT NULL,
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
