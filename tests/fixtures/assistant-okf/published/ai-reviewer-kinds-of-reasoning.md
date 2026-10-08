---
title: I fixed my AI reviewer. Then I kept solving the wrong problem
tags:
  - ai
  - workflow
  - agents
  - automation
notion_page: https://app.notion.com/p/3956cffaff9c81039526d96a00009c94
format: dev.to
project: Content Pipeline
devto_article_id: 4092992
devto_api_url: https://dev.to/michaeltruong/i-fixed-my-ai-reviewer-then-i-kept-solving-the-wrong-problem-58am
last_devto_sync: 2026-07-22T00:50:11.862Z
devto_draft_url: https://dev.to/michaeltruong/i-fixed-my-ai-reviewer-then-i-kept-solving-the-wrong-problem-2bd3-temp-slug-7435404?preview=822cd70a378ebe96664442daaf19f27c5571e3cb5dbb35516d9d2f7f30203e44ad4aa4e1835284adfdd9c18ba683048a997b7638f07f10e94b1d1cee
---

# I fixed my AI reviewer. Then I kept solving the wrong problem

<!--
Sequel framing: baseline article is prior shipped work. Legacy retrieval surfaced Schedule
drafting notes and the published reviewers piece as the anchor — link without re-deriving
read-before-score.
-->

I've been building an AI-assisted editorial pipeline for technical writing. Notion cards become markdown drafts in the repo, pass through review, then sync to dev.to.

