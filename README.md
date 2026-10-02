# Michael Truong — portfolio

Production site: **[michaeltruong.ai](https://michaeltruong.ai)**

Personal engineering portfolio and project knowledge base — a static-first Next.js app for case studies, published writing, and an ecosystem map.

Looking for the open-source engineering work? See [multipliers-dev/renovate-workflow](https://github.com/multipliers-dev/renovate-workflow) and [multipliers-dev/cursor-team-marketplace](https://github.com/multipliers-dev/cursor-team-marketplace).

## Stack

- Next.js 16 (App Router), React 19, TypeScript
- Tailwind CSS + layered brand tokens (`app/styles/`)
- GSAP ScrollTrigger for scroll choreography (homepage method reveal, Codenames case study)
- Vitest + Playwright; ESLint + Prettier; Husky pre-commit
- Deployed on Vercel; optional client-side PostHog analytics

## Local development

Requires Node 24 (see `.nvmrc`).

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Common scripts:

```bash
npm run lint
npm run typecheck
npm run test
npm run test:coverage
npm run build
npm run test:e2e            # after npm run build; run playwright:install once
```

Copy [`.env.example`](.env.example) to `.env.local` when you need `NEXT_PUBLIC_SITE_URL`, PostHog, or dev-only image/video generators. None are required for the static MVP.

Full command reference: [AGENTS.md](AGENTS.md).

## Routes

| Route              | Purpose                                                                  |
| ------------------ | ------------------------------------------------------------------------ |
| `/`                | Homepage — two systems, career ledger, supporting work, selected writing |
| `/projects`        | Case-study index                                                         |
| `/projects/[slug]` | Case-study detail (Codenames AI includes scroll-driven narrative)        |
| `/articles`        | DEV.to archive (external links)                                          |
| `/ecosystem`       | Read-only workflow canvases over static ecosystem data                   |
| `/about`           | Identity rail + numbered practice record                                 |

## Agent-native development

This repository is built and maintained with Cursor agents. [`.cursor/`](.cursor/) holds execution standards, staged plans, Impeccable design-review tooling, and git-hook bridges for Cloud agents — not runtime dependencies. Product truth lives in [`PRODUCT.md`](PRODUCT.md) and [`DESIGN.md`](DESIGN.md); architecture notes in [`docs/`](docs/).

## Licensing

| Layer                                                                                  | License                                                            |
| -------------------------------------------------------------------------------------- | ------------------------------------------------------------------ |
| **Source code** (app, components, scripts, tests, tooling)                             | [MIT](LICENSE)                                                     |
| **Portfolio content** (copy, branding, portraits, project media, case-study narrative) | All rights reserved — see [CONTENT_LICENSE.md](CONTENT_LICENSE.md) |

Code is open for learning and reference; portfolio copy and visual identity are not automatically reusable.

## Documentation

- [Architecture overview](docs/architecture/overview.md)
- [Design system](docs/design-system.md)
- [Agent handbook](AGENTS.md)

## Deployment

Canonical host: `https://michaeltruong.ai` (see [`lib/site.ts`](lib/site.ts)). Vercel deploys from `main`; preview environments use `robots.txt` disallow. PostHog is optional — set `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` on Vercel for preview/production analytics.
