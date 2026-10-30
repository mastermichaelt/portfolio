---
name: Articles refresh curation
overview: "Three merge-safe PRs: (1) portfolio articles-curation skill, (2) sync `/articles` to 21 DEV posts with taxonomy updates and assistant fixtures, (3) editorial post-publish invokes destination curation fail-open. Merge order: skill → content → editorial."
todos:
  - id: slice-skill
    content: "PR1 (portfolio): Add `.cursor/skills/articles-curation/SKILL.md` with hub→articles.ts sync procedure, taxonomy pointers, standalone verification checklist and agent prompt; Open PR only."
    status: completed
  - id: slice-content
    content: "PR2 (portfolio): Sync 21 articles (+6, move schema-first, refresh four line arguments, mandatory authority band note, dependent site copy/tests/e2e, fixtures/registry/tests) via articles-curation skill; Open PR only."
    status: pending
  - id: slice-editorial
    content: "PR3 (editorial-workflow): Extend editor-publish post-publish flow to invoke destination curation skill (portfolio default); fail-open skip report; runbook + optional dev.to README; Open PR only."
    status: pending
  - id: plan-closure
    content: "Docs-only PR after PR3 merges: verify editorial-workflow PR merged (gh), mark slice-editorial completed in portfolio frontmatter, verify todos, # Shipped note, archive plan."
    status: pending
isProject: false
---

# Articles refresh and editorial curation

## Recommended execution authority

| Slice           | Recommended authority | Agent instruction                        |
| --------------- | --------------------- | ---------------------------------------- |
| slice-skill     | Open PR only          | Do not merge. Stop after opening the PR. |
| slice-content   | Open PR only          | Do not merge. Stop after opening the PR. |
| slice-editorial | Open PR only          | Do not merge. Stop after opening the PR. |
| plan-closure    | Open PR only          | Do not merge. Stop after opening the PR. |

Repo default: **Open PR only** ([planning-standards.md](../standards/planning-standards.md)).

## Scope

- **Finalized** for implementation (investigation complete; taxonomy locked below).
- **Three PRs**, merge order: **curation skill → content refresh → editorial workflow**.
- **Topology:** Each slice starts from latest `origin/main` in its target repo; PR base is `main`; branch carries only that slice.

```mermaid
flowchart LR
  subgraph portfolio [mastermichaelt/portfolio]
    PR1[PR1 Curation skill]
    PR2[PR2 Content refresh]
    PR1 --> PR2
  end
  subgraph hub [multipliers-dev/editorial-workflow]
    PR3[PR3 Post-publish curation]
  end
  PR2 --> PR3
```

---

## Taxonomy target (locked for PR2)

| Line id       | Public label                 | Count | Featured lead (unchanged)                                                |
| ------------- | ---------------------------- | ----: | ------------------------------------------------------------------------ |
| `measurement` | Measurement & Telemetry      | **3** | `active-players-which-sessions-counted`                                  |
| `authority`   | Authority & Stop Conditions  | **6** | `agent-plans-authority-handoffs`                                         |
| `critique`    | Evals & Judgment             | **5** | `ai-reviewer-kinds-of-reasoning`                                         |
| `readiness`   | Product Taste & Verification | **5** | `persist-game-state-not-ephemeral-ui-intent`                             |
| `portability` | Agent Portability            | **2** | `agent-portability-does-not-require-centralizing-methodology-behind-mcp` |

**Moves and adds (PR2):**

- Add six rows from hub `editorial-workflow/docs/dev.to/published/` with classifications specified in the investigation.
- Move `schema-first-valid-json-wasnt-enough` from `measurement` → `readiness`.
- Refresh **`argument`** on the four existing line leads only (Measurement, Authority, Evals, Readiness); do not change lead slugs or `featured: true` set (still the three homepage-aligned slugs).

**Proposed lead arguments** (compress only if length breaks layout; do not strengthen claims):

| Line        | Lead slug                                    | New `argument`                                                                                                                                                                       |
| ----------- | -------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Measurement | `active-players-which-sessions-counted`      | A healthy-looking number or funnel only means what your inclusion rules say it means — whether that is which sessions count as active or which hiring transitions belong in history. |
| Authority   | `agent-plans-authority-handoffs`             | Agent work needs explicit stop lines and guardrails you can verify — in plans, in git hooks, and in host lifecycle boundaries — not checklists that only read well in review.        |
| Critique    | `ai-reviewer-kinds-of-reasoning`             | Passing a score, a rubric, or a retrieval fixture is one kind of judgment; product-ready output still needs separate editorial and configuration decisions.                          |
| Readiness   | `persist-game-state-not-ephemeral-ui-intent` | Shipping means honoring what the product has accepted as true — persisted state, requirements QA, and the runtime model — not green pipelines or plausible generated content.        |

