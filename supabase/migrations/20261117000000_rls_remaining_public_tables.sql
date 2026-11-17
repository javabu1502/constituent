-- Enable row level security on the three public tables that never had it.
--
-- Supabase's security advisor flagged rls_disabled_in_public on 2026-11-14.
-- The 2026-10-23 lockdown covered campaigns and campaign_actions but did not
-- sweep the rest of the schema, so these three were created with RLS off:
--
--   org_target_lists  - an organization's saved lists of officials to contact
--   social_config     - runtime config for the social desk agent, including
--                       its pause killswitch and reply configuration
--   social_posts      - posts the social agent has drafted or published
--
-- Grants had already been revoked from anon, so these were not readable with
-- the public key in practice. RLS being off meant the only thing standing
-- between that data and the public key was a grant, with no second control
-- behind it. This adds the second control.
--
-- Every application read and write of all three goes through the service-role
-- client (src/lib/supabase.ts createAdminClient), which bypasses RLS:
--   org_target_lists  src/app/api/target-lists/route.ts
--   social_config     src/lib/social/{config,circuit-breaker,brand-brain}.ts
--   social_posts      src/app/api/{social/publish,cron/social-desk,
--                     cron/social-digest}/route.ts, src/lib/social/cadence.ts
-- No browser client queries any of them, so no policy is needed for the
-- application to work. RLS with no policy denies everything else.

alter table public.org_target_lists enable row level security;
alter table public.social_config enable row level security;
alter table public.social_posts enable row level security;

-- Drop any lingering policy so "enabled with no policy" means deny-all and
-- nothing is silently granted by an older policy we have forgotten about.
do $$
declare p record;
begin
  for p in
    select tablename, policyname from pg_policies
    where schemaname = 'public'
      and tablename in ('org_target_lists', 'social_config', 'social_posts')
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

-- Verification (with the anon key, via PostgREST):
--   select count(*) from org_target_lists;  -> 0 rows
--   select count(*) from social_config;     -> 0 rows
--   select count(*) from social_posts;      -> 0 rows
-- And in the dashboard: Advisors -> Security shows no rls_disabled_in_public.
