---
title: The board came back. The highlights lied.
tags:
  - ai
  - webdev
  - typescript
notion_page: https://app.notion.com/p/3756cffaff9c810ead6cf6915831a971
format: dev.to
project: Codenames AI
devto_article_id: 4569417
devto_api_url: https://dev.to/michaeltruong/the-board-came-back-the-highlights-lied-18bo
last_devto_sync: 2026-09-06T01:12:57.301Z
devto_draft_url: https://dev.to/michaeltruong/the-board-came-back-the-highlights-lied-5bi2-temp-slug-712826?preview=649bec8196fb1aec8cfe905071cded0e4efb8540e40aea1ee596ede9cc290be3d39e7335638cacc29d4f8e6c048b58e2006c5441a93d126b0727f8ed
---

# The board came back. The highlights lied.

<!--
Title names the failure. Body keeps setup → assumption → reveal.
"Until I added targeting" is the curiosity hook, not a restatement of the title.
Same-game reload leftover is mostly harmless. The incident is a word collision
on the next mode's board. Name the cheaper clear-on-switch first so
persist-per-mode vs do-not-persist is an earned fork, not the only fix on
the table. Semantic acceptance waits until that fork earns it.
Do not flatten to persist-domain-discard-UI. Do not use chose-to-save.
Do not claim the AI turn itself disappears on restore.
-->

I ship [Codenames AI](https://codenames-ai.com/), a web game. Each game mode keeps its own save in `localStorage`. Reload the tab, switch to a different mode, come back later: the board, turn, clue history, and in-progress results all come back. That felt like a win until I added spymaster clue targeting.

While drafting a clue, I can click cards on my team. Those clicks sync the clue count and show which words I had in mind. They are visual intent only. They are not part of the clue submission payload.

I assumed that if I reloaded the same game, the UI could restore those highlights too. Same session, same cards, same mental model. On a single-mode refresh that was mostly harmless.

Switching game modes was not. Each mode loads its own 25-card board. Leftover targeting clicks stayed in memory. If a word on the new board matched a card I had highlighted in the previous mode, that new card lit up. I had never clicked it. The board was truthful. The UI was lying about what I was drafting.

Clearing those highlights when the board changed would have stopped the lie. That cheaper fix was not enough. I had already assumed a same-game reload should bring the clicks back. Keeping that assumption and stopping the leak meant persisting the clicks per mode, the same way we persist the board. That would have treated a thinking aid like a move. The collision forced the real question: should coming back restore those clicks at all?

## What coming back restores

<!--
Autosave first, then evidence for the split (typed vs unsubmitted AI).
Table encodes the three-state model. Anti-summary lands after the table.
Model/config refresh is a useful consequence, not the definition.
This section owns the Docs / never-press-Save beat and the three-state split.
Later sections must not restate either without new evidence.
-->

People now expect drafts to survive a reload. Google Docs made that the default: leave, come back, the paragraph is still there. Autosave is already on in this game. A lot of players never press Save. They just come back.

A saved snapshot carries the board, the turn, typed clue fields, history, and any in-flight result. It omits targeting clicks on purpose. The snapshot type documents that omission in `gamePersistence.ts`.

A clue you typed already works the Docs way. An unsubmitted AI-generated clue does not. Refresh asks the model again. The clue word and the highlighted targets can change (`INSECT` and one card can come back as `BODYPART` and two different cards). That generation has not crossed into accepted game state. A useful consequence is that a model experiment, upgrade, swap, or config change can take effect on the next reload instead of replaying the last output.

Human targeting clicks are the same shape: a thinking aid around a later submit, not a move on the board.

| Restored from snapshot                                         | Cleared or regenerated on restore |
| -------------------------------------------------------------- | --------------------------------- |
| Board, revealed cards, team, outcome, and pending guess result | Human-intended target highlights  |
| Human-typed clue word and count                                | Unsubmitted AI clue and targets   |
| Submitted clue history                                         | Manual clue-count override flag   |

<!--
Typed vs unsubmitted AI stay on one row. That contrast is the #563 discovery.
Left column is what coming back should treat as current truth.
-->

That is why "persist domain state, discard UI state" is the wrong summary. Some UI state should persist (the typed clue). Some AI-generated state should not, even though it occupies the same fields. React state versus a domain object does not tell you enough. The snapshot has to encode what the product has accepted as true, not whatever happened to exist in the UI, and not because anyone pressed Save.

## What restore actually does

<!--
Restore-then-clear, then the user-visible test. No helper parade. No restated
semantic rule. No standalone helper section.
-->

Switching modes and reloading the tab both restore the saved game, then clear the drafting pose. Targets, the manual count override, and any cached AI overlay go with it. The same clear runs on new game and after a successful submit, so a leftover thinking aid cannot leak into the next turn.

So restore is not "rehydrate everything the component used to know." It is "restore the game, then clear the drafting pose."

The restored count is durable user work: the number you typed comes back. What does not come back is the live session flag that blocked auto-sync from targets. After reload, the first target selection re-derives count from the grid. That is the same interaction as changing targets in the same session without reloading (`type 5 → change targets → derived count` matches `type 5 → reload → select a target → derived count`). The override flag is transient drafting pose, not durable provenance like human-typed clue word vs unsubmitted AI clue.

The regression tests I care about are behavioral:

- **Grid reference:** highlight on board A, switch to board B that shares the word, assert nothing is lit.
- **Provenance:** after reload, a human-typed clue survives while an unsubmitted model-generated clue is regenerated. The test controls the model's second answer so replaying the saved output fails deterministically.
- **Count after reload:** manually typed count survives reload; the first target selection afterward re-derives count from the grid (same as in-session target toggles).

Highlights only reflect choices made in the current drafting session on the current grid.

## Same problem, different surfaces

<!--
Classify this leftover highlight, then transfer on semantic acceptance.
Do not restate the three-state split or the never-press-Save beat.
Do not cite unpublished companion cards. Do not reopen chose-to-save.
-->

The leftover highlight was not a styling bug. Dropping the clicks from the snapshot fixed the category: a thinking aid is not current truth.

If you are building agent UIs with drafts, wizards, or "thinking aloud" interactions, coming back poses the same question. Autosave does not settle what on the screen is current truth. Keep proposals and thinking-aloud hints ephemeral, even when they sit in the same inputs as accepted work. Document that acceptance boundary in the snapshot type so the next contributor does not "helpfully" persist whatever the component last held.

<!--
Generalization is inline. Pattern applies beyond this game. We do not claim
universal proof from one SPA.
-->

**Takeaway:** Coming back should restore what the product treats as current truth, not whatever happened to be on screen. Accepted work stays. Proposals and thinking-aloud hints do not, even when they share the same fields. The persistence boundary is semantic, not architectural. Test what coming back looks like, not whether the save still loads.

---

If you'd like to see the project that inspired these lessons, you can try [Codenames AI](https://codenames-ai.com/).
