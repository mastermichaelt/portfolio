---
title: The AI reviewer scored 23/25 and missed the point
tags:
  - ai
  - workflow
notion_page: https://app.notion.com/p/3846cffaff9c819cbcd9cecedd725926
format: dev.to
project: Codenames AI
devto_article_id: 3999059
devto_api_url: https://dev.to/michaeltruong/the-ai-reviewer-scored-2325-and-missed-the-point-51mh
last_devto_sync: 2026-07-22T00:50:14.183Z
devto_draft_url: https://dev.to/michaeltruong/the-ai-reviewer-scored-2325-and-missed-the-point-4o9a-temp-slug-7388541?preview=65bd3d7988719b484186ad9af1c6f67ccdb4178eb3593f6546383f02a696666ed181fb68901388d5d8ac160968dcaef82a509792fb28d523dea680ce
---

# The AI reviewer scored 23/25 and missed the point

<!--
Open on the reviewer failure readers recognize before naming editor-critique.
Motivation: reproduce the Bugbot code-review loop (produce → review → iterate →
ship). Legacy broad retrieval surfaces the card's wrong-assumption lede and the
pipeline context discovered from linked editorial corpus.
-->

I've been building an AI-assisted editorial pipeline for my technical writing. Notion cards become markdown drafts in the repo, pass through review, then sync to dev.to.

The motivation was simple: I already had a review loop I trusted for code. Open a PR, run Cursor's **Bugbot** against a review guide, fix what mattered, merge. I wanted the same rhythm for writing: draft, critique, revise, publish. So I built my own AI review skill called **editor-critique**.

I had also started adding HTML comments inside drafts, much like code comments. They captured the editorial intent behind a section, including why it opened where it did and why evidence sat where it did, without becoming part of the published post.

That made the review step look straightforward. Give the AI a rubric, score the draft, return prioritized feedback.

If the rubric was good, I assumed the critique would be good.

That assumption failed in a very specific way.

