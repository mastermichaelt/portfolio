---
type: Runbook Section
title: Renovate PR workflow — prerequisites
resource: "https://raw.githubusercontent.com/multipliers-dev/renovate-workflow/main/docs/renovate-workflow.md"
sources:
  - id: "renovate-workflow-runbook"
    title: Renovate PR workflow — prerequisites
    resource: "https://raw.githubusercontent.com/multipliers-dev/renovate-workflow/main/docs/renovate-workflow.md"
generated:
  by: "process:portfolio-okf-producer"
tags:
  - "renovate-workflow"
  - repo
  - prerequisites
---

1. **GitHub MCP or authenticated `gh` CLI (operator credential)** — required when classifying or executing Renovate PRs. This is your Cursor MCP token or `gh auth`, not the Renovate bot Actions secret.
   - **MCP (preferred in packet workflow):** read-only endpoint for classifier (`https://api.githubcopilot.com/mcp/readonly`); maintainer needs merge tools (write access).
   - **`gh` fallback:** read-only for most classifier steps; classifier also needs **write** access for `gh pr update-branch` when a PR is `BEHIND`; maintainer may use `gh pr merge --merge` when all gates pass (see merge authority guard below). This repo allows **merge commits only** — never `--squash` or `--rebase`.
2. **Classic `repo` PAT (operator MCP / `gh`)** — use for Checks API (`get_check_runs` / `gh pr checks`) on this path; fine-grained PATs used here returned `403` for `get_check_runs`. Configure in `~/.cursor/mcp.json` or via authenticated `gh`; this is separate from `secrets.RENOVATE_TOKEN`.
3. **Renovate bot token (`pat_branch`)** — a separate GitHub Actions secret `RENOVATE_TOKEN` for self-hosted Renovate. A fine-grained PAT with Contents, Pull requests, Issues, Actions, and Workflows write (org repos as needed) is sufficient; classic `repo` scope is optional for the bot.
4. **Cursor Agent mode** for the maintainer step (fresh chat per PR).

After updating MCP tokens or `gh` auth, fully quit and restart Cursor if needed.

**Merge authority guard:** `gh pr merge` is allowed only when the plan or runbook already grants merge authority (Renovate maintainer agent invoked with a valid packet and all pre-merge gates satisfied). This change does **not** expand merge authority — it is a transport fallback for the same gated merge step, not a new permission to merge from generic agent sessions or Open PR only slices.

---
