---
title: "Schema first, prompt second: valid JSON wasn't enough"
tags:
  - ai
  - webdev
  - typescript
  - node
notion_page: https://app.notion.com/p/Structured-outputs-Zod-as-the-real-guardrail-3746cffaff9c81c9b50add6a3543da47
format: dev.to
project: Codenames AI
devto_article_id: 3816122
devto_api_url: https://dev.to/michaeltruong/schema-first-prompt-second-valid-json-wasnt-enough-3nhm
devto_draft_url: https://dev.to/michaeltruong/schema-first-prompt-second-valid-json-wasnt-enough-pc4-temp-slug-4797066?preview=68267a2aa5d4cb3e627683524e47d1d6cf0580ba3bbfd266dfc0439d5191b95992466355a23ddacecfa6337f455ad76bef4ca2d7cdbf9f8752e7810b
last_devto_sync: 2026-06-22T07:30:22.019Z
---

# Schema first, prompt second: valid JSON wasn't enough

Over the last month I've been building [Codenames AI](https://codenames-ai.com/), a small web game where an LLM plays Codenames with you. The guesser never sees unrevealed card identities. The server sends the board state and a clue; the model returns structured guesses with confidence scores and short explanations.

When I started, I assumed the hard part was prompting. I was half right. Getting _something_ reasonable out of the model was fast. Making the system safe to expose to players was not.

My first milestone felt responsible: `response_format: { type: "json_object" }` on the chat completion, plus Zod schemas for the response body. If the JSON didn't parse or failed Zod, retry. Ship it.

Then I watched the model comply perfectly with the schema and still propose moves that would ruin a game.

## Valid JSON, invalid game

Here's the distinction that mattered.

**JSON schema (via Zod) answers:** Did the model return the keys and types I asked for?

**Domain validation answers:** Is this output allowed on _this_ board, for _this_ clue, under _these_ rules?

Those are not the same questions.

Three examples I hit while testing and running the game:

**1. The model echoed the clue as a guess.**

Codenames forbids guessing the clue word. The model would sometimes put it in `guesses[]` anyway—confidently, with a tidy explanation object. Zod was thrilled. The game was not.

**2. The model hallucinated words that weren't on the board.**

Perfect JSON. A guess list full of words that don't exist on the 25-card grid, or that were already revealed. Again, schema-valid.

**3. The spymaster returned illegal clues.**

Single-word clues can't match a codename, can't be a substring of one (or vice versa), and can't be near-miss spellings. The model regularly suggested clues that a human referee would reject. Valid JSON every time.

I spent too long fixing these by adding sentences to the system prompt. That helped a little. It did not help enough.

## What actually moved reliability

The bigger wins came from code paths I treated as boring infrastructure.

**Sanitization before trust.** After Zod parses the guess payload, we strip clue echoes, off-board words, revealed cards, and duplicates, then realign the explanation array with whatever survived. The model can return whatever explanation it wants; the server decides which guesses survive validation.

**Deterministic validators with explicit error strings.** Clue validation returns things like "Clue cannot be a substring of a board word"—not "invalid." Those strings go back into the next attempt as `rejectionFeedback`, alongside an exclude list of clue words that already failed, so the next attempt could avoid repeating the same violations.

**Post-processing for uncertainty.** Even valid guesses get filtered by a confidence threshold before the client plays them. If nothing clears the bar, the API returns an empty guess list—the AI Guesser passes the turn rather than firing a weak pick. That's a product decision, but it only works because the earlier layers stopped nonsense from masquerading as success.

None of this required readers to know Codenames. It's the same shape as any LLM feature with invariants: inventory counts that can't go negative, user IDs that must exist, action enums that must match state machines.

## Mistakes, surprises and tradeoffs

**Mistake:** Treating structured output as the guardrail. It only enforced shape.

**Surprise:** Sanitization outperformed prompt engineering for the dumbest failures (echoed clue, off-board tokens). Cheap deterministic filters beat another paragraph of "IMPORTANT RULES."

**Surprise:** Retry feedback with the _reason_ a clue failed worked better than "try again." The model stopped repeating substring violations faster when the server named the violation.

**Tradeoff:** Retries burn tokens. Logging validation errors per attempt was essential to know whether we had a prompt problem or a missing rule.

**Tradeoff:** Sanitization can mask drift. If you silently drop bad guesses, monitor what you're dropping or you'll quietly turn the validator into the thing making all the decisions.

## What I'd do on the next project

1. Define the wire shape (JSON + schema).
2. List domain invariants as pure functions with test cases
3. Add sanitization for the failure modes observed in the first 50 live calls.
4. Only then invest in prompt nuance—and feed validator messages into retries.

Prompt engineering still matters for quality. It is not a substitute for enforcement when the user can lose a game—or money, or data—because the model followed the JSON spec and ignored reality.

**Takeaway:** If your LLM integration stops at "parse JSON, call it a day," you haven't finished the feature. You've finished the demo.

---

If you'd like to see the project that inspired these lessons, you can try [Codenames AI](https://codenames-ai.com/).
