---
name: michaeltruong.ai migration
overview: Migrate the portfolio to https://michaeltruong.ai as canonical host, add technical SEO (robots, sitemap, Person JSON-LD), harden public-release hygiene, and refresh repository presentation — without redesigning the site or rewriting Git history.
todos:
  - id: plan-review
    content: "Plan-only PR — commit plan artifact and open PR for review; do not implement"
    status: completed
  - id: slice-a-site-url
    content: "PR: Add lib/site.ts and replace hard-coded portfolio-multipliers-dev.vercel.app in layout, analytics, OG image, tests, .env.example"
    status: pending
  - id: slice-b-robots-sitemap
    content: "PR: Add app/robots.ts (preview disallow) and app/sitemap.ts (5 static + 5 project URLs) with tests"
    status: pending
  - id: slice-c-jsonld-metadata
    content: "PR: Add Person JSON-LD from profile.ts; refine metadata/OG copy for Senior SWE + AI Product Engineer positioning"
    status: pending
  - id: slice-d-docs-hygiene
    content: "PR: Redact phone PII; archive stale audit docs; add docs/archive/README.md"
    status: pending
  - id: slice-e-readme-license
    content: "PR: Rewrite README, add MIT LICENSE + content carve-out, update package.json metadata, document .cursor/ agent-native story"
    status: pending
  - id: plan-closure
    content: "Docs-only PR after last implementation slice: add # Shipped note, move plan to .cursor/plans/archive/2026-10-02-michaeltruong-ai-migration.plan.md"
    status: pending
isProject: false
---

# michaeltruong.ai migration and public-readiness

## Recommended execution authority

| Slice                   | Recommended authority | Agent instruction                                      |
| ----------------------- | --------------------- | ------------------------------------------------------ |
| plan-review             | Plan-only PR          | Do not implement. Stop after opening the plan-only PR. |
| slice-a-site-url        | Open PR only          | Do not merge. Stop after opening the PR.               |
| slice-b-robots-sitemap  | Open PR only          | Do not merge. Stop after opening the PR.               |
| slice-c-jsonld-metadata | Open PR only          | Do not merge. Stop after opening the PR.               |
| slice-d-docs-hygiene    | Open PR only          | Do not merge. Stop after opening the PR.               |
| slice-e-readme-license  | Open PR only          | Do not merge. Stop after opening the PR.               |
| plan-closure            | Open PR only          | Do not merge. Stop after opening the PR.               |

