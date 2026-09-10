---
name: Impeccable setup
overview: Add Impeccable as a Cursor agent design review/refinement capability — skill + preToolUse detector hook, semantic PRODUCT.md and DESIGN.md referencing canonical repo sources, AGENTS.md operator docs. Engine binaries stay untracked.
todos:
  - id: impeccable-setup
    content: "PR: Install Impeccable (Cursor), seed PRODUCT/DESIGN context, update AGENTS.md and .gitignore"
    status: completed
  - id: plan-closure
    content: "Docs-only PR after impeccable-setup merges: add # Shipped note, move plan to .cursor/plans/archive/2026-09-10-impeccable-setup.plan.md"
    status: completed
isProject: false
---

# Shipped

**Archived 2026-09-10.**

| Slice            | Delivered                                                                                                                                |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| impeccable-setup | [#38](https://github.com/mastermichaelt/portfolio/pull/38) — Impeccable skill, hooks merge, `PRODUCT.md` / `DESIGN.md`, `AGENTS.md` docs |
| plan-closure     | This PR — archive to `.cursor/plans/archive/2026-09-10-impeccable-setup.plan.md`                                                         |

Plan artifact (Plan-only PR): [#37](https://github.com/mastermichaelt/portfolio/pull/37).

**Deferred (out of scope):** First design exercise (`/impeccable audit home`, polish, etc.); `npx impeccable detect` CI gate; interactive `/impeccable init`; `package.json` dependency on `impeccable`; production UI changes from Impeccable workflows.

This plan is archived. The work described here has shipped; the remaining content is preserved for historical context.

# Impeccable setup

## Recommended execution authority

| Slice            | Recommended authority | Agent instruction                        |
| ---------------- | --------------------- | ---------------------------------------- |
| impeccable-setup | Open PR only          | Do not merge. Stop after opening the PR. |
| plan-closure     | Open PR only          | Do not merge. Stop after opening the PR. |

Repo default: **Open PR only** ([planning-standards.md](../../standards/planning-standards.md#repo-default-when-no-plan-slice-applies)).

## Repository topology (default)

The integration branch is `main`. Start the implementation slice from latest `origin/main`. The PR branch must represent only this slice; previous work arrives through merged `main`, not branch ancestry. PR base must be `main`.

---

## Goal

Give Cursor agents a first-class design review/refinement path via `/impeccable` (audit, critique, polish, distill, etc.) and a deterministic pre-edit detector hook, without changing production UI in the implementation PR.

**Implementation PR boundary:** capability installed + context seeded + hooks proven. First real design exercise (e.g. `/impeccable audit home`) is a **post-merge task**, not part of the implementation PR.

## Current state

- Portfolio styling is documented in [docs/design-system.md](../../../docs/design-system.md) with normative token **values** in [app/styles/tokens.css](../../../app/styles/tokens.css).
- Cursor hooks today are Layer 1 + Layer 2a in [.cursor/hooks.json](../../hooks.json) (`sessionStart` → git-hooks, `afterFileEdit` → Prettier).
- No Impeccable files are present yet.

## What Impeccable adds

Running `npx impeccable@4.1.0 install --providers=cursor --scope=project -y` from repo root produces:

| Path                             | Purpose                                                                                         |
| -------------------------------- | ----------------------------------------------------------------------------------------------- |
| `.cursor/skills/impeccable/`     | Single `/impeccable` skill (launcher at `scripts/impeccable`, reference docs, scripts)          |
| `.cursor/agents/impeccable-*.md` | Supporting subagents                                                                            |
| `.cursor/hooks.json`             | Adds `preToolUse` hook while **preserving** existing `sessionStart` and `afterFileEdit` entries |

**Engine binary model (do not commit):** The launcher lives at `scripts/impeccable`. Without a sibling binary it downloads the pinned engine into `~/.impeccable/bin/...` on first run. Upstream Impeccable gitignores `**/skills/impeccable/scripts/bin/`.

**Hook verification (installer is source of truth):** After install, verify `.cursor/hooks.json` still has `sessionStart` and `afterFileEdit` unchanged and adds a `preToolUse` entry **written by the installer**. Do **not** rewrite `preToolUse` to match documentation, an older plan snippet, or a different command shape — accept the installer's command verbatim. Command format may vary by Impeccable version (e.g. shell launcher vs `hook-before-edit.mjs`).

Impeccable reads root-level `PRODUCT.md` (product truth) and `DESIGN.md` (visual/interaction contract).

## Hook taxonomy (aligned with existing harness)

```text
Layer 1     — Hook availability (sessionStart → git-hooks)
Layer 2a    — Agent feedback
              • afterFileEdit → formatting (Prettier)
              • preToolUse    → Impeccable design detector (can block flagged proposed UI writes)
Layer 2b    — Commit correctness (Husky pre-commit)
Layer 3     — Authoritative enforcement (CI)
```

Document both Layer 2a entries under one heading in AGENTS.md.

---

## Slice — impeccable-setup

**Recommended authority:** Open PR only

**Rationale:**

- Agent harness + context files only; no production UI changes
- Merge-safe on its own; first design audit is post-merge

**Agent instruction:** Do not merge. Stop after opening the PR.

**Goal:** Install Impeccable for Cursor, seed semantic context files, document operator setup.

### Steps

1. **Branch:** `git fetch origin && git checkout -b chore/impeccable-setup origin/main`

2. **Install:**

   ```bash
   npx impeccable@4.1.0 install --providers=cursor --scope=project -y
   ```

   - Do **not** pass `--no-hooks`.
   - Commit skill payload and `.cursor/agents/`, **excluding** `scripts/bin/**`.
   - Add `.cursor/skills/impeccable/scripts/bin/` to `.gitignore`.
   - Verify hooks merge: `sessionStart` and `afterFileEdit` preserved; installer-added `preToolUse` present unchanged.
   - Post-install smoke: verify launcher resolves/downloads pinned engine without committed `scripts/bin/`, using an officially supported non-mutating command from installed v4.1.0 CLI/help output.

3. **`.gitignore`:** Add engine binary path plus Impeccable ephemeral block (`# impeccable-ignore-start` / `# impeccable-ignore-end` from upstream docs).

4. **`PRODUCT.md`:** Product truth only — audience, purpose, visitor outcomes, Experience posture. No visual or accessibility rules.

5. **`DESIGN.md`:** Semantic contract referencing `docs/design-system.md` and `app/styles/tokens.css`. No literal token duplication unless Impeccable schema requires it and requirement is proven. Portfolio anti-patterns only — not Impeccable's generic anti-slop catalogue.

6. **`AGENTS.md`:** Impeccable subsection with Nightly + Agent Skills prerequisites, commands, update path, Layer 2a agent-feedback framing.

7. **Verify:**

   ```bash
   npm run lint && npm run typecheck && npm run format:check
   ```

   - `git status` — no `scripts/bin/**` staged
   - Do **not** run `/impeccable audit` or other design commands in this PR

**Acceptance:**

- Impeccable skill + agents committed; `scripts/bin/**` untracked and gitignored
- Hooks merged without losing git-hooks or format entries
- `PRODUCT.md` and `DESIGN.md` seeded (semantic; no token-value drift)
- AGENTS.md documents operator setup and Layer 2a hooks
- No production route/component/CSS changes
- CI `verify` passes
- **Implementation PR CI:** e2e **runs** — `.gitignore`, root `PRODUCT.md`, and `DESIGN.md` are not on the docs-only allowlist in [`.github/workflows/ci.yml`](../../../.github/workflows/ci.yml) (only `.cursor/*`, `docs/*`, `README.md`, `AGENTS.md`, etc.). Plan-only PRs that touch `.cursor/**` only may skip e2e.

## Architecture

```mermaid
flowchart LR
  subgraph agentFlow [Agent design workflow]
    User["User: /impeccable polish hero"]
    Skill[".cursor/skills/impeccable"]
    Context["PRODUCT.md + DESIGN.md"]
    Canon["tokens.css + design-system.md"]
    User --> Skill
    Skill --> Context
    Context -.->|"references"| Canon
  end

  subgraph hookFlow [Layer 2a design feedback]
    Edit["Agent UI file edit"]
    PreHook["hooks.json preToolUse"]
    Launcher["scripts/impeccable launcher"]
    Cache["~/.impeccable/bin engine"]
    Edit --> PreHook --> Launcher
    Launcher --> Cache
  end

  subgraph existing [Existing harness]
    Session["sessionStart git-hooks"]
    Format["afterFileEdit Prettier"]
  end

  PreHook -.->|"merged in same hooks.json"| Session
  PreHook -.-> Format
```

## Out of scope (implementation PR)

- Production UI/CSS changes
- First design exercise (`/impeccable audit`, polish, etc.)
- `npx impeccable detect` CI gate
- Interactive `/impeccable init` session
- `package.json` dependency on `impeccable`

## Risk notes

| Risk                                  | Mitigation                                                                 |
| ------------------------------------- | -------------------------------------------------------------------------- |
| Engine binary accidentally committed  | Do not commit `scripts/bin/**`; launcher downloads to `~/.impeccable/bin/` |
| Cursor Stable lacks Agent Skills      | Document Nightly + Agent Skills in PR + AGENTS.md                          |
| `DESIGN.md` drifts from canonical CSS | Semantic roles; reference `tokens.css` / `docs/design-system.md`           |
| Hook config overwritten               | Verify all three hook types remain; accept installer `preToolUse` verbatim |
| Noisy skill upgrades                  | Review diffs on `npx impeccable update`                                    |
| Product/design overlap                | PRODUCT = audience/purpose; DESIGN = visual contract                       |

---

## Plan closure (docs-only PR)

**Recommended authority:** Open PR only

**Agent instruction:** Do not merge. Stop after opening the PR.

After `impeccable-setup` merges:

1. Verify `impeccable-setup` todo is `completed`
2. Add `# Shipped` closure note at top of plan body
3. Move to `.cursor/plans/archive/2026-09-10-impeccable-setup.plan.md`
4. Mark `plan-closure` `completed`; update agent prompt paths

Do not archive inside implementation PRs. Implementation PRs mark their own slice `completed` in frontmatter in the same PR as the code.

---

## Agent prompts (copy/paste for Cursor)

Use a **fresh Agent-mode chat** per slice. This plan is archived — prompts are preserved for historical context only.

- **Plan review — plan-only PR**
  - "Execute plan review from `@.cursor/plans/archive/2026-09-10-impeccable-setup.plan.md` only. Redraft or commit the plan artifact per repo planning standards. **Agent instruction:** Do not implement. Stop after opening the plan-only PR. Do not start implementation slices."
- **Slice — impeccable-setup**
  - "Implement impeccable-setup from `@.cursor/plans/archive/2026-09-10-impeccable-setup.plan.md` only. Start from latest `origin/main`, implement only this slice, verify the branch represents only this slice before opening the PR, open the PR targeting `main`, and verify the GitHub PR base branch is `main` after creation. Install Impeccable (exclude `scripts/bin/**`), seed `PRODUCT.md` and `DESIGN.md`, update `AGENTS.md` and `.gitignore`. **Agent instruction:** Do not merge. Stop after opening the PR. Mark `impeccable-setup` completed in plan frontmatter. Do not start plan-closure. Do not archive the plan."
- **Plan closure — plan-closure**
  - "Execute plan-closure from `@.cursor/plans/archive/2026-09-10-impeccable-setup.plan.md` only. Prerequisites: all implementation slices merged and already marked completed in frontmatter. Start from latest `origin/main`, verify the branch represents only this slice before opening the PR, open the PR targeting `main`, and verify the GitHub PR base branch is `main` after creation. Docs-only PR: verify slice todos, add `# Shipped` note, move plan to `.cursor/plans/archive/2026-09-10-impeccable-setup.plan.md`, mark `plan-closure` completed, update references. **Agent instruction:** Do not merge. Stop after opening the PR."
