---
title: We made agent session logging independent of individual repositories
tags:
  - ai
  - agents
  - workflow
notion_page: https://app.notion.com/p/4076cffaff9c81769c51dae93d7f94c3
format: dev.to
project: AI Learning
devto_article_id: 5129824
devto_api_url: https://dev.to/michaeltruong/we-made-agent-session-logging-independent-of-individual-repositories-3mbc
last_devto_sync: 2026-11-27T05:55:25.568Z
devto_draft_url: https://dev.to/michaeltruong/we-made-agent-session-logging-independent-of-individual-repositories-3a05-temp-slug-1300166?preview=9603634795b1cc05f2ee03f610cec9ccbfe98dab9152ecbe27de9b5763894bfff743f64f92ef31eccccff2b58263db6e76f4c0b4826c66815ddcf47f
---

# We made agent session logging independent of individual repositories

<!--
Governing thesis: a personal engineering methodology should be separable from the repositories it is applied in, and that separation is what lets the methodology evolve without changing those repositories. Every section serves it: the boundary (opening), portable skills and centralised activation (the separation, with an observed example), the validator (the methodology evolving without reintroducing repository changes), composability and consumer owned orchestration (why that works). The Takeaway states the thesis; it is not a new abstraction.
No formal definition of "methodology". The practice is shown through the need in the opening: a short record per session, written while the work is fresh, holding what shipped, what was decided, and what is still open. Savepoints comes after the motivation and the constraint is the tension; Lite is introduced as carrying the methodology without hooks, not as a contrast with Savepoints. No explicit contrast between full Savepoints and Lite, no "durable learnings vs session narrative" framing, no promotion versus append comparisons.
The tension is the author's own: the Savepoints integration was meant to be portable but was not, because each repository had to carry the hooks and rules, which meant modifying the repositories themselves, sometimes ones the author had no right to add logging to for everyone who works in them. State it plainly as fact in the constraint paragraph ("I thought of that integration as portable... It was not"). The methodology is the underlying practice and hooks were one integration mechanism; do not reopen a Savepoints versus Lite comparison. Do not dramatize it or invent an incident, and do not frame hooks themselves as bad (the conclusion owns that). The host lifecycle post is linked once, in the opening, as context for why hook based integration depended on the host; do not retell it.
Open source example (motivation, in the opening, before Savepoints is introduced): an illustrative scenario, not a claim about a specific contribution. It motivates portable skills and centralised activation: repositories own their tooling, the person or agent working across repositories owns the methodology. One or two sentences; do not expand it or repeat it in the conclusion. A shared cache service is the analogy that clarifies this for the author; keep it out of visible prose unless it improves the explanation.
Sequencing (chronological discovery): need (preserve useful context from each session) -> motivation (carry the practice into repositories I do not own; open source example) -> Savepoints as an existing project -> tension: the integration was meant to be portable but required modifying repositories (per-repository hooks and rules, some not mine to change), plus the host dependency -> router and provider skills -> centralised distribution and activation, with the observed example -> the incomplete record observation from using Lite across repositories -> the validator CLI and what it does about a missing property -> composability and consumer owned orchestration. Never reveal the validator or composability before the observation that motivates them.
Orchestration history: the decision to leave orchestration to the consumer is a design property of the package, not a response to agents misusing the validator. Do not connect the two causally. The misuse is a lesson from extending the methodology, kept inside the validation section and not repeated in the conclusion or Takeaway.
Terminology follows savepoints-lite: "post write validation" (validation.post_write) for the optional feature, "validator CLI" for the executable, "verification" for the agent act of running it, "repair" for the one bounded fix. Do not use "checker" or "script" in visible prose. Avoid release note chronology, version numbers, and implementation detail that does not serve the thesis. Hyphenated compounds stay out of visible prose; restructure instead.
Title: "We" is the approved title; the body is first person singular because the work is mine. Do not change the title without the human.
-->

