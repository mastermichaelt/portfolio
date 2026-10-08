# Assistant retrieval eval fixtures

Drives `tests/assistant-retrieval-eval.test.ts` against the structure-aware index on `DATABASE_URL`.

## Case kinds

| `kind`                | Scored? | Purpose                                                                 |
| --------------------- | ------- | ----------------------------------------------------------------------- |
| `positive`            | Yes     | Parent concept in top-K; optional or required chunk/section specificity |
| `corpus_gap`          | No      | Diagnostic — log whether dedicated evidence appears (not abstention)    |
| `negative_inspection` | No      | Diagnostic — log distances/titles for out-of-corpus questions           |

**Parent vs chunk:** `expected_parent_concepts` measures whether relevant knowledge is retrieved. `expected_unit_any_of` / `expected_sections` measure passage-level usefulness when `require_specificity: true` (see `attribution-experience`). Broader cases such as `developer-infrastructure` keep unit globs as optional diagnostics only.

**Section matching (initial eval):** `expected_sections` succeeds when the needle appears in `section_heading`, `title`, or the first 400 characters of `retrieval_text` — not heading-only. That is enough for this experiment; a later eval can require true section-boundary accuracy (metadata heading / chunk identity only).

Abstention and unsupported-question handling belong to the later grounded-generation experiment, not this retrieval eval.

## Fixture inventory (cross-repo expansion)

| Category                                      | Count | Ids                                                                                                                                                                                                            |
| --------------------------------------------- | ----- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Baseline regression (`baseline_positive_ids`) | 6     | `experimentation-infrastructure` … `developer-infrastructure`                                                                                                                                                  |
| Additional scored positives                   | 6     | `admin-hub-experimentation`, `cross-flow-attribution-depth`, `cursor-team-marketplace`, `savepoints-architecture`, `codenames-validation-pipeline`, `agent-memory-corpus-gap` (reclassified from `corpus_gap`) |
| Diagnostic                                    | 1     | `nuclear-reactor-negative-inspection`                                                                                                                                                                          |

Acceptance record: [cross-repository-corpus-eval-findings.md](../../../docs/assistant/cross-repository-corpus-eval-findings.md).