**Editorial ordering:** `groupArticleLines` preserves **inventory order within each line** (not DEV publish date). When editing `content/articles.ts`, insert new rows next to thematically related neighbors; do not sort by `published_at`.

Suggested **new portfolio slugs** (hub filename → slug), metadata from frontmatter (`title`, `tags`, `devto_api_url`):

| Hub file                                                                    | Portfolio slug                                                           | `line`        | `relatedProjectSlug` |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------ | ------------- | -------------------- |
| `we-made-our-agent-plans-portable-then-we-had-to-make-them-verifiable.md`   | `we-made-our-agent-plans-portable-then-we-had-to-make-them-verifiable`   | `authority`   | —                    |
| `hook-availability-was-split-from-product-enforcement-after-silent-skip.md` | `hook-availability-was-split-from-product-enforcement-after-silent-skip` | `authority`   | —                    |
| `the-retrieval-pipeline-worked-the-product-question-remained.md`            | `the-retrieval-pipeline-worked-the-product-question-remained`            | `critique`    | —                    |
| `records-first-chart-second-the-sankey-disagreed.md`                        | `records-first-chart-second-the-sankey-disagreed`                        | `measurement` | —                    |
| `the-agent-host-didnt-have-the-lifecycle-boundaries-i-assumed.md`           | `the-agent-host-didnt-have-the-lifecycle-boundaries-i-assumed`           | `authority`   | —                    |
| `ai-made-translation-cheap-localization-still-needed-human-judgment.md`     | `ai-made-translation-cheap-localization-still-needed-human-judgment`     | `readiness`   | `codenames-ai`       |

Summaries: one sentence each, compressed from opening/takeaway — same discipline as existing header comment in `articles.ts` (no invented metrics or causality).

---

## Slice — slice-skill

**Recommended authority:** Open PR only

**Rationale:**

- Reusable articles-curation skill must land before the one-time 21-article sync so editorial post-publish can invoke a stable procedure.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Goal:** Lightweight, **plan-independent**, independently invocable skill that keeps `content/articles.ts` aligned with hub published markdown.

**Add:** `.cursor/skills/articles-curation/SKILL.md` (optional short `verification.md` only if checklist-sized — no scripts).

**Skill contract (procedure, not automation):**

1. **Preflight:** Confirm checkout is `mastermichaelt/portfolio`; confirm sibling hub `multipliers-dev/editorial-workflow` is available (read-only). Portfolio-owned wording — no npm scripts required.
2. **Inventory:** List `editorial-workflow/docs/dev.to/published/*.md`; parse YAML frontmatter; compare `devto_api_url` to each row in `content/articles.ts`.
3. **Gap analysis:** Report missing / stale URLs / hub-only files not in portfolio (flag for editorial review; never auto-invent a sixth line).
4. **For each missing article:** Read full markdown body; classify into one of five `ArticleLine` ids using `content/article-lines.ts` and existing band examples. If no natural fit → **stop and ask** (do not add a category).
5. **Add rows:** Update `articles.ts` with slug, title, tags, year, url, line, optional `relatedProjectSlug`, summary.
6. **Line maintenance:** Consider whether line `argument` or lead should change; **preserve leads and featured** unless justified (document in PR).
7. **Assistant sync:** Extend `scripts/assistant/okf/published-articles.mjs` `PUBLISHED_ARTICLE_HUB_FILES`; copy hub markdown → `tests/fixtures/assistant-okf/published/<slug>.md`; bump `content-source-registry.mjs` SHA when `articles.ts` changes.
8. **Dependent inventory copy:** After `articles.ts` changes, **audit** the repo for stale **published article count** copy (e.g. `rg` for `15` near `report`, `fifteen`, or prior totals). Update homepage, projects, production-line surfaces, category band **notes**, and tests/e2e that assert those strings — not only `articles.ts`. Known call sites include `content/homepage.ts`, `content/projects-index.ts`, `content/production-line.ts`, `content/article-lines.ts` (membership comment + band notes), `tests/production-line.test.ts`, and `e2e/happy-path.spec.ts`. Prefer deriving the count from `articles` / `articles.length` where a module already imports inventory and a one-line derived string avoids future drift; do not introduce unrelated refactors or new shared constants solely for this refresh.
9. **Tests:** Update `tests/content-foundation.test.ts` and `tests/article-lines.test.ts`; refresh membership comment in `article-lines.ts`; keep production-line and e2e assertions aligned with updated copy.
10. **Verify:** `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm test`. Note OKF ingest re-run when fixtures change. When content paths change, run `npm run build` and e2e if CI would (PR2 verification matrix).
11. **Outcome:** If gap analysis finds **no** portfolio changes needed (hub URLs already match `articles.ts`, dependent copy/tests/notes are current, and fixtures are current), report **success — already synchronized** and **do not** open a PR. If changes are required, open a portfolio PR (Open PR only).

