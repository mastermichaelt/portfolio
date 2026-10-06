# Architecture overview

Production site: [michaeltruong.ai](https://michaeltruong.ai). Design tokens and visual guidance: [docs/design-system.md](../design-system.md).

## Goals

This repository serves four overlapping purposes:

1. A **public portfolio** for job hunting and engineering credibility
2. An **interactive map** of an AI engineering ecosystem (`/ecosystem`)
3. A **Next.js learning project** with a clean path to Postgres-backed persistence later
4. A **foundation** for a future grounded portfolio chatbot

The current milestone is a static content MVP on Vercel: home, projects, articles, about, and a live ecosystem map (orientation spine + operational workflow canvases). Database persistence stays later. Assistant **architecture direction** is documented under [`docs/assistant/`](../assistant/architecture-direction.md); no assistant implementation yet.

## Milestone progression

1. **Skeleton** — App Router, tooling, empty routes, domain/content/repository stubs, docs
2. **Static content** (shipped) — evidence-backed copy from typed modules under `content/`
3. **Ecosystem map** (shipped) — entities, relationships, read-only React Flow canvases
4. **Postgres persistence** — migrate storage behind the existing repository interface
5. **Chatbot foundation** — grounded Q&A over a multi-source assistant corpus normalized via OKF ([architecture direction](../assistant/architecture-direction.md); implementation later, just-in-time plans)

## Static-first strategy

Ship meaningful pages from TypeScript modules under `content/` before introducing a database. That keeps PRs reviewable, deployable on Vercel without secrets, and focused on information architecture rather than infra.

## Future Postgres persistence

When persistence is needed (editing, auth, richer queries), add a Postgres-backed `PortfolioRepository` implementation. Application and domain code should stay provider-neutral where practical; **Neon** is the likely hosted Postgres provider, but the architectural boundary is Postgres via the repository adapter — not a vendor SDK in pages or routes.

```text
pages / application
        ↓
PortfolioRepository
        ↓
current: typed content modules (StaticPortfolioRepository)
future: Postgres-backed repository
        ↓
hosted Postgres provider (likely Neon)
```

Pages should keep depending on the repository interface so persistence is a swap of adapters, not a rewrite of routes. No Neon-specific coupling, migrations, or env wiring are planned in the static MVP.

## Why a repository abstraction

`PortfolioRepository` decouples UI and route handlers from storage. Today that means `StaticPortfolioRepository` reading typed content modules. Tomorrow it can mean a Postgres-backed adapter without coupling pages to a database vendor SDK. Keep domain types in `domain/`; keep concrete data in `content/` or a future data layer.

## Analytics

Client-side PostHog (pageviews + outbound link clicks) is initialized from `instrumentation-client.ts` when `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` is set. It does not go through `PortfolioRepository` and is not part of the content/storage abstraction.

## Agent-native workflow

Development standards, staged plans, and design-review tooling live under `.cursor/`. They shape how the site is built and reviewed; they are not imported by the production app. See [AGENTS.md](../../AGENTS.md) and [README.md](../../README.md).
