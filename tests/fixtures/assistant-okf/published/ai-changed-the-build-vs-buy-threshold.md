---
title: AI changed the build-vs-buy threshold
tags:
  - ai
  - automation
  - workflow
notion_page: https://app.notion.com/p/3ad6cffaff9c8128b073ef1585ceca0f
format: dev.to
project: General
devto_article_id: 4384805
devto_api_url: https://dev.to/michaeltruong/build-looked-absurd-under-a-recruiter-deadline-1145
last_devto_sync: 2026-10-02T23:11:33.311Z
devto_draft_url: https://dev.to/michaeltruong/build-looked-absurd-under-a-recruiter-deadline-5fb-temp-slug-7528018?preview=ba41f9dd0714d5f87132fbf82e8699e3519096550c645f845735a0499d0d109e1272821648924edf3277793c5022c39ae613c8b6b52fa442737c43d0
---

# AI changed the build-vs-buy threshold

<!--
Post-publish revision (2026-08-13): early bounce suggested title + opening
misclassified the piece as resume/job-hunt content before the engineering thesis
landed. Title names the economic claim; lede opens on custom software under a
short deadline, then uses the recruiter/resume case as the experiment. Dual-cost
(implementation + revision) teases before system teaching. Buy economics stay in
the opening prose (no separate H2) so the first heading can be the build. Riot is
inbound outreach. Abstraction iteration stays mechanism, not headline.
-->

Building custom software to solve a two-afternoon problem sounded absurd.

A Riot Games recruiter reached out while I was still preparing to return to the job market. Suddenly I needed a current resume to send back, and I had roughly two afternoons to produce one.

Normally that is an obvious **buy** decision. Under a short deadline you are not optimizing for reuse. You are optimizing for a PDF in someone's inbox. A resume builder gives you templates, export, and enough polish to look professional without inventing infrastructure.

Historically, I built when the reuse justified the setup cost. I bought or assembled manually when I only needed the artifact.

The same rule still applied. What had changed was the cost.

AI had lowered not only how much it cost to build the first version, but how much it cost to keep revising the architecture underneath it.

## What I built instead

<!--
Reader onboarding: teach facts→prose layers in prose before YAML names matter.
Portability: table summarizes layers; no private repo required to follow the lesson.
Three escalating evidence beats: Riot (gaming) vs unnamed AI product engineering
company as selection contrast, then unexpected expansion into interview prep.
Author-supplied (2026-08-13 revision), not retrieved by editor-context. Do not
name the later company; categorical label ("AI product engineering company") is
intentional. Do not invent recruiter or interview outcomes. Do not frame the
prep beat as canonical-knowledge ("from the same inventory"); the point for this
article is that the supposedly-overbuilt system kept finding uses.
Research enters only as the compact causal input to selection (company/role
context → which inventory facts belong). Do not tour the research workflow or
import requirements-QA failures (sibling article). Contrast is the evidence:
gaming company vs AI product engineering company, same inventory, different slice.
-->

I built a private **facts → prose** resume repository with Cursor.

The idea is to separate career evidence from application wording:

| Layer              | Holds                                             | Does not hold          |
| ------------------ | ------------------------------------------------- | ---------------------- |
| Structured facts   | Stable claims (actions, outcomes, metrics, scope) | Resume bullet phrasing |
| Application config | Which facts to include, tone, theme               | New career claims      |
| Generated output   | Markdown and PDF resumes                          | Source of truth        |

Career claims live once in structured YAML. Each application selects, reorders, and rephrases them. `npm run generate` renders recruiter-facing prose. `npm run pdf` prints it. `npm run check:ats` runs structural ATS checks on the output.

You do not need my private repo to apply the pattern. The useful split is structured facts on one side and disposable rendered artifacts on the other.

Before generating a resume, the workflow researched the company and role, then used that context to decide which evidence from my career inventory belonged in the application. The system knew about far more career evidence than any one resume should contain. The inventory stayed put. What changed was which slice mattered.

For a gaming company like Riot Games, the research made a university game-design award relevant enough to surface on a software engineering resume where it normally would not belong. The same run also produced a one-page and two-page resume plus a recruiter reply.

