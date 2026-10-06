---
type: Runbook Section
title: Renovate PR workflow — automation and policy summary
resource: "https://raw.githubusercontent.com/multipliers-dev/renovate-workflow/main/docs/renovate-workflow.md"
sources:
  - id: "renovate-workflow-runbook"
    title: Renovate PR workflow — automation and policy summary
    resource: "https://raw.githubusercontent.com/multipliers-dev/renovate-workflow/main/docs/renovate-workflow.md"
generated:
  by: "process:portfolio-okf-producer"
tags:
  - "renovate-workflow"
  - repo
  - automation
  - policy
---

To run classify → route → execute without copy/paste between steps, use **`/renovate-loop`** ([`renovate-loop` skill](../skills/renovate-loop/SKILL.md)).

The orchestrator:

- Syncs local `main` to `origin/main` at the start of **every** iteration
- Delegates classification to `/renovate-classifier`
- Routes packets: **maintainer auto path** (`stop: false`), **investigation lane** (investigation-eligible `stop: true`), or **hard stop**
- On the auto path, delegates to the [maintainer agent](../.agents/renovate-maintainer.md) and continues **only** after a successful completed merge
- On the investigation lane, delegates to the [investigator agent](../.agents/renovate-investigator.md) and **stops** — human gate is `/renovate-maintainer --approved` in a fresh chat (loop never passes `--approved`)
- Stops on any classifier hard stop, maintainer hard stop, or iteration fuse

Supported invocations:

- `/renovate-loop` — normal classify → route loop; auto-path packets continue after merge, investigation-lane packets stop after investigator (human `--approved` step is separate)
- `/renovate-loop --babysit` — same routing as normal loop, plus helper-backed post-update GitHub settling and required PR CI completion
- `/renovate-loop dry-run` — one classify pass (FIFO queue overview + routing: `dry_run_complete`, `investigation_complete`, or hard-stop tag) without invoking maintainer or investigator

`--babysit` is supported only with the normal loop invocation. It does not expand merge authority; after a successful `gh pr update-branch`, the classifier invokes `scripts/renovate-freshness-poll.ts` to wait for a terminal result. Only `outcome: "clean"` can produce a packet, and the packet must use the helper's returned `headSha`. `--babysit` does **not** wait on pre-update §2.6 `UNKNOWN` — only post-update settling per classifier §2.7.

Manual verification checklist: [`skills/renovate-loop/verification.md`](../skills/renovate-loop/verification.md). Loop summaries: `.agent-runs/renovate/loop-{YYYY-MM-DD}.md` (gitignored).

This is **not** scheduled automation (cron, webhooks) — invoke only when you intend to process the Renovate queue in one session.

---

## What each recommendation means

| Classifier says     | You do                                                                |
| ------------------- | --------------------------------------------------------------------- |
| **merge**           | Maintainer auto path; agent may merge if checks pass                  |
| **review manually** | Auto path if `stop: false`; investigation lane if eligible high-touch |
| **defer**           | Leave open; revisit later                                             |

---
