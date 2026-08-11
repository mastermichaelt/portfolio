# Architecture overview

Design tokens and visual guidance: [docs/design-system.md](../design-system.md).

## Goals

This repository will eventually serve four purposes:

1. A public portfolio for job hunting
2. An interactive map of an AI engineering ecosystem
3. A Next.js + Supabase learning project
4. A foundation for a future grounded portfolio chatbot

The current milestone includes a live **ecosystem map** on `/ecosystem`: curated workflow views over static repository data (light orientation spine + three operational canvases). Full entity/relationship mega-graph, Supabase, and chatbot work stay later.

## Milestone progression

1. **Skeleton** — App Router, tooling, empty routes, domain/content/repository stubs, docs
2. **Static content** — real project/article copy served from typed static modules
3. **Ecosystem map** (live) — entities, relationships, and read-only React Flow canvases over static data
4. **Supabase** — migrate storage behind the existing repository interface
5. **Chatbot foundation** — grounded Q&A over portfolio knowledge (later)

## Static-first strategy

Ship meaningful pages from TypeScript modules under `content/` before introducing a database. That keeps early PRs reviewable, deployable on Vercel without secrets, and focused on information architecture rather than infra.

## Future Supabase migration

When persistence is needed (editing, auth, richer queries), add a Supabase-backed `PortfolioRepository` implementation. Pages should keep depending on the repository interface so the migration is a swap of adapters, not a rewrite of routes.

## Why a repository abstraction

`PortfolioRepository` decouples UI and route handlers from storage. Today that means `StaticPortfolioRepository` reading empty placeholder arrays. Tomorrow it can mean Supabase (or another store) without coupling pages to a vendor SDK. Keep domain types in `domain/`; keep concrete data in `content/` or a future data layer.

## Analytics

Client-side PostHog (pageviews + outbound link clicks) is initialized from `instrumentation-client.ts` when `NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN` is set. It does not go through `PortfolioRepository` and is not part of the content/storage abstraction.