A week later, I used the same career inventory for an AI product engineering company. The underlying evidence had not changed, but what mattered had. The workflow selected a different slice of it. The reuse I had been optimizing for was already real.

Later it expanded past resumes into interview prep materials, a use I had not planned when the recruiter first wrote. Different company, different evidence selection. Different stage, different artifact altogether. The system that looked overbuilt for one reply kept finding uses.

## The system did not start here

<!--
Abstraction iteration as mechanism for why build paid off, not a separate thesis.
Capture-asserted ladder; do not invent intermediate git states.
-->

The repository did not begin with that model.

It evolved through increasingly useful abstractions across the same short build window:

1. A single resume document
2. A reusable resume template
3. Career facts separated from prose
4. Capabilities grouping related achievements
5. Evidence entries inside each capability
6. Application-specific selection over that inventory

The first workable version was not the last one. Because implementation and revision were cheap, I could keep moving instead of freezing at "good enough for tonight."

Without that cost shift, the rational stopping point would probably have been a reusable template or a lightly parameterized document. Fine for one application. Weak as career infrastructure.

That was the advantage of the build path here: room to discover the right abstraction after the first one works.

## Two costs moved, not one

<!--
Headline thesis: implementation + iteration cost. Stop at the boundary claim;
resume-case close comes next so the incident stays adjacent. Outside-resume
generalization follows that close (reorder only; framing unchanged).
-->

AI did not magically make **build** correct for every problem.

It lowered two costs at once:

1. **Implementation cost:** scaffolding the generator, themes, and checks stopped being a multi-week side project.
2. **Architectural iteration cost:** revising the underlying model (facts vs capabilities vs application selection) stayed cheap enough to do in the same session.

Buying still wins when the problem is narrow, the tool fits, and you will not reuse the result. Building still loses when maintenance will crush you.

What changed is the boundary. Problems that used to land firmly on the buy side can cross over when reuse matters and you can afford to iterate past the first design.

## Buy was still faster for one send

<!--
Concrete resume-case close immediately after the dual-cost boundary. Hedge first,
then the why-build list (middle owns the reuse evidence). Outside-resume
generalization and knowledge-work suspicion follow the close, then takeaway.
Do not claim reuse was correctly predicted up front. Do not frame interview prep
as canonical-knowledge ("from the same inventory").
-->

This is not an argument that custom software always beats SaaS. I chose to build because the deadline still left room for something reusable. If the goal had been a single resume, buying an off-the-shelf builder would have been the faster path.

The build path made sense here because:

- The career inventory is the stable core.
- Research and role context drive application-specific selection.
- The same system produced multiple resume variants and a recruiter reply.
- It later expanded into interview prep materials.

Cheap iteration on both implementation and revision is what made exploring these abstractions affordable.

The same economics show up outside resumes: internal tooling, dashboards, documentation pipelines, code generators, personal workflow infrastructure. Anywhere the old math was "custom software is too expensive to build **and revise**", the revise term got smaller.

I suspect that generalizes beyond software engineering into knowledge work where bespoke systems used to lose to packaged tools on turnaround alone.

**Takeaway:** AI moves the build-vs-buy threshold by cutting both implementation cost and the cost of changing your mind about architecture. When reuse matters and you can iterate in the same sprint, building a small internal system can become rational where buying would previously have won on cost and turnaround.

---

**Editor's note (October 2026)**

This piece is about why building the job-search system made economic sense under a recruiter deadline. A follow-up, [I visualised my job search. The data model started breaking.](https://dev.to/michaeltruong/records-first-chart-second-the-sankey-disagreed-3841), picks up once enough hiring histories had accumulated. By then, extending the system with lifecycle analytics was cheap enough to be another incremental feature, and putting those histories on a Sankey diagram exposed semantic problems the YAML validators alone could not see.

---

<!--
Soft CTA after takeaway (corpus pattern). Bridge via the same revise/reuse
economics already in the close, not by rewriting this as a Codenames field report.
-->

If you'd like to see the same economics on a product I keep revising in public, try [Codenames AI](https://codenames-ai.com/).
