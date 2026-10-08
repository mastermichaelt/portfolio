# Assistant OKF fixtures

Pinned **test inputs** for OKF producers. These are not the assistant's persisted corpus and are not refreshed by an ingestion pipeline.

| Path                   | Represents                                                                                                                                                                  |
| ---------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `renovate-workflow.md` | Repo runbook excerpt (Renovate governance ladder)                                                                                                                           |
| `published/*.md`       | Full DEV article bodies for every row in `content/articles.ts` (slug-named copies of `editorial-workflow/docs/dev.to/published/`)                                           |
| `career-inventory/`    | Reviewed public career evidence excerpts from private inventory — `source-eligibility.json`, `publication-manifest.json`, and `snapshots/*.md` (not wholesale private YAML) |

Portfolio normalization reads canonical in-repo `content/` directly for cases, catalogs, About, project cases, and ecosystem inventory. Career inventory OKF is produced from **approved snapshots only**; ingest success does not imply publication approval. Structural manifest checks do not replace human content review of snapshot bodies — see [career-inventory/README.md](./career-inventory/README.md).

Update fixtures when portfolio article inventory changes or when producer tests need a new representative repo sample; record the upstream origin in the commit message.

**Freshness:** slug coverage (`published-articles.mjs` + `tests/okf-content-coverage.test.ts`) does not prove a fixture matches the latest hub or DEV body. When `editorial-workflow/docs/dev.to/published/` changes, re-copy the slug-named file here, update `content-source-registry.mjs` if `articles.ts` changed, and re-run `assistant:ingest`. Operational detail: [architecture-direction.md](../../../docs/assistant/architecture-direction.md).
