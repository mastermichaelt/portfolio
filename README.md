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
npm run build
npm start
```

Pre-commit (Husky): runs `lint-staged` (Prettier on staged files), then full `lint`, `typecheck`, and `format:check`. Husky install is skipped when `CI` is set.

Local app: [http://localhost:3000](http://localhost:3000)

Placeholder routes:

- `/`
- `/projects`
- `/articles`
- `/ecosystem`
- `/about`

## Deployment

Designed for Vercel. Connect the GitHub repository and deploy the Next.js app with default settings. No env vars are required for the skeleton.

## Layout

| Path            | Role                                        |
| --------------- | ------------------------------------------- |
| `app/`          | App Router pages                            |
| `components/`   | Shared UI (empty for now)                   |
| `domain/`       | Lightweight domain interfaces               |
| `content/`      | Static placeholder data                     |
| `repositories/` | Storage abstraction + static implementation |
| `lib/`          | Shared helpers (empty for now)              |
| `docs/`         | Architecture notes and plans                |

See [docs/architecture/overview.md](docs/architecture/overview.md).
