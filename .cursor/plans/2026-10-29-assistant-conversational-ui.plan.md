---
name: Assistant conversational UI
overview: Product-design follow-up to generation-ui — reshape /assistant into a session-local chat transcript while keeping stateless single-turn POST /api/assistant/generate and the claims[] + citation contract unchanged.
todos:
  - id: conversational-ui
    content: "PR: session transcript, sticky composer, prose + inline [n] citations, Sources & attribution details; no API/RAG changes"
    status: pending
  - id: plan-closure
    content: "Docs-only PR after conversational-ui merges — # Shipped note, archive plan, optional prior-art.md UX addendum"
    status: pending
isProject: false
---

# Assistant conversational UI

**Goal:** Make `/assistant` feel like a **conversation** (visible turns, scrollable thread, persistent composer) while the backend remains **stateless** — one independent `POST /api/assistant/generate` per submitted question, no model memory, no streaming, no retrieval changes.

**Relationship to [Assistant grounded RAG generation](./2026-10-08-assistant-grounded-rag-generation.plan.md):** `generation-ui` (PR #103) delivered the first grounded answer surface. **Operational acceptance** and **plan-closure** for the generation milestone stay on that plan. This document is a **distinct product-design follow-up**; it does not reopen generation contract, API, Drizzle, ingest, or eval slices.

**Direction:** [rag-generation-direction.md](../../docs/assistant/rag-generation-direction.md) (deferred AI-first homepage remains out of scope).

## Locked product decisions (2026-10-29)

| Topic                     | Decision                                                                                                                                                |
| ------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Transcript                | **Full session-local transcript** — visible exchanges are central to a conversational feel                                                              |
| Composer                  | **Multiline textarea** — **Enter** submits; **Shift+Enter** inserts a newline                                                                           |
| Attribution metadata      | **Collapsed by default** in expandable **“Sources & attribution”** — readable answers first; inspectable evidence on demand                             |
| Citations                 | **Visible in the answer** — numbered inline refs (e.g. `[1]` `[2]`), clickable when `source_url` is present; **not** hidden behind the expandable panel |
| Mobile composer           | **Sticky** at bottom of the assistant shell, with safe-area padding and scroll safeguards so content is not obscured                                    |
| Intro after first message | **Hide** — transcript becomes the primary interface once interaction begins                                                                             |
| Implementation sequence   | **After PR #103 (`generation-ui`) merges** to `main` — functional foundation and visual redesign stay independently reviewable                          |

**Naming:** Use **“Sources & attribution”** (not “confidence”) — `evidence_supported`, `evidence_inferred`, etc. describe the **basis** of a claim, not a calibrated probability.

---

## 1. Problem statement and intended user experience

### Problem

The shipped `/assistant` layout reads as **form → status line → structured report**: labeled textarea, “Ask” button, global loading copy, then a claim-by-claim panel with prominent attribution labels. Functionally correct and inspectable, but cognitively closer to submitting a ticket than talking to an assistant.

### Intended experience

Visitors should recognize a **chat-shaped interaction**:

| Phase     | Visitor perception                                                                                                                            |
| --------- | --------------------------------------------------------------------------------------------------------------------------------------------- |
| Land      | Short grounded intro (hidden after first send), suggested starters, obvious “type here” composer, trust cue that answers cite published work  |
| Ask       | Their words appear as a **user message**; assistant shows **in-thread loading**; composer stays usable (disabled while in flight, not hidden) |
| Answer    | One cohesive **assistant message** (readable prose flow) with **verifiable citations** without audit-report noise                             |
| Follow-up | Prior turns remain **visible for the page session**; each new question is clearly **independent** (no implied memory)                         |
| Leave     | No persisted history; refresh clears the thread                                                                                               |

Success is **UX and layout**, not new model capabilities.

---

## 2. Observations from prior art (nyaomaru-portfolio)

**Source inspected:** live site [https://nyaomaru-portfolio.vercel.app/](https://nyaomaru-portfolio.vercel.app/) via browser (Oct 2026). Repo notes in [prior-art.md](../../docs/assistant/prior-art.md) cover RAG mechanics; this section covers **rendered UX only**.

### Directly observed

| Behavior               | Evidence                                                                                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Entry point**        | Assistant-like interaction lives on the **homepage**, not a separate `/assistant` route. Primary nav: Home, Profile, Articles, Game.            |
| **Initial state**      | Terminal widget titled “nyaomaru is?” with welcome copy, command hints (`who / skills / …`), and prompt “What would you like to know about me?” |
| **Composer**           | Single-line input at bottom of terminal; placeholder “Type a command to learn more about me…”; submissions prefixed with `>` in the transcript  |
| **Command + NL input** | `help` → short guidance; `skills` → bulleted answer; full sentence “What is your experience with React?” → fluent prose answer (RAG path)       |
| **Transcript**         | Prior user lines and responses **accumulate** in the scrollable terminal body; **Reset terminal** clears history                                |
| **Response shape**     | Plain prose / bullets; **no visible citations**, attribution badges, or token usage                                                             |
| **Visual language**    | Retro terminal (monospace, green-on-dark); resizable terminal frame; optional ASCII art toggle                                                  |
| **Mobile (375px)**     | Header collapses to **Open menu** + icon row; terminal remains on homepage (full-width widget)                                                  |

### Inferred (not independently verified)

| Behavior           | Basis                                                                                                                        |
| ------------------ | ---------------------------------------------------------------------------------------------------------------------------- |
| Loading indicator  | RAG answers returned within a few seconds with **no loading text captured**; a spinner or “…” may exist but was not observed |
| Suggested starters | Hints are **inline copy**, not clickable chips — users must type commands                                                    |
| Keyboard           | Enter likely submits (used successfully); explicit send button **not** seen                                                  |
| Focus after reply  | Input stays at bottom; **auto-scroll** likely on new output (scrollbar present after multi-turn)                             |

### Not verified / absent

| Item                              | Status                                                                                            |
| --------------------------------- | ------------------------------------------------------------------------------------------------- |
| Dedicated assistant URL           | No `/assistant` visited successfully as a separate product surface                                |
| Claim-level attribution           | Not shown                                                                                         |
| Source links                      | Not shown                                                                                         |
| Abstention UX                     | Not triggered                                                                                     |
| Streaming                         | Not observed                                                                                      |
| Cross-page history                | Profile route is a **carousel**, not chat; transcript appears **homepage-only**                   |
| Accessibility tree for transcript | Terminal output not exposed as discrete message nodes in snapshot (text read via DOM `innerText`) |

Screenshots from the session: homepage welcome, `help` turn, `skills` + natural-language turn, mobile homepage.

---

## 3. Comparison with our current UI (PR #103 / `generation-ui`)

| Dimension                | nyaomaru (homepage terminal)   | Our `/assistant` today                                                                         |
| ------------------------ | ------------------------------ | ---------------------------------------------------------------------------------------------- |
| Information architecture | Chat on home                   | Dedicated `/assistant` + nav (per generation plan — **keep**)                                  |
| Turn visibility          | User `>` lines + answers stack | Only **latest** answer; question stays in form field                                           |
| Composer                 | Always bottom of widget        | Form **above** answer panel                                                                    |
| Answer presentation      | Continuous prose               | **Per-claim articles** with uppercase attribution labels                                       |
| Citations                | None visible                   | **Authoritative** `source_label` / `source_url` from API                                       |
| Grounding transparency   | Implicit                       | Explicit intro + attribution taxonomy                                                          |
| Loading                  | Not observed                   | Global status under form                                                                       |
| Session history          | Yes (until reset)              | No transcript                                                                                  |
| Design system            | Terminal aesthetic             | Portfolio tokens ([design-system.md](../../docs/design-system.md), `app/styles/assistant.css`) |
| API                      | `{ question }` → answer string | `claims[]`, abstention, `usage` — **richer contract we keep**                                  |

**Reuse (do not rebuild):** `postAssistantGenerate`, `parseAssistantGenerateSuccessBody`, `AssistantCitationLinks`, `AssistantUsageFooter`, `SafeClaimText`, attribution copy, suggested question list, abstention messages, existing CSS tokens/patterns where they still fit.

**Replace or re-layer:** `AssistantExperience` state model (single `UiState` → transcript + in-flight turn), layout order (intro → thread → composer), `AssistantQuestionForm` presentation (composer chrome), optional demotion of per-claim **visible** chrome.

---

## 4. Recommended interaction model and rationale

### Layout (desktop and mobile)

```text
┌─────────────────────────────────────┐
│ Intro + starters (first paint only) │
├─────────────────────────────────────┤
│ Scrollable transcript (flex-grow)     │
│   [user message]                      │
│   [assistant loading | answer | err]  │
│   …                                   │
├─────────────────────────────────────┤
│ Sticky composer (multiline + submit)  │
│ Stateless hints (muted, persistent)   │
└─────────────────────────────────────┘
```

**Rationale:**

- **Transcript-first** matches chat mental models without faking multi-turn intelligence.
- **Composer after thread** mirrors nyaomaru’s bottom input and common chat UIs; **sticky on mobile** (locked) keeps input reachable without scrolling past prior answers — pad for safe-area and ensure the transcript scrolls above the sticky block.
- **Intro hidden after first message** (locked) — the thread is the interface; suggested starters hide with the intro.

### Session-only history (locked: full transcript)

Append each completed turn to an in-memory list: `{ id, question, status, answer?, error?, usage? }`.

- Follow-up questions feel natural when prior turns stay visible.
- History is **presentational only** — each API call sends **only** the current question string.

**Stateless UX caution:** A visible transcript can imply coreference (“What technologies does it use?”) even though the model receives no prior turns. Mitigate with copy, not backend memory:

1. **Disclaimer (persistent near composer):** Each question is answered independently from published sources; earlier messages are not sent to the model.
2. **Actionable hint (same area):** Include the subject when asking a new question (e.g. name the project or topic).

Optional **Clear conversation** control (stage 1) resets session state without a full page refresh — distinct from nyaomaru’s terminal reset metaphor.

### Stateless honesty (copy)

Avoid language that implies memory, threads, or “continuing the conversation.” Pair factual disclaimer with the **subject-naming** hint above so visitors know how to phrase follow-ups that work without model context.

### Suggested questions

- **Before first send:** show current chip list (unchanged content from `ASSISTANT_SUGGESTED_QUESTIONS`).
- **After first send:** collapse to a secondary “Ask another…” control or hide until composer empty — avoids competing with transcript.

### Loading

Render an **assistant-side placeholder** in the transcript (“Searching evidence…”) rather than only a detached status line. Disable composer submit during flight; keep textarea focusable for a11y. Reuse spinner styling from `.assistant-spinner`.

### Errors

Insert an **assistant-role error message** in the thread (reuse callout styles) plus retain user message. Do not discard the user turn.

### Abstention

Keep abstention callout **inside** the assistant message bubble; still render `claims[]` when present per contract.

---

## 5. Component changes and reuse

| Piece                                        | Action                                                                                                                                  |
| -------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `AssistantExperience`                        | Own `messages[]`, `pendingTurn`, composer state; orchestrate append + scroll                                                            |
| **New** `AssistantTranscript`                | `role="log"` or labelled region, scroll container, `scrollIntoView` on new assistant content                                            |
| **New** `AssistantUserMessage`               | Question text, timestamp optional (skip if not design-system)                                                                           |
| **New** `AssistantAssistantMessage`          | Wrapper for success / abstention / error / loading                                                                                      |
| **New** `AssistantComposer`                  | Evolve from `AssistantQuestionForm` — multiline textarea; **Enter** submit, **Shift+Enter** newline; sticky wrapper on narrow viewports |
| **New** helpers                              | Turn list reducer; **citation numbering** across claims in one assistant message (stable `[n]` ↔ citation metadata)                     |
| `AssistantAnswerPanel`                       | Narrow to assistant bubble contents; may split **`AssistantMessageBody`** (prose-first claims)                                          |
| `AssistantClaimList` / `AssistantClaimBlock` | **Reuse**; add prop `presentation?: "inspectable" \| "conversational"`                                                                  |
| `AssistantSuggestedQuestions`                | Reuse; parent controls visibility                                                                                                       |
| `AssistantUsageFooter`                       | Reuse per turn; stay secondary                                                                                                          |
| `app/styles/assistant.css`                   | Add transcript, message bubbles, composer sticky rules; keep token variables                                                            |

**No changes:** `lib/assistant/client/post-generate.ts`, API route, generation service, DB.

---

## 6. Proposed message and citation presentation

**Distinguish citations from attribution metadata.** Citations are the portfolio differentiator — visitors must see verifiable sources in the reading flow. Attribution labels describe how each claim relates to evidence; they belong in inspection UI, not as the primary reading surface.

### Default assistant message (always visible)

1. **Prose body:** Render `claims[]` in order as connected paragraphs inside the assistant bubble. Use `SafeClaimText` per claim; prefer paragraph breaks between claims for scannability.

2. **Inline numbered citations:** After each claim segment (or merged prose block), append **visible** reference markers `[1]`, `[2]`, … mapped to that claim’s citation list (dedupe identical `evidence_id` + `unit_id` within the message when numbering). Each marker is:
   - **Clickable** when API provides verified `source_url` (`toVisitorHref`); otherwise plain text marker with label available in the expanded list.
   - **Accessible:** link text or `aria-label` includes `source_label` where present (e.g. “Source 1: Codenames AI — Architecture”).

Example reading flow:

```text
Codenames AI generates multiple spymaster clue candidates and validates them
deterministically. A second model evaluates the candidates and selects the
safest option. [1] [2]
```

3. **Do not** hide all sources behind `<details>` only. The numbered refs are part of the default answer.

4. **`answer_text`:** Still do not render as a separate divergent path; body text must remain consistent with `claims[]` (same rule as generation-ui).

### Expandable “Sources & attribution” (default closed)

`<details>` at the bottom of the assistant bubble (summary: **Sources & attribution**):

- Numbered list aligned with inline refs: `[1] Label` (link when URL present), `[2] …`
- Per-claim **attribution** lines using existing `ATTRIBUTION_LABELS` and qualifiers for `uncertain` / `evidence_inferred`
- Optional: reuse compact `AssistantClaimBlock` layout inside the panel for auditors — **not** duplicated as the main reading surface

Uppercase mono attribution badges on every paragraph remain **out of scope** for the default view (locked).

### Usage footer

Unchanged: compact secondary line per successful turn; outside or below the expandable panel.

---

## 7. Accessibility and responsive requirements

| Requirement      | Implementation notes                                                                                                                                             |
| ---------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Labels           | Composer retains visible label + hint; transcript region `aria-label="Conversation"`                                                                             |
| Live regions     | Loading and new assistant content: `aria-live="polite"` on assistant message container (avoid double-announcing every claim)                                     |
| Focus            | After submit, focus stays in composer; after answer, move focus to new assistant message (`tabIndex={-1}`) — preserve current success focus pattern per **turn** |
| Keyboard         | **Enter** submits; **Shift+Enter** newline (locked); Escape does not clear thread                                                                                |
| Reduced motion   | No new animations; spinner already respects `prefers-reduced-motion`                                                                                             |
| Mobile           | Sticky composer with safe-area padding; transcript scrolls above composer; ~42rem shell; touch targets ≥44px; test 375px + desktop                               |
| Inline citations | Numbered refs keyboard-focusable when linked; list in expanded panel reachable from details                                                                      |
| Scroll           | New content scrolls into view without trapping focus inside transcript                                                                                           |

---

## 8. Loading, error, and abstention states

| State                      | Transcript behavior                                               |
| -------------------------- | ----------------------------------------------------------------- |
| Loading                    | User message committed; assistant row shows spinner + status copy |
| Success                    | Replace loading row with answer bubble + usage footer             |
| Error                      | Replace loading with error callout; user message remains          |
| Abstention                 | Success path with abstention callout atop claims inside bubble    |
| Abort (navigation unmount) | Existing abort controller cleanup unchanged                       |
| Empty submit               | Blocked at composer (unchanged)                                   |

---

## 9. Acceptance criteria

- `/assistant` presents a **scrollable transcript** of user and assistant turns for the current page session.
- Submitting appends a **visible user message** before the network call completes.
- Loading, success, error, and abstention appear as **assistant-side rows** in the transcript.
- Each turn uses **one** `POST /api/assistant/generate` with **only** that turn’s question string (verify in Network tab / test mock).
- **Intro and suggested starters** visible on first paint; **hidden after first successful or attempted send** (intro locked hidden, not collapsed).
- **Stateless disclaimer + subject-naming hint** persist near composer once interaction begins (and on first paint if copy fits idle state).
- **Inline `[n]` citations** visible in default assistant prose; clickable only with API `source_url`; expanded **Sources & attribution** panel default closed.
- **claims[]** remain the render source; no client-side URL inference; usage footer rules unchanged from generation-ui.
- Optional **Clear conversation** clears session transcript without implying server-side memory reset.
- `npm run lint`, `npm run typecheck`, `npm test` pass; extend `tests/assistant-ui.test.ts` or add lightweight render tests for transcript reducer/helpers if extracted.
- Manual check: desktop + 375px width; keyboard submit path; screen reader spot-check for one turn (document in PR).

---

## 10. Explicit non-goals

- Conversation memory, multi-turn model context, or sending prior messages in the request body
- Persistent chat history (localStorage, server threads, URL state)
- Streaming tokens
- Agentic tools or new API fields
- Retrieval, ranking, corpus, embedding, or schema changes
- Homepage integration or floating site-wide widget
- Terminal / retro chrome clone of nyaomaru
- Replacing attribution taxonomy in the API or eval harness
- Operational acceptance or generation plan closure (stays on sibling plan)

---

## 11. Implementation sequence and verification

**Recommended authority:** Open PR only — implement and open PR; do not merge unless explicitly granted.

**Topology (locked):** Branch from latest `origin/main` **after PR #103 (`generation-ui`) merges**. Do not stack conversational UI on the #103 branch for review — keep foundation and redesign independently reviewable.

### Sequence (single PR — three logical stages)

Implement in order within one slice; split into multiple PRs only if review size or risk warrants it (~400+ lines of UI logic is a guideline, not a gate).

**Stage 1 — Transcript and composer**

- Transcript model (append turns, loading replacement, error retention).
- Multiline composer: Enter submit, Shift+Enter newline.
- Submit → user row → loading row → API wiring (unchanged client contract).
- Scroll-into-view for new content; optional **Clear conversation**.
- Hide intro + suggested starters after first interaction.
- Stateless disclaimer + subject-naming hint near composer.

**Stage 2 — Response presentation**

- Prose-first assistant bubble from `claims[]`.
- Cross-claim **citation numbering** and **visible inline `[n]`** markers (links from API only).
- `<details>` **Sources & attribution** (default closed) with numbered source list + claim-level attribution.
- Abstention and error callouts inside assistant rows; usage footer per success turn.

**Stage 3 — Responsive polish**

- Sticky mobile composer (safe-area, no obscured transcript).
- Focus order, live regions, inline citation a11y.
- Empty-state → first-message transition; desktop + 375px verification.

**Verification gate (end of PR):** `npm run lint`, `npm run typecheck`, `npm test`, `npm run format:check`; manual multi-turn session including a **subject-less follow-up** (document expected weak answer + copy behavior); PR screenshots.

### Verification strategy

| Layer       | What                                                                                             |
| ----------- | ------------------------------------------------------------------------------------------------ |
| Unit        | Transcript reducer, **citation index / dedupe numbering** for inline refs, parse tests unchanged |
| Integration | Optional component test for one happy-path turn sequence                                         |
| Manual      | Multi-turn session, abstention fixture question, error path (offline / 429 if available in dev)  |
| Regression  | Citation link still only from `source_url`; no usage on error                                    |

**Split PRs?** Only if review size exceeds ~400 lines of UI logic — otherwise one focused PR.

---

## Adopt / adapt / avoid (nyaomaru UX)

| Prior art pattern | Recommendation                                                                                                                                                                                                         |
| ----------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Adopt**         | Scrollable transcript; user line visible before answer; composer anchored at bottom; multi-turn **visual** history; natural-language questions alongside starters                                                      |
| **Adapt**         | Portfolio design language instead of terminal chrome; dedicated `/assistant` route; rich citations + attribution instead of prose-only; explicit stateless disclaimer nyaomaru does not need                           |
| **Avoid**         | Command-only metaphor; **hiding all citations** behind expand-only UI; homepage takeover; copying green terminal aesthetic; implying persistent memory because transcript exists; labeling attribution as “confidence” |

---

## Recommended execution authority

| Slice             | Recommended authority | Agent instruction                        |
| ----------------- | --------------------- | ---------------------------------------- |
| conversational-ui | Open PR only          | Do not merge. Stop after opening the PR. |
| plan-closure      | Open PR only          | Do not merge. Stop after opening the PR. |

Repo default: **Open PR only** ([planning-standards.md](../standards/planning-standards.md#repo-default-when-no-plan-slice-applies)).

## Repository topology (default)

Integration branch: **`main`**. Start `conversational-ui` from latest `origin/main` (with `generation-ui` merged). PR base **`main`**; diff contains only this slice.

---

## Agent prompts (copy/paste for Cursor)

### conversational-ui

```text
@.cursor/plans/2026-10-29-assistant-conversational-ui.plan.md

Implement slice conversational-ui only. Do not start plan-closure. Do not change POST /api/assistant/generate, generation service, retrieval, or database schema.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main (generation-ui merged); branch represents only this slice; PR base must be main.

Deliverables: chat transcript UX on /assistant per locked decisions and sections 4–8; inline visible [n] citations + expandable “Sources & attribution”; Enter/Shift+Enter composer; sticky mobile composer; hide intro after first message; disclaimer + subject-naming hint; implement in three stages within this PR (transcript/composer → presentation → polish). Reuse API client and citation/usage components only. Mark conversational-ui completed in plan frontmatter in this PR.

Verification: npm run lint, typecheck, test; manual desktop + 375px; multi-turn including subject-less follow-up; document a11y spot-check in PR.
```

### plan-closure

```text
@.cursor/plans/2026-10-29-assistant-conversational-ui.plan.md

Plan-closure only after conversational-ui merges. Do not implement UI in this PR.

Authority: Open PR only — open docs PR; do not merge.

Deliverables: # Shipped note; move plan to .cursor/plans/archive/; mark plan-closure completed; optional short UX paragraph in docs/assistant/prior-art.md (nyaomaru live UX observations); mark conversational-ui completed if not already.
```
