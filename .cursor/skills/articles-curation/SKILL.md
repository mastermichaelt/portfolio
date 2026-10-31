---
name: articles-curation
description: Reconcile mastermichaelt/portfolio curated article inventory with the editorial hub published DEV field reports — hub markdown ↔ content/articles.ts, dependent site copy, category band notes, assistant fixtures, and tests. Use after a new post lands in editorial-workflow/docs/dev.to/published/, on periodic inventory audits, or when post-publish destination curation is invoked from the editorial hub.
---

# Articles curation (portfolio)

Procedure skill for keeping **`/articles`** inventory aligned with the sibling editorial hub’s published markdown corpus. This is **manual agent procedure**, not automation: no new npm commands, DEV API clients, or schedulers.

## Taxonomy and source files

| Concern                                                                | Path                                                                                           |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------- |
| Five line ids (`ArticleLine`) and row shape                            | `domain/article.ts`                                                                            |
| Public labels, band `pairs` / `note`, render order                     | `content/article-lines.ts`                                                                     |
| Curated inventory (slug, title, summary, url, `line`, leads, featured) | `content/articles.ts` (header comment documents sync discipline)                               |
| Hub master markdown                                                    | Sibling checkout `multipliers-dev/editorial-workflow/docs/dev.to/published/*.md` (read-only)   |
| Assistant OKF hub filename map                                         | `scripts/assistant/okf/published-articles.mjs`                                                 |
| Fixture copies + registry hash                                         | `tests/fixtures/assistant-okf/published/`, `scripts/assistant/okf/content-source-registry.mjs` |

**Structural invariants** (do not break without explicit justification in the PR):

- Exactly **five** reasoning lines — never invent a sixth category; if a post does not fit, **stop and ask**.
- Render order and ids: **`taste`**, **`evals`** (label **Evals & Verification**), **`authority`**, **`measurement`**, **`portability`**. Stages 01–04 are **TEAM** in lifecycle order; **`portability`** applies TEAM consistently across projects, tools, and agents.
- Classify by the **primary engineering lesson** the post teaches (see `docs/articles-team-portability-classification-audit.md` and each stage’s `lifecycleQuestion` in `content/article-lines.ts`), not title keywords or techniques used along the way. **Taste:** worth building and good outcomes (product judgment, scope, trade-offs). **Evals & Verification:** whether the implementation satisfies its expected contract (tests, evals, CI, review when verification is the central lesson). **Authority:** permitted agent changes and execution boundaries. **Measurement:** what observed system behaviour reveals about quality and outcomes (telemetry, experiments, operational diagnostics — not only dashboards). **Portability:** transferring practices across projects, repositories, tools, and agents; verification may support portability without being the primary lesson.
- Exactly **one** `lineLead: true` per line; **only** line leads carry `argument`.
- **`lineLead`** on each lifecycle stage should match the corresponding **DEV profile pinned** post (one pin per stage). That row is the band **Start here** on `/articles`. Update pins on DEV and portfolio together.
- **`featured`** mirrors homepage selected writing (`content/homepage.ts` `writing[]` slugs) — distinct from line leads.
- Unique `slug` and canonical `url` (`devto_api_url` from hub frontmatter).
- **`groupArticleLines`** preserves **inventory order within each line** in `articles.ts` — do not sort rows by `published_at` when inserting.

Summaries: one sentence, compressed from opening or takeaway — same discipline as the `articles.ts` header (**no invented metrics or strengthened causality**).

### Voice gate (deterministic)

Before finishing a curation run (and before opening a PR that changes inventory copy), run:

```bash
npm run verify:articles-editorial-copy
```

That command rejects Unicode em dashes in editorial prose fields (summaries, line-lead `argument`s, band `label` and `note`; **not** archive `pairs` pairing labels) and flags hyphenated compounds that are not in the published fixture corpus (per slug or line) or the small allowlist in `scripts/lib/articles-editorial-copy-validation.mjs`. It **exits with code 1** on any failure so CI blocks merge; it does not rewrite copy. Fix reported strings using sibling hub [`editorial-workflow/.cursor/rules/engineer-writeup-voice.mdc`](../../editorial-workflow/.cursor/rules/engineer-writeup-voice.mdc). Focused unit tests live in `tests/articles-editorial-copy-validation.test.ts`.

## Preflight

1. Confirm checkout is **`mastermichaelt/portfolio`** (`git remote get-url origin` → `github.com/mastermichaelt/portfolio`).
2. Confirm sibling hub **`multipliers-dev/editorial-workflow`** is available read-only (typical path: `../editorial-workflow` from portfolio root). If the hub tree is missing, report **`skipped (hub unavailable)`** and stop — do not invent URLs or bodies from memory.

## Procedure

Run the full reconciliation every time this skill is invoked (including post-publish curation from the editorial hub). Do not treat “one new file in hub” as a shortcut that skips gap analysis or dependent copy audit.

### 1. Inventory

- List `editorial-workflow/docs/dev.to/published/*.md`.
- Parse YAML frontmatter (`title`, `tags`, `devto_api_url`, and any dates needed for `year`).
- Load `content/articles.ts` and compare each hub `devto_api_url` to portfolio row `url`.

### 2. Gap analysis

Report:

- Hub files **missing** from portfolio.
- Portfolio rows whose **URL** no longer matches hub frontmatter (stale).
- Hub-only files not yet curated (flag for editorial review).
- Line **membership** mismatches if hub intent clearly changed (classify before editing).

Never auto-invent a sixth line. Never add rows without reading the full markdown body.

### 3. Classify each missing or moved article

- Read the full published markdown.
- Assign exactly one `ArticleLine` id using `content/article-lines.ts` labels and **existing band examples** in `articles.ts`.
- Set `relatedProjectSlug` only when the report clearly pairs with a portfolio project (otherwise omit).
- If no natural fit → **stop and ask** (do not add a category or guess).

