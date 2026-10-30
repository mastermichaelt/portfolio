---
title: AI made translation cheap. The hard part was knowing what architecture to keep.
tags:
  - ai
  - webdev
  - programming
notion_page: https://app.notion.com/p/3d46cffaff9c81d9a995d2c4595fc056
format: dev.to
project: Codenames AI
devto_article_id: 4672345
devto_api_url: https://dev.to/michaeltruong/ai-made-translation-cheap-the-hard-part-was-knowing-what-architecture-to-keep-4hp3
last_devto_sync: 2026-09-17T06:29:00.000Z
devto_draft_url: https://dev.to/michaeltruong/ai-made-translation-cheap-the-hard-part-was-knowing-what-architecture-to-keep-5g6j-temp-slug-4380886?preview=f4cad40da7ac1e7cc79d2cb60063da6f6e0bc830e96031c1efab8378d7be09cf12042880876a9f34753d80634cfe9877968acd3989cfebb392163074
---

# AI made translation cheap. The hard part was knowing what architecture to keep.

<!--
Thesis: scaffolding mistaken for product invariants; localization as case study.
-->

I ship [Codenames AI](https://codenames-ai.com/), a web game where an LLM plays Codenames with you. One of my longtime readers, @xulingfeng, asked whether the game could support multi-language selection, and that was enough to pull forward work that had been sitting on the backlog: new word sets and languages, including Simplified Chinese.

<!--
Opening: reader signal first (longtime-reader @ attribution, no prior-post link — article topic
doesn't match; comment permalink if DEV supports it later). Hand off to non-native-speaker tension.
-->

I am not a native Chinese speaker. AI could generate candidate translations far faster than I could judge whether they were natural, ambiguous in the right way, or simply plausible-looking mistakes. So I needed machinery around the generation: deterministic checks for what I could verify mechanically, and explicit review points for what required human judgment.

<!--
Product scope: Chinese gameplay ≠ full app localization. Bridge: machinery existed because
author could not be the quality gate; deleted later because runtime did not need it forever.
-->

I deliberately did not turn this into full application localization. The interface could stay in English; what mattered was the language of the board and the AI playing against it. The board language is carried through to the model, so it can reason about the right words and answer in that language.

Generating the translations was fast. The harder work was discovering which parts of the system were real product invariants, and which were temporary scaffolding created by the first localization.

## A useful signal hardened into a rule

<!--
Two failure modes: (A) collision signal hardened into rule, relaxed to review; (B) semantic judgment beyond validation. Clue/content aside closes section. Keep concrete Chinese examples.
-->

I assumed a strict substring-collision validator would protect card-word quality. If no playable value could appear inside another, ambiguous substring interactions would shrink and the pack would feel cleaner.

That assumption was half right. Collisions matter in Codenames. Treating collision purity as a hard invariant made the Chinese worse.

**The first build treated overlap as a hard error.**

If one playable value appeared inside another (水 (water) inside 水星 (Mercury), 手 (hand) inside 手表 (watch)), the build failed until I shortened or rewrote the translation. On paper that sounds responsible. In practice it pushed translations toward single-character fragments and awkward abbreviations just to satisfy the checker. The validator was green. The card words were becoming less natural.

I relaxed the rule so overlap became something to review. Exact duplicates and invalid values still stop the build. Substring overlap in Chinese is often compositional (水, 水星 (Mercury), 水槽 (sink)) and sometimes a deliberate trade. Once collisions were reviewable instead of fatal, compact natural cards became viable again: **WATER** → 水, **WIND** → 风, **HAND** → 手, **SNOW** → 雪. The failure was elevating a useful authoring signal to the same severity as duplicates and empty values.

**But passing validation still wasn't enough.**

When I tried to preserve English double meanings too aggressively, I got unnatural Chinese. Codenames lives on ambiguity in English. Chinese often forces you to choose a meaning more explicitly. A validator that only asks "is this collision-free?" cannot tell you which meaning belongs on the card.

Some English concepts do not survive as a single clean Chinese word without choosing a meaning:

- **ROCK** → 岩石 (stone), not 摇滚 (music)
- **SPRING** → 春 (season), not 弹簧 (coiled metal)
- **SEAL** → 海豹 (animal), not 封 (to close)

Those choices are product calls, not lint results. A validator can flag overlap. It cannot tell you that 春 (spring) is a better card word than 春天 (springtime) for this grid, or that a natural standalone word beats an awkward shortening invented only to satisfy the checker.

This is a different question from clue-time substring rules in my English fairness validator ([schema first, prompt second](https://dev.to/michaeltruong/schema-first-prompt-second-valid-json-wasnt-enough-3nhm)). Clue validation asks whether a spymaster hint is fair on today's board. Content validation asks whether a codename is a good standalone word on a tile. Same word "substring," different layer.

## The first implementation looked like the architecture

<!--
Authoring workflow mistaken for product model. Withhold wordSet×language formula until reveal
(mistaken requirement → Extended counterexample → "game did not care" → formula).
~4,100-line cleanup quantifies accidental structure.
-->

I initially modeled Simplified Chinese as a localization of the English Classic pack: English concepts with Chinese mappings, validation metadata, and a build step that produced the word list the game loads at runtime. Codenames AI does not translate card words when a game starts.

That structure was useful while I was doing the localization work. It gave me somewhere to record ambiguous translations and collision judgments.

I made a mistake, though: I started treating that authoring workflow as the product model.

I briefly compared the localized Classic pack against an existing Chinese community list. That was useful as a spot check, but it also exposed another category error: a native Chinese Codenames list is not automatically a translation of English Classic. I was treating cross-language concept identity as a runtime requirement.

Later I added an Extended word set with independently sourced English and Simplified Chinese lists. There was no meaningful one-to-one mapping between them. They were simply two playable pools under the same product variant.

And the game did not care.

The runtime requirement was much smaller:

`wordSet × language → playable word pool`

Classic English, Classic Chinese, Extended English, and Extended Chinese could all use the same path.

Once that was obvious, the original localization machinery became scaffolding rather than architecture. I removed the mapping layer, generator scripts, and old comparison artifacts: roughly 4,100 lines deleted in a follow-up cleanup, while keeping the shipped words intact.

The useful distinction was not "translation versus native word list." It was **authoring process versus runtime requirement**.

I had made the same mistake inside the validator: a useful signal during authoring had hardened into a rule the product did not actually require.

## Where AI helps and where it stops

<!--
Paired closing statements; delegate runtime formula to §2 discovery.
-->

AI made producing the translations cheap. It did not tell me what deserved to become permanent structure.

A substring collision was useful evidence, not a hard invariant. A translation mapping was useful authoring scaffolding, not a runtime requirement.

Both mistakes came from the same place: **confusing the machinery that helped build a feature with the model the product actually needs.**

That smaller runtime requirement was what survived. The rest could stay where it belonged: in the implementation history, not the architecture.

**Takeaway:** Useful machinery from building a feature is not automatically part of the product model. Before a validator rule or authoring workflow hardens into architecture, ask what the runtime still requires without it.

---

Play [Codenames AI](https://codenames-ai.com/) in Classic or Extended mode, in English or Simplified Chinese.
