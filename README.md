# portfolio

Personal engineering portfolio and project knowledge base.

## Purpose

Job-search-ready static MVP: recruiter link, resume companion, interview reference, and public portfolio. Home, projects (four case studies), articles (DEV.to archive), and a thin About/contact page — fed by typed content modules via `StaticPortfolioRepository`.

**Current status:** static content MVP on production. Brand and IA live in the Next.js app (`app/`, `components/`, `app/globals.css`). Supabase and chatbot work stay later.

## Tech stack

- Next.js (App Router)
- TypeScript
- React Server Components (default)
- Tailwind CSS + brand CSS tokens
- ESLint + Prettier
- npm
- Deploy target: Vercel

Supabase is planned later and is not part of this MVP.

## Development

Requires Node 24 (see `.nvmrc`).

```bash
npm install
npm run dev
```

Other scripts:

```bash
npm run lint
npm run typecheck
npm run format
npm run format:check
npm test
npm run test:coverage
npm run build
npm start
npm run playwright:install   # once: Chromium for e2e
npm run test:e2e             # happy-path Playwright (expects `npm run build` first)
```

Pre-commit (Husky): runs `lint-staged` (Prettier on staged files), then full `lint`, `typecheck`, and `format:check`. Coverage runs in CI (`test:coverage`), not on every commit. Playwright e2e runs in a separate CI job after `verify`. Husky install is skipped when `CI` is set.

Local app: [http://localhost:3000](http://localhost:3000)

Primary routes:

- `/` — homepage (flagship projects + featured writing)
- `/projects` — four case studies
- `/projects/[slug]` — case-study detail
- `/articles` — published DEV.to index (external links)
- `/about` — short identity + contact

`/ecosystem` remains unlinked in primary nav (placeholder for later).

## Deployment

Designed for Vercel. The GitHub repository is connected; the Next.js app deploys with default settings. No env vars are required for the static MVP.

Stable production URLs (Multipliers Dev team):

- Production: [https://portfolio-multipliers-dev.vercel.app](https://portfolio-multipliers-dev.vercel.app)
- `main` branch alias: [https://portfolio-git-main-multipliers-dev.vercel.app](https://portfolio-git-main-multipliers-dev.vercel.app)

Per-deploy `*.vercel.app` hosts change every build and are not documented here. Add a custom domain here when one is configured.

## Layout

| Path            | Role                                          |
| --------------- | --------------------------------------------- |
| `app/`          | App Router pages                              |
| `components/`   | Shared UI (header, footer, case-study chrome) |
| `domain/`       | Lightweight domain interfaces                 |
| `content/`      | Static content modules (evidence-backed)      |
| `repositories/` | Storage abstraction + static implementation   |
| `lib/`          | Shared helpers                                |
| `docs/`         | Architecture notes and plans                  |

See [docs/architecture/overview.md](docs/architecture/overview.md).
