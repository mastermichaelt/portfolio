<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AGENTS.md

Personal engineering portfolio and project knowledge base (Next.js App Router). Static-first content behind a repository abstraction; Supabase later.

## Engineering preferences

When making technical decisions, do not over-weight development cost. Prefer quality, simplicity, robustness, and long-term maintainability.

### Tool selection

Prefer the **most mature first-class interface** for each problem — use the tool that already owns that domain.

| Problem domain                              | Preferred interface          |
| ------------------------------------------- | ---------------------------- |
| Version control                             | `git`                        |
| GitHub (PRs, checks, merge when authorized) | `gh`                         |
| Package scripts                             | `npm` (root `package.json`)  |
| Local files                                 | filesystem / repo read tools |

- **`gh pr merge` guard:** merge via `gh` (or MCP merge tools) is allowed only when **Merge granted** is explicit with rationale from either the current committed plan slice **or** the user’s current instruction for unplanned work. This does not expand merge authority beyond Open PR only / Merge granted rules.
- **Merge method:** when merge is authorized, use a **merge commit** only (`gh pr merge --merge`). Never use `--squash` or `--rebase`.

## Repository layout

| Path            | Role                                        |
| --------------- | ------------------------------------------- |
| `app/`          | App Router pages                            |
| `components/`   | Shared UI                                   |
| `domain/`       | Lightweight domain interfaces               |
| `content/`      | Static content modules                      |
| `repositories/` | Storage abstraction + static implementation |
| `lib/`          | Shared helpers                              |
| `docs/`         | Architecture notes and product roadmap      |
| `.cursor/`      | Agent standards, rules, and staged plans    |

Brand and IA live in production routes (`app/`, `components/`, layered CSS under `app/styles/` via `app/globals.css`). Design-system guidance: [docs/design-system.md](docs/design-system.md). Architecture: [docs/architecture/overview.md](docs/architecture/overview.md).

### Commands

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run format
npm run format:check
npm test
npm run test:coverage
npm run build
npm start
npm run playwright:install   # once: Chromium for e2e
npm run test:e2e             # happy-path Playwright (build first)
```

Pre-commit (Husky): `lint-staged` (Prettier on staged files), then full `lint`, `typecheck`, and `format:check`. Coverage is a CI gate, not a pre-commit step. Playwright e2e runs in CI after `verify`. The `e2e` job always reports a status (required-check safe) but **skips Playwright only when every changed path is on an explicit docs-only allowlist** (`docs/**`, `.cursor/**`, `README.md`, `AGENTS.md`, `CLAUDE.md`, and a few non-workflow `.github` metadata files); any other path (including unknown/future paths) runs e2e. `main` pushes always run e2e. Husky install is skipped when `CI` is set.

### Non-obvious notes

- **Node**: `.nvmrc` and `package.json` `engines` pin Node **24.x**. Use Node 24 for install, hooks, and CI scripts.
- **No env vars** are required for the static MVP. Optional PostHog: `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` + `NEXT_PUBLIC_POSTHOG_HOST` (see `.env.example`). Unset token = no tracking in local/CI; set the same vars on Vercel for preview/production.
- Analytics is **client-only** (`instrumentation-client.ts` + `ExternalLink` outbound events) and orthogonal to `PortfolioRepository`.
- Pages and UI should depend on `PortfolioRepository`, not on concrete storage adapters.
- Staged multi-PR plans live under `.cursor/plans/`. Product roadmap stubs under `docs/plans/` are not execution plans unless promoted.

## Pull request workflow

- Open pull requests **ready for review** once changes are committed, pushed, and verified. Do not create draft PRs unless asked.
- Prefer `gh pr create` for GitHub PR tasks. Fill [`.github/pull_request_template.md`](.github/pull_request_template.md).
- **Default execution authority: Open PR only** — implement and open a PR; stop after opening. Do not merge unless either the current committed plan slice **or** the user’s explicit instruction for the current (unplanned) task grants **Merge granted** with rationale.
- **Plan-only PR** — narrower: plan artifact only; stop after opening the PR; do not begin implementation. Triggered by [alias phrases](.cursor/standards/planning-standards.md#alias-phrases) or a plan slice that recommends Plan-only PR. Always-applied stop surface: [merge-safe-prs.mdc](.cursor/rules/merge-safe-prs.mdc).
- If no plan slice applies and the user has not granted Merge granted, authority is omitted, or authority is unclear → treat as **Open PR only** (unless alias phrases route to Plan-only PR) and **stop after opening the PR**.
- If branch protection blocks merge → **stop and escalate**.
- **Repository topology invariant** — start each staged-plan slice from latest `origin/main`; open PRs targeting `main`; verify the branch represents only the current slice. Policy: [planning-standards.md § Repository topology invariant](.cursor/standards/planning-standards.md#repository-topology-invariant).
- Branch protection and human review remain the final enforcement boundary. Full policy: [.cursor/standards/planning-standards.md](.cursor/standards/planning-standards.md).

### Planning proportionality

Not every change needs a multi-slice plan. See [Lightweight vs staged planning](.cursor/standards/planning-standards.md#lightweight-vs-staged-planning):

- Typo, copy tweak, or small content fix → direct small PR
- One page, component, or content-module update → single PR
- Cross-cutting work spanning multiple concerns → staged plan

## Stop conditions

- Unclear authority → stop after opening the PR
- Plan-only → stop after the plan-only PR; do not implement
- Topology mismatch (wrong base or branch carries prior-slice work) → stop; do not continue on that PR
- Branch protection blocks merge → stop and escalate
