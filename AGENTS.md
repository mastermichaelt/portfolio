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

| Path            | Role                                            |
| --------------- | ----------------------------------------------- |
| `app/`          | App Router pages                                |
| `components/`   | Shared UI                                       |
| `domain/`       | Lightweight domain interfaces                   |
| `content/`      | Static content modules                          |
| `repositories/` | Storage abstraction + static implementation     |
| `lib/`          | Shared helpers                                  |
| `docs/`         | Architecture notes and product roadmap          |
| `vendor/`       | Provenance for third-party code served verbatim |
| `.cursor/`      | Agent standards, rules, and staged plans        |

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
npm run verify:git-hooks     # confirm Husky shims are runnable in this checkout
```

Pre-commit (Husky): `lint-staged` (Prettier on staged files), then full `lint`, `typecheck`, and `format:check`. Coverage is a CI gate, not a pre-commit step. Playwright e2e runs in CI after `verify`. The `e2e` job always reports a status (required-check safe) but **skips Playwright only when every changed path is on an explicit docs-only allowlist** (`docs/**`, `.cursor/**`, `README.md`, `AGENTS.md`, `CLAUDE.md`, and a few non-workflow `.github` metadata files); any other path (including unknown/future paths) runs e2e. `main` pushes always run e2e.

### Git hooks (four-layer enforcement)

Do not blur hook infrastructure with formatting ergonomics or CI. Each layer answers a different question:

| Layer                             | Question                                                   | Mechanism                                                                                                                                                                        |
| --------------------------------- | ---------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **1 — Hook availability**         | Are Git hooks wired and **runnable in this checkout**?     | `scripts/prepare-git-hooks.sh`, `scripts/verify-git-hooks.sh`, `scripts/ensure-hooks.sh`, `scripts/husky-shim-repair.sh`, `.cursor/hooks/ensure-git-hooks.sh` (`sessionStart`)   |
| **2a — Agent feedback**           | Can agent edits stay formatted and on-brand while working? | Optional `.cursor/hooks/format.sh` + `afterFileEdit` (Prettier) and Impeccable `preToolUse` design detector in `.cursor/hooks.json` — **agent ergonomics only**, not Cloud Husky |
| **2b — Commit correctness**       | What must pass before a commit lands locally?              | `.husky/pre-commit` (`lint-staged`, `lint`, `typecheck`, `format:check`)                                                                                                         |
| **3 — Authoritative enforcement** | What is the backstop when local/agent machinery fails?     | CI (`format:check`, lint, typecheck, coverage, build)                                                                                                                            |

**Core invariant (Layer 1):** An agent must not assume Git hooks are active merely because `core.hooksPath` is configured. Configured path ≠ runnable shims — verification must check **actual executable hook state** in the current checkout/worktree.

- **Node**: `.nvmrc` and `package.json` `engines` pin Node **24.x**. Use Node 24 for install, hooks, and CI scripts. Cursor Cloud VMs have shipped PATH Node 22.x; committed `.cursor/environment.json` `install` pins Node from `.nvmrc` then runs `npm ci`.
- **Prepare / verify:** `scripts/prepare-git-hooks.sh` installs Husky locally and on Cursor Cloud; it skips Husky on Vercel, GitHub Actions, and other `$CI` environments (Cloud VMs may still set `CI=true`). Run `npm run verify:git-hooks` to confirm `.husky/_` shims exist in the current worktree.
- **Worktrees:** After `git worktree add`, run `npm run prepare` (or `npm run verify:git-hooks` after prepare) in the new worktree before committing — worktrees inherit `core.hooksPath=.husky/_` but not executable `.husky/_` shims until prepare runs there.
- **Cloud lifecycle:** `.cursor/environment.json` `install` is `sh scripts/cloud-agent-bootstrap-install.sh` (Node pin + `npm ci`, which runs `prepare`); `start` is `sh scripts/cloud-agent-start.sh` (session PATH + `ensure-hooks`). Marketplace / plugin install does not wire this by itself. After merging lifecycle changes, trigger and promote a **new environment Build** so Cloud does not reuse the old snapshot.
- **Cloud bridge:** `scripts/ensure-hooks.sh` chains Cursor Cloud's dispatcher to a per-user Husky bridge that resolves the current repo at hook time — also re-run from `.cursor/hooks/ensure-git-hooks.sh` (`sessionStart`), because `prepare` can finish before `~/.cursor/agent-hooks` exists.
- **Layer 2a is not Cloud Husky:** `afterFileEdit` formatting and Impeccable `preToolUse` design feedback are redundant ergonomics paths for agent sessions; they do **not** replace Husky, pre-commit lint/typecheck/format:check, or CI.
- **No env vars** are required for the static MVP. Optional PostHog: `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` + `NEXT_PUBLIC_POSTHOG_HOST` (see `.env.example`). Unset token = no tracking in local/CI; set the same vars on Vercel for preview/production.
- Analytics is **client-only** (`instrumentation-client.ts` + `ExternalLink` outbound events) and orthogonal to `PortfolioRepository`. Product Health dashboard: [Portfolio — Product Health](https://us.posthog.com/project/423501/dashboard/1976872).
- Pages and UI should depend on `PortfolioRepository`, not on concrete storage adapters.
- Staged multi-PR plans live under `.cursor/plans/`. Product roadmap stubs under `docs/plans/` are not execution plans unless promoted.

### scroll-craft (experiment)

A scroll-driven interaction engine from [`nateherkai/scroll-craft`](https://github.com/nateherkai/scroll-craft),
integrated on the homepage as an **experiment only**, on branch
`experiment/scroll-craft-integration-baseline`. Boundary, findings and exit
criteria: [docs/experiments/scroll-craft-baseline.md](docs/experiments/scroll-craft-baseline.md).

- The engine is vendored verbatim to `public/vendor/scrollcraft/` and **served,
  never imported**, so it stays out of the application module graph. Its sha256
  is pinned in [`vendor/scrollcraft/PROVENANCE.md`](vendor/scrollcraft/PROVENANCE.md)
  and asserted by `tests/scrollcraft-engine-integrity.test.ts`.
- **Never edit the engine** — that is scroll-craft's one hard rule. Bespoke
  behaviour is authored in this repo's markup and CSS, driven off the `--sc-p`
  custom property the engine publishes.
- The engine's own `engine/scrollcraft.css` is **not** vendored: it is a
  competing design floor that would replace this portfolio's typography and both
  themes. `app/styles/scrollcraft.css` carries a hand-scoped subset of its device
  rules and records what was refused.
- Everything scroll-craft touches is scoped to `[data-scrollcraft-scope]` on the
  homepage method section. `PortfolioRepository`, `domain/`, `repositories/` and
  `lib/` are unaware of it.
- `prefers-reduced-motion` stays governed by the global floor in
  `app/styles/base.css`, not by scroll-craft's gentler curve.
- The armed (hidden) state is gated on the scope element's own
  `data-scrollcraft-mounted`, **never** on the engine's `html.sc-ready`:
  `sc-ready` survives client-side navigation while the section's DOM does not,
  so it can outlive the instance it stands for and hide content permanently.
  The mount guard itself lives at module scope, because an element-held flag is
  destroyed by App Router navigation and lets engine instances accumulate.
- Any scroll-craft device that hides content needs a no-JS settled state, a
  `:focus-within` keyboard rescue, and an `@media print` settle. The engine
  supplies none of them.
- Plugin workflow: `claude plugin marketplace add nateherkai/scroll-craft`, then
  `claude plugin install nateherk-design`. Preflight is
  `node <skill>/scripts/doctor.mjs`; it exits non-zero without a full ffmpeg
  build even for builds that generate no assets.

### Impeccable (design review)

Impeccable adds `/impeccable` for design audit, critique, polish, and related UI refinement. Context files: root [`PRODUCT.md`](PRODUCT.md) (product truth) and [`DESIGN.md`](DESIGN.md) (visual contract referencing [`docs/design-system.md`](docs/design-system.md) and [`app/styles/tokens.css`](app/styles/tokens.css)).

**Prerequisites (Cursor):**

- **Cursor Nightly** (or a build with Agent Skills enabled) — `/impeccable` is a project skill under `.cursor/skills/impeccable/`
- Enable **Agent Skills** in Cursor settings

**Commands (no `package.json` dependency):**

```bash
.cursor/skills/impeccable/scripts/impeccable --help    # launcher + engine
.cursor/skills/impeccable/scripts/impeccable hooks status
npx impeccable@4.1.0 update                              # refresh skill payload (review diff)
```

**Update path:** Run `npx impeccable@4.1.0 update` from repo root after reviewing upstream release notes; re-verify `.cursor/hooks.json` merge (preserve `sessionStart`, `afterFileEdit`, and installer `preToolUse` verbatim).

**Engine binary:** `.cursor/skills/impeccable/scripts/bin/` is gitignored. The launcher at `.cursor/skills/impeccable/scripts/impeccable` uses a sibling binary when present or downloads the pinned engine to `~/.impeccable/bin/` on first run.

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
