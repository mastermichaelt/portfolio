---
title: Active players looked real until we asked which sessions counted
tags:
  - ai
  - webdev
  - analytics
notion_page: https://app.notion.com/p/37b6cffaff9c8148bf3defecfc56951f
format: dev.to
project: Codenames AI
devto_api_url: https://dev.to/michaeltruong/active-players-looked-real-until-we-asked-which-sessions-counted-11em
devto_draft_url: https://dev.to/michaeltruong/active-players-looked-real-until-we-asked-which-sessions-counted-2n06-temp-slug-1733980?preview=54a3102364db438101d2af4c2d30353d745495ba3a48841a86ce100c31a4a1d7f9fd87bea04a87851732bf943b4bf15f95afb8e2d69cfe280f89043b
---

# Active players looked real until we asked which sessions counted

<!-- Open on the June 10 Product Health tile: 64 Active players, last 21 days
     (date floor ≥ 2026-05-20), unique users with game_started or game_restored.
     Domain registered 2026-05-14; the 21-day window was roughly the product's entire life.
     Prose: "One morning in June, three weeks after launching" (field-report when + maturity, not window length).
     Operator-confirmed screenshot; not a live re-query. Pair with 122 starts/restores
     suspicion → unique players search couldn't explain → tagging plan → PR #183.
     Pair PostHog MCP analyst card stays out of this thesis.
     Accuracy: pre-tag confidence rested on unset VITE_POSTHOG_KEY for local/tests
     and origin-scoped returning-user merge. Review deploys were the hole that shared
     the key and minted new identities. GSC had not hit 30 clicks / 28 days yet (first
     achievement 2026-06-11); early dev.to not material.
     Title names the wrong question (which sessions), not the contaminant (review deploys).
     Opening foreshadows the healthy-metric trap (64 → keep shipping); do not insert
     "why now" before the hook. Broader lesson after the fix: distrust reassuring
     signals. Model-experiments contrast (failure vs curiosity) is optional enrich,
     not required for the thesis. -->

I've been building [Codenames AI](https://codenames-ai.com/), a small web game where an LLM plays Codenames with you. Like most solo products, I glance at a Product Health dashboard when I want a quick read on whether anyone is actually playing.

One morning in June, three weeks after launching the site, the Active players tile said **64**. Next to it sat **122** starts and restores. The number looked like traction. My first instinct was to treat it as confirmation and keep shipping.

That instinct did not survive the next question: which sessions were actually in that count?

## The dashboard answered a wider question than I asked