### 4. Add or update rows in `articles.ts`

For each change: `slug` (stable, filename-aligned), `title`, `tags`, `year`, `url`, `line`, optional `relatedProjectSlug`, `summary`.

Insert new rows **next to thematically related neighbors** within the same line (inventory order, not publish date).

When the corpus size changes, update the **`content/articles.ts` file header** comment (`(N posts; portfolio lists full corpus)`) to match `articles.length` — same discipline as the membership comment in `article-lines.ts`. Visible site copy should prefer `articles.length` derivation where practical; the header comment cannot, so refresh it on every reconciliation that changes row count.

### 5. Line maintenance

- Reconcile per-line counts with the membership comment in `content/article-lines.ts` when counts change.
- Consider whether a line **`argument`** or **lead** should change; **preserve existing leads and `featured` set** unless the reconciliation clearly requires a change — document rationale in the PR.
- Update band **`note`** text in `article-lines.ts` when membership or “unpaired report” framing changes (Authority line often needs this after bulk adds).

### 6. Assistant sync

When `articles.ts` or hub mappings change:

1. Extend `PUBLISHED_ARTICLE_HUB_FILES` in `scripts/assistant/okf/published-articles.mjs` for new hub filenames.
2. Copy hub markdown → `tests/fixtures/assistant-okf/published/<slug>.md`.
3. Bump `content-source-registry.mjs` SHA-256 for `content/articles.ts` when that file changed.
4. Reconcile OKF test expectations when concept counts shift (`tests/okf-normalization.test.ts` `EXPECTED_CONCEPT_COUNT`, producer lengths; `tests/assistant-retrieval-units.test.ts` concept count). **CI runs full `npm run test:coverage`** when secrets and DB are configured — local runs may skip `assistant-retrieval-eval` without `OPENAI_API_KEY`; treat green CI as the retrieval-eval gate after fixture changes.

Note in the PR if OKF ingest must be re-run locally after fixture changes.

### 7. Dependent inventory copy (mandatory)

After **any** `articles.ts` change — and on every full reconciliation run — **audit the repo** for stale **published article count** or total copy (e.g. search for prior totals like `15`, `fifteen`, or old “reports” strings near `proofSurface`, weekly reports, production line, category band notes).

Update at least these when totals or framing drift:

| Area                                 | Typical paths                                                                                      |
| ------------------------------------ | -------------------------------------------------------------------------------------------------- |
| Homepage weekly reports copy         | `content/homepage.ts`                                                                              |
| Projects index proof surface         | `content/projects-index.ts`                                                                        |
| Production line editorial cell       | `content/production-line.ts`                                                                       |
| Line membership comment + band notes | `content/article-lines.ts`                                                                         |
| `articles.ts` header corpus count    | `content/articles.ts` (top comment `(N posts; …)`)                                                 |
| Unit tests                           | `tests/content-foundation.test.ts`, `tests/article-lines.test.ts`, `tests/production-line.test.ts` |
| E2E                                  | `e2e/happy-path.spec.ts`                                                                           |

Prefer deriving a count from `articles` / `articles.length` where a module already imports inventory and a one-line derived string avoids future drift. Do **not** introduce unrelated refactors or new shared constants solely for a refresh.

Historical archive under `docs/archive/` is out of scope unless a live route or test still reads it.

### 8. Tests

- Update `tests/content-foundation.test.ts` and `tests/article-lines.test.ts` for counts, leads, and invariants.
- Keep production-line and e2e assertions aligned with updated copy.
- Refresh the membership comment in `article-lines.ts` when per-line counts change.

### 9. Verify

```bash
npm run lint
npm run typecheck
npm run format:check
npm run verify:articles-editorial-copy
npm test
```

When content paths or fixtures change, also run `npm run build` and `npm run test:e2e` if CI would (content-heavy PRs).

See [verification.md](./verification.md) for a compact checklist.

### 10. Outcome and PR policy

| Result                                                                                                              | Action                                                                                                                                      |
| ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- |
| Gap analysis finds **no** required portfolio edits, dependent copy/tests/notes are current, fixtures/registry match | Report **`success — already synchronized`**. **Do not** open a PR.                                                                          |
| Reconciliation requires edits                                                                                       | Implement changes; **Open PR only** — do not merge unless explicitly granted. Report **`PR opened`** with summary of hub ↔ portfolio delta. |
| Preflight failure (missing portfolio, hub, or skill context)                                                        | Report **`skipped (<reason>)`**; do not block unrelated editorial close-loop work.                                                          |

**Non-goals:** DEV API publishing, Notion inbox edits, new npm scripts, generic publishing frameworks, or duplicating full taxonomy tables inside the editorial hub (hub invokes this skill; taxonomy lives here).

## Standalone agent prompt (copy/paste)

Use a **fresh Agent-mode chat** with portfolio (+ hub) in the workspace. Invoke **only** this skill — no plan file required.

```text
@.cursor/skills/articles-curation/SKILL.md

Run the full published-inventory reconciliation procedure in mastermichaelt/portfolio against sibling hub editorial-workflow/docs/dev.to/published/.

Authority: Open PR only when portfolio changes are required — implement and open the PR; do not merge.

Topology: cd to mastermichaelt/portfolio; prove origin; if opening a PR, branch from latest origin/main; PR base main; branch represents only curation changes.

Include mandatory dependent inventory copy audit (homepage, projects-index, production-line, article-lines band notes/comments, production-line test, happy-path e2e, and any other stale report-count copy) — not articles.ts alone.

Outcome: report synchronized (no PR), PR opened, or skipped with reason. Run verification commands from the skill when you change tracked product files.
```
