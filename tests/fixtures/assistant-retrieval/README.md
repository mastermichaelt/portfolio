# Assistant retrieval eval fixtures

Drives `tests/assistant-retrieval-eval.test.ts` against the structure-aware index on `DATABASE_URL`.

## Case kinds

| `kind`                | Scored? | Purpose                                                                 |
| --------------------- | ------- | ----------------------------------------------------------------------- |
| `positive`            | Yes     | Parent concept in top-K; optional or required chunk/section specificity |
| `corpus_gap`          | No      | Diagnostic — log whether dedicated evidence appears (not abstention)    |
| `negative_inspection` | No      | Diagnostic — log distances/titles for out-of-corpus questions           |

**Parent vs chunk:** `expected_parent_concepts` measures whether relevant knowledge is retrieved. `expected_unit_any_of` / `expected_sections` measure passage-level usefulness when `require_specificity: true` (see `attribution-experience`). Broader cases such as `developer-infrastructure` keep unit globs as optional diagnostics only.

Abstention and unsupported-question handling belong to the later grounded-generation experiment, not this retrieval eval.
