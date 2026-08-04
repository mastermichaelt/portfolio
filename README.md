# portfolio

Personal engineering portfolio and project knowledge base.

## Purpose

This site will grow into a public portfolio, an interactive map of an AI engineering ecosystem, a Next.js + Supabase learning project, and later a foundation for a grounded portfolio chatbot.

**Current status:** repository skeleton. Routes, domain placeholders, a static repository adapter, and docs exist. Real content and features are intentionally out of scope.

## Tech stack

- Next.js (App Router)
- TypeScript
- React Server Components (default)
- Tailwind CSS
- ESLint + Prettier
- npm
- Deploy target: Vercel

Supabase is planned later and is not part of this skeleton.

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
```

Pre-commit (Husky): runs `lint-staged` (Prettier on staged files), then full `lint`, `typecheck`, and `format:check`. Coverage runs in CI (`test:coverage`), not on every commit. Husky install is skipped when `CI` is set.

Local app: [http://localhost:3000](http://localhost:3000)

Placeholder routes:

- `/`
- `/projects`
- `/articles`
- `/ecosystem`
- `/about`

## Deployment

Designed for Vercel. The GitHub repository is connected; the Next.js app deploys with default settings. No env vars are required for the skeleton.

Stable production URLs (Multipliers Dev team):

- Production: [https://portfolio-multipliers-dev.vercel.app](https://portfolio-multipliers-dev.vercel.app)
- `main` branch alias: [https://portfolio-git-main-multipliers-dev.vercel.app](https://portfolio-git-main-multipliers-dev.vercel.app)

Per-deploy `*.vercel.app` hosts change every build and are not documented here. Add a custom domain here when one is configured.

## Layout

| Path            | Role                                          |
| --------------- | --------------------------------------------- |
| `app/`          | App Router pages                              |
| `components/`   | Shared UI (empty for now)                     |
| `domain/`       | Lightweight domain interfaces                 |
| `content/`      | Static placeholder data                       |
| `repositories/` | Storage abstraction + static implementation   |
| `lib/`          | Shared helpers (empty for now)                |
| `docs/`         | Architecture notes and plans                  |
| `prototypes/`   | Standalone HTML design prototypes (not build) |

See [docs/architecture/overview.md](docs/architecture/overview.md). The AI engineering portfolio HTML prototype lives under [`prototypes/ai-engineering-portfolio/`](prototypes/ai-engineering-portfolio/README.md).
