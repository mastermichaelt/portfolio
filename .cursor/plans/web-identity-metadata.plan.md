---
name: Web identity metadata
overview: "Multi-slice plan to complete michaeltruong.ai web identity: branded MT monogram assets (single source, generated rasters), Next.js browser metadata + minimal manifest, metadata consistency, linked JSON-LD graph, scaffold cleanup, and production verification — without PWA runtime machinery."
todos:
  - id: slice-1-icon-source
    content: "PR 1: Canonical MT monogram SVG + generate:icons/check:icons script + committed raster assets (favicon, icon.png, apple-icon, 192/512)"
    status: pending
  - id: slice-2-browser-metadata
    content: "PR 2 (with slice 3): Wire app icon files, viewport themeColor (dual media) + colorScheme in layout.tsx"
    status: pending
  - id: slice-3-manifest
    content: "PR 2 (with slice 2): app/manifest.ts — identity fields, display browser, icon refs to public/brand/*.png"
    status: pending
  - id: slice-4-metadata
    content: "PR 3: lib/site-metadata.ts, homepage OG/Twitter description alignment, authors/creator + curated metadata.keywords in layout"
    status: pending
  - id: slice-5-jsonld
    content: "PR 4: Evolve PersonJsonLd to linked @graph (WebSite + ProfilePage + Person) with stable @id refs"
    status: pending
  - id: slice-6-cleanup
    content: "PR 4 or 5: Remove unused public/*.svg scaffold assets after grep verification"
    status: pending
  - id: slice-7-verification
    content: Add/extend web-identity tests; run production verification checklist
    status: pending
  - id: plan-closure
    content: "Docs-only PR: # Shipped note, archive plan, mark all todos completed"
    status: pending
isProject: false
---

# Web identity and metadata layer — michaeltruong.ai

