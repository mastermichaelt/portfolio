---
type: Runbook Section
title: Renovate PR workflow — operator ladder
resource: "https://raw.githubusercontent.com/multipliers-dev/renovate-workflow/main/docs/renovate-workflow.md"
sources:
  - id: "renovate-workflow-runbook"
    title: Renovate PR workflow — operator ladder
    resource: "https://raw.githubusercontent.com/multipliers-dev/renovate-workflow/main/docs/renovate-workflow.md"
generated:
  by: "process:portfolio-okf-producer"
tags:
  - "renovate-workflow"
  - repo
  - workflow
---

Work **one PR per classify run**. Route by packet shape after classification. Repeat until the **active (non-draft)** queue is clear (`queue_empty`) or only deferred/manual items remain. Parked drafts may still be open — that is a human backlog, not “done.”

### Parked drafts (operator lifecycle)

Use draft state to park a Renovate PR that should not enter the ladder yet (for example, an ecosystem-wide major upgrade blocked on upstream compatibility).

- **Park** — Convert the PR to draft, document why it is parked, and record the unblock criteria (reason and unblock condition may differ). Prefer draft over closing when the intent is “resume later,” because closing may suppress future Renovate attempts depending on repository configuration.
- **Loop / classifier** — Drafts are reported in discovery reconciliation but are not selectable. `/renovate-loop` and FIFO skip them until **Ready for review**. Drafts-only ⇒ `queue_empty` (active queue clear), not “no migration work left.” Draft FIFO for readiness triage lives in `/renovate-draft-readiness` (below); the active classify/loop queue is unchanged.
- **Draft readiness** — Run `/renovate-draft-readiness` (or `/renovate-draft-readiness <PR>` for an explicit draft) to assess one parked draft Renovate PR and **always refresh** its managed GitHub readiness comment (`<!-- renovate-draft-readiness -->`). Orthogonal to the merge ladder: it does **not** unpark, merge, approve, close, or update/rebase the branch, and it does **not** emit classifier packets or feed maintainer/investigator. There is no dry-run mode — comment publication is the skill. Skill: [`renovate-draft-readiness`](../skills/renovate-draft-readiness/SKILL.md).
- **Unpark** — Mark **Ready for review** (human). The PR immediately re-enters the active queue. It can then be processed normally via `/renovate-loop` (FIFO) or selected explicitly with `/renovate-classifier <PR>`. Expect the normal route for that PR’s risk class (often investigation / hard stop for high-touch majors) — not the auto-merge path by default. Eligibility is controlled by draft state, not operator memory. A `ready_to_unpark` verdict from draft-readiness is a recommendation only.
- Do **not** ask the ladder to analyze or merge while the PR is draft.

### 1. Classify (one PR)

Run `/renovate-classifier` for the next FIFO Renovate PR, or `/renovate-classifier {N}` for a specific PR in the active (non-draft) Renovate set.

You get:

- **Discovery reconciliation** — active (non-draft) Renovate queue plus draft skips
- **Queue overview** — which PR was selected and what remains
- **Base freshness** block (and branch update if the PR was `BEHIND`)
- A **one-row summary table**
- **Detailed notes** for the selected PR only
- **One execution packet** (YAML) with `stop_causes` when `stop: true`
- A **handoff prompt** — maintainer (auto path), investigator (investigation lane), or none (hard stop)

### 2. Route

| Packet                                   | Next step                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------- |
| `stop: false`                            | **Maintainer auto path** — copy packet → fresh chat with maintainer agent |
| `stop: true`, investigation-eligible     | **Investigation lane** — copy packet → fresh chat with investigator agent |
| `stop: true`, not investigation-eligible | **Hard stop** — review on GitHub; no maintainer or investigator handoff   |
| `defer`                                  | Leave open; no handoff                                                    |

Investigation eligibility is determined by [`evaluateInvestigationEligibility`](../scripts/lib/renovate-investigation-eligibility.ts) and policy `execution_modes.investigation_approved` in [`.agents/renovate-policy.yml`](../.agents/renovate-policy.yml). Typical eligible cases: high-touch tooling or unlisted package with only overridable classifier stops (e.g. sole or combined `runtime_behavior_affected`, `lockfile_threshold_exceeded`, or the human-required pair alone). The 800-line lockfile threshold remains a hard auto-merge signal; investigation-approved execution with human `--approved` may suppress `triggered_lockfile_threshold_exceeded` when policy lists it as overridable. Dependency-only `allowed_paths` gate investigation-approved merge, not investigation routing.

### 3a. Execute — maintainer auto path

Open a **fresh Agent-mode chat**. Paste the prompt from [`.agents/renovate-maintainer.md` § Copy/paste prompt](../.agents/renovate-maintainer.md#copypaste-prompt), for example:

```
@.agents/renovate-maintainer.md

Execute for PR #{N}. Input packet (YAML):
---BEGIN PACKET---
(paste packet from renovate-classifier)
---END PACKET---

Merge only if merge_authority conditions are satisfied.
Stop if policy_version differs from renovate-policy.yml at preflight or immediately before merge, if head_sha differs from live PR at preflight or immediately before merge, if mergeStateStatus is BEHIND at preflight, if triggered_human_required is non-empty, or if any human_required_if watch condition becomes true during inspection.
Write run report to .agent-runs/renovate/{date}-pr-{N}.md using .agents/templates/renovate-run-report.md
```

The agent re-fetches the PR, runs pre-merge checks, and either merges or stops.

### 3b. Investigate — investigation lane

Open a **fresh Agent-mode chat**. Paste the prompt from [`.agents/renovate-investigator.md` § Copy/paste prompt](../.agents/renovate-investigator.md#copypaste-prompt):

```
@.agents/renovate-investigator.md

Investigate PR #{N} using the classifier packet below.
Follow renovate-investigator SKILL.md, investigation-checklist.md, and investigation-rubric.md.
Write the investigation report to .agent-runs/renovate/{date}-pr-{N}-investigation.md using .agents/templates/renovate-investigation-report.md.
When verdict is ready_for_human_merge, emit the production-executable declarative execution overlay YAML in chat (normal invocation only).
Do not merge. Do not approve or comment on the PR. Do not invoke maintainer.

---BEGIN PACKET---
(paste classifier execution packet YAML)
---END PACKET---
```

The investigator writes a gitignored report. When verdict is `ready_for_human_merge`, it emits an execution overlay in chat.

### 4. Human gate — investigation-approved merge

**Manual only** — audit the investigation report. When satisfied, open a **fresh Agent-mode chat** with `/renovate-maintainer --approved`, the **same classifier packet**, and the **investigator overlay** (see [renovate-maintainer SKILL.md](../skills/renovate-maintainer/SKILL.md)). The loop and investigator **never** pass `--approved`.

### 5. Review the outcome

- **Merged (auto or investigation-approved path)** — agent confirms post-merge main CI; check the local run report.
- **Investigation verdict not ready** — handle per report (`needs_migration`, `inconclusive`, etc.) on GitHub.
- **Stopped** — handle that PR on GitHub (review, fix, merge manually, or leave open).

Run reports: `.agent-runs/renovate/{date}-pr-{N}.md` (maintainer). Investigation reports: `.agent-runs/renovate/{date}-pr-{N}-investigation.md` (investigator). Both are gitignored.

### 6. Next item

Re-run `/renovate-classifier` to classify the next FIFO Renovate PR (no argument needed unless you want a specific number).

---

Pairs with portfolio blocks on merge authority and investigation lanes: [Constraints](/portfolio/renovate-governance-b04-constraints.md), [Operation](/portfolio/renovate-governance-b05-operation.md).
