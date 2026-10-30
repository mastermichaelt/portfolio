---
title: Git said the commit succeeded. My hooks never ran.
tags:
  - ai
  - agents
  - workflow
  - governance
notion_page: https://app.notion.com/p/3ce6cffaff9c81e288b8df65d50ac29b
format: dev.to
project: General
devto_article_id: 4860001
devto_api_url: https://dev.to/michaeltruong/git-said-the-commit-succeeded-my-hooks-never-ran-49e2
last_devto_sync: 2026-10-16T05:36:07.867Z
devto_draft_url: https://dev.to/michaeltruong/git-said-the-commit-succeeded-my-hooks-never-ran-2g96-temp-slug-5271867?preview=87bdfe06cfdf4ea76f5ee96030bc8bfce1f0c0bb5ccda069d579ce716b429344015675dd8b61f805216289939e9611f6aa8e1965d2030c579e1f4e38
---

# Git said the commit succeeded. My hooks never ran.

<!--
Incident-driven title (commit succeeded vs hooks absent). Body: incident → mechanism → fleet escalation (nested init boundaries; GrokBot/Cloud design target) → four layers → ship beat.
Timeline (provenance): worktree silent skip, Aug 2026; marketplace Layer 1, Sep 2026.
Editorial: distinct from Published agent-host lifecycle post (when turns end vs whether git hooks run); keep that in annotations only.
-->

I use [Husky](https://github.com/typicode/husky) in several repos so commits hit lint, typecheck, and format checks before they land.

I added a git worktree to work on a side branch. The worktree inherited `core.hooksPath` from the main checkout. It did not inherit the executable shims Husky generates under `.husky/_`. I committed. Git accepted the commit. None of the pre-commit recipe ran. There was no error, no red banner, no failed hook exit code. The checks I thought were mandatory simply never executed.

That was the first time I treated "hooks configured" as "hooks enforced" and was wrong.

## What "configured" actually means

<!--
Minimal cold-reader onboarding: path vs runnable shims, not a Husky tutorial; section ends on worktree implication.
-->

Modern Husky does not drop scripts straight into `.git/hooks`. Git reads `core.hooksPath`, usually `.husky/_`, and Husky installs small forwarding shims there. Those shims call the real hook scripts in `.husky/pre-commit` and friends.

A new worktree inherits the repository's `core.hooksPath` setting. Husky still has to generate executable shims under `.husky/_` in that worktree, and `git worktree add` does not do that step for you.

```text
existing checkout
├─ core.hooksPath → .husky/_
└─ .husky/_ shims     present → pre-commit runs

new worktree
├─ core.hooksPath → .husky/_   (inherited)
└─ .husky/_ shims     missing → commit succeeds, hooks silent
```

A fresh worktree could have the expected hook path configured without the executable shims needed to run the checks. Git accepted my commit anyway.

## From one checkout to a fleet of agents

<!--
Local worktrees → GrokBot / Cloud (design target) → init per checkout (no auto re-run on new worktree); hypothetical lifecycle gap, not observed Cloud incident; bridge deferred to What I changed.
-->

For years, I worked from a relatively stable checkout. I installed dependencies, initialized Husky, and rarely thought about hook setup again.

That assumption started breaking with parallel Cursor sessions in Git worktrees. Each new worktree was another checkout that needed its own hook initialization, even when the original checkout was configured correctly.

The problem became more interesting as I started designing toward a fleet of Cloud Agents coordinated by [GrokBot](https://cursor.com/docs/grok-bot). GrokBot runs on a cloud computer and delegates coding tasks to Cursor Cloud Agents, each working in its own environment.

A Cloud Agent could start correctly, run its installation scripts, and initialize Husky. But if it subsequently created another Git worktree, that checkout would need its own initialization. The startup scripts wouldn't automatically run again.

The original checkout was correctly initialized. The new worktree wasn't. And across a fleet of delegated agents, I couldn't rely on noticing and fixing every missing hook myself.

Git and Husky hadn't changed. I had started treating agent startup as the initialization boundary, when every new worktree introduced another one.

## Four layers

<!--
Plain 1–4 numbering for readers; agent feedback called out as convenience, not guarantee. Layer 1 verify/repair, 3 pre-commit when invoked, 4 independent validation.
-->

I needed hook availability to be verifiable in each environment, repairable without my intervention, and backed by checks that didn't depend on local hooks running at all.

I split those responsibilities into four layers.

| Layer                 | Responsibility                             |
| --------------------- | ------------------------------------------ |
| **1. Availability**   | Verify hooks are runnable in this checkout |
| **2. Agent feedback** | Improve formatting during edits            |
| **3. Pre-commit**     | Run local validation before committing     |
| **4. CI**             | Independently validate changes             |

Blurring these responsibilities is how silent skips hide.

Layer 1 is observability, not enforcement by itself. An agent must not assume hooks are active merely because `core.hooksPath` is set. My `verify:git-hooks` script checks that each hook under `.husky/` has an executable companion shim under `.husky/_` in this worktree. A green run means that plumbing is present here; it does not prove Git will invoke those hooks on the next commit or that pre-commit checks would pass. Layers 3 and 4 still own whether the next commit is actually protected.

Layer 2 is deliberately weak. Optional formatting while an agent edits files helps diffs stay readable. It is convenience, not a guarantee, and it does not substitute for pre-commit or CI.

Layers 3 and 4 stay separate on purpose. Local pre-commit is the recipe you choose per repo. CI is the backstop when a checkout, an agent session, or a skipped hook lets something through anyway.

## What I changed

<!--
Compact ship beat: session start → Cloud commit/startup → worktree limit + plugin reuse → outcome. Provenance (PR #39, consumer rollouts) annotation-only.
-->

I moved hook verification and repair into shared scripts that run when a Cursor session starts. They check whether Husky's executable shims exist in the current checkout, attempt repair when they're missing, and warn with `HOOKS NOT RUNNABLE` if the problem remains. Session startup stays fail-open so a broken hook doesn't prevent me from editing.

Cloud Agents need another safeguard. Cursor's hook bridge routes Git hook execution to the current repository at commit time. When the bridge is active, a missing Husky shim can produce an explicit commit failure instead of a silent skip. In repositories where I've configured a blocking Cloud startup gate, the agent also waits for that bridge to become available before starting work.

None of this automatically initializes a worktree created later in the session. Each new checkout still needs its own `prepare` run. I packaged the verification, repair, and Cloud lifecycle scripts into my marketplace plugin and reused them across repositories. Each repository still needs to wire those scripts into its installation and session-start lifecycle; installing the plugin alone doesn't activate those safeguards.

The change wasn't that every possible hook failure had been eliminated. It was that broken hook state became easier to detect, repair, or stop before an unchecked commit went unnoticed.

**Takeaway:** A configured hook path told me where Git would look. It did not tell me whether anything would run there.

---

**Implementation:** I've published the [hook verification and repair scripts](https://github.com/multipliers-dev/cursor-team-marketplace) I use across my projects. They're part of my Cursor workflow, but the implementation is public if you're interested in how I approached the problem.
