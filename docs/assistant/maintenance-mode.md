# Assistant maintenance mode (Phase 0)

Temporarily disable **public** grounded generation on `/assistant` and `POST /api/assistant/generate` without touching Neon retrieval data, evaluation history, or operator scripts.

## Flag

| Variable                   | Default                  | Effect when disabled                                                                          |
| -------------------------- | ------------------------ | --------------------------------------------------------------------------------------------- |
| `ASSISTANT_PUBLIC_ENABLED` | `true` (unset = enabled) | API returns **503** `service_unavailable`; `/assistant` shows maintenance copy (no composer). |

Accepted false values: `0`, `false`, `no` (case-insensitive). Accepted true values: `1`, `true`, `yes`.

Parsing lives in [`lib/assistant/api/config.ts`](../../lib/assistant/api/config.ts). The handler checks the flag **before** opening a database pool or running generation ([`handle-generate-post.ts`](../../lib/assistant/api/handle-generate-post.ts)).

## What stays available

- `DATABASE_URL` retrieval index and evaluation tables
- `npm run assistant:ingest`, `assistant:retrieve`, `assistant:answer`, `assistant:db:*`, and Vitest suites
- Other site routes

## Operator toggle

### Local

```bash
# In .env.local (or export for one shell)
ASSISTANT_PUBLIC_ENABLED=false
npm run dev
```

Verify:

```bash
curl -sS -o /dev/null -w "%{http_code}\n" \
  -X POST http://localhost:3000/api/assistant/generate \
  -H "Content-Type: application/json" \
  -d '{"question":"Who is Michael?"}'
# Expect 503

open http://localhost:3000/assistant
# Expect maintenance message, no working composer
```

Re-enable: remove the variable or set `ASSISTANT_PUBLIC_ENABLED=true`, restart dev server.

### Vercel (preview / production)

1. Project → **Settings** → **Environment Variables**
2. Set `ASSISTANT_PUBLIC_ENABLED=false` for the target environment(s)
3. Redeploy (or wait for the next deployment that picks up env)

**Rollout order:** For a deploy that **introduces** the maintenance gate, set the env var **before** or **with** the deploy that contains this code — otherwise old code ignores the flag. To **turn off** public generation on code already on `main`, set `false` and redeploy; no code revert required. `/assistant` is `force-dynamic` so the maintenance page tracks the same env as the API after the server picks up new env (Vercel still requires a deployment for env var changes to apply).

Re-open public generation: set `ASSISTANT_PUBLIC_ENABLED=true` (or delete the variable) and redeploy. See [2026-10-30-assistant-04-production-reopening.plan.md](../../.cursor/plans/2026-10-30-assistant-04-production-reopening.plan.md) for the full reopening checklist.

## API contract (maintenance active)

```http
HTTP/1.1 503 Service Unavailable
Retry-After: 3600
Content-Type: application/json

{
  "error": {
    "code": "service_unavailable",
    "message": "Public assistant generation is temporarily unavailable. Please check back later."
  }
}
```

## Related docs

- [assistant-database.md](./assistant-database.md) — generation API section
- [2026-10-30-assistant-roadmap.plan.md](../../.cursor/plans/2026-10-30-assistant-roadmap.plan.md) — Phase 0
