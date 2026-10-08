---
title: I expected pair programming with a Cloud Agent. I got a new hire.
tags:
  - ai
  - agents
  - workflow
  - productivity
notion_page: https://app.notion.com/p/37c6cffaff9c812f9c89c74bd013ced0
format: dev.to
project: AI Learning
devto_article_id: 4277148
devto_api_url: https://dev.to/michaeltruong/the-first-cloud-agent-felt-less-like-pair-programming-and-more-like-hiring-an-engineer-18j4
last_devto_sync: 2026-08-03T23:39:18.236Z
devto_draft_url: https://dev.to/michaeltruong/the-first-cloud-agent-felt-less-like-pair-programming-and-more-like-hiring-an-engineer-28m5-temp-slug-7104430?preview=3376c52ada35b4db2d8d73c4fc1fc06ee7716ec18878c3baed6ada58b658a7a4673ea4b8fc992d4e8dc96529dedc526a1505669b2c024bfa3adcfad3
---

# I expected pair programming with a Cloud Agent. I got a new hire.

<!--
Promoted from context experiment (publish verdict 2026-07-30).
Title: two-beat hook (expected pair → got a new hire); opening leads with autonomy symptom.
Hiring payoff earns in Why it felt like hiring (not restated in the lede).
Concrete Cursor story first; durable claim after (workspace vs briefed clean env).
Include local worktree contrast (not git subtree).
-->

I thought a cloud coding agent was still pair programming: the same local conversation, just running somewhere else.

The first thing that surprised me was not the code. It was how little the run needed me.

My evidence is a first Cursor Cloud Agent run against a real monorepo. What initially looked like a Cursor feature turned out to be a different execution model. The run started over in a fresh environment, did the onboarding work, and left proof. Useful. Autonomous. And missing almost everything I already knew in the local session.

## The wrong picture

<!--
Wrong assumption: remote continuity of the same pairing session.
Reader contrast later: second local worktree still shares the personal workspace.
-->

In local Cursor I already had a planning thread: investigation, tradeoffs, and tools I had already authenticated in that session (including Notion MCP). When I pointed a Cloud Agent at [Codenames AI](https://codenames-ai.com/), an npm-workspaces monorepo with an Express API, a Vite frontend, Playwright E2E, and CI, I expected continuity. Same decisions. Same auth. Same half-finished reasoning, just remote.

That assumption failed in the first hour.

## What the first run actually did

<!--
Autonomous first-run sequence in prose (no private PR link).
Portability: lesson stands without repo or Notion access.
-->

The task itself was small: make the repository ready for future Cloud Agent runs and document the non-obvious setup in `AGENTS.md`. Completing it required establishing and proving the whole execution environment.

After that prompt, the agent worked without me sitting in the loop. It cloned the repo, installed dependencies, ran lint, typecheck, build, and tests, installed Playwright browsers, ran the E2E suite, played a Solo turn in the UI (a single-player practice game), captured screenshots and a walkthrough video, and opened a pull request.

That pull request added the `AGENTS.md` notes and recorded the verification trail from the clean VM, including a hello-world Solo turn in the UI. The change set was small. The _behavior_ was large: autonomous environment setup plus artifacts local agent workflows rarely leave behind.

## Two failures I did not expect

<!--
Context non-transfer carries the arc; MCP auth is one sharp beat.
Keep product-specific auth as evidence of session boundary, not a Cursor review.
Hiring metaphor pays off in the next section.
-->

**Local reasoning stayed on the laptop.** Choices I had already made in Cursor (what mattered, what to skip, how I was framing the job) were not present in that new cloud task. Anything that depended on that judgment had to be re-established. The agent could reach the repo and CI. It could not inherit the argument I had already had with myself. Other Cursor flows can move a conversation into the cloud. This fresh task did not arrive with the local framing behind it.

**Tool auth did not ride along.** Notion MCP worked only after separate authentication for the cloud run. Local Cursor access was not session continuity. "The cloud can use MCP" and "the cloud already has my MCP sessions" turned out to be different claims.

## Why it felt like hiring

<!--
Hiring metaphor pays off here after autonomy evidence (title was the promise).
Async handoff + brief + AGENTS.md as execution-worker briefing material.
-->

Async handoff fit. Open-ended design debate in the cloud did not. The run wanted a bounded job and a definition of done, not a remote pair for figuring out the product.

You do not onboard someone by forwarding a half-finished Slack thread. You give them a machine, a checklist, and a brief. Missing context hurts more as autonomy increases, because a new clean-environment job starts without your local reasoning.

`AGENTS.md` mattered once the agent was in an unfamiliar checkout: non-obvious Node version floors, optional `.env` for local runs, E2E setup, font-sensitive visual snapshots. You do not need the file itself. The point is that this is briefing material for an execution worker, not a substitute for the planning conversation that happened on my laptop.

## Why not another local worktree?

<!--
Reader objection + preference: clean boundary is a feature, not only a limitation.
Compress: reuse advantage → coupling cost → cloud isolation trade → systems generalization.
Do not re-own brief/artifact beats (Why it felt like hiring / closing).
Use git worktrees (not subtrees).
-->

A second local git worktree can also provide parallel execution, and it has one obvious advantage: it can reuse the tools, credentials, caches, and machine state I already have. For a single developer, that can make the handoff cheaper.

But it leaves me managing another local workspace, and it keeps the result coupled to my machine: extra checkouts, local processes, port conflicts, and the risk that the result only works in my environment. A teammate cannot reproduce that run exactly without inheriting my laptop state.

A cloud agent starts with less inheritance, so the handoff matters more. In return, I get an isolated task that is easy to parallelize, with less "works on my machine" risk, and I can start or monitor work remotely without babysitting another local workspace.

Cursor was where I encountered the boundary clearly. Clean environments, onboarding, and missing laptop state are not new lessons if you have been shipping to remote servers for years. What was new was seeing that old systems idea reappear inside an AI coding workflow. The useful response is an explicit handoff, not a remote continuation of your session. Wherever coding agents become independently executable, I expect the same trade-off to appear. The boundary is architectural.

## Where each side fits

<!--
Diagram owns the durable role split (not a first-run chronology replay).
Do not restate brief/local-vs-cloud after the diagram; add open questions, later usage, artifact trail, takeaway.
-->

```text
Local workspace
(planning, judgment, brief)
        ↓
Cloud agent
(bounded execution in a clean environment)
```

That first run left open questions: whether later runs would reuse the onboarding work, and how the pattern would hold beyond one carefully bounded task.

Looking back, I kept choosing Cloud Agents for bounded execution: maintenance loops (including [dependency upgrades](https://dev.to/michaeltruong/upgrades-dont-have-to-be-a-blind-trust-exercise-13mj)), targeted bug fixes, and focused investigations such as tracing a review finding or validating a specific question. Not because the first-run costs disappeared, but because isolation and the shared task model reduced coordination overhead. The run still leaves a reviewable trail (screenshots, video, a PR), the same kind of demo evidence you would expect from another engineer handing work back.

The lasting surprise was that the clean boundary is not only a limitation. It is also the feature that makes the model scale.

**Takeaway:** A cloud agent gives up some inherited local context in exchange for isolation and scalable delegation. Brief it like a new hire, not like a remote continuation of your existing session. The context it needs must cross that boundary deliberately.

---

If you'd like to see the project behind these workflow experiments, try [Codenames AI](https://codenames-ai.com/).
