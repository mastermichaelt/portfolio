---
title: I visualised my job search. The data model started breaking.
tags:
  - ai
  - programming
  - analytics
notion_page: https://app.notion.com/p/3ec6cffaff9c8113bd98d7e1b77f32fc
format: dev.to
project: General
devto_article_id: 4787657
devto_api_url: https://dev.to/michaeltruong/records-first-chart-second-the-sankey-disagreed-3841
last_devto_sync: 2026-10-02T23:13:49.041Z
devto_draft_url: https://dev.to/michaeltruong/records-first-chart-second-the-sankey-disagreed-215-temp-slug-9238058?preview=849bb434263b85ece3ac8c660df5c9f3b1d889adc516ad9cdf8528932611ee66bc97145cc503329320a823d43faa730aeb603905b1a02268cdac3ec9
---

# I visualised my job search. The data model started breaking.

<!-- Open on visualization/data-model tension for cold readers. Sankey defined
     inline on first use. Irregular histories before implementation inventory.
     lifecycle.yml motivation in next section; chart-as-validator payoff in
     § What the chart kept surfacing. -->

I wanted to see how my job applications progressed: where they started, which stages they went through, and where they ended.

I had assumed those histories would look like a conventional funnel: application, recruiter, hiring manager, technical, outcome. They did not. Some skipped stages. Some repeated them. Inbound opportunities did not start with an application at all.

So I modelled each opportunity's path in structured YAML first. Then I wired those histories into a Sankey diagram, a [flow chart](https://sankeymatic.com/) showing how applications moved between stages. Records first, chart second. The validators passed. The chart still kept surfacing problems the records alone hid.

## The operational board was not funnel history

<!-- Reader onboarding: optional backlink (not Part 1). Motivation: ramp-up →
     operational concurrency + analytical trend questions (not job-search results).
     Then Notion vs lifecycle.yml. Failure before fix: Completed vs path. -->

I had already [built a job search system](https://dev.to/michaeltruong/build-looked-absurd-under-a-recruiter-deadline-1145) that kept each opportunity in Notion alongside its research and generated resume in a repo. As the search ramped up, overlapping hiring processes replaced a handful of quiet opportunities. With enough of them accumulating, I wanted the cross-search view the board could not provide.

I use the Notion board to keep track of where each opportunity is, whether I am waiting on a company, and what I need to do next. What it does not preserve is the path each opportunity took to get there.

When a role ends in rejection, **Phase** often moves to **Completed**. That is useful on a kanban, but it loses the history I needed for analysis. The board no longer answers "how far did this application get before it ended?" I could see that a process closed, not the path it took.

Funnel analytics needs observed transitions between stages, grounded in substantiated events. Company A might run recruiter, then hiring manager, then technical. Company B might skip recruiter entirely. No global ordering of stage names can represent both without lying.

I needed to normalise those histories without forcing them back into a global funnel: how an opportunity entered, the ordered process events that followed, and any terminal outcome.

That is why `lifecycle.yml` exists as a separate canonical store: ordered `events`, one file per role posting, validated in CI. Notion stays operational. The repo holds history.

## What the chart kept surfacing

<!-- Failure cluster 1: entry mixed into process stages. Failure cluster 2:
     sequence-position nodes. Failure cluster 3: natural outcome depth.
     Failure cluster 4: wrong lifecycle membership (Relevance SSE). Narrative
     connectors between clusters; not a symmetric checklist. -->

The first problem was provenance: mixing how an opportunity entered the funnel with what happened after. Inbound outreach and cold applications became difficult to read on the same chart. A LinkedIn InMail that never went through a portal looked like it had already "reached" an application stage before any recruiter conversation. Entry provenance is how the opportunity entered the funnel. Recruiter, hiring manager, and technical rounds are what happened after. Those are different layers.

Order was the next fight. Repeating a stage is normal: two technical rounds are two technical rounds, not one node with a count badge. The chart keys nodes by sequence position so it preserves order without inventing a global stage ladder. Direct exits are valid too. One application went directly from cold application to rejected with no process events in between. The YAML allows `events: []` while a search is still open. The chart had to render `Cold application → Rejected` without padding imaginary recruiter steps.

Not every wrong branch was a modelling bug. The backfill had created a lifecycle file for another posting at the same company: researched, never submitted. Once the Sankey existed, that record looked wrong. There was no application process to chart, only notes where a hiring path should be. I deleted the lifecycle file rather than inventing another state for something that had never entered the funnel. The next day I applied the same boundary to the operational board and removed its Notion row too.

## Separating data, projection, and presentation

Failures came from different parts of the system, so I kept three concerns separate.

<!-- Three-layer boundary from docs/application-lifecycle.md. Active is
     projection-only; spell out in prose for cold readers. -->

**Canonical YAML** stores how an opportunity entered and the ordered process events that followed. A terminal outcome such as rejected, stalled, withdrawn, or accepted ends that history. If the research only substantiates entry so far, the file can stop there.

**Projection code** turns each history into Sankey edges. Histories without a terminal outcome append an **Active** branch on the chart only. That state never gets written back to `lifecycle.yml`. It answers "where does this open path end on the chart right now?" not "what is the canonical outcome?"

**Presentation** is layout: labels, column alignment, tooltips. I avoided a layout mode that forces every terminal into a shared rightmost column. Rejections after one recruiter screen and rejections after three rounds looked equivalent when all sinks lined up. Outcome nodes now terminate at natural depth, so a quick rejection after application does not share a column with a rejection after several rounds.

That separation made triage faster. When a branch looked wrong, I could ask whether the canonical data was wrong, the projection code misread it, or the layout was misleading. Sometimes the problem was that an opportunity should never have been included in the lifecycle history at all.

<!-- Unheaded synthesis. Inline calibration only. End with explicit **Takeaway:** per published corpus. -->

Spreadsheets and YAML validators catch schema mistakes. They do not show you that two rejection depths collapsed into one visual column, or that a role you researched but never submitted should not be in the dataset at all. The Sankey stress tested my representation of these hiring histories in specific, fixable ways.

**Takeaway:** If you are modelling a multi-step human process with irregular ordering, build structured records first, then visualise early to see whether your categories mean what you think. A valid schema does not necessarily mean you have modelled the process correctly.
