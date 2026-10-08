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

## Post-merge operator acceptance (ingest)

After this producer merges:

1. `npm run okf:build` — confirm **94** OKF concepts (was **89**; **+5** `career/*` concepts from the publication manifest).
2. `npm run assistant:derive --write` — read the derived total (structure-aware chunking; **do not** assume one retrieval unit per concept). Compare to the pre-merge derive baseline (e.g. **209** units after corpus expansion) and record the **unit** delta in the PR or ops notes.
3. `npm run assistant:ingest` on the intended `DATABASE_URL` — use ingest upsert/skip/delete summary; publication approval remains the merged manifests + human snapshot review, not a green ingest.
