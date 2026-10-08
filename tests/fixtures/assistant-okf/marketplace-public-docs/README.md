# Marketplace public docs fixtures

Pinned **public** documentation from [`multipliers-dev/cursor-team-marketplace`](https://github.com/multipliers-dev/cursor-team-marketplace). These are not indexed until `okf:build` → derive → ingest on a merged branch.

## Publication boundary

- Only paths listed in `publication-manifest.json` may produce OKF concepts.
- Snapshot `sha256` entries must match on-disk files after any content refresh.
- **Do not** ingest `SKILL.md` bodies or `.cursor/plans/` in this slice — README and engineering docs only.
- Ingest success does not substitute for publication review when refreshing snapshots.

## Refresh workflow

1. Copy reviewed upstream markdown into `snapshots/` (preserve frontmatter contract).
2. Recompute hashes in `publication-manifest.json`.
3. Run `npm run test -- tests/okf-marketplace-public-docs-coverage.test.ts`.
4. `npm run okf:build` — expect **+4** `tooling/*` concepts (**98** total with current corpus).
