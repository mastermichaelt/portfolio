# Portfolio redesign baseline

Read-only audit of the live portfolio and sibling-workspace evidence, written
before any `PRODUCT.md`, `DESIGN.md`, or `content/*` changes.

**Audit date:** 2026-09-11
**Plan:** [`.cursor/plans/archive/2026-09-10-portfolio-redesign-baseline.plan.md`](../.cursor/plans/archive/2026-09-10-portfolio-redesign-baseline.plan.md)
**Scope:** this file only. Retrieval notes in the plan were re-verified against
live files; numbers were re-read from authoritative sources, not copied from
plan shorthand.

## Provenance labels

Every claim in this document is labeled:

| Label                      | Meaning                                                                                   |
| -------------------------- | ----------------------------------------------------------------------------------------- |
| **On portfolio**           | Committed files in this repository (`content/`, `app/`, `PRODUCT.md`, tests, docs)        |
| **External evidence**      | Sibling checkout path, DEV.to profile/API, or both. Quantitative claims also name fact ID |
| **Auditor interpretation** | Inference or comparison only — never presented as a career or product fact                |

## Quantitative evidence rule

For quantitative evidence, preserve the source's exact scope, timeframe,
attribution, and confidence/qualification. Do not promote shorthand from the
plan into this baseline without re-reading the authoritative fact source.

When this document cites a number, it includes:

1. The fact module path (or the committed portfolio file that was counted)
2. The fact ID (for inventory metrics)
3. The source's own wording or qualifiers

Do not invent metrics. Do not collapse differently qualified counts into one
headline number.

---

## 1. Current portfolio baseline

### Information architecture and navigation

**On portfolio.** Desktop primary nav (`lib/nav.ts`) is Home, Projects,
Articles, Ecosystem, About. A Contact CTA in `components/SiteHeader.tsx` also
targets `/about`. Footer repeats the same five nav items plus GitHub.

Mobile (`SiteHeader.tsx`, e2e `mobile nav opens Contact and navigates`):
Home · Projects · Articles · Ecosystem + Contact. About is omitted from the
mobile link list; Contact is the `/about` destination.

| Route              | Role (from `app/*/page.tsx` + `README.md`)                           |
| ------------------ | -------------------------------------------------------------------- |
| `/`                | Hero + 2 featured projects + 3 featured articles                     |
| `/projects`        | All 4 case studies                                                   |
| `/projects/[slug]` | Case study + sticky TOC (`CaseStudyToc`)                             |
| `/articles`        | DEV archive (external `ExternalLink` rows) + Trusted Member sentence |
| `/ecosystem`       | 4 React Flow canvases + entity inventory                             |
| `/about`           | Bio, contact panel, skill clusters                                   |

No `/timeline` route. `PortfolioRepository.listTimelineEvents()` exists
(`repositories/portfolio-repository.ts`) and `content/timeline.ts` is an empty
stub (`timelineEvents: []`, comment: "Real content lands in a later PR"). No page
renders it.

### First-viewport positioning

**On portfolio** (`app/page.tsx`, `content/profile.ts`):

- Eyebrow: `Senior Software Engineer · Sydney, Australia`
- H1 brand mark: `Michael Truong`
- Lead bio: "Senior software engineer in Sydney. Previously at Atlassian across
  Growth (SWE and Engineering Manager) and Atlassians in Mentoring. Building
  production AI systems and publishing engineering field reports on DEV."
- Primary CTA: Browse projects → `/projects`
- Secondary CTA: About & contact → `/about`
- Right column: `SystemsDiagram` — live rendering of the ecosystem System
  overview spine (Projects → AI workflows → Governance & feedback → Evidence
  & outputs), linking to `/ecosystem` (`components/SystemsDiagram.tsx`)

Document title (`app/layout.tsx`, `app/page.tsx` metadata):
"Michael Truong · AI engineering systems". Meta description emphasizes production
AI systems, editorial workflows, and field reports — not Atlassian tenure.

### Audiences

**On portfolio** (`PRODUCT.md`):

- Primary: hiring managers, engineering leaders, and peer engineers evaluating
  Michael for senior software engineering roles — especially AI-enabled product
  and platform work
- Secondary: engineers exploring how production AI systems, agent workflows,
  and editorial tooling connect

Success criterion in `PRODUCT.md`: a visitor leaves with a clear mental model of
scope (production AI products, experimentation discipline, agent harness work)
and concrete links to proof.

### Represented content

**On portfolio**, counted from committed modules (2026-09-11):