Last month I shipped a post about the first big fix to my **editor-critique** reviewer skill: [The AI reviewer scored 23/25 and missed the point](https://dev.to/michaeltruong/the-ai-reviewer-scored-2325-and-missed-the-point-51mh). The problem was sequence. A score-first pass treated a polished rubric as the first lens and produced QA feedback when I needed editorial feedback. Reordering the skill so analysis precedes scoring fixed that.

I assumed the next improvements would come from rubric tuning. Longer prompts. Another scoring dimension. Sharper checklists.

That assumption was half right. The rubric still matters. But every useful fix after the baseline shared a different shape.

**The pattern I kept missing**

<!--
Wrong-lever beat before incidents; pattern label lands after Incident 1 earns it.
Narrative order: adversarial → subtractive → secondary thread (not implementation chronology).
-->

After I reordered analysis before scoring, reviewer failures kept arriving from different incidents. A critique that agreed with itself too easily. Drafts that grew every revision without getting shorter. A middle section that felt like a second article.

Each time I reached for the same lever: expand the rubric, add a rule, lengthen the prompt.

## Incident 1: When the reviewer needs to argue with itself

<!--
Adversarial review (PR #352, #355): freeze primary judgment, then falsify with
draft-supported counter-evidence — not open-ended skepticism. Distinguish from
score-first failure: sequence was right, falsification was under-powered.
-->

**editor-critique** produced decisive scorecards and prioritized feedback, but the report rarely challenged its own conclusions. A draft could earn **Ready to sync** with medium items left unexamined.

Score-first review had failed because it judged too early. This failure was different: the primary critique could be thorough and still under-falsified.

The fix was another staged pass. After the primary critique drafts, freeze it. Run adversarial review that assumes the primary assessment is wrong until draft-supported counter-evidence proves otherwise. Then synthesize: change the publication recommendation only when falsification is material.

I added adversarial review, synthesis, and canonical report assembly as new skill steps. A follow-up pass tightened adversarial review with an anchor requirement: every counter-evidence bullet must name the frozen primary claim it challenges. No orphan hypotheticals like "title spoils thesis?" when the primary critique already praised title strategy.

**Before:**

```text
Editorial read-through
→ Score
→ Critique
→ Post report
```

**After:**

```text
Editorial read-through
→ Score
→ Primary critique
→ Adversarial review (frozen inputs)
→ Synthesis
→ Post report
```

That was the first time staging a different kind of reasoning into its own pass beat rubric expansion. Two more failures would repeat the same shape before I stopped treating it as coincidence.

## Incident 2: When critique only adds

<!--
Subtractive editing (PR #381): pair expansion recommendations with displacement;
flag material that stops earning its place — motivated by PR #368 layered drafts.
-->

Self-falsification helped, but drafts were still growing. Investigation while critiquing [Upgrades don't have to be a blind trust exercise](https://dev.to/michaeltruong/upgrades-dont-have-to-be-a-blind-trust-exercise-13mj) showed feedback was consistently additive, but not subtractive. **editor-critique** found missing framing and evidence boundaries reliably. It did not ask what should be removed when new material arrived.

The result was layered drafts: an opening stacked on another opening, the same four-step investigation loop restated in three sections, a mental-model diagram that walked through event flow the prose had already established in the previous section.

The fix was not "be shorter" in the rubric. It was naming another cognitive job in the read-through: subtractive editing. Every paragraph should continue earning its place. Flag existing redundancy and addition-induced redundancy. Pair expansion recommendations with material that would become redundant if adopted.

A companion technique, **single-owner ideas**, lists 2–4 core ideas and flags when the same idea appears in multiple sections without new evidence. I codified subtractive editing in the skill file along with a test case that catches additive-only critique regressions and a lightweight subtractive pass in the human revision step.

The primary critique still owns expansion. Subtractive editing is a separate observational pass, not a rewrite engine.

## Incident 3: When a section becomes its own article

<!--
Secondary explanatory thread lens (PR #337): critique needed to notice when evidence
temporarily hijacks the reader's primary question — not ban technical detail.
Broadens pattern from critique mechanics to reader cognition.
-->

The last failure pushed past critique mechanics into reader cognition. While critiquing draft variants in my editorial workflow, several middle-body sections were technically correct but felt wrong in context. In one draft, an implementation walkthrough interrupted the investigation arc. In another, a full section on validation tooling read like its own mini-article.

The failure mode was narrow: a section stopped advancing the reader's current question and temporarily made another explanatory thread the center of gravity.

Adding a rubric dimension for "section focus" would have been vague. What worked was an observational lens in the editorial read-through step: name the primary thread, name the secondary thread, decide whether to compress, delay, embed later, or leave as-is.

I codified this as a **Secondary explanatory thread** lens in the skill file. The rubric stayed the same. It simply added a named cognitive job: track whether prose is serving the reader's current question or drifting into a side article.

## What stayed constant

<!--
Evidence boundary from card: baseline is prior work; this card's claim starts after it.
Avoid feature-list framing — synthesis, not changelog.
-->

Three incidents, three skill changes, one pattern. Across all three, a few constraints held:

- The five-dimension rubric stayed mostly intact.
- Read-only governance did not change: critique still does not write repo files or gate publish.
- Each pass added another observational lens, not another scoring dimension.
- The expensive part was naming the cognitive job precisely enough to operationalize in a skill file.

The recurring mistake was treating undifferentiated reasoning as one pass. Each fix changed the sequence, not the rubric weight. A capable reviewer can read before it scores and still under-read if falsifying primary judgment, displacing redundant prose, and tracking reader focus all compete in the same step.

## Before you expand the rubric

1. **List the failure modes** that survived your last sequence fix.
2. **For each one, name the cognitive job** that failed (self-falsification, subtractive editing, reader-focus tracking).
3. **Stage that job as its own observational pass** with a frozen handoff to the next step.
4. **Expand the rubric only if** that observational pass still misses failures in production.

<!--
Inline calibration per Closing and evidence calibration — field-report scope;
generalization beyond editorial workflow is hypothesis, not a closing disclaimer section.
-->

Once **editor-critique** understood before judging, the remaining improvements came from separating kinds of reasoning into distinct stages, not from a bigger rubric or a longer single pass. I suspect the pattern may generalize beyond editorial critique.

**Takeaway:** When a reviewer skill plateaus after a sequence fix, ask which cognitive jobs are still sharing one undifferentiated pass. Stage them before you expand the rubric.

---

If you'd like to see the project behind these workflow experiments, try [Codenames AI](https://codenames-ai.com/).
