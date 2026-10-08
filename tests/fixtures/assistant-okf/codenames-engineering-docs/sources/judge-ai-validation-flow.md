# Judge AI / validation flow (Solo vs JUDGE)

Solo vs **JUDGE** uses `strategy: "judged"` on `POST /api/clue`. The server generates several spymaster clue options in one call, runs **deterministic validation** on each, then a second **Judge** model call picks the safest option. Token usage from both calls is merged into the response.

Entry points: `frontend` (`solo_judge` → `clueStrategyForMode`) → `server/src/server/app.ts` → `getClue` → `getJudgedClue` in `server/src/ai/judgedClue.ts`.

---

## Architecture overview

```mermaid
flowchart TB
  subgraph Client
    UI[Solo vs JUDGE UI]
  end

  subgraph API
    Route["POST /api/clue<br/>strategy: judged"]
    BodyZod[ClueRequestBodySchema<br/>Zod request validation]
  end

  subgraph Orchestration["judgedClueWithOpenAI"]
    Batch[Phase 1: Candidate batch]
    Judge[Phase 2: Judge selection]
    Fallback[Fallback: direct clue]
  end

  subgraph Phase1["Phase 1 — Batch spymaster"]
    BatchPrompt[buildClueBatchMessages]
    BatchLLM[OpenAI chat<br/>json_object]
    BatchParse[parseClueBatchResponse]
    ClueVal[validateClueForRequest<br/>per candidate]
  end

  subgraph Phase2["Phase 2 — Judge"]
    JudgePrompt[buildClueJudgeMessages]
    JudgeLLM[OpenAI chat<br/>json_object]
    JudgeParse[parseClueJudgeResponse]
  end

  UI --> Route
  Route --> BodyZod --> Batch
  Batch --> BatchPrompt --> BatchLLM --> BatchParse --> ClueVal
  ClueVal -->|0 valid| Fallback
  ClueVal -->|1 valid| Single[Skip judge;<br/>chosenIndex = 0]
  ClueVal -->|2+ valid| Judge
  Judge --> JudgePrompt --> JudgeLLM --> JudgeParse
  JudgeParse -->|fail| Fallback
  JudgeParse -->|ok| Response[ClueResponse + judged metadata]
  Single --> Response
  Fallback --> Response
```

---

## Prompt chain (two LLM calls)

```mermaid
sequenceDiagram
  participant App as Frontend
  participant API as POST /api/clue
  participant Batch as clueBatchWithOpenAI
  participant Val as validateClueForRequest
  participant Judge as clueJudgeWithOpenAI

  App->>API: team, cards, strategy: judged
  API->>Batch: target 4 candidates

  Note over Batch: System: spymaster rules +<br/>"exactly 4 distinct candidates"
  Note over Batch: User: board, unrevealed friendly words
  Batch->>Batch: OpenAI (JSON)
  Batch->>Val: For each entry in candidates[]
  Val-->>Batch: Keep valid, dedupe words (max 4)

  alt Only one valid candidate
    API-->>App: clue + judged (index 0, no judge call)
  else Two or more valid
    Note over Judge: System: strict clue judge
    Note over Judge: User: board + numbered candidates 0..n-1
    Judge->>Judge: OpenAI (JSON)
    Judge->>Judge: chosenIndex + reason
    API-->>App: word, count, judged.candidates,<br/>chosenIndex, judgeReason, usage
  end

  opt Judge or batch fails
    API->>API: Fallback clueWithOpenAI (single direct clue)
  end
```

---

## Validation layers

