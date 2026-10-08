---
title: One skill per action looked like the safe boundary
tags:
  - ai
  - agents
  - workflow
notion_page: https://app.notion.com/p/3b16cffaff9c815886f4c04ccc2f2be9
format: dev.to
project: General
devto_article_id: 4336903
devto_api_url: https://dev.to/michaeltruong/one-skill-per-action-looked-like-the-safe-boundary-13pj
last_devto_sync: 2026-08-07T15:07:25.284Z
devto_draft_url: https://dev.to/michaeltruong/one-skill-per-action-looked-like-the-safe-boundary-1gdm-temp-slug-3095160?preview=df27d61c71c5c2d6b121886b2c703fd372621b8435a0963449fa26d3865af0c5f53b5b48345cd8fccf318e504e708f237656d7487c70e76d098db5cc
---

# One skill per action looked like the safe boundary

<!--
Tension-first entrance: familiar one-skill-per-action instinct before system teaching.
Title hints the wrong boundary; ownership lesson earned in the body.
Card guardrail: editor-inbox consolidation first; REST/resource analogy deferred.
Portability: lesson in prose; skill names are labels, not required reading.
Teach only enough system after tension lands; no defensive setup disclaimer.
-->

I started with a rule that felt like good engineering: **one skill per action**. Create a card here. Enrich it there. Reclassify it somewhere else. Each prompt got a clean boundary. Each file stayed small.

Then that decomposition started to fight the domain.

I ran into this while building an AI-assisted editorial workflow in Cursor, but the problem was not really about Cursor or publishing. It was about where an agent capability should begin and end.

In that setup, a **skill** is a markdown file the agent loads for a workflow. My editorial workflow uses those skills to create and manage Notion cards before drafting posts.

## When every action gets its own skill

<!--
Ground the failure mode in what the operator actually saw: independent skills
for operations that all touched the same Inbox card lifecycle.
Include one concrete misfire (wrong skill / second pass) before the architecture label.
-->

The first version of my inbox skill only created Inbox cards. That matched early usage: capture an observation, normalize it into a canonical shape, attach a small set of grounded references, and stop. The skill was create-only and treated each new card as immutable once it left Inbox.

As capture matured, the same card kept needing more work **while it was still Inbox**:

- **Create** when a new observation arrived
- **Enrich** when new evidence or framing changed the normalized shape
- **Reclassify** when routing rules decided the card should be sparse vs rich, or a quick note vs a planned blog post

Those felt like three different jobs. They had different verbs. They had different retrieval triggers. Splitting them into separate skills seemed obvious.

The split failed in ordinary corrections. I would enrich an Inbox card with new evidence, then realize it should change from a quick note into a planned blog post. That meant a second skill invocation for reclassify, with a second copy of the same lifecycle rules. For a moment it was unclear which skill was still responsible for keeping the page as one current write-up instead of an accumulating edit history. Get the order wrong and you did the work twice: an enrich that left the card type stale, or a reclassify that ignored the evidence rewrite you still needed.

The deeper problem was ownership. All three operations touched the **same owned object**: a single Inbox card in a Notion database. They shared the same lifecycle gate (the card must stay in Inbox), the same mutation boundaries (never change lifecycle status, source path, or published URLs on existing pages), and the same routing rules for how sparse or rich the card should be and whether it was a quick note or a planned post. They also shared the same rule: after every update, the page must hold exactly one current normalized write-up and exactly one captured observation. Notion history is the revision log; the operational card is not an append-only audit log.

Treating Create, Enrich, and Reclassify as three skills meant three prompts trying to enforce one coherent capability. The boundaries were at the wrong layer.

## Consolidation made the skill clearer

<!--
Surprise beat from card: coherence improved after merge, not degraded.
PR #493 is supporting detail, not the lede.
-->

The fix was to stop pretending those were separate capabilities. One inbox skill now owns the full Inbox lifecycle: **Create**, **Enrich**, and **Reclassify** while the card remains in Inbox.