| Inventory                  | Count | Source                                                                                                                                                |
| -------------------------- | ----- | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| Projects                   | 4     | `content/projects.ts` — slugs `codenames-ai`, `editorial-workflow`, `resume-generator`, `renovate-governance`                                         |
| Homepage featured projects | 2     | `featured: true` on Codenames + editorial; asserted in `tests/content-foundation.test.ts`                                                             |
| Articles                   | 9     | `content/articles.ts`                                                                                                                                 |
| Homepage featured articles | 3     | `featured: true` on model-experiments, evidence-driven-upgrades, reviewers-23/25; test caps featured at ≤3 and requires distinct `relatedProjectSlug` |
| Ecosystem entities         | 24    | `content/ecosystem.ts` `entities` array                                                                                                               |
| Workflow canvases          | 4     | `workflowViews`: `system-overview`, `workflow-renovate`, `workflow-editorial`, `workflow-product-loop`                                                |
| Timeline events            | 0     | `content/timeline.ts`                                                                                                                                 |

Project kinds (`content/projects.ts`): product, workflow, infrastructure,
governance. Featured flagships are product + workflow; resume-generator and
renovate-governance appear only on `/projects` and ecosystem.

`content/articles.ts` header comment still says the inventory was transcribed
from `codenames-ai-guesser/docs/dev.to/published/`. That sibling path currently
has **zero** files; the live corpus is `editorial-workflow/docs/dev.to/published/`
(see §2). **Auditor interpretation:** the comment is stale relative to hub
extraction.

Articles with `relatedProjectSlug` (8 of 9): three Codenames, three editorial,
two Renovate. `cloud-agent-felt-like-hiring` has no project slug. No article is
tagged to `resume-generator`. **On portfolio:** `relatedProjectSlug` is validated
against project slugs in `tests/content-foundation.test.ts` but **case-study
pages do not read `articles[]`** — they render hardcoded `project.evidence` /
`relatedLinks` only (`app/projects/[slug]/page.tsx`).

### Strongest case-study evidence (as the site presents it)

**On portfolio.** Codenames is the only project with a live public product URL
(`https://codenames-ai.com/`). Editorial, Renovate, and resume-generator point at
DEV posts or unlabeled private architecture evidence. Resume-generator evidence
items have no URLs (private repo). Renovate has no `outcomes` section — this is
enforced by `tests/content-foundation.test.ts`.

Codenames outcomes copy (`content/projects.ts` `codenames-ai` / `outcomes`):
"Hard product KPIs are intentionally not claimed here; the durable outcome is a
production system with explicit validation contracts and publishable engineering
lessons." That is an on-portfolio content decision, not a statement that
metrics do not exist in sibling inventory (see §2).

### Visitor journeys and CTAs

**On portfolio.**

| Entry                        | Next step                                           |
| ---------------------------- | --------------------------------------------------- |
| Home hero primary            | `/projects`                                         |
| Home hero secondary          | `/about`                                            |
| Home systems diagram         | `/ecosystem`                                        |
| Home selected work           | Flagship case studies; "All projects" → `/projects` |
| Home writing rows            | External DEV.to (new tab via `ExternalLink`)        |
| Home "All articles"          | `/articles` (still outbound rows)                   |
| Case study Links             | Live product / DEV posts / private labels           |
| Ecosystem node select        | Detail panel; "Open project case study" when mapped |
| Nav Contact / About Email me | `mailto:michael@multipliers.dev`                    |

There is no in-site article body. Writing always leaves the site.

### Technical qualities and constraints

Distinguish durable product/engineering constraints from replaceable
implementation. Redesign should preserve the left column unless `PRODUCT.md`
changes; the right column is fair game.

| Durable (keep unless product truth changes)                                                                                                   | Replaceable implementation                                                                                                            |
| --------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Static-first typed modules under `content/` behind `PortfolioRepository` (`docs/architecture/overview.md`, `PRODUCT.md`)                      | Specific five-item nav, combined About/Contact, featured-flag homepage composition                                                    |
| No auth, no CMS, no chatbot in the current milestone (`PRODUCT.md`)                                                                           | Hero split + `SystemsDiagram` as first-viewport artifact                                                                              |
| Evidence over invented employers/metrics (`PRODUCT.md`, `AGENTS.md`)                                                                          | Sage accent, paper canvas, Newsreader / Source Sans 3 / IBM Plex Mono stacks (`DESIGN.md`, `app/styles/tokens.css`)                   |
| Semantic CSS classes under `app/styles/` as the primary styling API; do not expand Tailwind `@theme` without a plan (`docs/design-system.md`) | Layer split (`tokens.css` / `base.css` / `layout.css` / `components.css` / `signature.css`)                                           |
| `prefers-reduced-motion: reduce` must remain a real alternative (`DESIGN.md`, `tests/signature-motion.test.ts`)                               | 920px / 921px desktop breakpoint (`app/styles/components.css`, `SiteHeader.tsx` `DESKTOP_MIN`)                                        |
| Node 24.x, Husky pre-commit (`lint` / `typecheck` / `format:check`), CI coverage + build (`.github/workflows/ci.yml`)                         | React Flow canvases vs another map treatment                                                                                          |
| Docs-only PRs may skip Playwright; unknown paths fail closed to e2e; `main` always runs e2e (`.github/workflows/ci.yml`)                      | Ambient brand light, live spine signal, section connector nodes (`app/styles/signature.css`)                                          |
| Optional client-only PostHog; unset token = no tracking (`instrumentation-client.ts`, `README.md`)                                            | Production hostname currently `portfolio-multipliers-dev.vercel.app` (`app/layout.tsx` `metadataBase`, `lib/analyticsEnvironment.ts`) |