| Stage          | Module                                      | What it checks                                                                                                                                                                                                                 |
| -------------- | ------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| HTTP body      | `ClueRequestBodySchema`                     | `team`, `cards`, optional `strategy`                                                                                                                                                                                           |
| Batch JSON     | `clueBatchValidation.ts`                    | Valid JSON; `candidates[]` entries parsed with `ClueResponseSchema` (`word`, `count`, optional model `targets[]`)                                                                                                              |
| Per-clue rules | `clueResponseValidation.ts`                 | Single word, letters only, count ≤ max, not on board, no substring/similarity to codenames, team has unrevealed cards; `targets` → `intendedTargets` + `intentStatus` (`ok` \| `missing` \| `invalid`) via `resolveClueIntent` |
| Batch output   | `parseClueBatchResponse`                    | At least one valid candidate after filtering; dedupe by normalized word                                                                                                                                                        |
| Judge JSON     | `clueJudgeValidation.ts`                    | `{ chosenIndex, reason }`; index in `[0, candidateCount)`                                                                                                                                                                      |
| Retry loop     | `openaiClueBatch.ts` / `openaiClueJudge.ts` | Up to 4 attempts on parse/validation failure (same model)                                                                                                                                                                      |

Judge prompt rules (see `codenamesClueJudgePrompt.ts`): pick the clue that best helps the **active team** only; avoid tempting assassin, opponent, or neutral hits; prefer plausible `count`; `reason` must cite only friendly codenames.

---

## Response shape

`ClueResponse` (`server/src/types/game.ts`) — chosen clue fields are duplicated at the top level; `judged.candidates[]` holds every validated `ClueCandidate` from the batch step.

| Field                | Type                                 | Notes                                                                                                          |
| -------------------- | ------------------------------------ | -------------------------------------------------------------------------------------------------------------- |
| `word`, `count`      | string, number                       | Winning clue                                                                                                   |
| `intendedTargets`    | `string[]`                           | Board-cased unrevealed friendly codenames for the chosen clue; empty when intent is missing/invalid            |
| `intentStatus`       | `"ok"` \| `"missing"` \| `"invalid"` | Whether model `targets` were present and passed validation                                                     |
| `judged`             | object                               | Present for `strategy: "judged"`                                                                               |
| `judged.candidates`  | `ClueCandidate[]`                    | Each entry: `word`, `count`, `intendedTargets`, `intentStatus`; optional legacy `pitch` on brainstorm payloads |
| `judged.chosenIndex` | number                               | Index into `candidates`                                                                                        |
| `judged.judgeReason` | string                               | Judge model rationale                                                                                          |
| `usage`              | `GuessTokenUsage`                    | Optional; merged batch + judge (and fallback) calls                                                            |

```json
{
  "word": "LINK",
  "count": 2,
  "intendedTargets": ["BRIDGE", "CHAIN"],
  "intentStatus": "ok",
  "judged": {
    "candidates": [
      {
        "word": "ROPE",
        "count": 1,
        "intendedTargets": ["CABLE"],
        "intentStatus": "ok"
      },
      {
        "word": "LINK",
        "count": 2,
        "intendedTargets": ["BRIDGE", "CHAIN"],
        "intentStatus": "ok"
      }
    ],
    "chosenIndex": 1,
    "judgeReason": "Links two friendly words without tempting assassin or neutrals."
  },
  "usage": {
    "promptTokens": 2400,
    "completionTokens": 120,
    "totalTokens": 2520,
    "cachedPromptTokens": 0,
    "apiCalls": 2
  }
}
```

---

## Related mode: STRANGE

`strategy: "strange"` uses the same batch step (target **6** candidates) but selects via simulated guess outcomes instead of the Judge model (`strangeClue.ts`). Validation for batch candidates is identical.

---

## Key files

| Role          | Path                                                                      |
| ------------- | ------------------------------------------------------------------------- |
| Orchestration | `server/src/ai/judgedClue.ts`                                             |
| Batch LLM     | `server/src/ai/openaiClueBatch.ts`                                        |
| Judge LLM     | `server/src/ai/openaiClueJudge.ts`                                        |
| Batch prompt  | `server/src/lib/prompt/codenamesCluePrompt.ts` (`buildClueBatchMessages`) |
| Judge prompt  | `server/src/lib/prompt/codenamesClueJudgePrompt.ts`                       |
| Clue rules    | `server/src/ai/clueResponseValidation.ts`                                 |
| Batch parse   | `server/src/ai/clueBatchValidation.ts`                                    |
| Judge parse   | `server/src/ai/clueJudgeValidation.ts`                                    |
