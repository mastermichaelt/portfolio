---
name: Assistant maintenance mode
overview: Temporarily disable public assistant generation with a reversible server-side flag, maintenance UX on /assistant, and HTTP 503 on POST /api/assistant/generate while preserving data and operator tooling.
todos:
  - id: maintenance-mode
    content: "PR: feature flag, 503 API guard, maintenance page, tests, docs"
    status: pending
  - id: plan-closure
    content: "Docs-only PR after maintenance-mode merges — # Shipped note, archive plan"
    status: pending
isProject: false
---

# Assistant maintenance mode

## Parent plan

|                         |                                                                                                |
| ----------------------- | ---------------------------------------------------------------------------------------------- |
| **Parent roadmap**      | [2026-10-30-assistant-roadmap.plan.md](./2026-10-30-assistant-roadmap.plan.md)                 |
| **Phase**               | **0** — Maintenance mode                                                                       |
| **Phase objective**     | Temporarily disable public generation; preserve data and operator tooling.                     |
| **Entry criteria**      | Roadmap adopted; operator approves public-off policy.                                          |
| **Dependencies**        | None (first active implementation phase).                                                      |
| **Completion criteria** | `maintenance-mode` (+ optional `plan-closure`) slices done; roadmap Phase 0 exit criteria met. |

**Goal:** Stop public generation without destroying Neon retrieval data, evaluation history, or dev/CI tooling.

## Recommended execution authority

| Slice            | Recommended authority | Agent instruction                        |
| ---------------- | --------------------- | ---------------------------------------- |
| maintenance-mode | Open PR only          | Do not merge. Stop after opening the PR. |
| plan-closure     | Open PR only          | Do not merge. Stop after opening the PR. |

Repo default: **Open PR only** ([planning-standards.md](../standards/planning-standards.md#repo-default-when-no-plan-slice-applies)).

## Repository topology (default)

Integration branch **`main`**. Fresh branch from `origin/main`; PR base **`main`**; diff contains only this slice.

---

## Slice — maintenance-mode

**Recommended authority:** Open PR only

**Rationale:**

- Small, reversible product gate before consolidation work.
- No schema or ingest changes.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Goal:**

- **`/assistant`:** Render a clear maintenance message (no working composer that hits production generation, or composer disabled with explanation — pick one coherent UX).
- **`POST /api/assistant/generate`:** Return **HTTP 503** with a stable, safe error body when maintenance is active (reuse existing error envelope patterns in `lib/assistant/api/errors.ts` where possible).
- **Server-side gate only:** Env-driven flag (e.g. `ASSISTANT_PUBLIC_ENABLED=false` or dedicated `ASSISTANT_MAINTENANCE_MODE=true`) checked in the API handler **before** pool creation / generation — no client-only bypass.
- **Preserve:** `DATABASE_URL` data, evaluation table, ingest/retrieve/DB scripts, Vitest suites (adjust tests that expect live generation on the public route when flag is set in test env).
- **Avoid:** Unrelated route changes; deleting evaluation rows; disabling operator CLIs.

**Likely touchpoints (implementation guidance, not mandatory paths):**

- `lib/assistant/api/config.ts` — parse maintenance flag alongside existing API config.
- `lib/assistant/api/handle-generate-post.ts` — early 503 return.
- `app/(site)/assistant/page.tsx` / `AssistantExperience` — maintenance branch.
- `.env.example` — document flag.
- `docs/assistant/assistant-database.md` or short `docs/assistant/maintenance-mode.md` — operator toggle instructions.
- Tests: `tests/assistant-generation-api.test.ts`, UI test if maintenance UI added.

**Acceptance:**

- With maintenance flag **on:** POST returns **503**; public page shows maintenance (no successful generation).
- With flag **off:** Current behavior unchanged (regression tests pass).
- Re-enable requires env/config change only — no code revert.
- `npm run lint`, `npm run typecheck`, `npm test`, `npm run build` pass.

**Verification:**

```bash
npm run lint && npm run typecheck && npm test && npm run build
```

Manual: toggle flag locally; curl POST `/api/assistant/generate`; load `/assistant`.

**Rollback:** Revert PR or set flag off in Vercel env.

**Compatibility risks:** Preview/production env must set flag before deploy if simultaneous code+config rollout; document order (config first vs code first) in PR description.

---

## Slice — plan-closure

**Recommended authority:** Open PR only

**Rationale:**

- Docs-only archival after Phase 0 implementation merges; keeps active `.cursor/plans/` limited to in-progress work.

**Agent instruction:** Do not merge. Stop after opening the PR.

**Prerequisites:** `maintenance-mode` merged.

**Deliverables:** `# Shipped` note; move to `.cursor/plans/archive/2026-10-30-assistant-00-maintenance-mode.plan.md`; mark `plan-closure` completed; update [2026-10-30-assistant-roadmap.plan.md](./2026-10-30-assistant-roadmap.plan.md) Phase 0 status.

---

## Agent prompts (copy/paste for Cursor)

### maintenance-mode

```text
@.cursor/plans/2026-10-30-assistant-00-maintenance-mode.plan.md

Implement slice maintenance-mode only. Do not start plan-closure. Do not begin Phase 1 (#107) or TypeScript consolidation in this PR.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: reversible server-side maintenance flag; HTTP 503 on POST /api/assistant/generate when disabled; maintenance UX on /assistant; tests and .env.example/docs updates per plan. Mark maintenance-mode completed in plan frontmatter in this PR.

Verification: npm run lint, typecheck, test, build; manual flag toggle check described in PR.
```

### plan-closure

```text
@.cursor/plans/2026-10-30-assistant-00-maintenance-mode.plan.md

Execute only plan-closure.

Authority: Open PR only — docs-only; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Prerequisites: maintenance-mode merged and marked completed.

Deliverables: # Shipped note; archive plan; update 2026-10-30-assistant-roadmap.plan.md Phase 0; mark plan-closure completed.

Verification: npm run validate:plans (or CI Validate plans job equivalent).
```
