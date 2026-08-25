-- Site-wide content cache (news feed, daily brief).
--
-- The news routes were written against a `cache_key`-keyed cache table that
-- never existed: prod's feed_cache is the per-user feed cache keyed by
-- (user_id, feed_type), so every cache read AND write in /api/news/civic and
-- /api/news/brief silently errored. Consequences: the "one AI call per day"
-- brief regenerated on every request, and each regeneration was a fresh
-- opportunity for the model to hallucinate stale "news" from training data.
-- This table is the schema those routes actually expect.
create table if not exists content_cache (
  cache_key text primary key,
  data jsonb not null,
  created_at timestamptz not null default now()
);

-- Service-role only, like the social desk tables: RLS on, no policies.
alter table content_cache enable row level security;
