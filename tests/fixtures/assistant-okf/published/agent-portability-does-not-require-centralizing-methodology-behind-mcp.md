---
title: I was solving agent portability at the wrong boundary
tags:
  - ai
  - agents
  - workflow
  - cursor
notion_page: https://app.notion.com/p/3bc6cffaff9c8100a147d7d9fe56ecdd
format: dev.to
project: General
devto_article_id: 4508719
devto_api_url: https://dev.to/michaeltruong/i-was-solving-agent-portability-at-the-wrong-boundary-1406
last_devto_sync: 2026-09-10T05:50:13.575Z
devto_draft_url: https://dev.to/michaeltruong/i-was-solving-agent-portability-at-the-wrong-boundary-2i62-temp-slug-5679315?preview=1659540ceddcbd19754e528aa40ad27ca258b145d366e9a2758ba7247d1b48194463f2905384ad4a6eeda1ade63b46830fb544541ba6302b4c226f8d
---

# I was solving agent portability at the wrong boundary

<!--
Title names the failure mode (wrong boundary), not the destination split
or the MCP instinct. Open on copy-drift (no canonical copy) before
inventorying repos or workflow categories. Teach only enough system
after the tension lands; name the categories, do not inventory every
capability. Hint the tangle (workflows lived where they evolved); do
not promise extraction. The MCP path is an instinct reasoned past, not
an implemented comparison. End the lede on the instinct feeling
rigorous. Land "I did not need to" at the close of the MCP-instinct
section, after methodology-versus-tools earns it, not in the lede
and not as a trial verdict.
One forward-looking sentence at the close is enough. The four-scope
map is the later payoff. User-level plugin path is owned in the
reusable-procedures walk, not here.
-->

Copying the last repo's agent setup into a new one worked at first. It also copied product-specific assumptions. Once I had several active projects, there was no longer a single canonical repo I could copy from. Every improvement now had several places it could drift.

