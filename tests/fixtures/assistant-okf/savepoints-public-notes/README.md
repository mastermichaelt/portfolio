# Savepoints public notes fixtures

Pinned **reviewed public excerpt** from [`multipliers-dev/savepoints`](https://github.com/multipliers-dev/savepoints) `notes/architecture-direction.md`. These are not indexed until `okf:build` → derive → ingest on a merged branch.

## Publication boundary

- Only paths listed in `publication-manifest.json` may produce OKF concepts.
- Snapshot `sha256` entries must match on-disk files after any content refresh.
- **Excerpt first** — do not paste the full architecture note until publication review approves.
- **Exclude** `.cursor/plans/`, hook implementation detail, and wholesale `src/` copies in snapshots.
- Optional `savepoints-6-pager.md` summary only after separate review.
- Ingest success does not substitute for publication review when refreshing snapshots.

## Refresh workflow

1. Edit reviewed excerpt in `snapshots/` (preserve frontmatter contract).
2. Recompute hashes in `publication-manifest.json`.
3. Run `npm run test -- tests/okf-savepoints-public-notes-coverage.test.ts`.
4. `npm run okf:build` — expect **+1** `tooling/*` concept (**99** total with current corpus).
