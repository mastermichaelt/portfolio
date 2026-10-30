---
title: We made our agent plans portable. Then we had to make them verifiable.
tags:
  - ai
  - workflow
  - governance
notion_page: https://app.notion.com/p/4026cffaff9c81c9851df6817eb99fcd
format: dev.to
project: General
devto_article_id: 4908472
devto_api_url: https://dev.to/michaeltruong/we-made-our-agent-plans-portable-then-we-had-to-make-them-verifiable-3ead
last_devto_sync: 2026-10-24T04:03:44.597Z
devto_draft_url: https://dev.to/michaeltruong/we-made-our-agent-plans-portable-then-we-had-to-make-them-verifiable-5a4e-temp-slug-1852470?preview=d527d9c153437ac382f15e5738c88b3895681f6a9355c9f33c4c9f29a621680147a217cfa5aad039cf88638ceb47a6f87a3f66c05b5e8f1bbf938e2c
---

# We made our agent plans portable. Then we had to make them verifiable.

I use AI agents to work across several software projects. For larger changes, I give them a Markdown plan that breaks the work into smaller pieces, with clear instructions about what each piece should deliver and when the agent needs to stop for review.

These plans live alongside the code, so each repository can manage its own work. A plan can contain multiple slices, each describing a chunk of work and where human review should kick in. Slices don't map directly to pull requests; several can ship together or span more than one. Some repositories also keep a boilerplate template so new plans start from the same outline.

For a concrete example, here's [an archived plan from a vector retrieval experiment](https://github.com/mastermichaelt/portfolio/blob/main/.cursor/plans/archive/2026-10-07-assistant-vector-retrieval-experiment.plan.md).

In an [earlier post](https://dev.to/michaeltruong/i-was-solving-agent-portability-at-the-wrong-boundary-1406), I described how I moved our planning methodology to a shared, portable implementation so every repository could point at the same rules instead of copying them by hand. That answered how to distribute the methodology. It did not answer how to know each repo's plans still matched it.

I deliberately kept those repositories separate. Some are public, some are private, and each needs to ship on its own timeline without negotiating every planning edit with the others. We share conventions through the methodology; we do not share a monorepo.

I still assumed shared conventions were enough on their own. Plans read fine in review; nobody was checking mechanical consistency at scale.

## The missing check

Language models are good at reasoning about how to divide work and what trade-offs belong in the plan. They are not a cheap way to confirm that every heading, todo id, and required section lines up with the rules. I wanted ordinary code for that: fast, repeatable checks in local runs and CI, with no second model pass.

Active plans guide what agents actually execute: the work to complete, the instructions for each step, when to stop for review, and how to verify the result. The validator checks that those elements are present and consistently structured. It doesn't guarantee that an agent will follow the plan, only that the required instructions are in place.

A repository can follow the shared methodology without installing the validator. I added a small deterministic checker through a reusable GitHub workflow where I wanted structure enforced in CI. It judges mechanical shape only, not whether a plan is wise, complete, or safe to merge.

The first workflow pass validated active plans only. During rollout, a smoke run in one repository passed while the log still showed the boilerplate template as unchecked, so we updated the reusable workflow to run both paths wherever a boilerplate template exists.

```text
Repository adopts optional plan validation
→ Active plans
  → Structural checks on executable plans
→ Local template (if present)
  → Strict checks on the starting template
→ CI flags structural violations before merge
```

## What validation revealed

Across six repositories, the validator caught problems in plans that agents were already using. In one plan, section headings didn't match the work items they were supposed to represent. Other sections were missing required labels for verification or rationale. The plans looked fine when read normally, but their structure didn't match the shared rules.

The templates revealed a similar problem. Three of the six repositories kept their own starting templates, and all three failed validation. Some used a different structure from the shared rules; others contained example instructions that the validator interpreted as real ones. These were small differences that had accumulated as the repositories evolved independently.

The individual fixes were small, but they showed that sharing a methodology hadn't kept the plans structurally consistent. CI now checks for those mismatches as plans change, rather than relying on reviewers to notice them.

**Takeaway:** Let LLMs reason about the work, but verify the plans agents execute from with deterministic checks so required instructions and boundaries are structurally present before execution starts.

---

**Implementation:** I've published the [plan validator source](https://github.com/multipliers-dev/cursor-team-marketplace/tree/main/packages/plan-validator) I use across my projects. It's part of my agent planning workflow, but the implementation is public if you're interested in how I approached the problem.