The first version of **editor-critique** did what I asked. It read a draft, applied five scoring dimensions, and produced a polished report. While reviewing my article, ["The agent plan had every step except where to stop"](https://dev.to/michaeltruong/the-agent-plan-had-every-step-except-where-to-stop-357h), it scored the piece **23/25** and mostly suggested polish.

It also missed the feedback I actually needed.

## Valid rubric, shallow read

<!--
Keep the concrete before/after on screen before the workflow vocabulary.
Card documents score-first missing reader-journey issues; analysis-first
surfaced thesis timing, audience gaps, and evidence-boundary drift.
-->

The draft did not need another pass on commas and section labels. It needed a colder editorial read.

A useful reviewer should have asked:

- Does the title reveal the lesson before the incident earns it?
- Does the article assume private repo context a dev.to reader will not have?
- Are links to PRs, plans, and standards supporting evidence, or required reading?
- Is governance framing outrunning what the incident actually proved?

Those are reader-journey questions, not formatting checks.

The score-first reviewer treated the rubric as the first lens. If the thesis was present, evidence was named, and the arc looked complete, the draft read as ready. The rubric turned critique into publication preflight: complete sections, reasonable voice, no obvious holes.

Useful, but not enough.

## What changed in the sequence

<!--
Name the sequence change plainly. The observed fix was ordering, not a bigger
model or a longer rubric — avoid implying prompt magic fixed the review.
-->

I revised the reviewer skill so analysis precedes scoring.

**Before:**

```text
Load draft
→ Score rubric dimensions
→ Generate critique
```

**After:**

```text
Load draft
→ Editorial read-through
→ Score rubric dimensions
→ Generate critique
```

The rubric stayed. It stopped being the opening move.

Before scoring, the reviewer now reads visible prose like a cold dev.to audience member. It mentally strips author notes and asks whether the lesson still works if repo links and hidden rationale disappeared. Then it checks thesis timing, audience assumptions, reference framing, and speculation drift.

The annotation loop mattered here. Because the comments sat beside the sections they explained, critique could compare intent against effect: the note described what the section was trying to do, while the reader-facing paragraph showed whether it actually did it. Sometimes the article needed the edit. Sometimes the annotation exposed that **editor-critique** itself was reading the section too mechanically. Either way, the disagreement became useful training material for the reviewer skill.

Only after that read does it assign scores.

The output became more editorial. Instead of asking only "does this draft satisfy the rubric?", it started asking "what will break for the reader?"

On the same article, the revised reviewer surfaced title spoiling the lesson, private PR assumptions, weak framing for repo artifacts, and governance language potentially ahead of the evidence. The **23/25** pass had treated those as minor or invisible.

## Why order beat rubric tuning

<!--
Linter-before-design-doc analogy bridges the editorial case without claiming
every AI reviewer behaves identically. Portable model, cautious generalization.
-->

A rubric compresses judgment into categories: thesis, structure, evidence, voice, readiness. That compression helps consistency.

Compression too early can hide the problem.

Once the reviewer committed to a numerical assessment, the rest of the report tended to justify that assessment. A **23/25** draft needed **23/25** feedback, so the model organized its reasoning around why the piece was mostly ready instead of independently discovering what a reader would struggle with.

It is a little like running a linter before reading a design doc. The linter can confirm imports and formatting are clean. It cannot tell you whether the design makes sense. Start with the linter and the document can feel more complete than it is.

That is what happened here. The rubric was not bad. It was premature.

Once analysis came first, the same categories became more honest. "Evidence and specificity" could include link-only dependence. "Thesis and opening" could include title spoiling the lesson. "Publish readiness" could include whether prose survives without private repo access.

The score became a summary of the read-through, not a substitute for it.

## QA review vs editorial review

<!--
Separate checklist validation from reader-impact judgment — the practical
lesson from the card. Prose must carry the distinction without requiring
readers to open editor-critique/SKILL.md.
-->

The revision made me distinguish two kinds of AI review.

**QA review asks:** Did the artifact satisfy the stated criteria?

**Editorial review asks:** What will the reader misunderstand, miss, or not believe?

This was not completely new to me. In code review, I already used different Bugbot guides depending on what I wanted it to optimize for: security, game-state changes, UX regressions, or plan intent. The same diff could be reviewed through different lenses.

Writing turned out to have the same property as code review. A QA reviewer checks completeness and publishing criteria. An editorial reviewer reads for audience confusion and belief. The artifact stayed the same. The review lens changed.

Both matter. Broken frontmatter, missing sections, or absent takeaways still need QA. But if the reviewer starts and ends there, it can produce a confident report that never engages the reader's path through the article.

The first reviewer was not useless. It was doing QA under the name of critique.

The revised reviewer still scores, but it has to earn the score by reading first.

That sequencing shift moved output from "this article is mostly ready" toward "this article assumes too much context, reveals its lesson too early, and needs stronger in-narrative evidence before the governance argument about where an agent should stop lands."

That is the feedback I needed.

## What I'd do on the next reviewer

<!--
Practical checklist grounded in the observed editorial case. The card explicitly
flags PR/architecture review as hypothesis — keep the broader claim cautious.
-->

For the next AI reviewer I build, I would design sequence before I tune rubric dimensions.

1. **Start with an ungated read.** Inspect audience, intent, risk, and evidence before scoring thresholds appear.
2. **Make the rubric summarize the analysis.** Scores should cite read-through observations, not invent them after the fact.
3. **Separate checklist pass from judgment pass.** "Is it complete?" and "is it good?" are different questions.
4. **Force reader-impact language.** Critique items should say what breaks for the reader, not only which rule was violated.
5. **Let scores come last.** Once a number appears, everything organizes around it.

This is not only about writing. I suspect the same pattern may apply to PR review, architecture review, incident analysis, and evaluation reports: if a reviewer scores before it understands, it overfits to the rubric and under-reads the situation.

The shape feels portable. Evaluation criteria are not enough. The order in which a reviewer thinks changes what it notices.

**Takeaway:** If your AI reviewer keeps producing technically correct but shallow feedback, do not only rewrite the rubric. Move analysis before scoring.

---

**Editor's note (July 2026)**

This article documents the first major architectural change to **editor-critique**: separating analysis from scoring. That sequence change held up, but it also exposed a new class of reviewer failures that couldn't be solved through rubric expansion alone. The follow-up, [I fixed my AI reviewer. Then I kept solving the wrong problem](https://dev.to/michaeltruong/i-fixed-my-ai-reviewer-then-i-kept-solving-the-wrong-problem-58am), explores that next stage.

---

If you'd like to see the project behind these workflow experiments, try [Codenames AI](https://codenames-ai.com/).

<!--
Closing keeps the broader lesson cautious. PR review and architecture review
are a leap per the card's evidence boundary; frame them as suspicion, land only
the observed editorial workflow claim in the takeaway.
-->
