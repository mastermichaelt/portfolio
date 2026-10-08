# Codenames AI engineering docs (pinned sources)

Pinned **public** `docs/` markdown from [`multipliers-dev/codenames-ai-guesser`](https://github.com/multipliers-dev/codenames-ai-guesser). Section extraction happens in `codenames-engineering-docs-producer.mjs`; these files are not indexed until `okf:build` → derive → ingest on a merged branch.

**Included upstream paths:**

- `docs/ai-pipeline-outcome.md` — PostHog `ai_pipeline_outcome` taxonomy
- `docs/judge-ai-validation-flow.md` — judged clue orchestration and validation layers (bounded sections; mermaid diagrams and tail sections excluded from OKF)

**Excluded:** `design/`, `frontend/docs/`, `.cursor/plans/`, `.agents/`, server source wholesale.

**Refresh workflow:**

1. Copy reviewed upstream markdown into `sources/` (paths must match `publication-manifest.json`).
2. Recompute `sha256` per file and update the manifest.
3. Run `npm run test -- tests/okf-codenames-engineering-docs-coverage.test.ts`.
