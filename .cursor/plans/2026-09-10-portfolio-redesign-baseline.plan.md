---
name: Portfolio redesign baseline
overview: Pre-redesign read-only audit — produce docs/redesign-baseline.md from portfolio content and wider workspace evidence before Claude Design exploration. No PRODUCT.md or DESIGN.md changes in the audit slice.
todos:
  - id: plan-review
    content: "Plan-only PR — commit plan artifact and open PR for review; do not implement"
    status: completed
  - id: baseline-audit
    content: "PR: Write docs/redesign-baseline.md (7-section audit + provenance); no production content changes"
    status: completed
  - id: plan-closure
    content: "Docs-only PR after baseline-audit merges: add # Shipped note, move plan to .cursor/plans/archive/2026-09-10-portfolio-redesign-baseline.plan.md"
    status: pending
isProject: false
---

# Portfolio pre-redesign baseline audit

## Recommended execution authority

| Slice          | Recommended authority | Agent instruction                                      |
| -------------- | --------------------- | ------------------------------------------------------ |
| plan-review    | Plan-only PR          | Do not implement. Stop after opening the plan-only PR. |
| baseline-audit | Open PR only          | Do not merge. Stop after opening the PR.               |
| plan-closure   | Open PR only          | Do not merge. Stop after opening the PR.               |

