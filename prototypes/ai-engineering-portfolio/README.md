# AI engineering portfolio — HTML prototype (temporary)

**Disposable** Open Design prototype for IA/brand review before the job-search-ready Next.js MVP. Not wired into the Next.js app; open the HTML files directly (or via any static server) for review.

After production surfaces port tokens/chrome from this package, **delete this folder** (`prototype-cleanup` in the active MVP plan). Do not treat these files as a permanent design source of truth.

## Visual system

Warm neutrals + muted sage accent. Tokens and posture live in [`brand-spec.md`](brand-spec.md). Shared chrome: [`css/site.css`](css/site.css), [`js/site.js`](js/site.js).

## Screens

| File             | Surface                                                                                                |
| ---------------- | ------------------------------------------------------------------------------------------------------ |
| `index.html`     | Home — focus, recruiter scan, featured systems                                                         |
| `projects.html`  | Searchable / tag-filtered project index                                                                |
| `project-*.html` | Detail pages (problem → role → overview → decisions → outcomes → evidence → related)                   |
| `articles.html`  | Writing tied to projects                                                                               |
| `system.html`    | Interactive graph across projects, agents, workflows, governance, knowledge, skills, outputs, articles |
| `about.html`     | Bio + contact form                                                                                     |

Featured systems: Codenames AI, AI-assisted editorial workflow, Renovate governance ladder, Editorial MCP, this portfolio.

## Local preview

```bash
# from this directory
npx --yes serve .
# or open index.html in a browser
```

## Scope boundary

This package is a temporary creative prototype for IA, visual direction, and interaction. Production routes remain under `app/`. Do not import these files into the Next.js build. Expected end state: removed from the tree once the production port ships.