Repo default: **Open PR only** ([planning-standards.md](../standards/planning-standards.md#repo-default-when-no-plan-slice-applies)).

## Repository topology (default)

Multi-slice plans stack execution order, not Git branches. Integration branch: `main`. Each implementation slice starts from latest `origin/main`; the PR branch must represent only that slice.

## Approved decisions (plan review)

- **Canonical host:** `https://michaeltruong.ai`
- **Slice F (`vercel.json`) deferred:** configure `michaeltruong.ai`, `www`, legacy domains, and primary-domain redirects in **Vercel first**. Add `vercel.json` only if a redirect requirement remains that Vercel domain settings do not handle cleanly. Do not duplicate Vercel domain config in-repo without cause.
- **Sitemap inventory:** five static routes (`/`, `/about`, `/projects`, `/articles`, `/ecosystem`) plus five project detail pages (`experiment-measurement`, `codenames-ai`, `editorial-workflow`, `renovate-governance`, `resume-generator`) — **10 URLs total**.
- **Person JSON-LD:** include public email (`michael@multipliers.dev`) and `Sydney, Australia` from [`content/profile.ts`](../../content/profile.ts); `sameAs` = LinkedIn, GitHub, DEV only.
- **`.cursor/` footprint:** keep and document as agent-native development setup.
- **License:** MIT for implementation code; explicit carve-out for portfolio copy, branding, portraits, and project media ([`CONTENT_LICENSE.md`](../../CONTENT_LICENSE.md) or README section).

## Current state (audit summary)

**Production host in code today:** `https://portfolio-multipliers-dev.vercel.app` — hard-coded in [`app/layout.tsx`](../../app/layout.tsx) (`metadataBase`), [`lib/analyticsEnvironment.ts`](../../lib/analyticsEnvironment.ts), [`app/opengraph-image.tsx`](../../app/opengraph-image.tsx).

**SEO present:** Next.js Metadata API on all route surfaces; per-page canonicals; `generateMetadata` on `/projects/[slug]`; default OG/Twitter images.

**SEO missing:** `app/robots.ts`, `app/sitemap.ts`, Person JSON-LD, env-driven site URL, preview `noindex`, metadata positioning for AI Product Engineer.

**Public-release audit:** no credential blockers in git history; redact phone PII in [`docs/content-evidence-migration.md`](../../docs/content-evidence-migration.md); archive or banner stale internal audit docs; external Vercel DNS required before redirect verification.

**Identity source of truth:** [`content/profile.ts`](../../content/profile.ts) — LinkedIn, GitHub, DEV, `michael@multipliers.dev`. DEV profile externally lists `michaeltruong.dev` (not wired in app).

---

## Slice — slice-a-site-url

**Recommended authority:** Open PR only

**Goal:** Single source of truth for production URL; defaults to `https://michaeltruong.ai`.

**Deliverables:**

- Add [`lib/site.ts`](../../lib/site.ts) — `getSiteUrl()` / `getSiteHostname()` from `NEXT_PUBLIC_SITE_URL` (HTTPS origin only; default `https://michaeltruong.ai`)
- Update [`app/layout.tsx`](../../app/layout.tsx), [`lib/analyticsEnvironment.ts`](../../lib/analyticsEnvironment.ts), [`app/opengraph-image.tsx`](../../app/opengraph-image.tsx)
- Add `NEXT_PUBLIC_SITE_URL=` to [`.env.example`](../../.env.example)
- Update [`tests/analytics-environment.test.ts`](../../tests/analytics-environment.test.ts), [`tests/posthog.test.ts`](../../tests/posthog.test.ts); add [`tests/site.test.ts`](../../tests/site.test.ts)

**Acceptance:** `metadataBase` and analytics production fallback resolve to `michaeltruong.ai`; tests pass.

---

## Slice — slice-b-robots-sitemap

**Recommended authority:** Open PR only

**Prerequisite:** slice-a-site-url merged.

**Goal:** Production crawlability; preview isolation.

**Deliverables:**

- [`app/robots.ts`](../../app/robots.ts) — `VERCEL_ENV === 'preview'` → `disallow: /`; production → `allow: /` + sitemap URL from `getSiteUrl()`
- [`app/sitemap.ts`](../../app/sitemap.ts) + shared [`lib/sitemap-paths.ts`](../../lib/sitemap-paths.ts) (same slug union as `generateStaticParams`)
- [`tests/robots-sitemap.test.ts`](../../tests/robots-sitemap.test.ts) — assert **10 sitemap URLs** (5 static + 5 project)

**Acceptance:** sitemap lists exactly `/`, `/about`, `/projects`, `/articles`, `/ecosystem`, and all five `/projects/[slug]` paths; preview robots disallows all.

---

## Slice — slice-c-jsonld-metadata

**Recommended authority:** Open PR only

**Prerequisite:** slice-a-site-url merged.

**Goal:** Person structured data; metadata-layer positioning without visible copy redesign.

**Deliverables:**

- [`components/PersonJsonLd.tsx`](../../components/PersonJsonLd.tsx) — `schema.org/Person` with `jobTitle` ["Senior Software Engineer", "AI Product Engineer"], `url`, `email`, `homeLocation`, `sameAs` from profile
- Mount in [`app/layout.tsx`](../../app/layout.tsx)
- Refine root/home `description` in `app/layout.tsx` and [`app/page.tsx`](../../app/page.tsx); update OG image eyebrow/footer in [`app/opengraph-image.tsx`](../../app/opengraph-image.tsx)
- [`tests/person-jsonld.test.tsx`](../../tests/person-jsonld.test.tsx)

**Acceptance:** valid JSON-LD on all pages; homepage meta description names Michael Truong, Senior Software Engineer, and AI Product Engineer naturally; do not change `content/profile.ts` visible headline unless explicitly requested.

---

## Slice — slice-d-docs-hygiene

**Recommended authority:** Open PR only

**Goal:** Safe to make repository public.

**Deliverables:**

- Redact phone number in `docs/content-evidence-migration.md`
- Move [`docs/content-evidence-migration.md`](../../docs/content-evidence-migration.md) and [`docs/redesign-baseline.md`](../../docs/redesign-baseline.md) to `docs/archive/` with historical banner; add [`docs/archive/README.md`](../../docs/archive/README.md)
- Update cross-links in [`docs/plans/portfolio-roadmap.plan.md`](../../docs/plans/portfolio-roadmap.plan.md) and content-module references

**Acceptance:** no phone PII in tracked files; archived docs clearly marked non-visitor-facing.

---

## Slice — slice-e-readme-license

**Recommended authority:** Open PR only

**Goal:** Recruiter/engineer-friendly README; explicit licensing.

**Deliverables:**

- Rewrite [`README.md`](../../README.md) — lead with `https://michaeltruong.ai`, stack, local dev, agent-native `.cursor/` note
- [`LICENSE`](../../LICENSE) (MIT), [`CONTENT_LICENSE.md`](../../CONTENT_LICENSE.md)
- Update [`package.json`](../../package.json) metadata (`description`, `homepage`, `repository`, `author`, `license`); keep `"private": true`
- Minimal wording refresh in [`docs/architecture/overview.md`](../../docs/architecture/overview.md)

**Acceptance:** README suitable for public GitHub; license split documented.

---

## Deferred — vercel.json redirects

Configure in Vercel dashboard first:

- Add `michaeltruong.ai` (apex) and `www.michaeltruong.ai`
- Set apex as primary production domain
- 301 legacy hosts: `portfolio-multipliers-dev.vercel.app`, `portfolio-git-main-multipliers-dev.vercel.app`, `michaeltruong.dev` / `www` (if owned), `www.michaeltruong.ai` → apex

Add [`vercel.json`](../../vercel.json) in a follow-up PR **only** if dashboard config leaves a gap.

---

## External steps (not in repo)

| Area                            | Action                                                                                |
| ------------------------------- | ------------------------------------------------------------------------------------- |
| Vercel                          | DNS, primary domain, legacy redirects, optional `NEXT_PUBLIC_SITE_URL` production env |
| GitHub                          | Make repo public (after D+E); set website to `michaeltruong.ai`                       |
| DEV / LinkedIn / GitHub profile | Update website links to `michaeltruong.ai`                                            |
| Google Search Console           | Add property; submit `https://michaeltruong.ai/sitemap.xml`                           |

---

## Final verification checklist

- [ ] `https://michaeltruong.ai` serves production with valid TLS
- [ ] Legacy hosts 301 to apex (Vercel-configured)
- [ ] Canonical tags and `metadataBase` use `michaeltruong.ai`
- [ ] `robots.txt` allows production; preview disallows
- [ ] `sitemap.xml` contains **10 URLs** (5 static + 5 project)
- [ ] Person JSON-LD validates; `sameAs` = LinkedIn + GitHub + DEV
- [ ] PostHog `analytics_environment: production` on `michaeltruong.ai`
- [ ] No credential/PII blockers; MIT + content carve-out in repo
- [ ] Visual design and GSAP animations unchanged

---

## Plan closure (docs-only PR)

After slice-e-readme-license merges: verify todos, add `# Shipped`, move to `.cursor/plans/archive/2026-10-02-michaeltruong-ai-migration.plan.md`, mark `plan-closure` completed.

---

## Agent prompts (copy/paste for Cursor)

### slice-a-site-url

```text
@.cursor/plans/2026-10-02-michaeltruong-ai-migration.plan.md

Implement slice slice-a-site-url only. Do not start slice-b-robots-sitemap or later slices. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: lib/site.ts; update app/layout.tsx, lib/analyticsEnvironment.ts, app/opengraph-image.tsx, .env.example, tests. Mark slice-a-site-url completed in plan frontmatter in this PR.

Verification: npm run typecheck && npm test; metadataBase resolves to michaeltruong.ai.
```

### slice-b-robots-sitemap

```text
@.cursor/plans/2026-10-02-michaeltruong-ai-migration.plan.md

Implement slice slice-b-robots-sitemap only. Prerequisite: slice-a-site-url merged. Do not start slice-c-jsonld-metadata or later slices. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: app/robots.ts, app/sitemap.ts, lib/sitemap-paths.ts, tests/robots-sitemap.test.ts (assert 10 sitemap URLs). Mark slice-b-robots-sitemap completed in plan frontmatter in this PR.

Verification: npm run typecheck && npm test; sitemap has 5 static + 5 project paths.
```

### slice-c-jsonld-metadata

```text
@.cursor/plans/2026-10-02-michaeltruong-ai-migration.plan.md

Implement slice slice-c-jsonld-metadata only. Prerequisite: slice-a-site-url merged. Do not start slice-d-docs-hygiene or later slices. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: components/PersonJsonLd.tsx, app/layout.tsx, app/page.tsx, app/opengraph-image.tsx, tests/person-jsonld.test.tsx. Mark slice-c-jsonld-metadata completed in plan frontmatter in this PR.

Verification: npm run typecheck && npm test; Person JSON-LD includes email, Sydney, sameAs profiles.
```

### slice-d-docs-hygiene

```text
@.cursor/plans/2026-10-02-michaeltruong-ai-migration.plan.md

Implement slice slice-d-docs-hygiene only. Do not start slice-e-readme-license or plan-closure. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: redact phone PII; move audit docs to docs/archive/ with README; update cross-links. Mark slice-d-docs-hygiene completed in plan frontmatter in this PR.

Verification: no phone number in tracked files; archived docs have historical banner.
```

### slice-e-readme-license

```text
@.cursor/plans/2026-10-02-michaeltruong-ai-migration.plan.md

Implement slice slice-e-readme-license only. Do not start plan-closure. Do not archive the plan.

Authority: Open PR only — implement and open the PR; do not merge.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: README.md, LICENSE, CONTENT_LICENSE.md, package.json metadata, docs/architecture/overview.md tweak. Mark slice-e-readme-license completed in plan frontmatter in this PR.

Verification: README leads with michaeltruong.ai; MIT + content carve-out documented.
```

### plan-closure

```text
@.cursor/plans/2026-10-02-michaeltruong-ai-migration.plan.md

Execute only plan-closure.

Authority: Open PR only — docs-only archive PR; do not merge.

Prerequisites: all implementation slices merged and marked completed in frontmatter.

Topology: start from latest origin/main; branch represents only this slice; PR base must be main.

Deliverables: verify slice todos, add # Shipped note, move plan to .cursor/plans/archive/2026-10-02-michaeltruong-ai-migration.plan.md, mark plan-closure completed, update references.

Verification: confirm all prerequisite implementation PRs are merged before archiving.
```
