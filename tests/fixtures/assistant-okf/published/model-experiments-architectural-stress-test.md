---
title: Model experiments became an architectural stress test
tags:
  - ai
  - webdev
  - programming
  - testing
notion_page: https://app.notion.com/p/39d6cffaff9c810e84c6ff397aef1898
format: dev.to
project: Codenames AI
devto_article_id: 4167709
devto_api_url: https://dev.to/michaeltruong/model-experiments-became-an-architectural-stress-test-3gc0
last_devto_sync: 2026-07-22T00:50:16.458Z
devto_draft_url: https://dev.to/michaeltruong/model-experiments-became-an-architectural-stress-test-6p6-temp-slug-4062786?preview=77f38f1d7c1a9647d5d7aef154e7fdc172455a8e6c038e66d8302a0ee20226c5fbab6b16138020cf3167535e88ddebc1da36585d0bb38fd04a8fc77d
---

# Model experiments became an architectural stress test

<!-- Open on growth motive + inevitable swap; core insight deferred until failures earn it.
     Keep motivation to a few sentences; article is about coupling, not model selection. -->

I've been tuning [Codenames AI](https://codenames-ai.com/), a small web game where an LLM plays Codenames with you. Clue generation is tightly constrained: one word, a count, optional intended targets, JSON on the wire, then deterministic validation before anything reaches the board.

As the project started attracting regular players, I wanted to improve the gameplay experience without blowing out costs. Moving one model generation from `gpt-4o-mini` to `gpt-5-mini` was my first instinct.

The default reasoning setting made responses an order of magnitude slower for this workload. Minimal reasoning looked like the obvious compromise: newer model, responsive gameplay.

I expected to compare clue quality, latency, and cost while the surrounding prompt, validator, and consumer contracts stayed put.

That last part was wrong.

## The experiment stopped behaving like an A/B test

<!-- Act 2: failures in stable places after the swap; pivot past the latency/cost motive already covered in the opening. -->

What showed up was structural, and it showed up in places that had been stable for months.

Validation failures started rising. Retries started rising. Entire candidate batches started failing before the game ever saw a clue. The sharpest signal came from a clue-selection path that had run untouched for months, and it hard-failed for the first time. They weren't latency regressions so much as architectural ones.

It is easy to read that as "minimal reasoning made the model worse." More often, the failures were exposing gaps in contracts that had looked fine under the previous model.

## What each failure actually invalidated

<!-- Failure modes as assumption breaks, not documentation.
     Introduce three layers here because evidence now needs names. -->

Eventually every failure traced back to one of three layers:

1. **Prompt contracts** ask for exactly `count` targets and, in batch mode, several distinct candidates.
2. **Deterministic validators** reject target/count mismatches and filter invalid candidates before anything downstream runs.
3. **Downstream consumers** only see survivors. Empty batches retry with rejection feedback, then fall back if needed.

Those layers share one job: enforce the same invariants. The failures below cut across all three rather than mapping one to one.

**Side commentary could kill an otherwise usable turn.**

To pick a clue, one strategy (Strange mode) simulates how the AI guesser would respond to each candidate clue, then scores those simulated turns and keeps the best one. I thought those simulations would fail only when the guesses themselves were bad. After the swap, they could also fail because the model attached commentary about other words it had considered, including words that were not even on the board. Because the payload schema included that commentary, the validator had to treat it as part of the same all-or-nothing contract. A payload with usable guesses still got rejected, and when every candidate died that way, the turn came back as a controlled API failure instead of a clue.

**Target cardinality had to match the clue count.**

I thought my validator was protecting the game. Instead I discovered the previous model had been consistently producing outputs that satisfied those contracts.

Say the prompt asks for `count: 2` and a `targets` array with exactly two unrevealed friendly codenames. Under the old model, a clue like `{"word": "BUILDING", "count": 2, "targets": ["TOWER", "CASTLE"]}` usually meant two real board words. After the swap, I started seeing the same shape with one valid target and one word that is not on the grid at all, or only a single target when `count` was 2. Valid JSON. Perfect keys. Intent status: invalid.

The validator rejects clues whose validated targets don't match `count`. Valid JSON wasn't enough.

**Retries assumed the contracts were already specific enough.**

I thought retries were simply robustness. Instead they became diagnostic tooling because they finally told me which invariant had actually failed. When a batch fails validation, the retry path can attach rejection feedback (failed clue words plus reason strings) so the next attempt is not a blind redo. That only helps if the contracts are specific enough to name the failure. Vague "try again" prompts hide whether you have a model problem or an underspecified invariant.

**The failures showed up in the product, not just the logs.**

Every rejected clue meant another retry before the player saw a move. On an AI spymaster turn, the game shows a clue, a count, and highlights the board words that clue is meant to cover. When the validated targets came back shorter than `count`, the UI looked broken: `count: 2` with only one word highlighted. The AI guesser still trusted the clue count and started reasoning from a board state that never actually existed.

None of this required a different product thesis from [schema-first validation](https://dev.to/michaeltruong/schema-first-prompt-second-valid-json-wasnt-enough-3nhm). Valid JSON was never enough. The migration stress-tested whether prompt text, deterministic checks, and consumer assumptions still agreed after the model changed.

## The uncomfortable part

<!-- Act 3: model as hidden contract layer; core insight lands here after evidence. -->

On paper, the clue path already looked responsible. Prompt, validator, consumer. Clean separation.

The migration revealed a hidden layer:

```
Prompt
  ↓
Model capability
  (compensating for weak contracts)
  ↓
Validator
  ↓
Consumer
```

I expected to compare models. Instead I ended up comparing how much of my architecture each model had been compensating for.

While a more capable model kept quietly covering those weak contracts, the dashboards looked fine. Drop reasoning effort, and the same prompts start producing outputs that are honest about what you actually specified. Once that stopped happening, I was no longer measuring model quality. I was measuring how much of the gameplay experience had been resting on those hidden assumptions.

That is uncomfortable and useful. Apparent regressions (count mismatches, partial batches, more retries, collapsed guess simulations) are a signal to ask which layer was doing the work: the model, or the application.

Subjective "does this clue feel clever?" still matters for gameplay. It should not be the only scoreboard when the pipeline can reject an entire batch before the server ever picks a clue.

## Treat migrations as compatibility tests

<!-- Prescriptive section after discovery; shorter checklist, same invariants. -->

What I want out of a model swap now:

1. **Align invariants across prompt, validator, and consumer.** If the prompt says "exactly `count` targets," the validator must reject mismatches, and the API response shape must not pretend invalid intent is OK.
2. **Keep structural correctness in deterministic code.** Use the model for association quality. Use pure functions for board membership, cardinality, illegal clue shapes, and survivor lists.
3. **Instrument validation failures by category.** First-pass success rate, retry rate, and failure reasons tell you whether you tightened a contract or uncovered a real model gap.
4. **Evaluate end-to-end workflow metrics**, not only single-call latency or token price. Retries and fallbacks change the bill and the player experience; measuring only the happy path lies.

**Takeaway:** A model migration tests the model and the architecture around it. If prompt, validator, and consumer contracts do not enforce the same invariants, stronger models can mask weaknesses in those contracts until a cheaper or more literal model exposes them. The lesson is not really about which LLM you pick. It is about architectural coupling: the model itself had become part of the contract without me noticing.

---

If you'd like to see the project that inspired these lessons, you can try [Codenames AI](https://codenames-ai.com/).