---

## 2. Wider evidence inventory

Index only. Do not treat sibling prose as portfolio copy. Private career
inventory must not be pasted onto public pages without an explicit content
decision.

### Career / Atlassian / AIM

**External evidence** — `resumes/roles/`, `resumes/facts/`, `resumes/stories/`.
`resumes/meta/profile.yml` is the identity source `content/profile.ts` comments
as a manual transcription (headline, location, email, LinkedIn/GitHub/DEV).
Portfolio bio is thinner than role history.

| Role file                                         | Title / org                       | Dates (role YAML) |
| ------------------------------------------------- | --------------------------------- | ----------------- |
| `resumes/roles/atlassian-graduate-2014.yml`       | Graduate Developer                | 2014-01 – 2015-04 |
| `resumes/roles/atlassian-swe-2015.yml`            | Software Developer                | 2015-04 – 2019-02 |
| `resumes/roles/atlassian-senior-swe-2019.yml`     | Senior Software Engineer / Growth | 2019-02 – 2020-05 |
| `resumes/roles/atlassian-em-2020.yml`             | Engineering Manager / Growth      | 2020-05 – 2024-05 |
| `resumes/roles/atlassian-senior-swe-2024.yml`     | Senior Software Engineer / Growth | 2024-05 – 2025-08 |
| `resumes/roles/atlassian-aim-program-lead.yml`    | Program Lead, AIM (concurrent)    | 2022-03 – 2025-08 |
| `resumes/roles/independent-codenames-ai-2026.yml` | Independent AI Product Engineer   | 2026-05 – present |

Quantitative Atlassian facts that exist in inventory and are **absent from
portfolio copy** (re-read 2026-09-11; keep source qualifiers):

