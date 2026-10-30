---
title: The agent host didn't have the lifecycle boundaries I assumed
tags:
  - ai
  - agents
  - workflow
notion_page: https://app.notion.com/p/3e46cffaff9c81d28ddfdeca964f18ed
format: dev.to
project: General
devto_article_id: 4730137
devto_api_url: https://dev.to/michaeltruong/the-agent-host-didnt-have-the-lifecycle-boundaries-i-assumed-5akh
last_devto_sync: 2026-09-25T02:01:00.000Z
devto_draft_url: https://dev.to/michaeltruong/i-thought-integration-would-be-wiring-the-host-did-not-have-the-boundaries-i-assumed-3ead-temp-slug-9227644?preview=ab6234c223b93187ea11b87de06de40cd5cfe0c3293100529e740e9828e9c6d7e30f9005de38c5fdc380d2fc65023b0a8ec3a36106b0340e99b2503d
---

# The agent host didn't have the lifecycle boundaries I assumed

<!--
Narrative arc: working-conditions shift → baseline semantic path → review boundaries →
architecture hypothesis → three host probes (identity → correlation → repo evidence) →
synthesis table → Cloud breaks correlation → single takeaway (events ≠ boundaries).
Cursor is case-study host; diagram is host-independent shape.
-->

As I started handing agents longer pieces of work, I stopped being present at every lifecycle boundary.

In shorter copilot-style sessions I had been part of the control loop without really thinking about it. Longer agent runs broke that assumption: I was no longer present to know when work finished, what mattered, or what context should survive into the next task.

One place this surfaced was memory. I wanted an agent to review completed work and decide whether anything was worth carrying into future sessions. I call the system I built for that Savepoints.

Savepoints already had the semantic path:

```text
Agent work
→ Observe
→ emit-savepoint (worth keeping?)
   → emit-learning / no_capture
```

Observe what happened, decide whether anything was worth keeping, then emit a learning or explicitly capture nothing.

The weak point was how that review started. It depended on the agent following instructions, but I had no reliable way to tell whether it had.

Across four substantial agent sessions, observe hooks confirmed real activity, but the `emit-savepoint` skill was consulted inconsistently and `emit-learning` never ran. I could not distinguish "reviewed the work and found nothing" from "the review never happened."

I added two boundaries around the semantic review:

```text
Agent work
→ Observe
→ Review opportunity       ← new boundary
→ emit-savepoint (worth keeping?)
   → emit-learning / no_capture
→ mark reviewed            ← new boundary
```

Open a review opportunity when observed work needed review, then mark that evidence as reviewed once the opportunity had been handled.

_Observation and semantic judgment stay separate._

## What I assumed the host could establish

<!--
Architecture hypothesis before probes; three operational questions; Cursor as case-study host.
-->

I already had a suspected shape for the larger system, and checking half a dozen agent-memory systems reinforced it: opportunity IDs, idempotent review closure, fail-open hooks, semantic judgment left to the agent.

What remained uncertain was whether those invariants had reliable lifecycle boundaries to attach to in the host.

For this implementation, the host was Cursor, which exposes lifecycle hooks such as `beforeSubmitPrompt`, `afterFileEdit`, and `stop`.

The host seemed to expose enough information to establish three boundaries: whether a turn was review scaffolding or source work, whether lifecycle events belonged to the same piece of work, and whether that work had actually affected this repository.

If those answers were reliable, the adapter was straightforward: register the work, watch its evidence, then open review when it completed.

I expected the next pass to be production wiring.

Live probes said otherwise.

## Probe 1: Host provenance is not scaffolding identity

<!--
Recursion on first implementation → beforeSubmitPrompt provenance fails → protocol marker.
-->

The straightforward implementation used Cursor's `stop` hook as the completion signal. When ordinary work hit `stop`, Savepoints would open a review opportunity and send a follow-up asking the agent to review what had just happened.

That immediately created a recursion problem. **The review was itself another agent turn.** If that turn also ended in `stop`, Savepoints could mistake its own review for more completed work and open another review.

```text
ordinary work
→ stop
→ open review
→ review follow-up
→ stop? (could trigger another review)
```

The natural first question was whether the host could tell me that this new turn was the review follow-up I had created.

I tried making that distinction when `beforeSubmitPrompt` fired. If the host could tell me whether a prompt came from the user or from the follow-up I had generated, I could classify the turn before any work happened.

Live probes showed that distinction was not reliable enough to build on.

So I stopped asking the host to infer an identity I controlled. When Savepoints creates a review follow-up, it now marks it explicitly:

```text
SAVEPOINTS_CAPTURE_REVIEW_V1 opportunity_id=<uuid>
```

A prompt with that marker is review scaffolding. It does not register as new source work, so the review cannot recursively open another review.

Instead of inferring scaffolding identity from host metadata, I made it part of the protocol I owned.

## Probe 2: `stop` did not establish which work had finished

<!--
Earlier one-shot guard (pre-marker) exposed ordering assumption → stale guard (~100s) →
generation_id correlates generations; event order alone is not proof.
-->

Explicitly marking the review turn solved one problem: Savepoints no longer had to infer whether a prompt was its own scaffolding.