**Repo:** [portfolio](https://github.com/mastermichaelt/portfolio) (Next.js 16 App Router, `main` as of inspection)

**Baseline already shipped (do not regress):**

- Canonical origin via [`lib/site.ts`](lib/site.ts) (`https://michaeltruong.ai`, `NEXT_PUBLIC_SITE_URL`)
- [`app/layout.tsx`](app/layout.tsx) `metadataBase`, title template, root OG/Twitter defaults
- Per-route `alternates.canonical` on all indexable pages
- [`app/robots.ts`](app/robots.ts) preview `disallow: /`
- [`app/sitemap.ts`](app/sitemap.ts) + [`lib/sitemap-paths.ts`](lib/sitemap-paths.ts) (9 URLs)
- [`components/PersonJsonLd.tsx`](components/PersonJsonLd.tsx) Person schema
- [`app/opengraph-image.tsx`](app/opengraph-image.tsx) / [`app/twitter-image.tsx`](app/twitter-image.tsx) (1200×630)
- Only icon today: [`app/favicon.ico`](app/favicon.ico) (likely default Next scaffold; no `app/icon.*`, no manifest, no `viewport` export)

**Known gap to fix:** homepage [`app/page.tsx`](app/page.tsx) sets a **shorter** `description` but does not override `openGraph`/`twitter` descriptions — crawlers inherit the **longer** layout copy on `/`.

---

## Implementation strategy (Next.js conventions)

### Single icon source — no competing mechanisms

Use **one canonical vector** + **one generation script** + **committed static rasters**. Do **not** add runtime `app/icon.tsx` / `app/apple-icon.tsx` `ImageResponse` routes alongside static PNGs (that duplicates the OG-image pattern unnecessarily and creates two live code paths).

| Layer                | Mechanism                                                                                        |
| -------------------- | ------------------------------------------------------------------------------------------------ |
| **Canonical design** | SVG + token constants in `lib/brand/`                                                            |
| **Reproduction**     | `npm run generate:icons` script (deterministic, in-repo)                                         |
| **Browser delivery** | Next file conventions: `app/favicon.ico`, `app/icon.png` (32×32), `app/apple-icon.png` (180×180) |
| **Manifest icons**   | `public/brand/icon-192.png`, `public/brand/icon-512.png` referenced from `app/manifest.ts`       |
| **Social preview**   | Unchanged: existing `opengraph-image.tsx` / `twitter-image.tsx` (separate concern)               |

**Raster generation:** add `sharp` as a **devDependency** to rasterize the SVG at fixed sizes and emit `favicon.ico` (16+32). This is deterministic, fast, and avoids a second `ImageResponse` renderer. The dev-only `generate:image` Gemini script is **not** used for brand icons.

**Brand palette** (from [`app/styles/tokens.css`](app/styles/tokens.css) / OG image):

- Background: `#121110`
- Monogram ink: `#d9a441`
- Optional inner contrast: `#ece9e2` (only if legibility at 16×16 requires it — keep design minimal)

**Monogram:** uppercase **MT** in IBM Plex Mono styling (weight/spacing tuned for 16px legibility). No portrait in favicon.

---

## Slice sequence and PR boundaries

```mermaid
flowchart TD
  s1[Slice1_IconSourceAndAssets]
  s2[Slice2_BrowserMetadata]
  s3[Slice3_MinimalManifest]
  s4[Slice4_MetadataConsistency]
  s5[Slice5_StructuredDataGraph]
  s6[Slice6_ScaffoldCleanup]
  s7[Slice7_VerificationClosure]

  s1 --> s2
  s1 --> s3
  s2 --> s7
  s3 --> s7
  s4 --> s7
  s5 --> s7
  s6 --> s7
```

| Slice                              | Recommended PR                  | Rationale                                                         |
| ---------------------------------- | ------------------------------- | ----------------------------------------------------------------- |
| 1 — Icon source + generated assets | **Own PR (PR 1)**               | Visual/design review before wiring `<head>`                       |
| 2 — Browser metadata integration   | **Combine with slice 3 (PR 2)** | Manifest is useless without icon routes; same surfaces            |
| 3 — Minimal manifest               | **PR 2** (with slice 2)         | Depends on slice 1 PNGs                                           |
| 4 — Metadata consistency           | **Own PR (PR 3)**               | Copy-only + layout metadata; independent of icons                 |
| 5 — Structured data graph          | **Own PR (PR 4)**               | Testable JSON-LD evolution; independent                           |
| 6 — Scaffold cleanup               | **Combine with PR 4 or PR 5**   | Trivial; avoid a PR that only deletes SVGs                        |
| 7 — Verification + plan closure    | **Docs-only closure PR**        | Per [planning standards](.cursor/standards/planning-standards.md) |

**Recommended execution authority:** Open PR only for all implementation slices; stop after opening each PR.

---

## Slice 1 — Icon design source and generated assets

**Objective:** Establish the canonical MT monogram and commit all derived raster assets. No layout/manifest/viewport wiring yet.

**Files / surfaces:**

- **Add** `lib/brand/icon-tokens.ts` — palette constants shared with generator/tests
- **Add** `lib/brand/mt-monogram.svg` — canonical vector (single source of truth)
- **Add** `scripts/generate-brand-icons.mjs` — reads SVG, emits rasters via `sharp`
- **Add** `npm run generate:icons` and `npm run check:icons` (regenerate + `git diff --exit-code` on outputs)
- **Add** committed outputs:
  - `app/favicon.ico` (replace existing)
  - `app/icon.png` (32×32)
  - `app/apple-icon.png` (180×180)
  - `public/brand/icon-192.png`
  - `public/brand/icon-512.png`
- **Add** `tests/brand-icons.test.ts` — asserts files exist, PNG dimensions, non-trivial byte size; optional snapshot hash of SVG

**Dependencies:** None

**Boundaries:**

- Do **not** edit [`app/layout.tsx`](app/layout.tsx), add `manifest.ts`, or `viewport` export
- Do **not** change OG/Twitter image routes
- Do **not** add PWA/service worker

**Tests / checks:**

- `npm run check:icons`
- `npm test` (new unit tests)
- Manual: open generated PNGs at 16/32/180/192/512 and confirm MT legibility on `#121110`

**Acceptance criteria:**

- One SVG source; all five raster targets reproducible from `npm run generate:icons`
- `check:icons` passes on clean tree
- No runtime icon generation routes added
- **`app/favicon.ico` replaced** with the branded MT monogram (intentional production change)

**Must remain unchanged:** robots, sitemap, JSON-LD, route metadata, OG image

**Production impact on merge:** Slice 1 **intentionally replaces** the existing `app/favicon.ico` — browsers will serve the new MT favicon as soon as this PR merges. Broader `<head>` integration (`theme-color`, manifest link, explicit verification of apple-touch-icon and multi-size icon tags) remains deferred to Slice 2. Committed `app/icon.png`, `app/apple-icon.png`, and `public/brand/*.png` land in this slice as generated artifacts; Slice 2 owns wiring and verifying the full browser-identity surface.

**PR:** Own PR — merge-safe (assets + script; favicon updates in production; remaining head metadata deferred to slice 2)

---

## Slice 2 — Browser metadata integration

**Objective:** Wire generated icons into Next App Router conventions and add browser chrome metadata.

**Files / surfaces:**

- **Replace** [`app/favicon.ico`](app/favicon.ico) with slice-1 output (if not already in PR 1 merge)
- **Add** `app/icon.png`, `app/apple-icon.png` from slice 1
- **Add** to [`app/layout.tsx`](app/layout.tsx):

```ts
import type { Viewport } from "next";

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f2efe8" },
    { media: "(prefers-color-scheme: dark)", color: "#121110" },
  ],
  colorScheme: "dark light",
};
```

- **Do not** add `metadata.icons` array if file conventions already emit correct `<link rel="icon">` / `apple-touch-icon` — verify rendered HTML first; only add explicit `icons` metadata if Next omits a required tag

**Dependencies:** Slice 1 merged

**Boundaries:**

- No `app/icon.tsx` / dynamic icon routes
- No manifest yet (slice 3)
- No theme-color JavaScript — viewport metadata only (consistent with [`ThemeScript`](components/ThemeScript.tsx) using system preference before hydration)

**Tests / checks:**

- Extend `tests/site.test.ts` or add `tests/head-identity.test.ts`: after `next build`, inspect metadata routes or use existing pattern (layout source assertions + build smoke)
- Manual post-deploy: `/favicon.ico`, `/icon.png` or Next icon route, `/apple-icon.png` return 200 with correct dimensions

**Acceptance criteria:**

- Production `<head>` includes favicon + apple-touch-icon links from Next file metadata
- `theme-color` meta present with light/dark media queries
- `color-scheme` meta present
- No duplicate competing icon `<link>` tags

**Must remain unchanged:** OG/Twitter images, robots, sitemap, Person JSON-LD content

**PR:** Combine with slice 3

---

## Slice 3 — Minimal manifest (identity only, not PWA)

**Objective:** Add a web manifest for name/colors/icons identity. **Not** installable-app behavior.

**Files / surfaces:**

- **Add** [`app/manifest.ts`](app/manifest.ts) (`MetadataRoute.Manifest`):

| Field              | Value                                                                                                                         |
| ------------------ | ----------------------------------------------------------------------------------------------------------------------------- |
| `name`             | `Michael Truong`                                                                                                              |
| `short_name`       | `Michael Truong`                                                                                                              |
| `description`      | Short homepage description (slice 4 constant — can use interim copy and align in PR 3 if PR 2 merged first)                   |
| `start_url`        | `/`                                                                                                                           |
| `display`          | `browser` (explicitly **not** `standalone`)                                                                                   |
| `background_color` | `#121110`                                                                                                                     |
| `theme_color`      | `#121110`                                                                                                                     |
| `icons`            | `/brand/icon-192.png`, `/brand/icon-512.png` (`purpose: "any"` only — skip maskable unless design provides safe-zone variant) |

- **Do not** add `<link rel="manifest">` manually — Next emits from `manifest.ts`
- **Do not** add service worker, `mobile-web-app-capable`, or install prompts

**Dependencies:** Slice 1 (192/512 PNGs)

**Boundaries:** No `display_override`, no offline scope, no `sw.js`

**Tests / checks:**

- Unit test: manifest function returns required fields and icon paths
- `curl https://michaeltruong.ai/manifest.webmanifest` (or Next's manifest path) — all icon URLs 200

**Acceptance criteria:**

- Manifest served with `display: browser`
- Icons resolve to committed PNGs at correct sizes
- Lighthouse "installable PWA" is **not** a goal; no SW registered

**Must remain unchanged:** robots, sitemap, OG routes

**PR:** Combined with slice 2 (single "browser identity" PR)

---

## Slice 4 — Metadata consistency and completeness

**Objective:** Fix homepage social description drift; add straightforward author/creator metadata; add a small curated `metadata.keywords` set for metadata completeness; centralize copy where helpful.

**Files / surfaces:**

- **Add** `lib/site-metadata.ts`:
  - `SITE_NAME` = `"Michael Truong"`
  - `SITE_TAGLINE` = `"Making uncertain systems dependable"`
  - `HOME_DESCRIPTION` = existing shorter homepage string from [`app/page.tsx`](app/page.tsx) (preserve verbatim)
  - `SITE_DEFAULT_DESCRIPTION` = existing longer layout description (for non-home routes that inherit)
  - `SITE_KEYWORDS` = curated readonly array (single source; emitted as `metadata.keywords` in layout). **Requirements:**
    - Concise and deliberately curated
    - Grounded in content already represented by the portfolio (profile, case studies, stack)
    - Sensible identity/topic terms only — e.g. `Michael Truong`, `software engineering`, `AI product engineering`, `TypeScript`, `React`, `AI agents`, `Sydney`
    - No keyword permutations, no marketing claims, no stuffing
    - Treat as **metadata completeness/compatibility**, not SEO ranking optimization (Google does not use `meta keywords` for ranking)
- **Update** [`app/page.tsx`](app/page.tsx):
  - Import `HOME_DESCRIPTION`
  - Set `openGraph.description` and `twitter.description` to `HOME_DESCRIPTION`
  - Optionally set `openGraph.title` / `twitter.title` to match absolute title (explicit > inherited)
- **Update** [`app/layout.tsx`](app/layout.tsx):
  - `authors: [{ name: SITE_NAME, url: getSiteUrl() }]`
  - `creator: SITE_NAME`
  - `keywords: [...SITE_KEYWORDS]` (from `lib/site-metadata.ts`)
  - Keep long `description` / OG / Twitter as site-wide fallback for inner routes
- **Update** [`app/manifest.ts`](app/manifest.ts) `description` to `HOME_DESCRIPTION` if slice 3 already merged (or include in same PR if reordering)

**Dependencies:** None (can ship in parallel with PR 2 after slice 1)

**Boundaries:**

- Do **not** add verification tokens or other speculative SEO fields
- Do **not** change inner-route descriptions
- Do **not** add per-project OG images
- `SITE_KEYWORDS` must stay short and curated — resist expanding the list during implementation

**Tests / checks:**

- Unit test: `HOME_DESCRIPTION` used by homepage metadata builder (source assertion or small helper test)
- Unit test: `SITE_KEYWORDS` is a bounded curated list (e.g. length cap + expected anchor terms)
- Build/render check: homepage meta description equals OG/Twitter description
- Build/render check: layout emits `keywords` meta from `SITE_KEYWORDS`

**Acceptance criteria:**

- `/` has one consistent description across `description`, `og:description`, `twitter:description`
- Layout exposes `authors`, `creator`, and `keywords` (`<meta name="keywords" content="…">`)
- `keywords` content matches `SITE_KEYWORDS` exactly — curated, no permutations, no marketing claims
- Inner pages unchanged except any shared constant import

**Must remain unchanged:** canonical URLs, title template, OG image files, robots, sitemap

**PR:** Own PR (PR 3)

---

## Slice 5 — Structured data graph (Person + WebSite + ProfilePage)

**Objective:** Evolve [`components/PersonJsonLd.tsx`](components/PersonJsonLd.tsx) into a single linked `@graph` — smallest clean change, no duplicate script blocks.

**Proposed shape** (claims from [`content/profile.ts`](content/profile.ts) + existing Person fields only):

```ts
const siteUrl = getSiteUrl();
const personId = `${siteUrl}/#person`;
const websiteId = `${siteUrl}/#website`;
const profilePageId = `${siteUrl}/#profilepage`;

@graph: [
  {
    "@type": "WebSite",
    "@id": websiteId,
    url: siteUrl,
    name: "Michael Truong",
    description: HOME_DESCRIPTION, // from lib/site-metadata.ts
    publisher: { "@id": personId },
  },
  {
    "@type": "ProfilePage",
    "@id": profilePageId,
    url: siteUrl,
    name: "Michael Truong",
    isPartOf: { "@id": websiteId },
    mainEntity: { "@id": personId },
  },
  {
    "@type": "Person",
    "@id": personId,
    name, jobTitle, email, homeLocation, sameAs,
    url: siteUrl, // person's canonical web presence
  },
]
```

**Files / surfaces:**

- **Refactor** `components/PersonJsonLd.tsx` → `components/SiteJsonLd.tsx` (or keep filename, export `buildSiteJsonLd` + `SiteJsonLd`)
- **Update** [`app/layout.tsx`](app/layout.tsx) import
- **Update** [`tests/person-jsonld.test.tsx`](tests/person-jsonld.test.tsx) → graph assertions: single script, three nodes, `@id` cross-refs, no invented fields (no `worksFor`, no image unless already in profile)

**Dependencies:** Slice 4 merged (for shared `HOME_DESCRIPTION`) — **or** inline the homepage description constant in slice 5 if PR 3 is still open (prefer waiting to avoid duplicate strings)

**Boundaries:**

- One `application/ld+json` block only
- No `SearchAction` (no site search)
- No `ImageObject` for portrait unless explicitly desired later

**Tests / checks:**

- Unit tests for graph structure and stable `@id` URLs
- Manual: Google Rich Results Test on production `/`

**Acceptance criteria:**

- Person fields preserved (email, location, sameAs, jobTitle)
- WebSite.publisher → Person; ProfilePage.mainEntity → Person; ProfilePage.isPartOf → WebSite
- Valid JSON, single script tag

**Must remain unchanged:** visible page content, OG image, icons

**PR:** Own PR (PR 4)

---

## Slice 6 — Scaffold cleanup

**Objective:** Remove verified-unused Next/Vercel starter assets.

**Files to remove** (grep shows **zero** references in app code):

- [`public/next.svg`](public/next.svg)
- [`public/vercel.svg`](public/vercel.svg)
- [`public/globe.svg`](public/globe.svg)
- [`public/window.svg`](public/window.svg)
- [`public/file.svg`](public/file.svg)

**Dependencies:** None

**Boundaries:**

- Do **not** remove portrait JPEGs (used on About)
- Re-grep before delete; skip any file with unexpected references

**Tests / checks:** `npm run build`, `npm test`, `npm run test:e2e` (if not docs-only — this slice is safe for lightweight CI)

**Acceptance criteria:** Starter SVGs gone; no broken imports

**PR:** Combine with PR 4 (JSON-LD) or standalone if preferred

---

## Slice 7 — End-to-end verification and plan closure

**Objective:** Prove production identity layer end-to-end; close the plan.

**Files / surfaces:**

- **Add** `tests/web-identity.test.ts` (or extend existing): import `manifest`, `robots`, `sitemap`, `buildSiteJsonLd`; assert contracts
- **Optional** Playwright smoke: homepage has `link[rel="canonical"]`, manifest link, favicon link
- **Plan closure:** move plan to `.cursor/plans/archive/`, `# Shipped` note, mark todos complete

**Dependencies:** Slices 1–6 merged

**Verification checklist (production `https://michaeltruong.ai`):**

| Check                                                                           | Method                                                                                       |
| ------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| `<head>` icon links                                                             | View source / curl                                                                           |
| `/favicon.ico`, `/apple-icon.png`, `/brand/icon-192.png`, `/brand/icon-512.png` | HTTP 200 + correct `Content-Type`                                                            |
| Icon dimensions                                                                 | `file` / image inspect (16/32/180/192/512)                                                   |
| MT legibility at 16×16                                                          | Visual                                                                                       |
| `theme-color` (light + dark media)                                              | View source                                                                                  |
| `color-scheme`                                                                  | View source                                                                                  |
| Canonical on `/`                                                                | `link[rel=canonical]`                                                                        |
| Title + description on `/`                                                      | Match `HOME_DESCRIPTION`                                                                     |
| `meta name="keywords"`                                                          | Present on layout; content matches curated `SITE_KEYWORDS` (completeness check, not ranking) |
| `og:*` + `twitter:*` on `/`                                                     | Description matches; image 1200×630 URL resolves                                             |
| JSON-LD graph                                                                   | Rich Results Test; 3 entities linked                                                         |
| `/robots.txt`                                                                   | Allow `/` + sitemap URL                                                                      |
| `/sitemap.xml`                                                                  | 9 URLs at canonical origin                                                                   |
| Preview deploy                                                                  | `VERCEL_ENV=preview` → robots disallow (existing test)                                       |
| CI                                                                              | `npm run check` green                                                                        |

**PR:** Docs-only plan-closure PR

---

## Risks and open decisions

| Risk                         | Mitigation                                                                                                                     |
| ---------------------------- | ------------------------------------------------------------------------------------------------------------------------------ |
| 16×16 MT illegibility        | Tune letter-spacing/weight in SVG; test early in slice 1                                                                       |
| `check:icons` drift in CI    | Run in `npm run check` or document `generate:icons` in PR workflow                                                             |
| Slice 4 / 5 ordering         | Merge metadata constants before JSON-LD to share `HOME_DESCRIPTION`                                                            |
| Duplicate icon links         | Prefer file conventions only; inspect HTML before adding `metadata.icons`                                                      |
| `themeColor` vs stored theme | User chose **dual_media** on `prefers-color-scheme` — acceptable; stored theme may diverge from chrome (documented limitation) |
| Manifest mistaken for PWA    | `display: "browser"`, no SW — document in PR description                                                                       |

**Resolved:** `themeColor` uses light `#f2efe8` / dark `#121110` media queries.

**Still open at implementation:** exact monogram geometry (spacing/weight) — resolved visually in slice 1 PR review.

---

## Explicitly out of scope

- Service worker, offline caching, install prompts
- Crawler fallback HTML
- Runtime SPA SEO
- Per-project OG images
- Sitemap `lastModified`
- Search Console verification (unless token provided)
- Portrait-based favicon

---

## Agent prompts (copy/paste for Cursor)

### Slice 1 — Icon source and assets

Implement slice 1 only from `@.cursor/plans/web-identity-metadata.plan.md`. Add `lib/brand/mt-monogram.svg`, `lib/brand/icon-tokens.ts`, `scripts/generate-brand-icons.mjs` (sharp), `npm run generate:icons` + `check:icons`, and committed rasters under `app/` and `public/brand/`. Replace `app/favicon.ico` with the branded MT monogram (intentional production change). Do **not** edit layout, manifest, viewport, JSON-LD, or OG images. Verify with `npm run check:icons` and `npm test`. Open PR targeting `main`; do not merge. Mark slice-1 todo completed in plan frontmatter.

### Slice 2+3 — Browser identity + manifest

Implement slices 2 and 3 only from `@.cursor/plans/web-identity-metadata.plan.md` after slice 1 is on `main`. Wire `app/icon.png`, `app/apple-icon.png`, `app/favicon.ico`; add `export const viewport` to `app/layout.tsx` (dual media themeColor); add `app/manifest.ts` with `display: browser`. No SW/PWA. Do not add `app/icon.tsx`. Verify build + manifest/icon routes. Open PR; do not merge. Mark slice-2 and slice-3 todos completed.

### Slice 4 — Metadata consistency

Implement slice 4 only from `@.cursor/plans/web-identity-metadata.plan.md`. Add `lib/site-metadata.ts` (including curated `SITE_KEYWORDS`), fix homepage OG/Twitter descriptions to match `HOME_DESCRIPTION`, add `authors`/`creator` and `metadata.keywords` in layout. Keywords: concise, portfolio-grounded, no permutations/stuffing/marketing claims — metadata completeness only, not ranking optimization. No verification meta. Open PR; do not merge. Mark slice-4 todo completed.

### Slice 5 — JSON-LD graph

Implement slice 5 only from `@.cursor/plans/web-identity-metadata.plan.md` after slice 4 is on `main`. Evolve Person JSON-LD to a single `@graph` (WebSite, ProfilePage, Person) with stable `@id` links. Update tests. Open PR; do not merge. Mark slice-5 todo completed.

### Slice 6 — Cleanup

Implement slice 6 only from `@.cursor/plans/web-identity-metadata.plan.md`. Remove unused starter SVGs from `public/` after grep verification. Open PR (may combine with slice 5 if already open); do not merge. Mark slice-6 todo completed.

### Plan closure

Implement plan-closure only from `@.cursor/plans/web-identity-metadata.plan.md`. Run full verification checklist, add `# Shipped` note, move plan to `.cursor/plans/archive/`, mark all todos and plan-closure completed. Docs-only PR; do not merge.
