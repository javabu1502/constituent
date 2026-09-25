-- Saved target lists: an org builds a named set of officials once (their
-- champions, a delegation) and reuses it across actions. Officials are
-- stored as {id, name, level, state, chamber, party} snapshots; the id is
-- a bioguide (federal) or Open States id (state), matched against the
-- participant's resolved reps at send time.
create table if not exists public.org_target_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 1 and 80),
  officials jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);
create index if not exists org_target_lists_user_idx on public.org_target_lists (user_id);
