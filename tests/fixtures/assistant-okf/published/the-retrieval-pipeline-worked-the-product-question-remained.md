---
title: The retrieval pipeline worked. The product question remained.
tags:
  - ai
  - agents
  - webdev
notion_page: https://app.notion.com/p/3f36cffaff9c81dabdc8cdb127cf2d17
format: dev.to
project: General
devto_article_id: 4823417
devto_api_url: https://dev.to/michaeltruong/the-retrieval-pipeline-worked-the-product-question-remained-80c
last_devto_sync: 2026-10-09T13:14:31.313Z
devto_draft_url: https://dev.to/michaeltruong/the-retrieval-pipeline-worked-the-product-question-remained-938-temp-slug-3910936?preview=45ebaa50a276a4914f69f04299a480621720d41136220d1b3ba804fbaf5ce8bc32062a3666476f80373200a0b7d5c0990fbbb9d24aa4df231c6d8e74
---

# The retrieval pipeline worked. The product question remained.

<!--
Field report: retrieval-stage only (no deployed chat assistant eval).
35/61 initial (six positives; attribution rank-1/0.373; nuclear diagnostic).
PR #45 portfolio expansion → 89/209; retrieval-eval 18/18 (6/6 scored positives + 2 diagnostics; agent-memory still corpus_gap).
Cross-repo producers (career, marketplace, Savepoints, Codenames) → 12/12 scored positives; agent-memory reclassified positive @ parent rank 10 (top-10 pass, top-5 miss).
Answer generation out of scope.
-->

I assumed that if search found the right document, that was good enough for a conversational assistant answering questions about my work.

My portfolio had grown beyond a collection of project pages. Between independent projects, technical writing, career history, and engineering documentation across repositories, there was increasingly more material to navigate. I was building retrieval behind a site chat assistant so visitors could ask about that work without hunting through sources themselves.

The first indexing pass treated each whole document as one searchable item, enough to prove ingest, stable identifiers, and scripted checks before wiring chat.

Some documents covered several distinct topics: a case overview, a block on how attribution was measured, runbook notes in the same file. A narrow question needs one of those sections, not an average of the whole document. With one search result per document, similarity ranking cannot prefer the attribution section over the overview when both share the same parent.

I needed retrieval to return individual passages, not whole documents, without changing how the underlying content was authored. The pipeline normalized mixed sources into [Open Knowledge Format (OKF)](https://cloud.google.com/blog/products/data-analytics/how-the-open-knowledge-format-can-improve-data-sharing) documents, split documents that covered several topics into independently searchable passages, and indexed them for similarity search:

```text
Portfolio, repos, and writing
→ OKF structured documents
→ Passage splitting
   one document, several topics
   ├─ Overview passage
   ├─ Attribution passage
   └─ Runbook passage
   each independently searchable; retains source reference
→ OpenAI embeddings
→ Postgres + pgvector
→ Similarity search
→ Top matching passages
```

Splits follow Markdown headings (`#`, `##`, and so on), not fixed character counts, so each passage lines up with how the source was already organized. Headings inside fenced code blocks are ignored so examples do not become false section breaks. When a section was still too long, the splitter used paragraph boundaries rather than cutting through the middle of a paragraph.

## What the retrieval tests showed

Across **35** structured documents from the selected sources, splitting produced **61** independently searchable passages. I built a small set of automated tests using questions where I knew what information should be returned. Each passage kept a stable id and a pointer to its parent document so checks could score document match and section match separately.

One test asked about attribution in growth experiments. The relevant write-up covered several topics, so finding the document alone wasn't enough. The test checked whether search returned the specific section about attribution measurement.

It did. The attribution passage ranked first.

I also tested what happened when the information wasn't there.

For a deliberately unrelated question about nuclear reactors, search still returned passages from my career history. They were the closest available matches, even though none could answer the question.

That meant the chat assistant would need both the retrieved passages and their distance scores to help determine whether there was enough evidence to answer.

### Expanding the portfolio corpus

I expanded the corpus to include more of the material already available across my portfolio: project case studies, published articles, and documentation about the tools and workflows I'd built. The retrieval architecture stayed the same. What changed was the information available for search.

| Stage                        | Structured documents | Searchable passages |
| ---------------------------- | -------------------: | ------------------: |
| Initial retrieval experiment |                   35 |                  61 |
| Portfolio corpus expansion   |                   89 |                 209 |

After expanding the portfolio corpus, a question about agent memory still exposed a gap. The answer lived in architecture notes for Savepoints, a side project where I capture durable learnings from agent sessions, and those notes were not in the index yet.

### Expanding beyond the portfolio

I added selected engineering documentation from my other repositories, including the Savepoints architecture notes, alongside reviewed career material. I kept the index limited to material suitable for public use.

After indexing the additional material, search could finally find the architecture notes about agent memory.

For that question, related articles about agent portability occupied the first nine results. The Savepoints notes appeared at rank 10.

The evaluation passed because it searched the top 10 results, while the retrieval CLI returned only five by default. With that setting, the relevant Savepoints notes would have been missed.

That left a decision for when I wired up the chat assistant: how many passages should each search return? Five wasn't necessarily wrong, and ten wasn't necessarily right. The answer depended on what was in the index, what visitors asked, and which passages ranked highest.

**Takeaway:** Retrieval quality depends on both the content being indexed and how search is configured. Passing retrieval tests is a useful starting point, but the settings still need to be evaluated against the questions the assistant is expected to answer.
