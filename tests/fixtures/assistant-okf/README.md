# Assistant OKF experiment fixtures

Representative **test inputs** for repo and DEV producers in the OKF normalization experiment. These are not the assistant's persisted corpus and are not refreshed by an ingestion pipeline.

| File                                     | Represents                                        |
| ---------------------------------------- | ------------------------------------------------- |
| `renovate-workflow.md`                   | Repo runbook excerpt (Renovate governance ladder) |
| `evidence-driven-dependency-upgrades.md` | Published DEV field report with YAML frontmatter  |

Portfolio normalization reads canonical in-repo `content/` directly — no portfolio fixture here.

Update fixtures only when producer tests need a new representative sample; record the upstream origin in the commit message.