| Fact module                                           | Fact ID                                                                   | Source wording / qualifier                                                                                                                                                                                                          |
| ----------------------------------------------------- | ------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resumes/facts/em-growth-delivery.yml`                | `direct-reports`                                                          | metric name "engineers directly managed", value `8–10`; action `org-change-leadership` says "Managed teams of 8–10 engineers within Atlassian’s Growth organization…"                                                               |
| `resumes/facts/em-growth-delivery.yml`                | `fy22-projects-shipped`                                                   | "FY22 projects shipped" = `12`; paired `fy22-complex-projects` = `3`; `trust-score-card` = `100%` with qualifier "manager Trust Score Card (delivery reliability)"                                                                  |
| `resumes/facts/aim-participation-scale.yml`           | `matched-count` / `workforce-share`                                       | `3552` "matched mentors and mentees"; `~20%` "approximate share of Atlassians". Outcome `participation-scale`: "Scaled mentorship participation to 3,552 matched mentors and mentees, representing approximately 20% of Atlassians" |
| `resumes/facts/aim-sentiment-atlas.yml`               | `sentiment-score` / `atlas-projects`                                      | `86%` "Engineering positive sentiment"; `>60000` "Atlas projects compared". Outcome `atlas-followership`: "Grew AIM into Atlassian’s highest-followed Atlas project among more than 60,000 company projects"                        |
| `resumes/facts/aim-cohort-launch.yml`                 | `senior-stakeholders`                                                     | `30+` "senior stakeholders aligned"; action `cohort-launch` "17 mentoring cohorts"                                                                                                                                                  |
| `resumes/facts/aim-pairing-ops.yml`                   | `mentors-q2-fy23` / `mentors-q3-fy23`                                     | AIM mentors `160` (Q2 FY23) then `500` (Q3 FY23)                                                                                                                                                                                    |
| `resumes/facts/loom-acquisition.yml`                  | `okr-attainment`                                                          | "OKR attainment vs target" = `10x`; outcome `okr-10x`: "Exceeded associated business OKR targets by 10x"                                                                                                                            |
| `resumes/facts/loom-event-pipeline.yml`               | `data-recovered` / `paid-user-events-preserved` / `experiments-unblocked` | "previously lost Loom Cross-flow experiment data recovered" = `20%`; "paid-user events that would otherwise have been excluded" = `~50%`; "in-flight experiments unblocked by attribution fix" = `5`                                |
| `resumes/facts/post-office-ml-surfaces.yml`           | `switcher-impressions` / `d1d6ai-untenanted` / `d1d6ai-tenanted`          | "monthly Switcher recommendation impressions" = `2.5 million`; D1D6AI uplift `77%` untenanted / `62%` tenanted; `switcher-userid-signup-share` = `40%` "share of Loom signups from userId-attribution Switcher touchpoint"          |
| `resumes/facts/admin-hub-experimentation.yml`         | `d1d6ai-increase` / `zero-incident-launch`                                | D1D6AI increase `35%`; outcome "Zero-incident, zero-restart launch across three Cross Flow experiments…"                                                                                                                            |
| `resumes/facts/statsig-reliability.yml`               | `attribution-window-variance`                                             | "in-flight experiment uplift variance across StatSig attribution windows" = `9%–41%`                                                                                                                                                |
| `resumes/facts/cross-flow-experiment-measurement.yml` | `attribution-uplift`                                                      | "prior-approach over-attribution exposed" = `>10%`                                                                                                                                                                                  |

**External evidence** — interview stories (not generate input, not résumé
claims): `resumes/stories/billing-grandfathering.yml`,
`technical-bottleneck.yml`, `loom-analytics-alignment.yml`. Through-line in
`resumes/stories/README.md`: domain-knowledge ownership; structural capacity;
local vs system incentives.

Other AIM modules without additional metrics cited here:
`aim-craft-champion.yml` (founding committee / sole Engineering Craft
Champion), `aim-program-comms.yml`, `aim-cross-pillar.yml`.

### Codenames depth

**External evidence** — `codenames-ai-guesser/docs/`:

- `docs/judge-ai-validation-flow.md` — JUDGE strategy: batch candidates →
  deterministic validation → second-model judge; fallback to direct clue
- `docs/ai-pipeline-outcome.md` — server-canonical `ai_pipeline_outcome`
  event; `reject_classes` closed vocabulary (`structure`, `membership`,
  `cardinality`, `completeness`, `consistency`, `survivors`, `provider`)
- `docs/analytics-workflow.md` — fortnightly PostHog review; Sunday-anchored
  windows (7d operational, 14d activity, 28d engagement); Phase 6 automation
  deferred
- `docs/ci-workflow.md` — path-aware CI gating (not restated here)

Quantitative Codenames facts (**not claimed on the portfolio case study**):

| Fact module                                | Fact ID                       | Source wording / qualifier                                                                                                                                                                    |
| ------------------------------------------ | ----------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `resumes/facts/codenames-ai-telemetry.yml` | `telemetry-model-experiments` | "Combined live-product telemetry from 150+ monthly active players with controlled model experiments…" Resume phrasing uses 150+ as durable floor                                              |
| `resumes/facts/codenames-ai-telemetry.yml` | `monthly-active-players`      | name "Monthly active players", value `165`. Comment: "Rolling MAU snapshot (measured 165, PostHog game_started monthly_active, 2026-09-09). Do not paste this exact count into resume prose." |
| `resumes/facts/codenames-ai-telemetry.yml` | `branded-search-position`     | "Branded Google Search average position (last 28 days)" = `~1`; action `branded-search-discovery` "Grew organic discovery to #1 average position for branded Google Search queries…"          |
| `resumes/facts/codenames-ai-e2e.yml`       | `canonical-concept-count`     | "Canonical English concepts" = `350`; action `canonical-word-pack` "Authored 350 canonical English concepts…"                                                                                 |

### Editorial / writing

**External evidence** — hub `editorial-workflow/`:

- Runbook: `docs/editorial-workflow.md` — lifecycle Inbox → Candidate →
  Drafting → Published; ownership (Notion metadata, repo body, DEV live post,
  skills for agent behavior); cadence table "Drafting → Published **~1 / week**"
- Skills: `.cursor/skills/editor-{inbox,triage,scheduler,refresh,context,draft,critique,publish}/SKILL.md`
- Published corpus: `docs/dev.to/published/` — **15** markdown files (counted
  2026-09-11)

**External evidence** — inventory counts that disagree with the live hub/API
count (do not merge):

| Source                                    | Fact ID / field          | Value   | Qualifier                                                                                                                                       |
| ----------------------------------------- | ------------------------ | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| `resumes/facts/writing-field-reports.yml` | `published-report-count` | `14`    | metric name "Published field reports"; action `series-overview` "Published 14 weekly AI Engineering Field Reports to 2200+ DEV followers…"      |
| `resumes/facts/writing-field-reports.yml` | `dev-followers`          | `2200+` | metric name "DEV followers"                                                                                                                     |
| `resumes/facts/writing-field-reports.yml` | `trusted-member`         | —       | outcome: "Recognized as a Trusted Member of the DEV Community, contributing to community moderation and content quality"                        |
| `resumes/facts/ai-editorial-workflow.yml` | `published-via-workflow` | `14`    | "Field reports published via the workflow"; action `weekly-publishing-scale` "Operated a weekly publishing cadence producing 14 field reports…" |

**On portfolio:** Trusted Member sentence on `/articles` (`app/articles/page.tsx`)
matches `trusted-member` outcome wording closely. Follower count and "14"
do **not** appear on the site.

Hub files **not** in `content/articles.ts` (6):

| Hub file                                                                    | Live DEV title (frontmatter `title`)                                |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------- |
| `persist-game-state-not-ephemeral-ui-intent.md`                             | The board came back. The highlights lied.                           |
| `agent-portability-does-not-require-centralizing-methodology-behind-mcp.md` | I was solving agent portability at the wrong boundary               |
| `experiment-repos-need-first-class-retirement-semantics.md`                 | Throwaway experiments are easy to start. Retiring one safely is not |
| `ai-changed-the-build-vs-buy-threshold.md`                                  | AI changed the build-vs-buy threshold                               |
| `ai-workflows-need-a-requirements-qa-stage.md`                              | The pipeline was green. The product was underspecified              |
| `skills-should-own-capabilities-not-individual-actions.md`                  | One skill per action looked like the safe boundary                  |

### DEV.to public profile (external surface)

Fetched 2026-09-11 from `https://dev.to/michaeltruong` and
`https://dev.to/api/articles?username=michaeltruong&per_page=30`.

