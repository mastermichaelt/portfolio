---
title: The pipeline was green. The product was underspecified
tags:
  - ai
  - agents
  - workflow
notion_page: https://app.notion.com/p/3b06cffaff9c81d39b4be3a6c66ef571
format: dev.to
project: General
devto_article_id: 4414727
devto_api_url: https://dev.to/michaeltruong/the-pipeline-was-green-the-product-was-underspecified-1fnj
last_devto_sync: 2026-08-17T08:10:06.576Z
devto_draft_url: https://dev.to/michaeltruong/the-pipeline-was-green-the-product-was-underspecified-191e-temp-slug-3728463?preview=766a29b4a49e43c881192130819bcb699a6a58e4449c3ab51b19500a054e6d3187a44c88d1be1742dedeaf595838b6700e484520f16aa93dfb10bdda
---

# The pipeline was green. The product was underspecified

<!--
Title names the green-checks gap / wrong assumption (underspecified, not absent).
Opening: stakes + wrong assumption before teaching the generator; withhold
"requirements QA" until manual-smuggling / stage sections. Stage prescription
lands after incidents earn it.
-->

The checks all passed. I still would not have sent the resume.

I had been using a Cursor agent to implement a private **facts → prose** resume generator. Structured career claims in, recruiter-facing PDFs out. Generation, rendering, and ATS checks all stayed green. The PDFs looked plausible.

I treated that as enough.

Several product requirements were still wrong.

## What implementation QA was checking

<!--
Reader onboarding: teach the pipeline and what "green" meant before naming YAML fields.
Portability: table summarizes layers without requiring repo access.
-->

The useful split is structured facts on one side and disposable rendered artifacts on the other:

| Layer              | Holds                                             | Does not hold          |
| ------------------ | ------------------------------------------------- | ---------------------- |
| Structured facts   | Stable claims (actions, outcomes, metrics, scope) | Resume bullet phrasing |
| Application config | Which facts to include, tone, theme, page length  | New career claims      |
| Generated output   | Markdown and PDF resumes                          | Source of truth        |

Implementation QA in this workflow means the pipeline runs end to end and the automated checks pass. Generation succeeds. PDFs render. ATS scripts assert page counts, required sections, and a few structural rules about separators and headings.

Those checks are real. They caught broken builds and regressions I did not want to ship.

They did not answer a different question: did the specification describe the resume I actually wanted?

That gap showed up in three places. None of them failed the scripts at first.

### When page count is not product fit

The workflow produced one-page and two-page variants for the same application. Both PDFs passed `check:ats`. Both stayed inside their page limits.

The two-page resume still read like a stretched one-pager.

Experience on the shorter version used concise evidence entries selected for a tight one-page fit. The longer version reused that same condensed slice, then filled the remaining space with additional facts. Page count was correct, but the shape was wrong: the original concise bullets never expanded into fuller evidence. A two-page resume should deepen the roles that already earned a place, not keep the one-page wording and pad with more items.

Mismatched typography could fake the same green result by enlarging text on the longer PDF. Unifying the shared typographic scale and margins removed that shortcut: a two-page count had to come from the evidence itself.

Implementation QA had no opinion about which facts belonged on which page length, or whether two pages meant more evidence or just larger fonts. It only knew the PDF had two pages.

### When valid data reads wrong to a human

Not every miss was about page length.

One Program Lead role was technically valid in the data: correct dates, correct employer, correct title. In the Experience section it rendered with a `Full-time` employment label. On paper that is accurate enough for a schema. On a resume it reads like a sequential primary job when the role was actually concurrent with other work.

The requirement was not "store valid employment metadata." It was "make concurrent work legible to a recruiter scanning the ladder." Renaming the label to `Concurrent program` was a product fix, not a pipeline fix. No ATS script flagged the old wording.

### When structural correctness stood in for finish

The last category looked optical. It was still underspecification.

I only noticed after opening the PDF: the contact block and Skills sidebar shared a column edge on paper, but the Skills heading sat a few points lower than Experience, so the two-column header row looked crooked even though every section and separator rule still passed. ATS-safe contact separators are a constraint, not a design.

The workflow had encoded structural correctness: page counts, required sections, separator rules, heading shape. It had never named a human visual-acceptance criterion. The scripts were never asked to stand in for a finish requirement the spec had never named: would I send this?

## What manual implementation used to smuggle in

<!--
Causal chain owned here: manual friction = accidental requirements QA; agents absorb
ambiguity. Two-page density miss is the absorbed-choice scene (callback to the earlier
miss; do not retell the condensed-bullets mechanism).
Speed + finished-looking output is one beat; build-vs-buy link is the second-order
shift, not a third restatement. Bridge to planning as deliberate recreation.
-->

When I wrote this kind of tooling by hand, implementation and requirements review were harder to separate. Every intermediate decision was visible. Choosing a font size, picking which bullet to cut, or rewriting a concurrent-role label forced a product judgment in the same session as the code change.

Manual implementation was accidentally doing requirements QA. Every ambiguous decision eventually became my problem because I had to turn it into code myself. An agent can absorb that ambiguity instead.

The two-page PDF was that pattern in miniature. It looked finished. The missing product decision (whether two pages meant deeper evidence) never came back through me.

That speed is the danger now. Incomplete specification can arrive dressed as a finished product.

[An earlier piece](https://dev.to/michaeltruong/build-looked-absurd-under-a-recruiter-deadline-1145) was about why building this system suddenly made economic sense. This is the other side of that shift: once implementation got cheaper, I needed to make requirements review more explicit.

## What a requirements QA stage could look like

<!--
Strategy first (portable jobs), then compact labeled ladder as one encoding.
Short parentheticals only; detail stays in surrounding prose and miss bullets.
Keep workflow-pattern level; do not name specific reviewer tools.
-->

The portable version is a few jobs, not a particular toolchain:

- Force the vague request into concrete behavior before implementation: what changes, what stays invariant, and what counts as done
- Review against that written intent, not only the local diff
- Accept the finished artifact as a product ("would I send this?"), not only as a green pipeline

The first two are where requirements QA is cheapest. If those questions stay implicit, an agent can execute the wrong thing extremely efficiently.

In my workflow that looks like:

```text
plan                        (overall intent)
→ slice                     (concrete behavior)
→ review slices             (gaps and boundaries before any code)
→ for each slice:
    → implementation
    → review after code     (still matches plan?)
→ artifact acceptance       (ready to send?)
```

I commit the plan alongside the work so the intent lives in the repo, not only in the chat. A reviewer is not limited to the current diff. It can see where this slice is supposed to lead, and flag something that is locally correct but inconsistent with a later slice. Reviewing the slices can still challenge assumptions, missing requirements, and slice boundaries before any code exists.

The ladder above is how I recreate the interrogation that manual implementation used to provide implicitly. Planning and review still miss gaps that never made it into the written requirements. Artifact acceptance is the last gate for those: it catches product misses the earlier rungs never named.

**Takeaway:** Agents are good at satisfying the requirements they are given, quickly enough that a miss looks finished. Implementation QA proves the system did what you asked. Somebody still has to QA whether those requirements describe the product you actually wanted.

---

<!--
Soft CTA after takeaway (corpus pattern). Bridge via requirements-vs-implementation
QA, not by rewriting this as a Codenames field report.
-->

If you'd like to see the same gap between green checks and product acceptance on a product I keep revising in public, try [Codenames AI](https://codenames-ai.com/).
