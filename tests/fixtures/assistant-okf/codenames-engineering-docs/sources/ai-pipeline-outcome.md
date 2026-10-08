# `ai_pipeline_outcome` schema notes

Server-canonical PostHog event for AI clue/guess pipeline health. Emitted once per `/api/clue` or `/api/guess` that enters the AI provider path (no-op when PostHog env unset).

## P1 taxonomy properties

| Property             | Type       | Meaning                                                                    |
| -------------------- | ---------- | -------------------------------------------------------------------------- |
| `reject_classes`     | `string[]` | Distinct contract classes that failed on any attempt (closed vocabulary)   |
| `sanitization_drops` | `number`   | Entries removed by deterministic sanitizers across all generation attempts |

### `reject_classes` vocabulary

Defined in [`server/src/ai/rejectClass.ts`](../server/src/ai/rejectClass.ts):

- `structure` — JSON/schema/shape
- `membership` — board membership / revealed / illegal clue word
- `cardinality` — count vs targets / length agreements
- `completeness` — required intent or fields missing
- `consistency` — cross-field agreement (e.g. considered vs guesses)
- `survivors` — validation left zero selectable candidates
- `provider` — upstream model/provider error

Free-text validator errors remain for prompts and logs; only these classes appear on the event.

Empty `reject_classes` and `sanitization_drops: 0` on clean first-pass success.

P0 core fields (`pipeline_revision`, `generation_attempts`, `first_pass_ok`, `recoveries`, etc.) are unchanged. The fortnightly review consumes this event via [`.cursor/skills/analytics-weekly-review/event-catalog.md`](../.cursor/skills/analytics-weekly-review/event-catalog.md) and the **AI pipeline health** section of [metrics-manifest.md](../.cursor/skills/analytics-weekly-review/metrics-manifest.md) on the **operational 7d window**.