**External evidence** — profile copy (not in `content/profile.ts`):

- Tagline: "Senior Software Engineer documenting my AI retraining journey by
  building real products with agents, LLMs, and modern engineering tools."
- Work: "Senior Software Engineer \| AI Product Engineer \| Ex Atlassian"
- Website: `https://michaeltruong.dev`
- Education: University of New South Wales
- Joined Jun 3, 2026
- Profile stats text: "15 posts published", "71 comments written", "3 tags followed"

**External evidence** — API: **15** articles returned (same count as hub
markdown files). The API payload has **no** `pinned` field.

**Auditor interpretation** of pin set: the profile HTML includes a "Pinned"
heading. Titles immediately under that heading, before the newest chronological
post ("Throwaway experiments…", published 2026-09-10), are:

1. The board came back. The highlights lied.
2. I was solving agent portability at the wrong boundary
3. Active players looked real until we asked which sessions counted
4. I fixed my AI reviewer. Then I kept solving the wrong problem
5. The agent plan had every step except where to stop

Treat pinning as profile-page structure, not API-confirmed. Plan authoring
screenshot (2026-09-10) recorded the same five-pin tension.

**Auditor interpretation** — three curation layers (sets compared 2026-09-11):

| Layer                         | Count | Source                                               |
| ----------------------------- | ----- | ---------------------------------------------------- |
| DEV.to live / hub corpus      | 15    | API + `editorial-workflow/docs/dev.to/published/`    |
| Portfolio article inventory   | 9     | `content/articles.ts`                                |
| Portfolio homepage featured   | 3     | `featured: true`                                     |
| Inferred DEV pins             | 5     | profile page structure                               |
| Inventory "published reports" | 14    | `writing-field-reports.yml` `published-report-count` |

Homepage featured titles (model experiments, evidence-driven upgrades,
reviewers 23/25) **do not overlap** the inferred pin set. Two inferred pins
(persist-game-state, agent-portability) are **missing** from the portfolio
article module. Three inferred pins are in the portfolio archive but not
featured.

DEV website `michaeltruong.dev` vs portfolio `metadataBase`
`https://portfolio-multipliers-dev.vercel.app` (`app/layout.tsx`, `README.md`):
**On portfolio** the documented production host is the Vercel app domain;
custom domain is documented as not yet configured (`README.md`).

### Renovate governance

**External evidence** — `renovate-workflow/`:

