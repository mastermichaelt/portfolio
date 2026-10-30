# Articles curation — verification checklist

Run this checklist on **every** skill invocation after the full published-inventory reconciliation (hub `docs/dev.to/published/` ↔ `content/articles.ts`), **including** when gap analysis finds **no** required `articles.ts` edits. That synchronized path still requires confirming inventory, dependent copy, and fixtures/registry — then report **`success — already synchronized`** with **no PR** (see `SKILL.md` §7 and §10).

**Always complete:** Inventory and **Dependent inventory copy** below (same mandatory audit as `SKILL.md` §7).

**Skip only when inapplicable:** Assistant fixtures, test-file edits, and command rows that apply only after you changed the paths they guard (e.g. skip fixture checks when `articles.ts` and hub mappings did not change; skip `build` / e2e when no content paths or fixtures changed).

## Inventory (every invocation)

- [ ] Every hub file under `editorial-workflow/docs/dev.to/published/` has a matching `url` in `content/articles.ts` (or gap explicitly reported).
- [ ] No duplicate slugs or URLs; each line has exactly one `lineLead`; arguments only on leads.
- [ ] `featured` set still matches homepage `writing[]` intent unless deliberately changed with PR rationale.

## Dependent inventory copy (every invocation — mandatory)

- [ ] Audited repo for stale report totals / “fifteen” / old band notes (even when `articles.ts` unchanged).
- [ ] `content/homepage.ts`, `content/projects-index.ts`, `content/production-line.ts` aligned with inventory.
- [ ] `content/article-lines.ts` membership comment and band `note`s accurate.
- [ ] `content/articles.ts` header comment corpus count matches inventory length.
- [ ] `tests/content-foundation.test.ts` and `tests/article-lines.test.ts` counts and invariants match inventory (update only if audit found drift).
- [ ] `tests/production-line.test.ts` and `e2e/happy-path.spec.ts` aligned with production-line copy and dynamic surfaces (e.g. Codenames field-report door heading from `articles` count).

## Assistant fixtures (only when `articles.ts` or hub mappings changed)

- [ ] `published-articles.mjs` hub filenames updated.
- [ ] Fixture markdown copied under `tests/fixtures/assistant-okf/published/`.
- [ ] `content-source-registry.mjs` SHA updated for `content/articles.ts`.
- [ ] OKF concept-count / producer-length test constants updated when fixture set grows; rely on **CI `test:coverage`** for retrieval-eval integration when local OpenAI is unset.

## Commands

- [ ] `npm run verify:articles-editorial-copy` passes when summaries, line-lead `argument`s, or band `label` / `pairs` / `note` changed (or on every run before PR).
- [ ] `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm test` when you changed tracked product files.
- [ ] `npm run build` + `npm run test:e2e` only when content paths or fixtures changed (CI parity).

## Outcome

- [ ] **Already synchronized** (inventory + dependent copy + fixtures/registry current, no edits required) → no PR; chat report only.
- [ ] **Changes required** → PR opened (Open PR only); do not merge unless Merge granted.
