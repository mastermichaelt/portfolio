---
title: The agent plan had every step except where to stop
tags:
  - ai
  - automation
  - programming
  - governance
notion_page: https://app.notion.com/p/3826cffaff9c811e9fc9ea7b2c768e61
format: dev.to
project: Codenames AI
devto_article_id: 3937432
devto_api_url: https://dev.to/michaeltruong/the-agent-plan-had-every-step-except-where-to-stop-357h
last_devto_sync: 2026-07-22T00:50:09.934Z
devto_draft_url: https://dev.to/michaeltruong/the-agent-plan-had-every-step-except-where-to-stop-j30-temp-slug-176400?preview=b85f7d49b89eab538b2fe90885e9a8a1119179c8d7b377516210ec92c4f2cffee236665ccb81a82d59559441879b7218b87cbe2ad7d064b2e687b2af
---

# The agent plan had every step except where to stop

<!--
Title names the missing stop line (failure mode), not the fix (authority handoffs),
so the regrouping merge earns the lesson. Opening leads with portable slice-plan shape; Cursor
setup follows the "you do not need Cursor" bridge before the wrong assumption.
-->

I've been running multi-slice agent plans in the [Codenames AI](https://codenames-ai.com/) repo — Renovate migrations, content-pipeline skills, dependency upgrades. I split multi-PR work into **slices** (usually one pull request each), each backed by a markdown file with file paths, verification commands, and merge-safe acceptance criteria.

You do not need Cursor to recognize the shape: any agent workflow that can open branches, push commits, or merge PRs from a written plan has the same gap. In my setup I paste each slice into a fresh agent chat as a delegation prompt — not a ticket summary, but executable instructions — and start a new chat when that PR is ready.

I assumed the checklist was enough. The plan described _what_ to build. I treated _how far the agent could go_ as implicit.

Then an agent merged a pull request I expected to review first.

## The merge that reframed planning

<!--
Lead with the regrouping merge before naming "authority handoffs." Readers need the concrete
merge and missing stop line before the vocabulary table; an outline that opened
on governance definitions felt abstract without the incident.
-->

The trigger was mundane. During the first slice of a Renovate migration, an agent regrouped dependency buckets in `renovate.json` — config-only, no version bumps, no runtime behavior. It ran lint and typecheck, opened the pull request, and merged it.

The change itself was reasonable. Config-only `renovate.json` regrouping is exactly the kind of slice you'd want off your plate.

What surprised me was the _absence of a documented stop line_. The migration plan described the edit, the verification commands, and the acceptance criteria. It did not say whether the executing agent should stop at "open PR" or continue to "merge after green checks." The plan was an implementation spec. The agent treated it as permission to finish the job.

## Implementation specs vs authority handoffs

<!--
Authority comparison table follows the incident, not precedes it—once readers have
felt the gap, two columns (implementation spec vs handoff) crystallize the lesson
without re-explaining the regrouping merge.
-->

Traditional engineering plans answer: **what work should happen, in what order, with what verification?**

Agent plans increasingly need a second answer: **how much autonomy does the next actor get?**

Those questions diverge the moment an agent can take repository actions — create branches, push commits, open pull requests, merge — instead of only recommending diffs in chat.

| Question            | Implementation plan              | Authority handoff                       |
| ------------------- | -------------------------------- | --------------------------------------- |
| What to change      | File paths, diffs, acceptance    | Same                                    |
| How to verify       | Commands, CI checks              | Same                                    |
| Where to stop       | Often implicit ("human reviews") | Must be explicit                        |
| Who enforces limits | Code review habit                | Plan recommendation + branch protection |

A human teammate might read "prepare this for review" and stop. An agent reads a completed checklist and reasonably asks: "Verification passed — what's left?"

## The first response wasn't the plan

<!--
Separate branch protection from planning standards. One enforces the boundary;
the other communicates intended authority before review. Combining them blurred
"what stopped the merge" vs "what should the plan have said."
-->

My first reaction was not to rewrite the migration plan. It was to tighten the repository boundary.

Branch protection became the safety layer GitHub enforced when the plan stayed silent — required CI checks on `main`, review rules, merge gates — infrastructure answering "may this land on `main`?" regardless of what the agent thought the plan implied.

That helped. It also surfaced the next question: if branch protection is the final gate, what should the _plan_ say about intent before the gate?

Repository guardrails and plan language solve different problems. Branch protection is authoritative — if merge is blocked, the agent stops. But protection alone does not tell the agent whether _this slice_ was supposed to end at an open PR or proceed to merge. You still need the handoff to be legible before someone reviews the diff.

## Making execution authority explicit

<!--
Portable two-level table and handoff model lead; repo standards/template follow as
one implementation example (private repo—no links). "You do not need those files"
frames the pattern for cold readers.
-->

The follow-up was documentation, not a ban on agent merges.

The portable fix: every slice names exactly how far the executor may go before any implementation detail. We use two levels:

