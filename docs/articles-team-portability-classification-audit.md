# TEAM Portability classification audit (21 articles)

Content-first reassessment against published bodies in `editorial-workflow/docs/dev.to/published/`. Primary lesson = central argument and **Takeaway**, not techniques used along the way.

## Review table (all 21)

| Article                                                                  | Primary engineering lesson                                                                          | Current     | Proposed        | Rationale                                                                                                                        |
| ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------- | ----------- | --------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `ai-workflows-need-a-requirements-qa-stage`                              | Someone must judge whether requirements describe the product you wanted, not only whether CI passed | taste       | taste           | Takeaway contrasts implementation QA with product-intent QA; strongest fit Taste                                                 |
| `ai-changed-the-build-vs-buy-threshold`                                  | AI shifts when building in-house is rational versus buying                                          | taste       | taste           | Build-vs-buy and architecture commitment under deadline pressure                                                                 |
| `ai-made-translation-cheap-localization-still-needed-human-judgment`     | Decide what machinery deserves to become permanent product architecture                             | taste       | taste           | Takeaway: do not harden validators/workflows into the model without judgment                                                     |
| `the-retrieval-pipeline-worked-the-product-question-remained`            | Retrieval settings must serve the questions visitors actually ask                                   | evals       | **taste**       | Passing eval fixtures is backdrop; conclusion is product/question fit (top-k, index scope), not contract verification            |
| `one-example-beats-style-guide`                                          | Choose shipped writing that already sounds right as the voice spec instead of expanding rules       | evals       | **taste**       | Exemplar is the mechanism; lesson is editorial/product judgment about what “good” output looks like                              |
| `ai-reviewer-kinds-of-reasoning`                                         | Separate reviewer cognitive passes instead of one undifferentiated rubric                           | evals       | evals           | Central lesson is verification/review process design                                                                             |
| `reviewers-analysis-before-scoring`                                      | Move analysis before scoring so review checks the right thing                                       | evals       | evals           | Reviewer evaluation sequence; not product scope                                                                                  |
| `schema-first-valid-json-wasnt-enough`                                   | Domain contracts must enforce legality beyond parseable JSON                                        | evals       | evals           | Implementation correctness and validation contract                                                                               |
| `persist-game-state-not-ephemeral-ui-intent`                             | Reload must restore semantic truth; test behavior not just persistence                              | evals       | evals           | Verification of product semantics on restore                                                                                     |
| `model-experiments-architectural-stress-test`                            | Model swaps surface hidden architectural coupling through observed regressions and metrics          | evals       | **measurement** | Body: dashboards looked fine until a literal model exposed assumptions; experiment as operational diagnostic, not CI gate design |
| `we-made-our-agent-plans-portable-then-we-had-to-make-them-verifiable`   | Shared planning methodology drifts across repos until consistency is enforced                       | evals       | **portability** | Narrative arc is six-repo methodology transfer; CI validator supports portability rather than defining the lesson                |
| `agent-plans-authority-handoffs`                                         | Plans must document authority handoffs, not only implementation steps                               | authority   | authority       | Delegation and stop lines when agents can merge                                                                                  |
| `evidence-driven-dependency-upgrades`                                    | Upgrade ladder: investigate before deferring merges                                                 | authority   | authority       | Permitted change and merge governance with evidence packets                                                                      |
| `hook-availability-was-split-from-product-enforcement-after-silent-skip` | Configured hooks path ≠ runnable enforcement                                                        | authority   | authority       | Execution boundary and enforcement availability                                                                                  |
| `experiment-repos-need-first-class-retirement-semantics`                 | Retiring experiments needs explicit stop semantics and human verification                           | authority   | authority       | Stop conditions and allowed deletion surfaces                                                                                    |
| `the-agent-host-didnt-have-the-lifecycle-boundaries-i-assumed`           | Define lifecycle boundaries; do not infer them from host events                                     | authority   | authority       | Where agent work stops and what the host guarantees                                                                              |
| `active-players-which-sessions-counted`                                  | Distrust reassuring metrics; know what you instrumented                                             | measurement | measurement     | Production metric definition and behavioural signal                                                                              |
| `records-first-chart-second-the-sankey-disagreed`                        | Structured records before charts; validate process categories against reality                       | measurement | measurement     | Observational modelling of irregular process behaviour                                                                           |
| `agent-portability-does-not-require-centralizing-methodology-behind-mcp` | Split portability by ownership/lifecycle, not one MCP hub                                           | portability | portability     | Cross-project methodology placement                                                                                              |
| `cloud-agent-felt-like-hiring`                                           | Brief cloud agents with deliberate context crossing, not session continuation                       | portability | portability     | Environment transfer and delegation setup                                                                                        |
| `skills-should-own-capabilities-not-individual-actions`                  | Consolidate skills by owned capability, not one action per skill                                    | portability | portability     | Consistent agent capability boundaries across workflow                                                                           |

## Counts

| Stage                | Current | Proposed |
| -------------------- | ------: | -------: |
| Taste                |       3 |    **5** |
| Evals & Verification |       8 |    **4** |
| Authority            |       5 |        5 |
| Measurement          |       2 |    **3** |
| Portability          |       3 |    **4** |

## Changed classifications only

| Article                                                                | Before | After       | Rationale (short)                                        |
| ---------------------------------------------------------------------- | ------ | ----------- | -------------------------------------------------------- |
| `the-retrieval-pipeline-worked-the-product-question-remained`          | evals  | taste       | Visitor question fit, not verification mechanics         |
| `one-example-beats-style-guide`                                        | evals  | taste       | Judgment about the right voice spec                      |
| `model-experiments-architectural-stress-test`                          | evals  | measurement | Model experiment as behavioural/architectural diagnostic |
| `we-made-our-agent-plans-portable-then-we-had-to-make-them-verifiable` | evals  | portability | Cross-repo methodology consistency                       |

## Ambiguous cases

| Article                                                                | Proposed              | Why this beats the alternative                                                                                                                        |
| ---------------------------------------------------------------------- | --------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| `the-retrieval-pipeline-worked-the-product-question-remained`          | taste                 | Eval work appears, but the unresolved decision is **which visitor questions** the assistant must answer (product/index scope), not whether tests pass |
| `one-example-beats-style-guide`                                        | taste                 | Reads like eval calibration, but the takeaway is **stop rule sprawl** and anchor on writing you already accept as good                                |
| `model-experiments-architectural-stress-test`                          | measurement           | Validators appear, but the insight comes from **observed production-like regressions** when model capability changes, exposing masked coupling        |
| `we-made-our-agent-plans-portable-then-we-had-to-make-them-verifiable` | portability           | CI validation is the fix; the problem statement is **methodology drift across six repositories**                                                      |
| `evidence-driven-dependency-upgrades`                                  | authority (unchanged) | Uses evidence packets (eval-shaped) but teaches **when merges may proceed** on the ladder                                                             |
| `reviewers-analysis-before-scoring`                                    | evals (unchanged)     | Touches editorial judgment, but the fix is **review process order**, not product scope                                                                |

## Distribution assessment

Evals & Verification at **4** matches articles whose primary lesson is correctness machinery (reviewer stages, JSON/domain validation, reload semantics). Taste at **5** reflects several product-scope and editorial-judgment reports. Measurement at **3** covers metric definition, process observability, and model-migration diagnostics. Portability at **4** reflects cross-repo, cross-host, and cross-skill transfer work. Authority remains the largest band (5), consistent with governance-heavy field reports. The distribution is uneven by design, not by quota.