<!-- Failure before fix: healthy metric → 64 vs 122 suspicion → contamination question.
     Prior confidence: (1) key unset locally / in tests, (2) returning-user merge on
     production. Triangulation: GSC still below 30 clicks / 28 days; early dev.to not
     material. Contaminant: review-deploy origin (### subhead before reveal for mobile scan). -->

I was reading Product Health as if every event in the project came from real players on the production site. The tile did not lie about its math. It counted distinct people who started or restored a game. What it could not tell me, from the chart alone, was which runtime those people were in.

I had reasons to trust the number:

- PostHog init only ran when `VITE_POSTHOG_KEY` was set. Local Vite and Playwright runs did not ship that key, so I treated laptop and E2E traffic as silent by configuration. There was no `analytics_environment` property yet, and no environment-conditional init path. "Do not put the key in this build" was one guardrail.
- Returning users looked safe too. On production, game state restores from origin-scoped `localStorage`, and PostHog keeps an anonymous ID on that same origin. Come back later and you still count as one Active player via `game_restored`. We do not call `identify`; continuity is browser storage on that host. I assumed testing on review URLs worked the same way: me again, already counted.

Outside PostHog, the acquisition picture did not match. Real arrivals were mostly organic Google Search. In Search Console, we had not yet hit the first “30 clicks from Google Search in the past 28 days” milestone. We had only just started posting on [dev.to](https://dev.to/), so that channel was not a material source either.

Sixty-four unique players on a site that young, against a search funnel that had not cleared thirty clicks in a month, and early publishing that barely existed, was already a little suspicious. The starts/restores volume next to it made it worse. My working note was blunt: investigate further; something was minting unique players that real arrivals could not explain.

### Review deploys were the hole

Review deploys (for us, Vercel preview URLs) look like the real app, often share the same analytics project key, and show up whenever you click a pull-request review link. They were not "local without a key," and they were not the same origin as `codenames-ai.com`.

A review hostname gets its own empty save store and its own anonymous PostHog identity, so a click-through during review can land as a new unique player (`game_started`) instead of folding into the production self I already knew. Without a way to separate those runtimes, that 64 was still a hypothesis about whether review-deploy traffic, and new identities on those hosts, were in the count.

That investigation became a concrete plan: stop treating every capture in the project as if it were production traffic.

An early cut disabled PostHog for E2E. Silencing one runtime would still leave review deploys sharing the key; we needed an explicit boundary instead of relying on some environments staying silent.

## What should count as production?

<!-- Heading carries the narrower question; body opens on the two fixes (no restated lede).
     Lock Product Health OR-not-set wording in prose (historical untagged production).
     One brief clause on exact production for newer views is fine; avoid “different rules
     on purpose” docs tone. Avoid hard-locking tile counts (PR #183 said 25; live
     dashboard has drifted). Current code tags environments and filters in PostHog;
     it does not skip init for E2E. Avoid SDK/env-var inventory in prose.
     After fix: harder lesson (healthy numbers resist scrutiny), then optional
     model-experiments contrast (failure vs curiosity). -->

Two fixes landed together.

**Client tagging.** On PostHog init, the frontend resolves an `analytics_environment` of `production`, `preview`, `local`, or `e2e`, then attaches it to every event and to the user profile. Hostname and the host’s build-time environment distinguish the runtimes.

Non-production traffic is excluded by dashboard filters, not by skipping PostHog init. Tagging every runtime, including ones we used to silence by omitting the key, is what makes the filter meaningful.

**Dashboard filters.** Product Health keeps events where `analytics_environment = production OR not set`, so older production events from before tagging remain visible. Newer views can use an exact `production` filter once tagging coverage is trusted.

The missing dimension wasn't another metric. It was the production boundary. Once that existed, Product Health could filter on it.

### Healthy numbers resist questions

The harder lesson wasn't that the dashboard was wrong. It was that healthy-looking numbers are the least likely ones to get questioned.

While working on [model experiments](https://dev.to/michaeltruong/model-experiments-became-an-architectural-stress-test-3gc0), failure exposed hidden assumptions. Here nothing looked broken, so curiosity had to do the same job: notice that the system was faithfully answering a different question than the one I thought I was asking.

How we ask the dashboard questions is a separate story. This post stays on the quieter failure mode: one project key, a review runtime that looked like production, and a number that looked clean until we asked.

## What I'd check on the next dashboard

1. Start by asking what question the metric actually answers, not the one you hope it answers.
2. Compare it against an independent signal. If the numbers do not fit together, investigate before celebrating.
3. Look for missing dimensions that collapse different kinds of traffic into one KPI: environment, internal users, bots, staging, or another hidden segment.
4. Only then decide whether the fix is better tagging, better filtering, or a different metric altogether.

You do not need our dashboards or our app code to apply the pattern. Review deploys were the incident that exposed the gap here.

I cannot put a clean contamination percentage, from today’s data alone, on the period before we added tagging; the point is the missing question, not a guessed share of noise.

**Takeaway:** Production engineering isn't just responding to broken signals. It's occasionally distrusting reassuring ones. Metrics answer exactly the question you instrumented, not necessarily the one you think you asked.

---

If you'd like to see the project that inspired these lessons, you can try [Codenames AI](https://codenames-ai.com/).