**Explicit non-goals:** No new npm commands, DEV API clients, schedulers, or generic publishing framework.

**Acceptance:**

- Skill lives under `.cursor/skills/articles-curation/` and is invocable without any active `.cursor/plans/` file.
- Documents taxonomy pointers (`domain/article.ts`, `content/article-lines.ts`, `articles.ts` header).
- Includes a **standalone** copy-paste agent prompt (invoke `@.cursor/skills/articles-curation/SKILL.md` only — no plan file reference).
- Skill text must remain valid after this plan is archived.
- Documents **no-change success**: full reconciliation with zero required edits → report synchronized; do not open a PR.
- Procedure step **Dependent inventory copy** is mandatory on every run — do not treat `content/articles.ts` as the only place article totals appear.

Mark `slice-skill` **completed** in plan frontmatter in the same PR.

---

## Slice — slice-content

**Recommended authority:** Open PR only

**Rationale:**

- Curated `/articles` inventory must match all 21 published DEV field reports with locked taxonomy and assistant fixtures.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Prerequisite:** `slice-skill` merged.

**Goal:** Execute the articles-curation skill to land **21** curated articles matching the taxonomy table above.

**Primary files:**

| File                                                | Change                                                                                                                                                                                             |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `content/articles.ts`                               | +6 rows, move `schema-first`, update four lead `argument`s, reorder within lines                                                                                                                   |
| `content/article-lines.ts`                          | Membership comment **3/6/5/5/2**; **rewrite** Authority & Stop Conditions band `note` (mandatory — retire “Three of fifteen” / single-unpaired framing; reflect post-refresh authority membership) |
| `content/homepage.ts`                               | Update hardcoded **15** weekly-reports copy → **21** (or derive from `articles.length` if already practical)                                                                                       |
| `content/projects-index.ts`                         | Update `proofSurface` report count **15** → **21** (or derived equivalent)                                                                                                                         |
| `content/production-line.ts`                        | Update editorial cell title **15 reports** → **21** (or derived equivalent)                                                                                                                        |
| `scripts/assistant/okf/published-articles.mjs`      | +6 hub filename mappings                                                                                                                                                                           |
| `tests/fixtures/assistant-okf/published/*.md`       | +6 copies from hub                                                                                                                                                                                 |
| `scripts/assistant/okf/content-source-registry.mjs` | New SHA-256 for `content/articles.ts`                                                                                                                                                              |
| `tests/content-foundation.test.ts`                  | Counts `{ measurement: 3, authority: 6, critique: 5, readiness: 5, portability: 2 }`, `length === 21`                                                                                              |
| `tests/article-lines.test.ts`                       | `band.count` `[3, 6, 5, 5, 2]`                                                                                                                                                                     |
| `tests/production-line.test.ts`                     | Assertion aligned with updated production-line editorial cell title                                                                                                                                |
| `e2e/happy-path.spec.ts`                            | `last` editorial cell expectation aligned with production-line title                                                                                                                               |

**Inventory-count audit (required):** Search the repo for other stale references to the old **15**-article (or **fifteen**) published total in live content, tests, or e2e. Update any affected copy or assertions to **21**. Historical archive under `docs/archive/` is out of scope unless a live route or test still reads it.

**Acceptance:**

- Every curated hub published file has matching `devto_api_url` in `articles.ts`.
- Structural invariants: one `lineLead` per line, arguments only on leads, three `featured`, unique slugs/urls.
- Authority band `note` in `content/article-lines.ts` accurately describes authority-line membership after the refresh (not conditional).
- No remaining live copy or test assertions that imply **15** published curated reports when inventory is **21**.
- `npm test` + pre-commit recipe green; `npm run build` / e2e green when content paths in the verification matrix change.

Mark `slice-content` **completed** in plan frontmatter in the same PR.

---

## Slice — slice-editorial

