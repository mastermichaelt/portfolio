-- Durable per-client rate limit counters for the public assistant generation API.
-- Shared across Vercel Fluid Compute instances via the assistant retrieval DATABASE_URL.

CREATE TABLE assistant_api_rate_limit_counters (
  bucket_key    text PRIMARY KEY,
  count         integer NOT NULL DEFAULT 1,
  window_ends_at timestamptz NOT NULL
);

CREATE INDEX assistant_api_rate_limit_counters_window_ends_at_idx
  ON assistant_api_rate_limit_counters (window_ends_at);