- `docs/renovate-workflow.md` — manual four-step ladder; classifier never
  merges; investigator has no merge authority; maintainer merge-commit only;
  draft PRs skipped until ready; Phase 6 automation deferred
- `docs/distribution-discovery.md` — plugin vs consumer-owned
  `.agents/renovate-policy.yml`; scripts via npm git dependency, not vendoring
- Skills: `.cursor/skills/renovate-{classifier,loop,investigator,maintainer,draft-readiness}/`

**External evidence** — `resumes/facts/renovate-governance.yml` (no numeric
KPIs): ladder roles, stop causes, portable plugin packaging.

**On portfolio:** case study covers the ladder and links two DEV posts; no
outcomes section (test-enforced).

### Agent harness / Savepoints / team-harness

**External evidence** — `cursor-team-marketplace/README.md` and
`plugins/team-harness/.cursor-plugin/plugin.json` (version `1.10.2`): one
plugin shipping planning methodology skill, `/repo-bootstrap`, and cloud-hooks
primitive. Install ≠ automatic Cloud-safety; each Husky repo still needs
prepare/wiring.

**External evidence** — `resumes/facts/ai-engineering-workflows.yml`:
`team-harness-plugin`, `cloud-hooks-primitive`, `cloud-hooks-cross-repo`,
`hook-stack-model` (four-layer hook enforcement). Not a portfolio project.

**External evidence** — `savepoints/notes/architecture-direction.md` (draft
v0.1.7, updated 2026-09-09): repo-local observer is a prototype, not the product
boundary; three product pieces (agent runtime / backend / UI) are direction, not
shipped packaging. Demo experiment recorded "8 Savepoints (4 Learning / 4
Decision) and 5 retrospective cards" with date 2026-09-03 and qualifier "Lived
demo corpus"; Improvements stage "do not treat as a shipped product surface."

**External evidence** — `resumes/facts/savepoints-durable-capture.yml`:
pipeline, Postgres-backed store, dual-runtime submit; scope
`savepoints-prototype-scope` "Scoped repo-local spool as prototype boundary;
deferred packaging, MCP, and retrospective UI per architecture direction."

**On portfolio:** Savepoints is not a project, entity, or article. Architecture
overview still lists chatbot as later; it does not name Savepoints.

### Resume builder (meta-infrastructure)

**External evidence** — `resumes/AGENTS.md`,
`resumes/.cursor/rules/facts-vs-prose.mdc`: facts vs prose; applications only
select/reorder/rephrase; stop rather than invent missing facts.

**External evidence** — `resumes/facts/resume-builder.yml`: end-to-end
ownership, facts-vs-prose, application tailoring, quality gates (ATS, PDF,
visual regression). No public demo URL — matches portfolio evidence labels.

---

## 3. Product truth

Facts, audiences, capabilities, and constraints that should survive redesign
unless product intent changes. **On portfolio** unless noted.

- **Who it is for:** hiring managers, engineering leaders, peer engineers
  (`PRODUCT.md` Users). Secondary audience of practitioner-engineers exploring
  the ecosystem.
- **What it must communicate:** who Michael is, what he has shipped, how
  projects connect, then drill into proof (`PRODUCT.md` Purpose).
- **Positioning:** not a generic résumé template — a systems-oriented map of
  shipped work (`PRODUCT.md` Positioning).
- **Identity facts transcribed from inventory:** name, Sydney, email
  `michael@multipliers.dev`, headline Senior Software Engineer, Atlassian Growth
  SWE + EM + AIM, production AI systems, DEV field reports (`content/profile.ts`
  - `resumes/meta/profile.yml`).
- **Four current systems exist as case studies** (product, workflow,
  knowledge architecture, governance). Codenames is the public live product.
- **Evidence discipline:** agents must not invent employers, metrics, or
  shipped features not in `content/` or canonical career inventory (`PRODUCT.md`,
  `AGENTS.md`). Hard KPIs omitted on Codenames outcomes are an honesty choice,
  not an absence of inventory.
- **Static-first:** typed `content/` modules, Vercel without required secrets,
  `PortfolioRepository` as the storage seam, Supabase later
  (`docs/architecture/overview.md`).
- **Ecosystem map is a presentation layer**, not a second canonical inventory
  (`resumes/facts/portfolio-ecosystem.yml` `portfolio-presentation-scope`;
  `content/ecosystem.ts` comment).
- **Writing is external:** DEV.to owns the live post (`editorial-workflow`
  ownership table). Portfolio is an index + featured set, not a CMS.
- **Honest stubs:** empty timeline, deferred chatbot, optional PostHog
  (`PRODUCT.md` principle 5; `content/timeline.ts`).
