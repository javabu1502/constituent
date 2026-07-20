-- Social Desk: state for the autonomous social pipeline.
-- All tables are service-role only (the agent authenticates with
-- SUPABASE_SECRET_KEY): RLS is enabled with NO policies, so anon/auth
-- clients get nothing and only the service role (which bypasses RLS) can
-- read/write. Idempotent (IF NOT EXISTS / ON CONFLICT) so it is safe to
-- re-run and safe under `supabase db push`.

-- Scout output: candidate items (news, bill movement, our own weigh-in data)
-- scored for whether they're worth posting/replying to.
create table if not exists social_signals (
  id uuid primary key default gen_random_uuid(),
  source text not null,                    -- 'news' | 'bill' | 'weigh_in'
  external_ref text,                       -- upstream id / url key for dedup
  title text,
  summary text,
  url text,
  issue_area text,
  classification text,                     -- 'actionable' | 'informational'
  campaign_slug text,                      -- linked/created weigh-in, if any
  score numeric default 0,
  status text not null default 'new',      -- 'new' | 'used' | 'skipped'
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists social_signals_status_idx on social_signals (status, created_at desc);
create unique index if not exists social_signals_source_ref_idx
  on social_signals (source, external_ref) where external_ref is not null;

-- Posts: draft -> queued -> posted, with metrics written back by the Analyst.
create table if not exists social_posts (
  id uuid primary key default gen_random_uuid(),
  platform text not null,                  -- 'bluesky' | 'x' | ...
  lane text,                               -- posting lane (news drop, by-the-numbers, ...)
  body text not null,
  link_url text,
  issue_area text,                         -- for the balanced-issue-diet tracker
  content_hash text,                       -- for near-duplicate detection
  signal_id uuid references social_signals (id) on delete set null,
  campaign_slug text,
  status text not null default 'draft',    -- draft|pending_approval|approved|queued|posted|skipped|failed
  dry_run boolean not null default false,
  scheduled_for timestamptz,
  posted_at timestamptz,
  external_post_id text,                    -- Bluesky at:// uri (or platform id)
  external_post_cid text,
  guardrail_report jsonb,                   -- which gates ran + verdicts
  metrics jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists social_posts_status_idx on social_posts (platform, status, created_at desc);
create index if not exists social_posts_hash_idx on social_posts (content_hash);
create index if not exists social_posts_issue_idx on social_posts (issue_area, created_at desc);

-- Replies: the engager's drafts, with approval status. Elected-official
-- replies are human-gated (requires_human = true -> pending_approval).
create table if not exists social_replies (
  id uuid primary key default gen_random_uuid(),
  platform text not null,
  lane text,
  target_uri text not null,                -- the post being replied to
  target_author text,
  target_text text,
  draft_body text not null,
  requires_human boolean not null default false,
  status text not null default 'draft',    -- draft|pending_approval|approved|posted|skipped|rejected
  dry_run boolean not null default false,
  external_post_id text,
  posted_at timestamptz,
  guardrail_report jsonb,
  created_at timestamptz not null default now()
);
create index if not exists social_replies_status_idx on social_replies (status, created_at desc);
create unique index if not exists social_replies_target_idx on social_replies (platform, target_uri);

-- Playbook: the learning loop's memory (findings, rules, metric snapshots the
-- Analyst writes back). Steers future runs alongside the brand brain.
create table if not exists social_playbook (
  id uuid primary key default gen_random_uuid(),
  kind text not null,                      -- 'finding' | 'rule' | 'metric'
  content text not null,
  weight numeric default 1,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

-- Runtime control: the kill switch and circuit-breaker state live here as
-- single rows so they can be flipped without a deploy. is_paused = true halts
-- ALL posting and replying; the circuit breaker trips itself on error spikes.
create table if not exists social_config (
  key text primary key,
  value jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);
insert into social_config (key, value) values
  ('killswitch', '{"is_paused": true, "reason": "not launched yet"}'::jsonb),
  ('circuit_breaker', '{"tripped": false, "consecutive_failures": 0, "error_count": 0}'::jsonb),
  ('mode', '{"mode": "gated"}'::jsonb),
  ('reply_config', '{"enabled": false, "mode": "gated"}'::jsonb)
on conflict (key) do nothing;

alter table social_signals enable row level security;
alter table social_posts   enable row level security;
alter table social_replies enable row level security;
alter table social_playbook enable row level security;
alter table social_config  enable row level security;
