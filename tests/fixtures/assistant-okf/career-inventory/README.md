# Career inventory fixtures (publication boundary)

Pinned **reviewed public excerpts** for the career-inventory OKF producer. These are not the assistant’s persisted corpus until `okf:build` → derive → ingest run on a merged branch.

## Two controls

| Control                 | Artifact                                       | What CI verifies                                                                                                               |
| ----------------------- | ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| **Source eligibility**  | `source-eligibility.json`                      | Only listed `facts/`, `roles/`, `meta/` paths may be referenced (default deny; safe relative paths only).                      |
| **Content publication** | `publication-manifest.json` + `snapshots/*.md` | Snapshot file hashes, manifest ↔ frontmatter alignment, non-empty `approved_entry_ids`, no duplicate paths, no path traversal. |

`assistant:ingest` success does **not** imply publication approval.

## Machine checks vs human content review

`assertCareerInventoryPublicationIntegrity()` is **structural** only. It can confirm:

- Pinned snapshot bytes match `publication-manifest.json` hashes.
- `approved_entry_ids` in the manifest match snapshot frontmatter.
- Eligibility paths and snapshot paths are well-formed and stay under this directory.

It **cannot** prove that each snapshot **body** contains only claims corresponding to those `approved_entry_ids`, or that prose excludes contact info, interview prep, recruiter feedback, confidential employer detail, or strengthened claims.

Before merging a PR that adds or changes snapshots, an operator must **explicitly content-review** each listed file:

- [ ] `snapshots/admin-hub-experimentation.md`
- [ ] `snapshots/cross-flow-experiment-measurement.md`
- [ ] `snapshots/em-growth-delivery.md`
- [ ] `snapshots/loom-acquisition.md`
- [ ] `snapshots/savepoints-durable-capture.md`

Compare body text to the private inventory entries named in `approved_entry_ids` (no claim strengthening; no extra fields). Record the review in the PR description or commit message when refreshing hashes.

## Refresh workflow

1. Update eligibility and/or snapshots after inventory review.
2. Recompute `sha256` for each changed snapshot and update `publication-manifest.json`.
3. Run `npm run test -- tests/okf-career-inventory-coverage.test.ts`.