- **Accessibility floor:** contrast, focus rings, skip link, reduced-motion
  alternatives (`docs/design-system.md`, `app/layout.tsx` skip link).

---

## 4. Current design decisions

Replaceable IA, hierarchy, visual, and interaction choices. Changing these does
not by itself change product truth.

**On portfolio:**

- Five-item primary nav including Ecosystem at the same tier as Projects and
  Articles (`lib/nav.ts`)
- Combined About + Contact page; Contact CTA duplicates About
- Homepage: two flagships + three featured articles (test-enforced shape)
- Articles as outbound log rows, not in-site essays
- Hero systems diagram as the distinctive first-viewport artifact
- Warm paper canvas, single sage accent, quiet graph motif (`DESIGN.md`)
- Cards for work tiles / contact / TOC; no decorative cards in the hero
  (`docs/design-system.md` component posture)
- Case studies as long-form section stacks with sticky TOC
- Ecosystem: four stacked canvases + kind-filtered entity inventory; explicitly
  "no mega-graph" (`app/ecosystem/page.tsx`)
- Featured-project selection: Codenames + editorial; resume-generator and
  Renovate demoted to index/ecosystem
- Featured-article selection: one post per flagship case study
  (`content/articles.ts` comment; test requires distinct `relatedProjectSlug`)
- Visual identity tied to "· systems" brand mark (`SiteHeader` logo)
- Production URL still the Vercel default host
- 920px layout collapse for nav, grids, ecosystem chrome

**Auditor interpretation:** these choices encode a "systems map first, career
narrative second" hierarchy. That is a design/IA decision, not forced by the
repository abstraction.

---

## 5. Current strengths

What redesign should not lose. Mix of on-portfolio fact and labeled
interpretation.

| Strength                                                                                                                     | Provenance                            |
| ---------------------------------------------------------------------------------------------------------------------------- | ------------------------------------- |
| Evidence-backed case studies with section kinds chosen after audit; unsupported kinds omitted (`content/projects.ts` header) | On portfolio                          |
| Codenames live URL + schema/validation/evaluation story without inventing traction KPIs                                      | On portfolio                          |
| Editorial and Renovate case studies make agent contracts, stop lines, and human gates explicit                               | On portfolio                          |
| Resume-generator case study teaches facts-vs-prose without exposing PII                                                      | On portfolio                          |
| Ecosystem canvases match interview walkthroughs (talk tracks on views, not entities)                                         | On portfolio (`content/ecosystem.ts`) |
| Progressive disclosure: scannable home → case study → external proof (`PRODUCT.md` principle 2)                              | On portfolio                          |
| Signature motif mirrors ecosystem spine rather than inventing decorative nodes (`docs/design-system.md`)                     | On portfolio                          |
| Reduced-motion guards are tested, not only documented                                                                        | On portfolio                          |
| Repository seam + static modules keep a later storage swap from rewriting routes                                             | On portfolio                          |
| Content-foundation tests lock four projects, two flagships, featured-article uniqueness                                      | On portfolio                          |

**Auditor interpretation:** the site already has a coherent voice — systems,
contracts, and field reports — that matches how the sibling repos actually
operate. That mental model is the asset.

---

## 6. Current weaknesses and opportunities

Each row is labeled. "Gap" means a difference between surfaces, not a mandate
to add content.

