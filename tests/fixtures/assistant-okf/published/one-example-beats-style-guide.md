---
title: One good example beat every AI writing rule I wrote
tags:
  - ai
notion_page: https://app.notion.com/p/3756cffaff9c81169f84eebfd74a7c85
format: dev.to
project: Codenames AI
devto_article_id: 3880143
devto_api_url: https://dev.to/michaeltruong/one-good-example-beat-every-ai-writing-rule-i-wrote-7oo
last_devto_sync: 2026-08-10T00:59:34.697Z
devto_draft_url: https://dev.to/michaeltruong/one-good-example-beat-every-ai-writing-rule-i-wrote-9ki-temp-slug-8042703?preview=5e47536d10657f1012ffb98325da58d38f28ffec6b9da80045d36127188533ecb0ac844ed7c99636f698e1c096b14305b2acb02bc812bb1278eb7dbc
---

# One good example beat every AI writing rule I wrote

I've been building an AI-assisted content pipeline around [Codenames AI](https://codenames-ai.com/) — field reports from the repo, drafted in markdown, synced to dev.to. The part I assumed would be hard was publish automation. The part that actually burned time was teaching the model how to _sound_ like me.

## The experiment

I started where most people start: the prompt. I wrote a Cursor rule with tone guidance, pacing notes, section shapes, and a list of things to avoid. If the draft felt flat, add another paragraph to the rule. If it over-corrected, tighten the rule. Iterate until the voice stabilizes.

That felt like the correct lever.

I assumed a longer, more detailed AI writing rule would produce better drafts. Voice felt like something you could specify in prose: a style encyclopedia with tone, pacing, and guardrails.

## The failure loop

Each revision made the output worse in a _different_ way.

The cycle was predictable: generate a draft, dislike the tone, add rules, get over-correction, revert partway, add different rules, hit a new failure mode. Some passes sounded like generic engineering docs: correct, but missing the observations that made the article worth reading. Others had no concrete details. Others followed every instruction and lost personality entirely.

The rule file kept growing. The drafts kept rotating through new ways to miss the mark.

## The accidental discovery

The useful move, in hindsight, was deleting most of the rules.

I replaced the checklist with one shipped article: [Schema first, prompt second: valid JSON wasn't enough](https://dev.to/michaeltruong/schema-first-prompt-second-valid-json-wasnt-enough-3nhm). That post already had the shape I wanted — field report, wrong assumption up front, specific failures, tradeoffs, a single takeaway.

The Cursor rule shrank to a pointer: read the example, match the example.

"Write more like this article" beat "be direct, avoid metaphors, use short paragraphs, include a takeaway."

Drafts stopped sounding like engineering documentation. They started carrying the observations and pacing of a field report instead of a rule checklist.

## Why the example transferred better

Rules describe voice from the outside. An example demonstrates it.

For long-form writing, an exemplar turned out to be closer to a spec than a style encyclopedia. Rule text and example text fail differently — a checklist compresses badly; an example carries decisions that are hard to encode as rules: pacing, level of detail, how much context to provide, and when to introduce examples.

When I asked for "direct engineer-to-engineer tone," the model complied literally and stripped the texture that makes a post readable. When I pointed at a finished article, it copied structural choices I hadn't thought to name: opening with context and a wrong assumption, using bold labels for contrast, ending sections with a concrete mistake instead of a principle.

The interesting part wasn't that the example contained better instructions. It contained decisions I didn't know how to describe.

I could recognize those choices when I saw them. I just wasn't very good at encoding them as rules.

## What changed

Git history tells the story cleanly: the checklist-era rule peaked at **69 lines**; the example-pointer rule landed at **23 lines**.

After the switch, I spent less time fighting over-compliance and stripping generic phrasing. Voice became more consistent across drafts because the target was an article, not a growing instruction list.

**Maintenance lesson:** At 69 lines, the rule had enough instructions to contradict itself. A single canonical example stays honest. If the next post should sound different, update the example or add a second one for a new format. The rule stays an import statement.

**Tradeoff:** One example encodes one format. Field reports work; a tutorial or release note might need a second exemplar later.

**Tradeoff:** Examples can go stale. If the canonical post ages badly, future drafts inherit the wrong target. Treat the example like code you refactor, not like documentation you forget.

**What I'd do differently next time:**

- Ship one article I'm proud of before investing in voice rules.
- Point agents at that article.
- Keep the Cursor rule as workflow plus a link, not a paraphrase of the example.
- Add rules only for things examples can't carry: where files live, what not to paste into Notion, publish steps.

Prompt engineering still matters for facts, structure, and evidence gathering. For _tone_ on long-form posts, though, one good example beat every style guide I wrote.

## Takeaway

If your AI writing rules keep growing and the drafts keep getting worse, stop adding rules. Find an article that already sounds right and make that the spec.

---

**Editor's note (August 2026)**

The core lesson still holds: a growing style encyclopedia made drafts worse, and pointing agents at shipped writing worked better than encoding voice as rules.

The implementation has evolved. The `editor-draft` and `editor-critique` skills now calibrate against a short, human-maintained set of published field reports rather than one canonical structural example. The original [schema-first](https://dev.to/michaeltruong/schema-first-prompt-second-valid-json-wasnt-enough-3nhm) article is still useful for tone and annotation style, but no longer defines the default structure.

The tradeoff remains the same: exemplars can go stale, so the set has to evolve with the writing.

---

If you'd like to see the project behind these posts, try [Codenames AI](https://codenames-ai.com/).