| Level        | Label             | Agent instruction                                   |
| ------------ | ----------------- | --------------------------------------------------- |
| **Default**  | **Open PR only**  | Do not merge. Stop after opening the PR.            |
| **Elevated** | **Merge granted** | You may merge after documented verification passes. |

Default is **Open PR only**. **Merge granted** requires explicit rationale — config-only changes, docs-only closure PRs, isolated tooling with green CI. Branch protection remains the final gate even when merge is recommended.

Each slice also states **Rationale** (why this level fits) and copies the **Agent instruction** verbatim into the prompt so a fresh chat is self-contained. A plan-level summary table at the top lets you scan a multi-PR plan and see where merge is elevated before you read file paths.

**Handoff model:** On that slice, the checklist implied edit, verify, and open PR; nothing stated whether merge was in scope, so the agent treated verification success as permission to finish. The chain we wanted spelled out: plan recommends authority → human accepts by executing the plan → agent follows the recommendation → branch protection enforces the final boundary.

In our private repo, a follow-up docs change codified this as **Recommended execution authority** in our planning standards and plan template — motivated directly by the regrouping merge. You do not need those files to apply the pattern; you need the label on every slice before the agent reads the checklist.

The Renovate migration's first slice is the motivating example: config-only grouping where merge _can_ be reasonable — if the plan says so out loud.

## What changed on the next slice

<!--
Post-incident beat: first rewritten prompt with authority block—not a recap of branch
protection or the two-level table already covered above.
-->

The Renovate migration's second slice was the first prompt I rewrote with authority at the top: **Open PR only**, a one-line rationale ("runtime-adjacent dependency bumps need human review"), and an imperative agent instruction copied verbatim into the chat. The regrouping slice would have been legible with the same block — either **Merge granted** with rationale for config-only regrouping, or explicitly **Open PR only**; silence defaulted to "finish the job."

I am not arguing for autonomous merge bots on every repo. The lesson is narrower: **once agents act, plans delegate autonomy whether you write that down or not.**

Human delegation has always been fuzzy — "take a pass at this" means different things to different people. Agent delegation punishes ambiguity faster because the agent will complete every step it can justify from the text in front of it.

The plan becomes the contract between author and executor. Implementation steps say what to build. Authority steps say how far to carry it.

<!--
"Plan as contract" names the author–executor boundary without opening sibling threads
(API contract testing, discovery governance, Renovate ladder automation)—those belong
to adjacent writeups; this article stays narrow on execution authority per slice.
-->

## Why not just forbid agent merges?

<!--
Address "just forbid agent merges" before the final checklist. This is the obvious
reader objection after the next-slice section; deferring it would leave the prescriptive
ending feeling unearned.
-->

Fair pushback. If unexpected merges are the risk, disable merge capability and be done.

That misses what actually happened on the regrouping merge. The merge was not reckless — it was a config-only change with local verification and CI checks. Forbidding all agent merges would have blocked a useful outcome and pushed the work back to manual toil.

The interesting conclusion is not "agents should never merge." It is **"agents need explicit authority boundaries."**

Sometimes the right recommendation is **Open PR only** — runtime migrations, sensitive paths, slices that need human judgment before landing. Sometimes **Merge granted** is appropriate — docs-only closure, config-only regrouping, low-risk tooling with clear verification. The plan author chooses per slice. The agent follows the label. Branch protection catches mistakes either way.

Without the label, the agent invents its own stopping point from task completion heuristics. That is how you get surprised by a merge that was, by some readings, the correct next step.

## What I'd do on the next agent plan

<!--
Numbered checklist framed as future action ("on the next agent plan"), not a regrouping-merge
retrospective—readers get portable steps after objections are handled. Prescriptive
steps precede the bold takeaway so dev.to skimmers get actions before philosophy.
-->

1. **Default every slice to Open PR only** unless I can defend merge with rationale and verification.
2. **Put authority at the top of each slice** — recommended level, rationale, imperative agent instruction — not buried after acceptance criteria.
3. **Mirror authority in the plan-level summary table** so scanning a multi-PR plan shows where elevation happens.
4. **Treat branch protection as enforcement, not specification** — it blocks bad merges; it does not replace telling the agent where to stop.
5. **Re-read the plan as a handoff**, not a spec: if I pasted this into a fresh agent chat, would "stop after PR" vs "merge after green CI" be unambiguous?

Prompt engineering still matters for implementation quality. It does not substitute for stating how much autonomy you are delegating when the executor can act on the repo.

**Takeaway:** When agents can merge, push, and open PRs, a plan that only describes _what_ to build is incomplete. You are handing off work _and_ authority — write both down, or the agent will infer the second from the first.

<!--
Single bold takeaway after the checklist—not a repeat of the numbered steps—matches
the schema-first article's closing shape for readers who scroll to the bottom first.
-->

---

If you'd like to see the project that inspired these lessons, you can try [Codenames AI](https://codenames-ai.com/).