| Observation                                                                                                                                                                                                                            | Label                                                                      |
| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------- |
| Portfolio article module has **9** entries; hub + DEV API have **15** published posts; inventory metrics still say **14** (`writing-field-reports.yml` `published-report-count`, `ai-editorial-workflow.yml` `published-via-workflow`) | On portfolio + external evidence (do not collapse)                         |
| `content/articles.ts` comment still points at `codenames-ai-guesser/docs/dev.to/published/` (empty); corpus lives in `editorial-workflow`                                                                                              | On portfolio + external evidence                                           |
| Homepage featured set (3) and inferred DEV pins (5) overlap **zero** titles                                                                                                                                                            | Auditor interpretation of compared sets                                    |
| Two inferred pins (persist-game-state, agent-portability) are absent from portfolio inventory                                                                                                                                          | External evidence vs on-portfolio module                                   |
| DEV profile positions "AI retraining journey" / AI Product Engineer / `michaeltruong.dev`; portfolio bio leads with Atlassian then production AI + DEV                                                                                 | External evidence vs on-portfolio copy                                     |
| Atlassian EM, AIM, Loom, Post Office, Statsig, Admin Hub quantitative evidence is inventory-only; portfolio compresses it to one bio sentence                                                                                          | External evidence vs on-portfolio copy                                     |
| Codenames inventory has qualified MAU / search / 350-concept facts; portfolio outcomes explicitly refuse hard KPIs                                                                                                                     | External evidence vs on-portfolio copy (honesty, not necessarily a defect) |
| `relatedProjectSlug` is unused by case-study pages; articles index does not link back to projects                                                                                                                                      | On portfolio                                                               |
| Timeline is a stub in the repository interface with no route                                                                                                                                                                           | On portfolio                                                               |
| Savepoints, team-harness, and cloud-hooks exist as sibling systems / facts and are invisible as first-class portfolio work                                                                                                             | External evidence vs on-portfolio inventory                                |
| Resume-generator and Renovate are not homepage flagships; Renovate has no outcomes section                                                                                                                                             | On portfolio                                                               |
| About is a single screen that duplicates home bio; Contact is the same route as About                                                                                                                                                  | On portfolio                                                               |
| Trusted Member is only on `/articles`, not home                                                                                                                                                                                        | On portfolio                                                               |
| Entity inventory (24) duplicates canvas information in a second scan pattern; relationships exist in data (`listRelationships`) but are not rendered as a graph                                                                        | On portfolio                                                               |
| Production host is still `*.vercel.app` while DEV lists `michaeltruong.dev`                                                                                                                                                            | On portfolio + external evidence                                           |
| Writing always exits the site — no hosted essay, no series framing beyond "Field reports from production work."                                                                                                                        | On portfolio                                                               |

---

## 7. Redesign questions

Questions only. This audit does **not** decide. Include both addition/promotion
and removal/distillation.

### Addition / promotion

- Should Atlassian Growth / AIM evidence appear as a first-class narrative
  (role timeline, selected metrics with inventory qualifiers), or stay a bio
  clause so the site remains "systems now, career on the résumé"?
- Which qualified Codenames metrics, if any, belong on the public case study
  given `monthly-active-players` "Do not paste this exact count into resume
  prose" and the current outcomes refusal of hard KPIs?
- Should the article inventory match the hub/DEV 15, the inventory 14, or a
  curated subset — and which layer is canonical for the public site?
- Should homepage featured writing follow DEV pins, flagship-project pairing,
  or a third editorial rule?
- Should persist-game-state and agent-portability (inferred pins; missing from
  `articles.ts`) be added, and if so to which project?
- Should Savepoints, team-harness, or cloud-hooks become a project, an
  ecosystem entity, or remain deferred prototypes (`savepoints-prototype-scope`)?
- Should `michaeltruong.dev` become the portfolio canonical host so DEV, meta,
  and the site agree?
- Should Trusted Member and/or follower qualification (`dev-followers` `2200+`)
  appear above the articles index?

### Removal / distillation

If stronger evidence is promoted, what should be cut or demoted so the site
stays scannable?

- **Articles route vs integrated writing.** Keep `/articles` as a DEV log, fold
  writing into case studies / home, or host selected essays? What happens to
  the 9-vs-15 mismatch if the route stays a full archive?
- **Ecosystem nav tier.** Keep Ecosystem in primary nav, demote it to a home
  module / projects affordance, or make it the spine of the whole site?
- **Entity inventory vs canvases only.** The page already says the canvases are
  not a mega-graph. Is the 24-entity inventory earning its section, or is it a
  second model visitors do not need?
- **About / Contact duplication.** Keep one page, split identity vs contact, or
  put contact in the footer/header only?
- **Timeline stub.** Ship a real timeline from `resumes/roles/`, remove the
  repository API until needed, or leave the honest empty array?
- **Resume-generator visibility.** Homepage flagship, stay on `/projects`, or
  treat as supporting infrastructure mentioned inside other case studies?
- **Four-project parity.** Promote Renovate and resume-generator to equal
  homepage weight, keep two flagships, or drop below four public case studies?
- **Hero systems diagram.** Keep as the signature first-viewport artifact,
  simplify, or replace with career/proof-led hero copy?
- **Trusted Member prominence.** Keep on `/articles` only, promote, or drop as
  community chrome that does not help the hiring scan?
- **Featured-article rule** ("≈ one post per flagship"). If pins or newer posts
  are stronger, should that uniqueness test be relaxed — and what homepage
  density does that create?

### Cross-cutting

- What is the single first-viewport sentence a hiring manager should leave with —
  Atlassian scope, production AI operator, agent-systems builder, or writer of
  field reports? The current bio concatenates all four.
- Which numbers are allowed on a public page at all, given facts-vs-prose and
  Codenames' "do not paste 165" qualifier?
- How should portfolio featured, DEV pins, and hub corpus stay in sync without
  turning the site into an uncurated mirror?