But an earlier attempt to contain that recursion had exposed a different assumption about `stop`. Before I added the marker, I had tried a simpler guard: after opening review, suppress the next `stop`.

That assumed the next `stop` belonged to the review I had just opened. It didn't.

```text
open review
→ expect review stop
→ no stop arrives
→ guard remains armed

~100 seconds later
→ unrelated work stops
→ stale guard eats it
```

I tried several variations on the same idea. None gave me a reliable way to distinguish "the review I just started has finished" from "some unrelated work has finished."

The stale guard had assumed an ordering relationship the host did not guarantee. A `stop` told me that something had ended. It did not prove that the thing ending was the review I had just opened.

`generation_id` gave me a stronger relationship: events carrying the same ID could be connected to the same agent generation. I no longer had to assume that the next `stop` belonged to the work I was tracking.

But correlation only told me which events belonged together. It did not tell me whether that work had affected this repository.

## Probe 3: Hook scope is not repository evidence

<!--
One generation may span repos; each repo gates on its own evidence.
Simultaneous multi-repo review orchestration remains deferred (see end note).
-->

Multi-root workspaces exposed why that distinction mattered.

A single agent generation can touch several repositories in one session. Session-wide hooks still run in each Savepoints-enabled repository, even when the edit happened somewhere else.

That meant `generation_id` could tell me that events belonged to the same agent generation, but not which repository that work had affected. A generation did not need a single repository owner. It could span several repositories.

```text
one agent generation
│
├─ edits repo A/
│  └─ afterFileEdit under repo A's root → evidence for repo A
│
└─ edits repo B/
   └─ afterFileEdit under repo B's root → evidence for repo B

Each repo evaluates its own evidence independently.
```

Seeing the hook fire was therefore not evidence that this repository had been affected. Each repository asked a narrower question: **did this generation produce evidence here?**

An `afterFileEdit` event counted only when its `file_path` resolved under that repository's `repoRoot`. If the session touched another repository but none of those edits belong here, this repository does not open review.

Shell and MCP activity does not count toward this gate because I cannot reliably tie it to a repository. Savepoints can still learn from what happens around a tool call; it just does not try to observe what happens inside a tool boundary.

## Three boundaries that must stay separate

<!--
Causal synthesis after three probes: question-first table; no post-table re-explanation.
-->

By this point, each failed assumption had removed an inference from the adapter. What remained were three boundaries that needed separate evidence:

| Boundary I needed                                              | Reliable signal                      | What I could not infer                         |
| -------------------------------------------------------------- | ------------------------------------ | ---------------------------------------------- |
| Is this Savepoints' own review turn?                           | `SAVEPOINTS_CAPTURE_REVIEW_V1`       | Scaffolding identity from host provenance      |
| Do these lifecycle events belong to the same agent generation? | `generation_id`                      | Which work had finished from event order alone |
| Did this work affect this repository?                          | `afterFileEdit` under its `repoRoot` | Repository evidence from hook scope            |

## Sometimes the correct adapter is unsupported

<!--
Cloud: individually useful events may not compose into an end-to-end lifecycle boundary.
Refuse to guess; unsupported reconnects to review safety.
-->

On Desktop, I could now follow one piece of work all the way through: it started, this repository produced evidence, the same work stopped, and Savepoints opened review.

Then I ran the same design in Cloud.

Every piece seemed to be there. I could see work start, observe repository-local file edits, and see a final `stop`.

The individual lifecycle events existed. The boundary I needed between them did not.

```text
this work started
→ this repository produced evidence
→ this same work stopped
→ open review
```

On Desktop, `generation_id` connected that chain. In Cloud, the ID I saw when work started and while evidence was collected did not reliably match the one I saw at `stop`.

I could have tried to guess which events belonged together using `conversation_id`, timing, or rules for normalizing the IDs.

I didn't. Probe 2 had already shown the problem with guessing at correlation: seeing events in the expected sequence was not proof that they belonged to the same work.

If Savepoints could not reliably establish that the work it observed was the work that just stopped, it could not safely open review for it. So in Cloud, the adapter treats capture review that depends on lifecycle hooks alone as `unsupported`.

That does not mean Savepoints cannot run in Cloud, or that an agent cannot save a learning. It means this adapter cannot establish the evidence needed to guarantee this particular review path.

I was also reluctant to build my own correlation scheme on top of a lifecycle surface that was still evolving. [A later public Cursor report](https://forum.cursor.com/t/generation-id-has-extra-suffix-for-afteragentthought/166275) documented different `generation_id` shapes across hook types. I would rather wait for a stable primitive I can verify than own an approximation that the host may eventually make unnecessary.

<!-- Simultaneous multi-repository review orchestration remains deferred: each repository
gates locally; workspace-level coordination when several repos want review in one session
is unsolved. -->

**Takeaway:** An agent host can expose lifecycle events without exposing the lifecycle boundaries your system needs. I had to establish scaffolding identity, lifecycle correlation, and repository-local evidence separately instead of inferring them from host events.

I could establish review identity myself, but correlation and repository evidence still needed independent proof. When the host could not provide that proof in Cloud, `unsupported` was more accurate than another heuristic.
