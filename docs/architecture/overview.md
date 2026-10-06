# Architecture overview

Production site: [michaeltruong.ai](https://michaeltruong.ai). Design tokens and visual guidance: [docs/design-system.md](../design-system.md).

## Goals

This repository serves four overlapping purposes:

1. A **public portfolio** for job hunting and engineering credibility
2. An **interactive map** of an AI engineering ecosystem (`/ecosystem`)
3. A **Next.js learning project** with a clean path to Supabase later
4. A **foundation** for a future grounded portfolio chatbot

The current milestone is a static content MVP on Vercel: home, projects, articles, about, and a live ecosystem map (orientation spine + operational workflow canvases). Supabase persistence stays later. Assistant architecture is documented at [portfolio-assistant.md](./portfolio-assistant.md); implementation is not started.

## Milestone progression

1. **Skeleton** — App Router, tooling, empty routes, domain/content/repository stubs, docs
2. **Static content** (shipped) — evidence-backed copy from typed modules under `content/`
3. **Ecosystem map** (shipped) — entities, relationships, read-only React Flow canvases
4. **Supabase** — migrate storage behind the existing repository interface
5. **Chatbot foundation** — grounded Q&A over portfolio knowledge ([architecture](./portfolio-assistant.md); implementation later)

## Static-first strategy

Ship meaningful pages from TypeScript modules under `content/` before introducing a database. That keeps PRs reviewable, deployable on Vercel without secrets, and focused on information architecture rather than infra.

## Future Supabase migration

When persistence is needed (editing, auth, richer queries), add a Supabase-backed `PortfolioRepository` implementation. Pages should keep depending on the repository interface so the migration is a swap of adapters, not a rewrite of routes.

## Why a repository abstraction

`PortfolioRepository` decouples UI and route handlers from storage. Today that means `StaticPortfolioRepository` reading typed content modules. Tomorrow it can mean Supabase (or another store) without coupling pages to a vendor SDK. Keep domain types in `domain/`; keep concrete data in `content/` or a future data layer.

## Analytics

Client-side PostHog (pageviews + outbound link clicks) is initialized from `instrumentation-client.ts` when `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` is set. It does not go through `PortfolioRepository` and is not part of the content/storage abstraction.

## Agent-native workflow

Development standards, staged plans, and design-review tooling live under `.cursor/`. They shape how the site is built and reviewed; they are not imported by the production app. See [AGENTS.md](../../AGENTS.md) and [README.md](../../README.md).