I run agents across a lot of repositories. After each session I want a short record of what shipped, what we decided, and what is still open, written while the work is still fresh.

I also want to carry this practice into repositories I don't own. If I'm contributing a fix to an open source project, I shouldn't need to add my personal tooling or agent instructions to their repository.

I already had a way to preserve context from agent work through a project called Savepoints. It uses agent lifecycle hooks to capture and persist learnings beyond the session that produced them.

While the persistence could be shared across repositories, the lifecycle hooks and rules had to be integrated into each repository. That integration also depended on the host, and not every host [exposed the same lifecycle boundaries](https://dev.to/michaeltruong/the-agent-host-didnt-have-the-lifecycle-boundaries-i-assumed-5akh).

## Distributing the methodology as portable skills

<!--
Chronological discovery: this section covers only the router and provider skills. Do not mention the validator or composability here; both are introduced later, after the observation that motivates the validator.
Lite is another integration of the practice the opening motivates: one that needs no hooks and no repository wiring. Describe Lite as having started instruction only; it now also ships the validator CLI, so never describe it as instruction only in the present tense. Keep implementation detail to what a cold reader needs: routing and persistence as separate skills, the host's Notion MCP, fail open.
Notion is the provider the author uses, not an architectural requirement; the router and the provider skill are separate for that reason. Name Notion once, here, as "the provider I use", and gloss Notion MCP for readers who have not used it. After this paragraph use provider agnostic terms: data store, persisted record, persistence configuration, provider response. Do not imply alternative providers already exist, and do not add a section on provider independence.
-->

I built Savepoints Lite to carry the same methodology across repositories without relying on lifecycle hooks. Rather than embedding the methodology in each repository, Savepoints Lite started as a package of portable agent skills, with routing and persistence as separate capabilities.

A router skill decides when to write a record, and a provider skill persists it. The provider I use is Notion, through the host's existing Notion MCP, which lets an agent read and write Notion. If a write fails, the agent continues its primary work.

<!--
Merged from the former "Centralising distribution and activation" section: standalone adoption kept the repository boundary; marketplace distribution plus global activation moved it. The marketplace integration is the optional integration layer; its framing as one composition of the pieces belongs in the conclusion, not here.
Observed example (portability evidence, replaces an architectural explanation). Five repositories took an adoption commit on 27 Oct 2026 (about 18:13 AEDT): mastermichaelt/portfolio 44aead1, mastermichaelt/resumes 0b3c8dd, multipliers-dev/editorial-workflow b05e96d, multipliers-dev/codenames-ai-guesser 6f6b73e, multipliers-dev/renovate-workflow 9bb1505. Each took a removal commit about 02:00 AEDT on 28 Oct (3c55dda, 50941cd, 2c329c8, cc81a35, a2fb3e7) once marketplace distribution (cursor-team-marketplace PR #71, cleanup PR #73) replaced per repository activation. Notion Savepoints database queried 2026-11-27: records naming portfolio 44, resumes 38, editorial-workflow 36, codenames-ai-guesser 6 (124 total), every one created after the removal commit (earliest portfolio record 2026-10-28 07:07Z, which is after the removal at about 15:00Z on 27 Oct). renovate-workflow has no records and is not cited. git grep at HEAD for "savepoint" across AGENTS.md, CLAUDE.md, .cursor rules and hooks, .agents, package.json and .husky in those four repositories finds no wiring; the one hit is editorial-workflow's article voice rule, which is guidance about writing posts, not activation. No later commit touches session logging wiring in them.
Limits: the Repository value is written by the agent, and records alone do not prove which instruction path ran, but no activation path other than the plugin and User Rules exists in those repositories. Counts are as of 2026-11-27: 124 records across the four repositories (portfolio 44, resumes 38, editorial-workflow 36, codenames-ai-guesser 6). Visible prose carries no absolute record count, so these figures live here for traceability. The 119 record audit in the next section is an earlier snapshot of a different population, taken before the validator existed; its exact counts stay in the validation annotations and out of visible prose. Package portability and Cursor specific integration are not restated in visible prose; the preceding paragraph already names the Cursor plugin and User Rules. Do not expand into a host compatibility discussion. Claude Code and other hosts are unobserved.
Dropped from visible prose as implementation detail: the thin /savepoints wrapper, the data_source_id naming, adoption commit hashes, and the savepoints-lite PR #18 hub cleanup. Keep package version out of visible prose.
-->

Initially, using Savepoints Lite still meant installing the package and adding session logging instructions to each repository's `AGENTS.md`. The methodology was packaged separately, but activation still depended on each repository.

I then moved distribution into a [Cursor team marketplace](https://github.com/multipliers-dev/cursor-team-marketplace) plugin and activation into global Cursor User Rules. My personal persistence configuration stays in a gitignored local file.

I removed the existing session logging instructions from my repositories and continued recording sessions across them through the shared plugin.

## A confirmed write was not always a complete record

<!--
Beats in discovery order: (1) the observation, which emerged from using Lite across repositories: 16 of 119 records (visible prose: around one in eight) missing required properties despite successful writes; this observation comes before the limitation of write confirmation and before the validator is introduced; (2) the validator CLI as a third capability, the responsibility split, what it does on a missing property, and the observed misuse; (3) the lesson, which belongs to extending the methodology and is not an article level takeaway. The thesis job of this section: the methodology gained a capability, and then fixes to that capability, without any repository adopting new tooling or lifecycle integration. Provider agnostic wording; Notion is not named here. Do not repeat these mechanics in the conclusion.
Omitted on purpose because they belong in implementation documentation: provider response format, instruction ordering, the rationale for not mandating invocation, credentials, exit codes, configuration defaults, and enforcement guarantees. The validator is written against the current provider's response format; do not imply other providers exist or that it supports arbitrary providers. Do not claim that the validator repaired the 16 historical records (they were not backfilled; the 16 rows with no Repository and no Agent are still in the database), that completeness improved because of it, that usage rates improved, that validation is mandatory, or that every write is verified.
Source records (omitted from visible prose on purpose; do not restore as statistics).
Baseline: 103/119 records had all required properties before verification existed; 16 were missing Agent or Repository. A create call confirms the page exists, not that every property landed. Query 2026-11-27: 212 records, 16 with no Repository and the same 16 with no Agent, last created 2026-11-18.
One week audit after adoption (from the archived hardening plan summary, not the original audit artifact): 39/39 records complete, 0 organic repairs, verification attempted on 18 of 39 appends, so no credit to validation for the completeness gain. Of the 18 attempts, 11 read back and validated persisted values, 6 ran the CLI on JSON built from intended values, 1 was an invalid invocation. Of 9 CLI running sessions, 5 failed on the first call (an explicit input flag the instructions did not show; one agent read only the first 80 lines of the skill and improvised a command). 5 of 39 records had a bare repository name.
What the validator does on a missing property (provider skill, savepoints-notion): the validator names the missing property; where the agent already has a usable value for that append it makes one update to the same page, then fetches and validates once more; it never invents a value; it never changes a confirmed write into a failure. Validation is optional, off by default, controlled by validation.post_write, agent judged per append.
Tool and instruction fixes that followed: the validator accepts the fetched page directly, and the skills were shortened with the verification invocation up front. Distribution of the validator and of those fixes: cursor-team-marketplace PR #78 (validator and optional validation) and PR #80 (fixes); adoption after merge was a plugin refresh and fresh chats, with the validation flag in the author's own User Rules; no commit to any consumer repository. Automated tests cover CLI behaviour only.
Live smoke after the fixes: one agent, one desktop Cursor session; three appends with verification on the first and last; an induced missing property repaired once and validated again. The default off scenario was inconclusive and must not be asserted as a pass. No audit has been rerun since the changes, so no claim of improved usage rates. Cloud Agents and non Cursor hosts are unobserved.
-->

Using Savepoints Lite across my repositories, I found that around one in eight persisted records were missing required properties such as the repository or the agent name. A successful write confirmed that the record existed, but not that every property had been stored.

To address this, I added a third capability: a validator CLI that checks a persisted record against its schema. The validator identifies missing properties, and the agent can repair the record if it already knows the missing values.

The validator is responsible for checking the record. It is the agent's responsibility to retrieve it from the data store and pass it to the validator.

In practice, some agents skipped the retrieval step and passed in the original write payload instead. Others struggled to invoke the validator correctly. I simplified the validator's input interface and made the instructions more explicit about how to use it.

Instructions for a deterministic tool matter as much as the tool: they have to say not only when to run it, but how.

Both the validator and its subsequent improvements were distributed through the shared plugin, without requiring changes to my repositories.

## Composable capabilities

<!--
Conceptual conclusion; it explains why the thesis held, rather than introducing another principle. Composability is carried once by the diagram (component relationships, all components now introduced) plus a short explanation of consumer owned orchestration; do not restate component relationships or the validation mechanics in prose. The skills provide orchestration guidance; the package does not enforce a model. Only the validator is deterministic; the router and provider skills are interpreted by agents, so do not title or describe all capabilities as deterministic, and do not label deterministic code versus agent interpreted skills in the diagram.
The author's workflow (global User Rules) is the one composition observed to need no repository changes. Other consumers choose where and how to orchestrate, including hooks or automation, which may be implemented inside repositories depending on their environment: do not claim every consumer integration leaves repositories untouched, and do not claim anyone integrates this way. The conclusion explains the principle (the package separates capabilities from their integration into an environment, so the consumer chooses where and how orchestration happens) and states that hooks were not the problem in themselves, only requiring every repository to adopt one integration. It does not restate repository independence or the marketplace and User Rules mechanics: the distribution and validation sections own that evidence. The Takeaway states the thesis and the transferable lesson the article demonstrated: separating a methodology from the repositories it is applied in is what lets it evolve without changing them. Do not present optional invocation as the innovation or repeat the misuse lesson here. Omitted on purpose and kept in the grounding below: npm executable, JSON input, Node version, global User Rules detail.
Grounding (savepoints-lite 2.2.0, checked against the repository): README design principle section (invocation and verification are independently usable capabilities; orchestration left to the consumer; agents may invoke verification at their discretion while adopters needing stronger guarantees integrate hooks, automation or host specific lifecycle mechanisms). package.json exposes the validator as the npm bin savepoints-lite-validate and requires Node 22 or later. docs/architecture.md layer model: router owns what and when, provider owns how to persist, validator owns deterministic property checks only; the marketplace integration is an optional layer. The architecture doc notes the validator has no independent consumers today, so the article says it can be integrated and does not claim anyone does. Only the Notion provider exists; do not imply others.
Hooks are not bad; they just do not belong in the package. No audit statistics here. The host lifecycle history is told once, in the opening.
-->

Savepoints Lite provides independently usable capabilities and leaves their orchestration to the consumer. The skills provide guidance without enforcing a particular integration.

```text
consumer orchestration: agent instructions, hooks, or automation
│
├─ record
│  router skill (decides when to record)
│  └─ provider skill (persists to the data store)
│
└─ verify
   validator CLI (checks the persisted record)
```

My workflow is one way of composing these capabilities. Other consumers can integrate them through their own instructions, hooks or automation.

Hooks were not the problem in themselves. Requiring every repository to adopt one particular integration was.

**Takeaway:** A portable methodology should be able to evolve without requiring changes to the repositories where it is used.

---

**Implementation:** I've published [Savepoints Lite](https://github.com/multipliers-dev/savepoints-lite) as an npm package I use across my projects. It's part of my agent workflow, but the implementation is public if you want to see how the router, provider, and optional validator fit together.