**Recommended authority:** Open PR only

**Rationale:**

- Post-publish must invoke destination curation fail-open so portfolio stays in sync without blocking Notion/DEV close-loop.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Prerequisite:** `slice-content` merged.

**Goal:** Make **destination curation** a standard step in the existing **post-publication** flow (`editor-publish` §5), not an optional reminder. **Fail-open:** publication close-loop succeeds even when curation cannot run.

**Behavior (document in skill + runbook):**

After the operator confirms live DEV publish and the agent completes Notion **Published URL** + **Status → Published**:

1. **Determine destination** (docs-only convention for this installation — no new YAML schema in this slice):
   - **Portfolio:** weekly field reports that belong on [michaeltruong.ai/articles](https://michaeltruong.ai/articles) → destination repo `mastermichaelt/portfolio`, skill `.cursor/skills/articles-curation/SKILL.md`.
   - Other destinations: same pattern later (“invoke that repo’s article curation skill”); do not duplicate portfolio taxonomy in the hub.
2. **Invoke curation:** In an Agent session with the **portfolio checkout** available, load and follow the portfolio articles-curation skill and run its **full published-inventory reconciliation** (hub `docs/dev.to/published/` ↔ portfolio `content/articles.ts`, dependent site copy/tests/category notes, fixtures, and tests — not a single-article shortcut).
3. **Fail-open:** If the destination repo checkout, skill file, or hub `published/` tree is unavailable, **do not fail** Notion publish or treat post-publish as blocked. Append to the **Required chat report** (and optional Notion audit block):

   `Destination curation: skipped (<reason>)`

   Examples: `portfolio checkout not in workspace`, `articles-curation skill not found`, `markdown not yet under docs/dev.to/published/`.

4. **Outcome:** Report one of: **`synchronized (no PR)`** when reconciliation finds no portfolio changes; **`PR opened`** when the skill mutates portfolio content (Open PR only, separate from this editorial-workflow PR); or **`skipped`** per step 3. Do not open an empty PR when already synchronized.

**Files to update:**

| File                             | Change                                                                                                                                                                   |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `skills/editor-publish/SKILL.md` | Extend **§5 Post-publish mode** with steps 1–4 above; extend Required chat report with `Destination curation` outcome (`synchronized (no PR)` / `PR opened` / `skipped`) |
| `docs/editorial-workflow.md`     | Add pipeline step after step 12 (close loop): **destination curation invoke** with fail-open semantics; portfolio example only                                           |
| `docs/dev.to/README.md`          | Optional one sentence: after move to `published/`, post-publish flow may invoke destination curation                                                                     |

**Wording anchor (intent, not duplicated taxonomy):**

> If the published article is associated with a destination repository that maintains a curated article collection, invoke that repository's article curation skill.

**Acceptance:** `npm test` + `npm run typecheck` in editorial-workflow.

**Multi-repo note:** Full curation execution requires `mastermichaelt/portfolio` in the agent environment; hub-only sessions still complete publish but report `Destination curation: skipped`.

**Plan frontmatter:** This slice lands in **editorial-workflow only**. **Do not** edit `mastermichaelt/portfolio` plan frontmatter or mark `slice-editorial` **completed** from the editorial PR. **`plan-closure`** (portfolio) verifies the editorial-workflow PR merged, then marks `slice-editorial` **completed** in this plan’s frontmatter before archive.

---

## Verification matrix

| Repo               | PR  | Required checks                                                                                                 |
| ------------------ | --- | --------------------------------------------------------------------------------------------------------------- |
| portfolio          | PR1 | Skill present; `npm test` if product invariants touched                                                         |
| portfolio          | PR2 | `npm run lint`, `npm run typecheck`, `npm run format:check`, `npm test`, `npm run build` (e2e on content paths) |
| editorial-workflow | PR3 | `npm test`, `npm run typecheck`                                                                                 |

---

## Blockers and decisions

| Item                                           | Status                                                                    |
| ---------------------------------------------- | ------------------------------------------------------------------------- |
| Taxonomy / counts / six classifications        | **Decided**                                                               |
| PR merge order                                 | **Decided:** skill → content → editorial                                  |
| Skill independent of this plan                 | **Decided** — no plan references in skill acceptance                      |
| Post-publish curation                          | **Decided** — invoke in flow; fail-open skip                              |
| `relatedProjectSlug` for General posts         | **Default none**; translation → `codenames-ai`                            |
| Destination registry in `.agents/projects.yml` | **Out of scope** — runbook convention only                                |
| `slice-editorial` todo completion              | **Portfolio plan-closure only** — after `gh` confirms editorial PR merged |

---

## Slice — plan-closure

**Recommended authority:** Open PR only

**Rationale:**

- Docs-only archival after all implementation slices merge, per planning standards.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Prerequisites:** `slice-skill` and `slice-content` merged and marked `completed` in this plan’s frontmatter; **editorial-workflow** PR for `slice-editorial` merged on GitHub (`gh pr view` / merge commit on `multipliers-dev/editorial-workflow`).

**Goal:** Reconcile cross-repository completion; `# Shipped` closure note; move plan to `.cursor/plans/archive/2026-10-30-articles-refresh-curation.plan.md`; update agent prompt `@` paths to archived location.

**Cross-repo reconciliation (required in this PR):**

1. Confirm portfolio PRs for `slice-skill` and `slice-content` merged; frontmatter todos `completed`.
2. Confirm editorial-workflow PR for `slice-editorial` merged (do not infer from portfolio git state).
3. Mark `slice-editorial` **completed** in this plan’s frontmatter in the **same** portfolio closure PR.
4. Mark `plan-closure` **completed**; archive plan.

**Acceptance:** Plan validator passes on archived file; all implementation todos `completed` with `slice-editorial` attested only after step 2.

**Verification:** `npm run validate:plans` if run locally; CI validate job green.

---

## Agent prompts (copy/paste for Cursor)

Use a **fresh Agent-mode chat** per slice.

### slice-skill

```text
@.cursor/plans/2026-10-30-articles-refresh-curation.plan.md

Implement slice-skill only. Do not start slice-content, slice-editorial, or plan-closure.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: cd to mastermichaelt/portfolio; prove origin; start from latest origin/main; PR base main; branch represents only this slice.

Deliverables: Add `.cursor/skills/articles-curation/SKILL.md` (optional verification.md) per plan PR1 — plan-independent skill with standalone agent prompt (no @ plan reference inside the skill). Include dependent inventory copy audit step (site copy, tests, category band notes — not articles.ts alone). Mark slice-skill completed in plan frontmatter in this PR.

Verification: Skill readable and self-contained; portfolio tests green if any tracked files beyond skill/docs change.
```

### slice-content

```text
@.cursor/plans/2026-10-30-articles-refresh-curation.plan.md

Implement slice-content only. Prerequisite: slice-skill merged. Do not start slice-editorial or plan-closure.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: cd to mastermichaelt/portfolio; prove origin; start from latest origin/main; PR base main; branch represents only this slice.

Deliverables: Follow @.cursor/skills/articles-curation/SKILL.md to sync 21 articles (taxonomy table in plan), mandatory authority band note rewrite, dependent inventory copy (homepage, projects-index, production-line, production-line test, happy-path e2e) plus audit for other stale 15-article references, fixtures, registry hash, tests, article-lines comments. Mark slice-content completed in plan frontmatter in this PR.

Verification: npm run lint, typecheck, format:check, test; npm run build and e2e when content paths change per plan verification matrix.
```

### slice-editorial

```text
@.cursor/plans/2026-10-30-articles-refresh-curation.plan.md

Implement slice-editorial only. Prerequisite: slice-content merged. Do not start plan-closure.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: cd to multipliers-dev/editorial-workflow; prove origin; start from latest origin/main; PR base main; branch represents only this slice.

Deliverables: Update editor-publish SKILL §5 and docs/editorial-workflow.md (and optional docs/dev.to/README.md) so post-publish invokes full published-inventory reconciliation fail-open per plan slice-editorial. Do not edit mastermichaelt/portfolio plan frontmatter from this PR.

Verification: npm test && npm run typecheck in editorial-workflow.
```

### plan-closure

```text
@.cursor/plans/2026-10-30-articles-refresh-curation.plan.md

Execute only plan-closure.

Authority: Open PR only — docs-only archive PR; do not merge.

Prerequisites: slice-skill and slice-content merged and marked completed; slice-editorial editorial-workflow PR merged (verify with gh on multipliers-dev/editorial-workflow).

Topology: cd to mastermichaelt/portfolio; prove origin; start from latest origin/main; PR base main.

Deliverables: Cross-repo reconciliation per plan slice plan-closure — mark slice-editorial completed after verifying editorial PR merged; # Shipped note; archive plan; mark plan-closure completed; update agent prompt @ paths to archived file.

Verification: All three implementation PRs merged; frontmatter todos consistent; plan validator green.
```
