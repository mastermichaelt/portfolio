---
type: Runbook Section
title: Renovate PR workflow — troubleshooting
resource: "https://raw.githubusercontent.com/multipliers-dev/renovate-workflow/main/docs/renovate-workflow.md"
sources:
  - id: "renovate-workflow-runbook"
    title: Renovate PR workflow — troubleshooting
    resource: "https://raw.githubusercontent.com/multipliers-dev/renovate-workflow/main/docs/renovate-workflow.md"
generated:
  by: "process:portfolio-okf-producer"
tags:
  - "renovate-workflow"
  - repo
  - troubleshooting
---

Re-run `/renovate-classifier` to refresh the packet when:

- **`head_sha` changed** — new commits landed on the PR after classification
- **`mergeStateStatus: BEHIND` at maintainer preflight** — `main` moved after classification (e.g. another Renovate PR merged). Re-run classify; the classifier runs `gh pr update-branch` when appropriate.
- **`policy_version` drift** — [`.agents/renovate-policy.yml`](../.agents/renovate-policy.yml) was updated since classification
- **`triggered_human_required` is non-empty** — classifier already flagged a hard stop (e.g. large lockfile, unexplained CI failure)
- **CI not green** or a **pre-merge check** fails (lockfile threshold, workflow pin rules, etc.)

### Classifier stops before a packet

GitHub computes mergeability asynchronously. Immediately after changes to the base branch, `mergeStateStatus` may temporarily be `UNKNOWN` until GitHub finishes recomputing the merge result.

| Situation                                                  | What to do                                                                                                                                                                                                                                                                                                                                                                                                     |
| ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| PR is `BEHIND` and `gh pr update-branch` fails (conflicts) | Resolve conflicts on GitHub or locally, then re-run `/renovate-classifier`                                                                                                                                                                                                                                                                                                                                     |
| Readonly MCP only and PR is `BEHIND`                       | Authenticate `gh` with repo write access, or update branch manually on GitHub, then re-run                                                                                                                                                                                                                                                                                                                     |
| **Pre-update** `UNKNOWN` at §2.6 (no branch update yet)    | Wait for GitHub to finish computing mergeability (often immediately after `main` moves). Open the PR on GitHub or run `gh pr view <N> --json mergeStateStatus,mergeable`. When `mergeStateStatus` becomes `CLEAN` or `BEHIND`, re-run `/renovate-classifier` or `/renovate-loop --babysit`. If `mergeStateStatus` becomes `BLOCKED` or `DIRTY`, or `mergeable` is `CONFLICTING`, resolve those blockers first. |
| **Post-update** `UNKNOWN` with `--babysit`                 | Helper polls (up to 3 consecutive `UNKNOWN`, 10s interval); if `unknown_exhausted`, wait and re-run.                                                                                                                                                                                                                                                                                                           |
| `mergeStateStatus` BLOCKED / DIRTY                         | Fix merge blockers on GitHub; do not force analysis                                                                                                                                                                                                                                                                                                                                                            |
| `--babysit` helper stops after branch update               | Use the reported helper outcome (`unknown_exhausted`, `budget_exhausted`, `merge_query_failed`, `ci_query_failed`, `ci_failed`, `non_clean`, or `head_changed`) to decide whether to wait, fix CI, update the branch again, or review manually                                                                                                                                                                 |
| CI pending after branch update                             | Normal — rubric maps pending → review manually; maintainer waits for green CI                                                                                                                                                                                                                                                                                                                                  |
| Explicit PR not in active Renovate set                     | Check PR number; draft Renovate PRs are skipped until ready — use FIFO or pick a non-draft Renovate PR from the queue summary                                                                                                                                                                                                                                                                                  |

If the maintainer stops for ambiguity, default to **manual review** on GitHub.

---

Full rules live in consumer [`.agents/renovate-policy.yml`](../.agents/renovate-policy.template.yml) (facts) and portable interpretation [`.agents/policy-rubric.base.md`](../.agents/policy-rubric.base.md). Classifier entrypoint: [`policy-rubric.md`](../skills/renovate-classifier/policy-rubric.md).

| Category               | Examples                                                                                                                                                      |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Generally safe**     | Lockfile-only patches; low-risk devDependency patch/minor bumps; same-major GitHub Action `uses:` pin updates                                                 |
| **Agent review first** | Low-risk tooling **major** bumps (manifest + `package-lock.json` only)                                                                                        |
| **Human only**         | Runtime dependencies; auth/security; analytics/telemetry; large lockfile deltas; GitHub Action **major** bumps; `renovate.json` changes; sensitive path edits |

---
