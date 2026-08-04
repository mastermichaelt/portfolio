# Cursor planning standards

We merge every PR into `main` as soon as it is ready. **Each PR must be merge-safe on its own** — no “land half the change and fix correctness in PR N+2.”

Always-applied stop surface: [merge-safe-prs.mdc](../rules/merge-safe-prs.mdc).

## Lightweight vs staged planning

Not every change needs a multi-slice `.cursor/plans/*.plan.md`. Keep governance proportional to the work:

| Work shape                                                                    | Path                                      |
| ----------------------------------------------------------------------------- | ----------------------------------------- |
| Typo, copy tweak, or small content fix                                        | Direct small PR; no multi-slice plan      |
| One page, component, or content-module update                                 | Single implementation PR                  |
| Cross-cutting work spanning multiple concerns (IA, data layer, design system) | Staged multi-PR plan via `.cursor/plans/` |

Multi-slice plans are for cross-cutting or multi-concern work. Simple PRs still follow **Open PR only** (default) and merge-safe rules — they just skip the plan template. For unplanned lightweight work, the user may explicitly grant **Merge granted** with rationale in the current instruction without creating a staged plan solely to authorize merge.

Product roadmap notes under `docs/plans/` are not staged execution plans unless promoted into `.cursor/plans/*.plan.md`.

## Recommended execution authority

### Repo default (when no plan slice applies)

**Default execution authority: Open PR only.** This applies to fresh chats, generic repo instructions, ad-hoc tasks, and any work without a committed plan slice.

