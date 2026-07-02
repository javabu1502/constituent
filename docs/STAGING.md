# Staging environment — `testing.mydemocracy.app`

A full, isolated copy of the stack for exercising the **CWC test key** and any
risky change before it hits production. Same codebase, one `staging` git branch;
isolation comes entirely from **env-var values** (a separate Supabase project, a
test CWC key, no live email). Production is never touched by staging.

## Model

- **Vercel**: the `staging` git branch deploys to `testing.mydemocracy.app` via
  Vercel's branch/Preview environment. Env vars are scoped to that environment.
- **Supabase**: a dedicated second project (`mydemocracy-staging`) with its own
  URL + keys. Migrations and seed run against it just like prod.
- **Guardrails already in code**: a STAGING banner renders on any non-prod
  deploy (`src/lib/site-env.ts`); Resend no-ops without `RESEND_API_KEY`; the
  CWC client points at whatever `CWC_API_BASE_URL` + `CWC_API_KEY` you give it.

## One-time setup

### 1. Supabase (staging project)
1. Create a new project `mydemocracy-staging`.
2. Apply every migration in `supabase/migrations/` (via the `/db-migrate` skill
   linked to the staging project, or `supabase link` + `supabase db push`).
3. Seed campaigns: run with the staging DB in env —
   `NEXT_PUBLIC_SUPABASE_URL=<staging-url> SUPABASE_SECRET_KEY=<staging-secret> npm run seed-campaigns`.
   (The `refresh-*` data scripts write only to committed repo files, so staging
   inherits them from the same checkout — no need to re-run.)
4. Auth → URL configuration: add `https://testing.mydemocracy.app/auth/callback`
   to the allowed redirect URLs (keep `http://localhost:3000/...` for local dev).

### 2. Vercel (staging env)
Create the `staging` branch, then set these env vars scoped to the
Preview/`staging` environment:

| Var | Staging value |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` | staging project's |
| `SUPABASE_SECRET_KEY` | staging project's service-role key |
| `NEXT_PUBLIC_SITE_URL` | `https://testing.mydemocracy.app` |
| `CRON_SECRET`, `UNSUBSCRIBE_SECRET`, `IP_HASH_SALT` | **distinct** from prod |
| `NEXT_PUBLIC_TURNSTILE_SITE_KEY` | `1x00000000000000000000AA` (Cloudflare "always passes" test key) |
| `TURNSTILE_SECRET_KEY` | `1x0000000000000000000000000000000AA` (test secret) |
| `RESEND_API_KEY` | **omit** — staging must not email real users |
| `CWC_API_KEY` | the **TEST** key |
| `CWC_API_BASE_URL` | the CWC **test** base URL |
| `CWC_DELIVERY_AGENT_ID` / `_NAME` / `_EMAIL` | as issued for the test env |
| `NEXT_PUBLIC_CWC_ENABLED` | `true` (turns the client "Deliver to Congress" path on for testing) |
| `ANTHROPIC_API_KEY`, `CONGRESS_API_KEY`, and other API keys | copy from prod (or use test keys) |
| `ADMIN_USER_IDS` / `ADMIN_EMAILS` | your admin identities (for the review queue + CWC diagnostics) |
| `GLOBAL_AI_DAILY_LIMIT` | optional; platform-wide daily cap on AI events (default 10000) |

> Turnstile note: Vercel runs staging with `NODE_ENV=production`, so the dev
> bypass in `turnstile.ts` does NOT apply — the test keys above are what keep the
> widget from blocking automated testing.

### 3. Domain
Point `testing.mydemocracy.app` at the Vercel `staging` branch deployment.

## Production checklist (do NOT cross the keys)
- Production `CWC_API_KEY` / `CWC_API_BASE_URL` = the **prod** values only.
- Keep `NEXT_PUBLIC_CWC_ENABLED` **unset/false** in production until CWC delivery
  has been validated end-to-end on staging.

## Smoke test on staging (CWC test key)
1. Clean message to a federal rep → verdict `pass` row in `message_compliance`,
   CWC test endpoint returns a delivery id, message shows delivered.
2. Fake-name sender (e.g. "Hairy McButthole") → `block` (422), no deliverable
   `messages` row, verdict still logged.
3. Borderline message → `pending_review` (202), shows up in `/admin/compliance`;
   approving it fires the CWC test delivery and flips status to `sent`.
4. Confirm the STAGING banner is visible and no real emails were sent.

## Ongoing
Merge `main` → `staging` (or cherry-pick) to test a change before it ships.
New migrations must be applied to the staging Supabase project too.
