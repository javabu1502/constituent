-- AI-themed campaign insights cache.
-- Expensive to generate (an LLM pass over a campaign's stories or messages), so
-- we snapshot the result per (campaign, kind) and regenerate on demand rather
-- than on every analytics page load. Service-role only (RLS on, no policies) —
-- reads/writes happen through the admin client in owner-gated routes.
create table if not exists public.campaign_insights (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  kind text not null check (kind in ('stories', 'messages')),
  insights jsonb not null,                 -- { summary, themes: [{label, prevalence, quote}] }
  source_count integer not null default 0, -- how many stories/messages fed the analysis
  model_version text,
  created_at timestamptz not null default now(),
  unique (campaign_id, kind)
);

alter table public.campaign_insights enable row level security;

create index if not exists campaign_insights_campaign_idx
  on public.campaign_insights (campaign_id, kind);