- Agents must **not merge** unless either the **current committed plan slice** or the **user’s explicit instruction for the current unplanned task** grants **Merge granted** with rationale.
- If no plan slice applies, the user has not granted Merge granted, authority is omitted, or authority is unclear → **stop after opening the PR**.
- User prompts that match [alias phrases](#alias-phrases) (e.g. “commit the plan and open a PR”, “commit the plan only”) → **Plan-only PR** — narrower than Open PR only; do not begin implementation unless the user explicitly grants broader authority.
- If branch protection blocks merge → **stop and escalate** (report; do not bypass).
- Branch protection and human review remain the final enforcement boundary (see [Current enforcement boundary](#current-enforcement-boundary)); authority labels are handoff instructions, not credential-level permission envelopes.

Per-slice recommendations below apply to staged `.cursor/plans/` work; they do not replace this repo default for unscoped sessions.

Plans are **execution handoffs**: when a plan (or slice prompt) is pasted into a fresh agent chat, the plan should actively recommend how far the agent may take that slice — not merely document restrictions.

**Handoff model:** plan recommends authority → human accepts by executing the plan → agent follows the recommendation → branch protection enforces the final boundary.

| Step          | Who         | What                                                                                                                                                                                                                                                                                                                                             |
| ------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Recommend** | Plan author | States recommended authority, rationale, and agent instruction per slice                                                                                                                                                                                                                                                                         |
| **Accept**    | Human       | Pastes plan/slice prompt into agent chat                                                                                                                                                                                                                                                                                                         |
| **Follow**    | Agent       | **Plan-only PR:** drafts/commits plan artifact only; stops after opening the PR. **Open PR only** / **Merge granted:** implements the slice; runs documented verification; follows the agent instruction. **Manual verification gate:** runs only the specified verification; writes only allowed gitignored outputs; reports the verdict; stops |
| **Enforce**   | GitHub      | Branch protection, required checks, and review rules — recommendations do not override repo settings                                                                                                                                                                                                                                             |

**Baseline capabilities** (always allowed when executing a plan): create branches, commit, push, and open pull requests (ready for review). For **Plan-only PR**, “commit” means the plan artifact only (see [Plan-only PR](#plan-only-pr)).

**Default recommendation:** **Open PR only** — stop after opening the PR unless the plan recommends otherwise with rationale.

### Authority hierarchy

PR authority ladder (narrowest → broadest):

```text
Plan-only PR  →  Open PR only  →  Merge granted
```

- **Plan-only PR** — create or revise a plan artifact for review; no implementation.
- **Open PR only** — implement the slice and open a PR; do not merge.
- **Merge granted** — implement, verify, and merge when preconditions pass. For staged plans, the committed slice must state Merge granted with rationale. For unplanned lightweight work, the user’s current instruction may grant Merge granted with rationale without a staged plan.

Agents sometimes treat “commit the plan and open a PR” as permission to keep implementing because **Open PR only** assumes implementation is in scope. **Plan-only PR** makes that stop explicit.

### Plan-only PR

Use when the user (or a plan slice) wants plan review **before** implementation begins.

**Purpose:** Create or revise a plan artifact so it can be reviewed before implementation begins.

**Allowed:**

- Inspect repository context needed to draft the plan
- Create or update the plan file (`.cursor/plans/*.plan.md`)
- Align the plan with repository planning standards
- Commit the plan artifact
- Open a pull request for plan review
- Update the PR description to explain that the PR is plan-only

**Not allowed:**

- Do not implement the plan
- Do not edit app code, tests, workflows, config, or implementation docs unless planning standards explicitly require a planning-artifact update there
- Do not continue past opening the PR
- Do not merge the PR

**Expected diff:** Plan artifact only (+ optional PR description metadata). No source, test, config, workflow, or implementation documentation changes.

**Stop condition:** A PR is opened containing only the plan artifact and clearly marked as plan-only.

**Agent instruction (template):** Do not implement. Stop after opening the plan-only PR.

See also [Active vs archived plans](#active-vs-archived-plans) and staged plan item 8 below.

### Execution invariants

The following execution invariants apply independently of execution authority. They constrain _how_ a slice is executed regardless of which authority label (`Plan-only PR`, `Open PR only`, `Merge granted`) applies; they are **not** additional rungs on the PR authority ladder.

#### Manual verification gate (non-PR)

Some plan slices require evidence generation or manual verification **without** mutating tracked repository state. Use **Manual verification gate** when a plan slice must run a specified verification or evidence-generation step (for example, checks under `.agent-runs/**`) and report a verdict before plan closure — **without** opening a PR or editing tracked files.

**Purpose:** Produce verification evidence and report a verdict so plan closure can proceed with required proof.

**Allowed:**

- Inspect repository context needed to run the specified verification
- Run only the verification named in the slice
- Write only explicitly allowed gitignored artifacts required by the verification (for example, `.agent-runs/**` paths named in the slice)
- Report the verdict and artifact paths in chat

**Not allowed:**

- Do not commit
- Do not open a PR
- Do not edit tracked files
- Do not perform implementation work while executing the verification
- Do not continue past reporting the verdict

**Repository diff:** none (tracked files unchanged).

**Stop condition:** The specified verification has run, required gitignored artifacts are present when applicable, and the verdict has been reported.

**Agent instruction (template):** Do not commit or open a PR. Run only the specified manual verification, do not perform implementation work, write only allowed gitignored outputs if needed, report the verdict, and stop.

#### Repository topology invariant

This invariant prevents accidental stacked PRs. Multi-slice plans stack execution order, not Git branches.

The repository integration branch is `main` unless documented otherwise.

Implementation slices start from and target the repository integration branch by default — unless a committed plan slice explicitly says otherwise.

Slice continuity is logical, not git-topological. A slice branch is never the repository integration branch. Prerequisites are satisfied by merging into the integration branch, not by targeting another slice branch.

The bug this invariant prevents has two observable parts: a wrong PR target **and** a branch diff that carries previous-slice work. Patching only the PR target while the branch still contains a prior slice's changes still produces an oversized diff. The branch diff matters as much as the PR target, so state the observable property — the branch represents only the current slice — rather than prescribing a mechanism (fresh branch, rebase, cherry-pick, etc.).

Agents must not infer branch topology or PR target from:

- the currently checked-out branch
- the previous slice branch
- another open PR
- local git state
- the branch they were asked to continue from

If the intended target is unclear, stop before opening the PR and report the ambiguity.

##### Phased checklist

| Phase                     | Scope            | Steps                                                                                                                                                                                    |
| ------------------------- | ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Before implementation** | Local repository | Start the slice from the latest integration branch (typically `git fetch` then a fresh branch from `origin/main`).                                                                       |
| **During implementation** | Local repository | Implement only the current slice.                                                                                                                                                        |
| **Before opening the PR** | Local repository | 1. Verify the current branch represents only the current slice. 2. Verify previous-slice work is already present through the repository integration branch, not through branch ancestry. |
| **After opening the PR**  | GitHub           | 1. Verify the GitHub PR base branch is `main`. 2. Verify the PR diff does not include previous-slice work except through merged `main`.                                                  |

On mismatch after opening: stop and report. Do not continue implementation work on that PR.

Exception: only when a committed slice explicitly documents a non-integration-branch target with rationale. This should be rare.

##### Topology example

```text
Incorrect - stacked PR target

main
 `- slice-1
     `- slice-2

PRs:
  slice-1 -> main
  slice-2 -> slice-1    <- not permitted

Incorrect - PR target patched to main, branch still carries slice-1

main
 `- slice-1
     `- slice-2

PR:
  slice-2 -> main    <- still not permitted (branch diff includes slice-1 work)

Correct - parallel branches from integration branch, same PR target

main
 |- slice-1
 |- slice-2
 `- slice-3

PRs:
  slice-1 -> main
  slice-2 -> main
  slice-3 -> main
```

### Alias phrases

Treat these user phrases as **Plan-only PR** unless the user explicitly grants broader authority (e.g. “then implement slice 1”, “Open PR only for slice-1”):

- “commit the plan and open a PR”
- “commit the plan only”
- “open a plan-only PR”
- “prepare a planning PR”
- “open a PR for plan review”
- “redraft the plan and open the PR”
- “commit only the plan”
- “plan review before implementation”

### Recommendation levels

Use exactly one label per slice.

**PR authority ladder** (narrowest → broadest):

| Level         | Label             | Agent instruction (template)                                                                                            |
| ------------- | ----------------- | ----------------------------------------------------------------------------------------------------------------------- |
| **Narrowest** | **Plan-only PR**  | Do not implement. Stop after opening the plan-only PR.                                                                  |
| **Default**   | **Open PR only**  | Do not merge. Stop after opening the PR.                                                                                |
| **Elevated**  | **Merge granted** | You may merge after documented verification passes and preconditions are met. Branch protection remains the final gate. |

**Orthogonal execution mode** (not on the PR ladder):

| Mode                         | Label                        | Agent instruction (template)                                                                                                                                                               |
| ---------------------------- | ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Non-PR verification gate** | **Manual verification gate** | Do not commit or open a PR. Run only the specified manual verification, do not perform implementation work, write only allowed gitignored outputs if needed, report the verdict, and stop. |

### What every recommendation must include

For each slice, document:

1. **Recommended authority** — `Plan-only PR`, `Open PR only`, `Merge granted`, or `Manual verification gate` (orthogonal non-PR mode)
2. **Rationale** — bullet list (risk, scope, review needs)
3. **Agent instruction** — imperative sentence copied verbatim into the slice prompt

When **Manual verification gate** is recommended, also document in the slice body:

- **Specified verification** — exact workflow or operator steps
- **Allowed gitignored outputs** — explicit paths (for example, `.agent-runs/**` subdirectories)
- **Verdict / stop condition** — what evidence closure requires and how the agent reports completion

When **Merge granted** is recommended, also document in the slice body (or Verify block):

- **Preconditions** — e.g. prerequisite slice merged
- **Required verification** — reuse the slice test plan; do not duplicate

### Placement in plans

- **Plan-level summary:** `## Recommended execution authority` immediately after the plan title (before the first slice) — table of slice → recommended authority → agent instruction.
- **Per-slice detail:** repeat the three fields at the top of each slice section so a copied prompt is self-contained.

### Guidance for plan authors

- **Default to Open PR only** for implementation slices unless the slice is low-risk, well-scoped, and verification is straightforward.
- **Recommend Plan-only PR** for optional pre-implementation plan-review slices when the plan should land for human review before any code changes.
- **Recommend Merge granted** for docs-only closure PRs or isolated low-risk changes with clear verification — always with rationale and verification listed.
- **Unplanned lightweight work:** when there is no staged plan, default remains **Open PR only**. The user may still grant **Merge granted** in the current instruction (with rationale) for an isolated direct PR — do not invent a staged plan solely to authorize merge.
- **Recommend Manual verification gate** for slices that must generate verification evidence under `.agent-runs/**` without committing, opening a PR, or editing tracked files — place these slices before `plan-closure` and name the allowed gitignored output paths.
- **Multi-slice plans:** recommend authority **per slice**; do not blanket-recommend merge unless every slice meets the same bar.
- **Repository topology:** the default branch-from and PR target is the integration branch (`main`). Prerequisites mean "the prior slice merged to the integration branch," not "branch from the prior slice."
- **Human acceptance:** pasting a slice prompt is the handoff — no separate grant step beyond authoring the recommendation.

### Examples

**Docs-only / low-risk slice:**

```markdown
**Recommended authority:** Open PR only

**Rationale:**

- Governance docs only
- No application behavior changes
- Human review of authority wording

**Agent instruction:** Do not merge. Stop after opening the PR.
```

**Plan-review slice** (optional pre-implementation):

```markdown
**Recommended authority:** Plan-only PR

**Rationale:**

- Plan must be reviewed before implementation slices begin
- Expected diff is plan artifact only

**Agent instruction:** Do not implement. Stop after opening the plan-only PR.
```

**Manual verification gate slice** (orthogonal non-PR mode):

```markdown
**Recommended authority:** Manual verification gate

**Rationale:**

- Verification writes only gitignored artifacts, not tracked implementation changes
- Evidence must be produced before plan closure
- No PR or tracked-file diff is appropriate for this slice

**Agent instruction:** Do not commit or open a PR. Run only the specified manual verification, do not perform implementation work, write only allowed gitignored outputs if needed, report the verdict, and stop.
```

### Safety boundaries

- **Branch protection is authoritative** — if merge is blocked, the agent stops and reports.
- **Recommendation ≠ merge-safe waiver** — merge-safe PR rules still apply; authority governs how far the agent proceeds after verification.

### Current enforcement boundary

Plan slices declare intended execution authority, but this is not currently enforced by task-scoped credentials.

Current enforcement comes from a combination of:

- reduced-scope GitHub PAT credentials used by Cursor agents
- GitHub branch protection (when enabled)
- human review before merge

This means **Plan-only PR**, **Open PR only**, **Merge granted**, and **Manual verification gate** are explicit handoff instructions, not credential-level permission envelopes.

## Merge-safe PRs

- A merged PR must not leave `main` in a broken, misleading, or partially wired state.
- Stacked plans are fine for **scope and reviewability**, not for deferring known gaps that the current PR can already affect. Staged plans stack **execution order**, not Git branches: each slice obeys the [Repository topology invariant](#repository-topology-invariant).
- Do **not** defer known issues in these areas to a later PR:
  - repository contract or domain-type correctness
  - route / content behavior this PR introduces
  - coverage and tests for logic this PR introduces
  - lifecycle / reset wiring when this PR adds client state

If a later PR is still needed, it should add capability that is genuinely unavailable — not paper over missing correctness from an earlier merge.

## Staged plan authoring

For multi-PR plans under `.cursor/plans/` (skip this section for lightweight direct PRs):

0. **Plan file naming:** New executable plans under `.cursor/plans/` should use the `.plan.md` suffix and include structured frontmatter (`name`, `overview`, `todos`, `isProject`). Use plain `.md` for non-plan reference docs. Prefer [`.cursor/plans/_template.plan.md`](../plans/_template.plan.md).
1. **Per-PR acceptance** must be merge-safe: what ships to `main` after this PR alone?
2. **Per-PR test plan** must list checks required in that PR, not only in the final PR.
3. Do not label later PRs as the sole home for correctness that the current PR’s merge already requires.
4. Multi-PR `.plan.md` files should include a final closure todo, e.g. `plan-closure`: archive plan in a docs-only PR after the last implementation PR merges with date-prefixed archive naming.
5. **Per-slice progress in frontmatter:** Each implementation PR must set **its** todo `status: completed` in the plan frontmatter in the **same PR** as the production code. Optionally append the merged PR number to `content`. Do not change other slices’ statuses, add `# Shipped`, or move/archive the plan.
6. Implementation PR prompts should not include archival steps unless the PR is explicitly the closure PR.
7. **Agent prompts (copy/paste):** Multi-PR `.plan.md` files should include an **Agent prompts (copy/paste for Cursor)** section with one ready-to-paste prompt per agent-executable frontmatter todo — including implementation slices, `plan-closure`, and any optional plan-review or Manual verification gate todos. Each prompt should:

- Reference the plan file path (e.g. `@.cursor/plans/<slug>.plan.md`)
- Name the slice (`Phase 2`, `PR3`, todo id, `plan-closure`, etc.)
- State scope boundaries (`only`, `do not start …`)
- List deliverables and stop conditions for that slice
- Include the slice’s **Agent instruction** verbatim from its authority recommendation (see item 8); do not contradict the **Recommended authority** level
- Note prerequisites when they exist (prior PR merged)
- Include the [Repository topology invariant](#repository-topology-invariant) phased reminders when the slice opens a PR: start from latest `origin/main`, verify the branch represents only the current slice before opening the PR, and verify the GitHub PR base branch is `main` after creation
- Instruct the agent to mark the slice todo `completed` in plan frontmatter in the same PR when the slice opens a PR (see item 5); Manual verification gate slices mark completed only if the plan documents that step after the verdict
- For implementation slices: omit archival steps (see item 6). For `plan-closure`: include archival steps only
- Prefer **fresh Agent-mode chats** per slice

Example shape:

```markdown
## Agent prompts (copy/paste for Cursor)

- **Next step: Phase 2 — content-hardening**
  - "Implement Phase 2 (content-hardening) from `@.cursor/plans/<slug>.plan.md` only. … **Agent instruction:** Do not merge. Stop after opening the PR. Mark `content-hardening` completed in plan frontmatter. Do not start Phase 3. Do not archive the plan."
- **Plan closure — plan-closure**
  - "Execute plan-closure from `@.cursor/plans/<slug>.plan.md` only. … **Agent instruction:** Do not merge. Stop after opening the PR."
```

8. **Recommended execution authority:** Every executable `.plan.md` should include authority recommendations per [Recommended execution authority](#recommended-execution-authority):

- **`## Recommended execution authority`** near the top — plan-level summary table (slice → recommended authority → agent instruction)
- **Per-slice block** at the top of each slice: **Recommended authority**, **Rationale**, **Agent instruction**
- **Plan-only PR** for optional pre-implementation plan-review slices; **Merge granted** recommendations must cross-reference the slice’s Verify / test-plan bullets for preconditions and required verification
- Default when unspecified: **Open PR only**

## Active vs archived plans

- Treat `.cursor/plans/*.plan.md` as the source of truth for active work, **excluding**:
  - `.cursor/plans/archive/` (historical only)
  - [`.cursor/plans/_template.plan.md`](../plans/_template.plan.md) (boilerplate skeleton only — never execute it as a plan)
- Treat `.cursor/plans/archive/` as historical context only.
- When implementing or continuing work, ignore archived plans and `_template.plan.md` unless explicitly asked for historical context, migration history, postmortem analysis, or template authoring.
- If both active and archived versions of a plan topic exist, prefer the active plan and call out ambiguity.

## Plan completion rule

When the final implementation PR for a staged plan is merged, open a final docs-only closure PR that:

1. Verifies all implementation todos are already `completed` or `cancelled`; fix stragglers only.
2. Verifies every **Manual verification gate** slice produced its required evidence (verification run, allowed gitignored artifacts present when applicable) and reported its verdict.
3. Adds a `# Shipped` section with shipped date, merged PR links/numbers, and deferred work.
4. Moves the plan to `.cursor/plans/archive/` using `YYYY-MM-DD-<slug>.plan.md` (archive/shipped date prefix).
5. Marks `plan-closure` `completed` and updates references to the archived plan path.
6. Makes no application behavior changes.

Implementation slices should already be marked `completed` in frontmatter when their code PRs merged (see staged plan item 5). Closure is for archival, not first-time progress tracking.

Keep active `.cursor/plans/` reserved for in-progress work only; do not leave finished plans there.

## PR description

When opening a PR (from a staged plan or a lightweight direct change), fill [`.github/pull_request_template.md`](../../.github/pull_request_template.md) and call out:

- **Execution authority** — `Plan-only PR`, `Open PR only`, `Merge granted`, or `Manual verification gate` (see [Recommendation levels](#recommendation-levels))
- **PR target** — the integration branch `main` (or cite the committed slice exception that authorizes another target)
- Which plan slice todo was marked `completed` in frontmatter (same PR), when applicable
- What ships in **this** PR only
- Verification run (lint / typecheck / format / test:coverage / build), or N/A for docs-only
- Anything intentionally deferred