I was doing that across [Codenames AI](https://codenames-ai.com/), a portfolio site, and a resume generator. Shared workflows for planning, editorial work, dependency upgrades, review, and repo bootstrap had accumulated around them. Some still lived inside product repos simply because that was where they had evolved.

I wanted the next repo to start with the methodology already available, without cloning the implementation details of the last product.

My first instinct was to solve that with an MCP-shaped architecture. Extract the shared behavior into a separate repository. Expose it through a remote tool boundary. Every repo could call the same capability when it needed merge-safe planning rules or editorial workflow guidance.

That felt rigorous. One service. One contract. One place to version policy.

## Why the MCP-shaped instinct looked right

<!--
Name the instinct in operator terms before the shipped split. Capture-only
evidence: notes and conversation, not an implemented comparison. Do not
invent a design doc, and do not write as if two systems were run. Close on
"I never built that service / I did not need to" after the
methodology-versus-tools contrast.
-->

The idea lived in notes and conversation: treat portable agent policy the way you would treat a remote tool.

Building it would have bought a clean contract. It would also have attached the baggage that belongs to real tools:

- a runtime or service boundary
- an MCP contract and deployment story
- versioning and invocation decisions
- "when do we call this?" routing inside every agent session

That overhead makes sense when the capability is genuinely external: query Notion, pull PostHog metrics, deploy through Vercel. It does not make sense when the capability is mostly **operating methodology**: how to slice plans, when to stop after opening a PR, how to keep merge-safe invariants explicit.

Planning standards and merge-safe workflows are agent policy and procedure. They are not remote resources waiting behind a tool boundary.

I never built that service. I did not need to.

## What shipped instead: four durable scopes

<!--
Teach durable scopes as the destination split. Do not freeze this as
complete before the interview. Bootstrap skills belong in the later
extraction-pass section. After the table, walk rows in table order:
always-on policy, shared tools (already taught; one short nod),
reusable procedures (distribution wrinkle lives here: user-level
plugin path was the better fit, not another in-repo copy), then
repo files. Table
cell is inventory. Product-knowledge reason lives in the reusable-procedures
sentence (varies by product). The interview owns why stable mechanics
stay in the repo. Then one cross-cutting note: update semantics
(policy flows across existing repos; bootstrap is the baseline for new
ones unless migrated). Do not add a section, and do not widen into
lifecycle adapters or other-agent runtimes. Do not expand Team
Marketplace cardinality in visible prose.
-->

The decomposition was the work: what should follow me into every repo, what should stay behind a tool boundary, what should stay with me as procedure, and what must live in the repo itself. I happened to implement that split in Cursor (user-level rules, MCP config, installable skills, repo files). The architecture is the scopes:

| Scope                   | Role                       | What belongs here                                                                                                                                 |
| ----------------------- | -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Always-on policy**    | Invariants in every repo   | Short rules: execution authority, repository topology, stop-after-open, tool preferences, pointer to planning methodology.                        |
| **Shared tools**        | External tool boundaries   | Notion, PostHog, Vercel after you authenticate the service.                                                                                       |
| **Reusable procedures** | Workflow installation      | Full portable skills such as staged planning and new-repo bootstrap.                                                                              |
| **Repo files**          | What must live in the repo | Stable mechanics (local hooks, remote environment lifecycle, CI) and product knowledge (`AGENTS.md`, domain rules, product skills, review guides) |

**Always-on policy** kept a pointer to the planning methodology instead of a second copy of it. Copying one product repo's harness into another just to match would have recreated the drift.

**Shared tools** stay behind that authenticated service boundary.

**Reusable procedures** stay at user level. The new repo does not store those skills. I run bootstrap once to write **stable mechanics** into repo files. That step does not copy the skill into the repo, and it does not write **product knowledge** because it varies by product.

The scopes also have different update semantics: policy changes flow across existing repos, while bootstrap changes become the baseline for new ones unless I explicitly migrate older repos.

## The interview showed what still had to be reconstructed

<!--
Three-act chronology: scaling (opening) → interview leak → post-interview
deterministic bootstrap. Do not claim the architecture was finished going in.
Do not narrate interview outcome. Concrete failures: README vs AGENTS.md,
Cloud hooks, empty-repo setup reconstructed under time pressure. Keep the
three-beat failure (README vs AGENTS.md, hooks, invent-under-time-pressure).
Do not add a "not a reason to copy more harness" restatement after it.
Do not restate the
four-scope table; add only reconstruction → deterministic
materialization, and let this section own why stable mechanics stay local. The cold start is later evidence, not a second
implementation. Do not imply MCP was tried and failed; the missing
piece was not an MCP-shaped architecture. Bootstrap is drift control, not
leftover that could not be made global. Close on the
ownership/lifecycle lesson, not a second question.
-->

The first serious cold-start test was a timed AI-native product-build interview. I used the same scopes in a genuinely new repo under time pressure.

The interview proved the methodology did not depend on my existing repos. It also showed that too much generic setup still had to be reconstructed in an empty one. The agent put instructions in the README instead of `AGENTS.md`. Hooks that should have wired the remote agent environment were not reliably set up. Setup that was obvious in my established repos was not obvious when an agent had to invent it under time pressure.

Policy, procedures, and shared tools were already available. What failed was leaving stable repo mechanics to be rediscovered. An empty repo still has to run those hooks and that remote environment. The following week I converted more of that baseline into deterministic bootstrap: known-good scripts and templates for local hooks, remote environment lifecycle, CI, and other baseline infrastructure, not another round of agent redesign.

The goal is not zero bootstrap. It is to stop spending agent reasoning on decisions I have already made.

**Takeaway:** Splitting the problem by ownership and lifecycle showed I did not need an MCP-shaped architecture. Policy could stay always-on, procedures could stay at user level, stable mechanics could be materialized by running bootstrap, and the agent could spend its reasoning on the product.

---

**Editor's note (September 2026)**

Since publishing this, I extracted the implementation behind this approach into an open-source workflow and shipped it as a Cursor plugin. It includes the portable agent policy, reusable skills, and deterministic repo bootstrap described above.

The implementation is available in the [multipliers-dev/cursor-team-marketplace](https://github.com/multipliers-dev/cursor-team-marketplace) repository on GitHub.