Repo default: **Open PR only** ([planning-standards.md](../standards/planning-standards.md#repo-default-when-no-plan-slice-applies)).

## Repository topology (default)

The integration branch is `main`. Each slice starts from latest `origin/main`. The PR branch must represent only that slice; previous work arrives through merged `main`, not branch ancestry. PR base must be `main`.

---

## Goal

Produce a durable [`docs/redesign-baseline.md`](../../docs/redesign-baseline.md) that captures:

1. What the portfolio communicates today
2. Credible evidence in sibling workspace repos that is absent, compressed, or underrepresented
3. Product truth vs replaceable design decisions
4. Strengths, weaknesses, and open redesign questions (including distillation/removal)

**Out of scope for the audit slice:** visual direction, PRODUCT.md / DESIGN.md edits, `content/*` changes, implementation of redesign.

## Provenance labels (required in baseline doc)

- **On portfolio** — committed portfolio files
- **External evidence** — sibling repo + path (+ fact ID for quantitative claims)
- **Auditor interpretation** — inference only, never presented as fact

## Quantitative evidence rule (required in baseline doc)

> For quantitative evidence, preserve the source's exact scope, timeframe, attribution and confidence/qualification. Do not promote shorthand from this plan into the baseline without re-reading the authoritative fact source.

When the baseline cites a number, include fact module path, fact ID, and the source's own wording/qualifiers.

## Workspace repos to inspect (read-only)

| Repo                      | Role in audit                                            |
| ------------------------- | -------------------------------------------------------- |
| `portfolio`               | Product under redesign — full site review                |
| `resumes`                 | Career facts, roles, stories, application positioning    |
| `editorial-workflow`      | Published field reports, editorial pipeline, skills      |
| `codenames-ai-guesser`    | Codenames product/architecture/agent workflows           |
| `renovate-workflow`       | Renovate ladder implementation                           |
| `savepoints`              | Prototype learning capture (deferred from portfolio MVP) |
| `cursor-team-marketplace` | Cross-cutting harness (team-harness)                     |

External surface: DEV.to profile (`https://dev.to/michaeltruong`) — pinned posts and profile copy (screenshot 2026-09-10).

---

## Plan review (plan-only PR)

**Recommended authority:** Plan-only PR

**Rationale:**

- Audit scope spans multiple repos; plan must be reviewed before writing `docs/redesign-baseline.md`
- Expected diff is plan artifact only

**Agent instruction:** Do not implement. Stop after opening the plan-only PR.

**Delivered:** This plan file.

---

## Slice — baseline-audit

**Recommended authority:** Open PR only

**Rationale:**

- Docs-only deliverable; merge-safe without production behavior changes
- No PRODUCT.md / DESIGN.md / content module edits

**Agent instruction:** Do not merge. Stop after opening the PR.

**Goal:** Write `docs/redesign-baseline.md` with seven sections:

### 1. Current portfolio baseline

Document IA/navigation, first-viewport positioning, audiences, represented content, strongest case-study evidence, visitor journeys/CTAs, and **technical qualities/constraints to account for** — distinguish durable constraints (static-first, evidence discipline, CI gates) from replaceable implementation (specific breakpoints, CSS approach, motion implementation).

Key portfolio sources: `app/*`, `content/*`, `components/*`, `PRODUCT.md`, `DESIGN.md`, `docs/design-system.md`, tests/e2e.

### 2. Wider evidence inventory

Index credible material outside portfolio with `repo/path` provenance. Domains:

- Career / Atlassian / AIM (`resumes/roles/`, `resumes/facts/`, `resumes/stories/`)
- Codenames depth (`codenames-ai-guesser/docs/`)
- Editorial / writing (`editorial-workflow/docs/dev.to/published/`, skills, runbook)
- DEV.to public profile and pinned posts (external; note curation vs portfolio featured vs full corpus)
- Renovate governance (`renovate-workflow/docs/`)
- Agent harness / Savepoints / team-harness

Do not mechanically copy sibling prose into portfolio recommendations.

### 3. Product truth

Facts, audiences, capabilities, and constraints that should survive redesign (from PRODUCT.md, content policy, architecture overview).

### 4. Current design decisions

Replaceable IA, hierarchy, visual, and interaction choices.

### 5. Current strengths

What redesign should not lose.

### 6. Current weaknesses and opportunities

Label rows as on-portfolio fact vs auditor interpretation. Include known gaps: 9 vs 15 articles, DEV pinned ≠ portfolio featured, timeline stub, cross-linking underused, etc.

### 7. Redesign questions

Include **addition/promotion** and **removal/distillation** — which routes, content, or concepts should be cut if stronger evidence replaces them?

**Acceptance:**

- Single new file: `docs/redesign-baseline.md`
- No edits to PRODUCT.md, DESIGN.md, or `content/*`
- All quantitative claims traceable to authoritative sources
- Mark `baseline-audit` completed in plan frontmatter in the same PR

**Verification:**

- Docs-only diff
- `npm run lint` / `npm run typecheck` N/A or green (no code changes expected)

---

## Plan closure (docs-only PR)

**Recommended authority:** Open PR only

After `baseline-audit` merges:

1. Verify `baseline-audit` marked `completed`
2. Add `# Shipped` closure note
3. Move this file to `.cursor/plans/archive/2026-09-10-portfolio-redesign-baseline.plan.md`
4. Mark `plan-closure` completed

---

## Agent prompts (copy/paste for Cursor)

### plan-review

```text
@.cursor/plans/2026-09-10-portfolio-redesign-baseline.plan.md

Execute only plan-review. Do not start baseline-audit or later slices.

Authority: Plan-only PR — commit the plan artifact only; do not implement. Stop after opening the plan-only PR.

Topology: start from latest origin/main; branch represents only the plan artifact; PR base must be main.

Deliverables: plan file under .cursor/plans/; mark plan-review completed in frontmatter in the same PR.

Verification: plan satisfies repo planning standards; no implementation changes included.
```

### baseline-audit

```text
@.cursor/plans/2026-09-10-portfolio-redesign-baseline.plan.md

Implement slice baseline-audit only. Do not start plan-closure. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Scope: Write docs/redesign-baseline.md only. Do not modify PRODUCT.md, DESIGN.md, or content/*. Read-only audit across portfolio and sibling workspace repos (resumes, editorial-workflow, codenames-ai-guesser, renovate-workflow, savepoints, cursor-team-marketplace). Include DEV.to profile/pinned-post evidence as external surface.

Deliverables: docs/redesign-baseline.md with 7 sections, provenance labels, quantitative evidence rule, technical qualities/constraints framing, distillation questions in §7. Mark baseline-audit completed in plan frontmatter in this PR.

Verification: docs-only diff; quantitative claims cite fact module + fact ID + source qualification; no invented metrics.
```

### plan-closure

```text
@.cursor/plans/2026-09-10-portfolio-redesign-baseline.plan.md

Execute only plan-closure.

Authority: Open PR only — docs-only archive PR; do not merge.

Prerequisites: baseline-audit merged and marked completed in frontmatter.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: verify slice todos, add # Shipped note, move plan to .cursor/plans/archive/2026-09-10-portfolio-redesign-baseline.plan.md, mark plan-closure completed, update agent prompt references to the archived path.

Verification: confirm baseline-audit PR is merged before archiving.
```

---

## Audit specification (reference for baseline-audit slice)

The sections below summarize research conducted during plan authoring. **Retrieval notes only** — the baseline-audit agent must re-verify against live files and re-read fact sources before citing numbers.

### Current portfolio snapshot (on portfolio)

| Route              | Role                                             |
| ------------------ | ------------------------------------------------ |
| `/`                | Hero + 2 featured projects + 3 featured articles |
| `/projects`        | All 4 case studies                               |
| `/projects/[slug]` | Case study + sticky TOC                          |
| `/articles`        | DEV archive (external links)                     |
| `/ecosystem`       | React Flow canvases + entity inventory           |
| `/about`           | Bio, contact, skill clusters                     |

Nav: Home, Projects, Articles, Ecosystem, About + Contact CTA → `/about`.

Projects: `codenames-ai`, `editorial-workflow` (featured); `resume-generator`, `renovate-governance` (not featured).

Articles in `content/articles.ts`: 9 entries. Editorial hub corpus: 15 published markdown files.

Ecosystem: 24 entities, 4 workflow canvases; `timelineEvents` empty stub.

First-viewport copy from `content/profile.ts`: Atlassian (Growth SWE + EM + Atlassians in Mentoring) + production AI systems + DEV field reports.

### DEV.to curation tension (external evidence)

Three layers do not align: DEV pinned (5), portfolio homepage featured (3), full hub corpus (15). Portfolio featured (model-experiments, evidence-driven-upgrades, reviewers-23/25) overlaps zero DEV pins. Two DEV pins (persist-game-state, agent-portability) missing from portfolio article inventory.

DEV profile positioning differs from portfolio bio ("AI retraining journey", AI Product Engineer, michaeltruong.dev website link).

### Wider evidence index (external — re-read sources)

| Domain                 | Key paths                                                                                                                                        |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| Atlassian career       | `resumes/roles/atlassian-*.yml`, `resumes/facts/em-growth-delivery.yml`, `resumes/facts/loom-*.yml`, `resumes/facts/post-office-ml-surfaces.yml` |
| AIM program            | `resumes/facts/aim-*.yml`                                                                                                                        |
| Interview stories      | `resumes/stories/*.yml`                                                                                                                          |
| Codenames architecture | `codenames-ai-guesser/docs/judge-ai-validation-flow.md`, `docs/ai-pipeline-outcome.md`, `docs/analytics-workflow.md`                             |
| Editorial pipeline     | `editorial-workflow/docs/editorial-workflow.md`, `.cursor/skills/editor-*/SKILL.md`                                                              |
| Renovate ladder        | `renovate-workflow/docs/renovate-workflow.md`, `docs/distribution-discovery.md`                                                                  |
| Harness / Savepoints   | `cursor-team-marketplace/README.md`, `savepoints/notes/architecture-direction.md`                                                                |
| Resume builder         | `resumes/AGENTS.md`, `.cursor/rules/facts-vs-prose.mdc`                                                                                          |

### Distillation candidates (§7 — do not decide in audit)

Articles route vs integrated writing; Ecosystem nav tier; entity inventory vs canvases only; About/Contact duplication; timeline stub; resume-generator visibility; four-project parity; Trusted Member prominence; hero systems diagram.
