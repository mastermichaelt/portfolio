<!--
To generate this PR description with Cursor:

"Prepare the PR description in raw markdown using `.github/pull_request_template.md`.
Base it on the current git diff, relevant docs, and test results.
Return it inside a single ```md fenced block."
-->

## Summary

<!-- What changed and why. Link related docs or plan sections. Note scope boundaries: what this PR includes and explicitly does not include. -->

-

## Execution authority

<!-- Pick one. Repo default when unspecified: Open PR only. -->

- [ ] **Plan-only PR** — planning artifact only; implementation not started.
- [ ] **Open PR only** — implementation in this PR; do not merge.
- [ ] **Merge granted** — explicit with rationale from the committed plan slice **or** the user’s instruction for this unplanned task; branch protection remains final gate.

Agents must not merge unless **Merge granted** is explicitly selected with rationale. Branch protection and human review remain the final enforcement boundary.

## Test plan

<!-- Check off what you ran. Docs-only: mark N/A where applicable. -->

- [ ] `npm run lint`
- [ ] `npm run format:check`
- [ ] `npm run typecheck`
- [ ] `npm run test` / `npm run test:coverage`
- [ ] `npm run build`
- [ ] GitHub Actions CI green on branch
- [ ] Manual / preview verification (if applicable):
- [ ] Other:

## Rollback criteria

<!-- Concrete symptoms that mean this PR should be reverted. -->

Revert if:
