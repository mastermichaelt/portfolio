# Articles curation — verification checklist

Use after reconciliation edits (skip items that did not change).

## Inventory

- [ ] Every hub file under `editorial-workflow/docs/dev.to/published/` has a matching `url` in `content/articles.ts` (or gap explicitly reported).
- [ ] No duplicate slugs or URLs; each line has exactly one `lineLead`; arguments only on leads.
- [ ] `featured` set still matches homepage `writing[]` intent unless deliberately changed with PR rationale.

## Dependent copy (required on every run when auditing)

- [ ] Searched repo for stale report totals / “fifteen” / old band notes.
- [ ] `content/homepage.ts`, `content/projects-index.ts`, `content/production-line.ts` aligned with inventory.
- [ ] `content/article-lines.ts` membership comment and band `note`s accurate.
- [ ] `tests/production-line.test.ts` and `e2e/happy-path.spec.ts` aligned with production-line copy.

## Assistant fixtures (when `articles.ts` or mappings changed)

- [ ] `published-articles.mjs` hub filenames updated.
- [ ] Fixture markdown copied under `tests/fixtures/assistant-okf/published/`.
- [ ] `content-source-registry.mjs` SHA updated for `content/articles.ts`.

## Commands

- [ ] `npm run lint`
- [ ] `npm run typecheck`
- [ ] `npm run format:check`
- [ ] `npm test`
- [ ] `npm run build` + `npm run test:e2e` when content paths or fixtures changed (CI parity)

## Outcome

- [ ] **Already synchronized** → no PR; chat report only.
- [ ] **Changes required** → PR opened (Open PR only); no merge unless Merge granted.