The operator still invokes one skill. The skill routes internally:

| User-facing command      | What it does                                                               |
| ------------------------ | -------------------------------------------------------------------------- |
| **create inbox card**    | Creates an Inbox card with a canonical write-up and grounded references    |
| **enrich inbox card**    | Folds new evidence into the existing Inbox page as one current write-up    |
| Same-thread continuation | Treats further capture in the same chat as enrich on the page just created |

**Reclassify** is not a separate user command. It is detected inside enrich when the routing rules decide the card should be richer or thinner than before, or should shift from a quick note to a planned post. Sparse captures can become richer field reports. The skill rebuilds the current Inbox representation when those derived choices change; it does not append enrichment history sections.

That consolidation expanded the inbox skill from create-only immutability to Inbox-lifecycle ownership. The skill file grew, but the **system** got simpler: one place owns Inbox normalization, one shared rule set, one place with authority over the rules.

That was the opposite of what I expected. I thought a bigger skill file would feel heavier. Instead routing got easier. I stopped wondering which inbox skill to invoke for a correction vs a note-to-post change. I invoked the inbox skill, and the routing rules decided whether enrich included reclassify.

## One capability, many internal operations

<!--
Portable consolidate-vs-split test; falsifiers so the list is not a restatement.
-->

The incident suggests a short consolidate-vs-split test:

1. **Same owned object under the same lifecycle gate.** If lifecycle stage or artifact type diverges, stop consolidating.
2. **Compatible mutation rules and safety boundaries.** If the operations need conflicting write permissions or rejection rules that cannot share one authority, keep them separate.
3. **Same type-and-shape rules across operations.** Given the same input, if the operations would disagree about what kind of thing it should become, keep them separate.

Those are internal operations, not separate capabilities.

A parallel already existed elsewhere in the pipeline. A triage skill scores Inbox cards, recommends promotions out of Inbox, and archives the weakest rows. Those are different mutations, but they live inside one triage skill because they share the same queue-review ownership. I did not split score, promote, and archive into three skills. The operations differ; the owned workflow does not.

That comparison has limits. Triage promotion requires an explicit **apply** command after a dry-run report. Inbox enrich rejects cards that have already left Inbox. The internal gates differ without splitting ownership. The pattern is still recognizable: **one skill per coherent capability**, with internal routing between operations.

That does not mean every related action belongs in one skill. Scheduling, drafting, critique, and publishing own different artifacts and stop lines, so they remain separate.

## The resource mattered more than the verb

<!--
Card guardrail: REST analogy only after editor-inbox story lands.
Keep as portable frame; do not restate the consolidate-vs-split criteria.
-->

You do not need Cursor to recognize the shape. A REST API does not usually become a separate service for every operation on the same resource.

`POST` creates. `PATCH` updates. `DELETE` removes. Different operations, same resource contract. Reclassification in my system is just another mutation of that same Inbox card resource.

Splitting those operations into separate agent skills was like building one service for create, another for update, and a third for delete. The endpoints looked clean in isolation. Ownership of the resource was fragmented.

Agentic workflows drift toward that decomposition because **actions are easier to name than ownership**. "Create card" and "enrich card" are vivid verbs. "Own Inbox normalization throughout the Inbox lifecycle" is accurate but abstract. The verbs made the skills easy to name. The resource revealed where the boundary actually belonged.

Your domains may decompose differently. The useful question is not "how many skills do I have?" but "what object does this capability own, and are these verbs operations on that object or different capabilities entirely?"

**Takeaway:** Start with one skill per action if that helps you ship. When multiple operations share an owned object, lifecycle, and compatible safety boundaries, consolidate them into one capability module and route internally. The risk was no longer a skill becoming too broad. It was one capability having multiple competing owners.

---

If you'd like to see the project behind these workflow experiments, try [Codenames AI](https://codenames-ai.com/).
