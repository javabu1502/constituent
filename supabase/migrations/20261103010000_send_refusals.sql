-- Why a send attempt never became a message.
--
-- Audit 2026-11-03: /api/track-send has eight ways to return before it writes
-- a messages row (rate limit, bad JSON, schema, CAPTCHA, legislator cooldown,
-- per-office quota, closed campaign, insert failure). Every one of them was
-- console-only, so a refused send left no trace in the database at all.
--
-- The visible result: 766 AI chat calls and 94 drafts in 30 days against ~16
-- messages, with 342 calls on 2026-10-13 producing zero sends and nothing
-- anywhere recording why. Client analytics cannot see these: the refusal is
-- the server's answer, and the person is usually gone before any event fires.
--
-- No message content and no email address. A reason, a coarse identity for
-- rate-limit forensics, and a timestamp.

create table if not exists public.send_refusals (
  id bigserial primary key,
  -- Machine reason, matched to the early return that produced it.
  reason text not null,
  -- HTTP status the caller received, so a spike is easy to classify.
  status smallint not null,
  campaign_id uuid,
  user_id uuid,
  -- Same hashed-IP scheme as ai_usage_logs. Never a raw address.
  ip_hash text,
  legislator_id text,
  created_at timestamptz not null default now()
);

create index if not exists send_refusals_created_at_idx on public.send_refusals (created_at desc);
create index if not exists send_refusals_reason_created_at_idx on public.send_refusals (reason, created_at desc);

-- Service-role only, like every other operational table here. No policies:
-- the app writes through createAdminClient, which bypasses RLS.
alter table public.send_refusals enable row level security;
