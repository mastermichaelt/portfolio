---
title: Throwaway experiments are easy to start. Retiring one safely is not
tags:
  - ai
  - agents
  - workflow
notion_page: https://app.notion.com/p/3d66cffaff9c81c49e10c06c92918e48
format: dev.to
project: General
devto_article_id: 4619455
devto_api_url: https://dev.to/michaeltruong/throwaway-experiments-are-easy-to-start-retiring-one-safely-is-not-2afe
last_devto_sync: 2026-09-10T05:33:19.113Z
devto_draft_url: https://dev.to/michaeltruong/throwaway-experiments-are-easy-to-start-retiring-one-safely-is-not-hl9-temp-slug-1706623?preview=45c027505bbedcc30605c0ebefd7bf9f25d5a475db5c731d342f6fc340f9089ca464399cd91b48ebcb77246ed2d7b0cc26f62944add119caf4b816c7
---

# Throwaway experiments are easy to start. Retiring one safely is not

<!-- Title: experiment retirement tension (not repo spin-up). Opening lands incident;
   failure modes; sequence table + takeaway in close. -->

I was closing out a throwaway repo from an agent-workflow experiment. I had treated experiment repos as cheap to delete once the hypothesis felt answered. The prototype had to go because leaving both checkouts live gave later agents two competing sources of precedent. Deleting it meant deciding what had been validated, writing it down somewhere durable, and removing experiment surfaces only after that record was complete.

Standing up the narrow prototype had been genuinely fast. [Portable agent policy, skills, and repo bootstrap](https://dev.to/michaeltruong/i-was-solving-agent-portability-at-the-wrong-boundary-1406) had already made that part easy. Safe retirement was not.

## What was validated before deletion

The experiment had tested one narrow claim: a working agent could turn captured learnings into retrospective summary cards in a single pass, without a dedicated second inference service. The prototype wired learnings into Notion, ran that synthesis step, and left card formats, retrieval defaults, and cap rules as unproven demo choices. Most of the wiring was unhardened prototype.

By retirement time, that conclusion was already in architecture notes. Everything else in the prototype wiring was discardable.

The audit question was not "did I copy every file?" It was "did I record every experimentally supported conclusion before I delete the experiment?"

The answer was yes. That cleared the way for the part where things actually got scary.

## Three ways experiment retirement goes wrong

<!-- Failure modes mirror closing sequence: Plan, doc absorption, delete external. -->

**The first failure mode is preserving provisional choices because they feel unique.**

When I asked an agent to plan the retirement, its first draft tried to absorb all the demo logic into architecture notes before deletion: card formats, retrieval defaults, cap rules, idempotency guesses. That treats retirement like archival absorption. The audit question above already ruled that out.

Agents completing a "retire safely" goal default toward documenting every visible artifact, because nothing marks validated conclusions versus provisional hacks unless you write an explicit discard list. An earlier architecture pass had already elevated some of that demo protocol as if it were product design; retirement needed de-specification, not more absorption.

Two different leftovers would have read as precedent. One run had produced five retrospective cards from eight captured learnings; that still looked like evidence even though the pipeline was unproven. A forty-card demo cap would have landed the same way: the next agent writes "last time we capped retros at forty cards" into architecture even when the experiment never validated that limit.

My retirement plan named what not to absorb so the real product could be designed from validated direction plus product constraints, not inherited defaults.

**The second failure mode is deleting before you unlink.**

Live GitHub and Notion links in architecture notes look harmless until the repo is gone and the URLs 404. Agents (and future-you) follow those links, infer missing context, or treat dead references as signals that something was lost mid-migration.

A docs-only absorption step had to land first: reframe the experiment in past tense, strip live experiment URLs, drop protocol details the experiment never validated, and point readers at the written record.

Only after architecture notes were self-contained did I delete the GitHub repo, the Notion databases, and the local checkout.

**The third failure mode is treating search results as deletion targets.**

When you have three related Notion databases (raw learnings, retrospectives, improvement ideas) linked by relations, you need a verified deletion set before you touch anything. My retirement plan listed exact database IDs and data source IDs, verified independently against the live workspace, and deleted them in reverse dependency order: improvement ideas, then retrospectives, then raw learnings.

Stray-page search was allowed only as inspection: find standalone pages that might belong to the experiment, report them, and do not delete anything that search returns unless you can prove it is experiment-only.

That rule exists because search is retrieval, not enumeration. A query that mentions "learning" or the experiment project name will surface unrelated pages. An agent under pressure to "clean up" can easily delete the wrong surface if search hits become the allowlist.

## Why retirement needs semantics

Agentic workflows lower the cost of spinning up experiment repos, skills, Notion schemas, and multi-root checkouts to test a hypothesis in isolation. Nothing in the default toolchain lowers the cost of retiring them safely, so teams accumulate ambiguous surfaces that agents treat as canonical.

Those three failure modes are what retirement looks like without explicit decisions. The sequence that held up looked like this:

| Step            | What it did                                                                                           |
| --------------- | ----------------------------------------------------------------------------------------------------- |
| Plan            | Write down what will be deleted, in what order, and what must be captured first                       |
| Doc absorption  | Make architecture notes self-contained: past tense, no live experiment links                          |
| Delete external | Delete GitHub repo, Notion DBs, and local checkout with exact ID allowlists, under human verification |

Whether that retirement contract should live in a central registry, per-repo retirement plans, or something else is still an open design question.

**Takeaway:** Answering the hypothesis is not retirement. Capture validated conclusions in durable docs, make those docs self-contained, then delete external experiment surfaces from a verified allowlist under human verification.
