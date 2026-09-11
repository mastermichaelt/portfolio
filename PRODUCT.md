# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Primary audience: hiring managers, engineering leaders, and peer engineers evaluating Michael Truong for senior software engineering roles — especially AI-enabled product and platform work.

Secondary audience: engineers exploring how experimentation discipline, verification contracts, and agent-native workflows connect in one practitioner's practice.

## Product Purpose

A public portfolio that lets visitors quickly understand who Michael is, what he has shipped, and how his projects connect — then drill into case studies, articles, and an interactive ecosystem map as evidence.

Success means a visitor leaves with a clear mental model of Michael's scope (experimentation and measurement across Atlassian and product work, verification discipline, agent harness systems) and concrete links to proof (projects, DEV articles, GitHub, ecosystem map).

## Positioning

Not a generic resume site or template portfolio — a systems-oriented map of real shipped work with curated narrative and an ecosystem spine that mirrors how Michael actually builds (projects → workflows → governance → evidence).

## Operating Context

Static-first Next.js site deployed on Vercel without required secrets. Content is typed TypeScript modules under `content/` behind a `PortfolioRepository` abstraction. PostHog analytics is optional client-side instrumentation.

## Capabilities and Constraints

- Routes: home, about, projects (with case-study slugs), articles, ecosystem map
- Ecosystem map: read-only React Flow canvases over static curated data
- No auth, no CMS, no chatbot in the current milestone
- Repository abstraction preserves a future Supabase migration path

## Evidence on Hand

Real project copy, articles, GitHub links, and ecosystem entities from committed content modules. Agents must not invent employers, metrics, or shipped features not present in `content/` or canonical career inventory.

## Product Principles

1. Evidence over adjectives — let shipped work and field reports carry credibility
2. Progressive disclosure — scannable sections before dense detail
3. Systems thinking visible — show how pieces connect, not isolated tiles
4. Static-first deployability — meaningful pages without backend secrets
5. Honest scope — distinguish live surfaces from roadmap stubs

## Accessibility & Inclusion

Respect stated accessibility expectations in production code. No product-specific compliance certification is claimed.
