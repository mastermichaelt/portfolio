---
title: Upgrades don't have to be a blind trust exercise
tags:
  - ai
  - webdev
  - typescript
  - dependencies
notion_page: https://app.notion.com/p/3806cffaff9c81ddaff9cdf718196fa7
format: dev.to
project: Codenames AI
devto_article_id: 4056883
devto_api_url: https://dev.to/michaeltruong/upgrades-dont-have-to-be-a-blind-trust-exercise-13mj
last_devto_sync: 2026-09-10T05:50:11.444Z
devto_draft_url: https://dev.to/michaeltruong/upgrades-dont-have-to-be-a-blind-trust-exercise-3g4h-temp-slug-3422682?preview=ebc8903c16d3df34fffa479054ba928b89c5bcd4497736581d4027a8f42b5197d23abf89d56f9de54ae0da716dba8e0d9c4cbe18f693f68480d51ccb
---

# Upgrades don't have to be a blind trust exercise

<!--
Title promises audit-over-trust; body opens on maintenance sustainability,
then Vite incident as proof. Agent runs four-step packet; human audits.
Economics reinforced once in manual-review section.
-->

I've been building [Codenames AI](https://codenames-ai.com/) as a solo project I want to keep alive. Renovate helps dependency upgrades move without maintenance eventually crushing momentum.

You don't need my exact setup to follow along.

Every project accumulates maintenance work. Framework upgrades are one place that work stalls, not because engineers do not know how to migrate, but because proving what actually needs to change takes time. That tradeoff shows up on a hobby repo as "I'll look at this when I have an uninterrupted evening." It shows up in production as major versions piling up while investigation competes with feature work.

That's the problem I was trying to solve.

Before AI, my realistic choices were narrow: trust the automation and hope, spend hours mapping release notes to my codebase, or leave the upgrade sitting.

I was not trying to invent a better review process.

I was trying to keep maintenance cost below available time.

AI changed the cost of investigation enough that I stopped treating it as something to postpone.

When Renovate opened a pull request for one of those framework majors, upgrading Vite from `^6.0.11` to `^8.0.0` and `@vitejs/plugin-react` from `^4.3.4` to `^6.0.0`, my first instinct was still to treat it like migration work. Read the guides. Find the breaking changes. Plan the code changes. Validate the app. Then merge.

It was also the wrong starting assumption.

The useful work was not implementing the migration. The useful work was proving whether a migration existed for this repo at all.

<!--
References PR #223 only in annotations. Visible prose must carry the lesson
without requiring readers to open the private repo.
-->

## The review gate was right

Renovate grouped the update as a frontend React/Vite major. My review policy sorts packages into low-risk and high-touch buckets: a patch-level bump to a type definition or a lint plugin can auto-merge, but anything that builds or serves the app (the bundler, the React plugin) is high-touch.

Both Vite and `@vitejs/plugin-react` sit in that high-touch bucket, so any version change routes to a human instead of auto-merge.

The pull request looked serious on paper:

- Vite 8 release notes included explicit breaking changes.
- The lockfile churn was large because Vite moved from the Rollup-centered dependency shape toward Rolldown packages.

<!--
Keep the package/version table compact. The article is about the decision loop,
not a migration guide for every Vite 8 release-note item.
-->

The old workflow would have started with a migration plan. The evidence-first workflow started with a different goal:

> Which documented breaking changes actually apply to this repository?

CI showed the branch built; it did not show the breaking changes were irrelevant to this repository. I ran the PR through an AI-assisted review and used the four-step checklist below to audit the result. My job was not to re-derive every fact by hand; it was to decide whether the evidence was enough to merge.

## Investigation before implementation

The checklist covers four increasingly specific questions. For the Vite bump, the resulting evidence packet looked like this:

<!-- prettier-ignore-start -->

1. **Inspect the upstream change.**

    Both packages shipped documented breaking changes. The review used those notes to name possible failure modes, not to assume which ones touched this repo. Vite 8's release notes called out, for example, SSR pipeline shifts and stricter `import.meta.hot` handling.
2. **Map those changes to actual usage.**

    The packet reframed the question from "does Vite 8 have breaking changes?" to "does this app use the surfaces those changes break?" This repo has an ordinary Vite React setup with no custom SSR.
3. **Identify custom risk.**

    The packet flagged one meaningful project-specific area: a small custom Vite plugin, `cssBeforeModuleScript`, that hooks `transformIndexHtml` to reorder the stylesheet and module-script tags. A bundler swap from Rollup to Rolldown could plausibly change that behavior, so this remained unresolved until the app was exercised.
4. **Validate the app.**

    CI's `test` job had already been green; the packet still called for proof the custom-risk path and production build held. A ready Vercel preview closed that gap: it ran a production build through the new Vite with `cssBeforeModuleScript` included, and the rendered page was where broken stylesheet or module-script ordering would have shown up.

<!-- prettier-ignore-end -->

<!--
The four-step sequence is the portable model. PR links, file paths, and exact
check names are supporting evidence; the reader should still understand the
method if every repo artifact disappears.
-->

At that point, the recommendation changed.

The packet had not found migration work. It had found enough evidence that no migration was required.

## Evidence over migration plans

The merged PR changed two files: `frontend/package.json` and `package-lock.json`.

No source files. No Vite config rewrite. No component changes. No test rewrites. No custom shim.

That is easy to misread as "the upgrade was trivial." It was not trivial. The pull request carried real risk signals. The absence of source changes only became meaningful after the investigation proved they did not require code changes.

<!--
This distinction protects against overclaiming. The article should not imply
that all major upgrades are safe, only that evidence can show when no migration
work is necessary.
-->

Implementation only belongs once the evidence asks for it. The human job shifts from "please migrate this dependency" to auditing whether the packet answers the four steps above.

## What this changed about manual review

Before this, "review manually" sounded like a parking lot. A major upgrade arrived, the automation refused to merge it, and the human picked it up later. Assembling the evidence packet by hand was often what stalled the review.

Now I treat "review manually" as an evidence-gathering lane. AI makes that lane practical: much of the packet assembly no longer has to happen in one sitting at your keyboard. That's what changed the economics. Investigation stopped being the expensive part that made maintenance easy to postpone. On the Vite bump, AI helped assemble the evidence; I audited whether it was enough to merge without migration work.

For low-risk patches the question stays simple: did CI pass and did the diff stay inside package files? For high-touch framework upgrades it gets richer: can the packet cover upstream changes, repo usage, custom risk, and real app validation well enough for a human to decide without first doing speculative migration work?

That does not remove judgment or the merge decision. It moves both earlier: gather the packet first, then audit whether implementation is actually required.

## What I'd do on the next major upgrade

<!--
End with a checklist because the material is operational. Keep it dependency
agnostic so the lesson transfers beyond Vite/Renovate.
-->

1. **Classify the package honestly.** Runtime and framework packages deserve more evidence than a patch-level dev tool bump.
2. **Run the four-step loop above** against release notes, repo usage, custom risk, and real app validation.
3. **Treat zero source changes as a conclusion, not an assumption.** If no implementation is required, say what evidence proved that.

**Takeaway:** When investigation is cheap enough to run, deferral stops being the default. Do the audit before you write the migration plan.

---

**Editor's note (September 2026)**

Since publishing this, I extracted the implementation behind this approach into an open-source workflow and shipped it as a Cursor plugin. It includes the governed Renovate merge ladder, portable classifier and maintainer skills, and the evidence-first review path described above.

The implementation is available in the [multipliers-dev/renovate-workflow](https://github.com/multipliers-dev/renovate-workflow) repository on GitHub.
