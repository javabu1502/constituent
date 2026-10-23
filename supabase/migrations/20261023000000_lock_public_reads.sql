-- Lock campaign_actions and campaigns against reads with the public anon key.
--
-- Audit 2026-10-23: with NEXT_PUBLIC_SUPABASE_ANON_KEY alone, PostgREST returned
-- every campaign_actions row (participant_name, participant_email, city, state,
-- stance) and every campaigns row (all columns, including recipient_email,
-- custom_domain, creator_id and every unlisted or storytelling slug).
--
-- Every application read of these tables goes through the service-role client
-- (src/lib/supabase.ts createAdminClient), which bypasses RLS. The cookie-based
-- client (src/lib/supabase/server.ts) is used for auth only. No client component
-- queries tables directly. So no policy is needed for the app to work; the
-- policies below exist only so a signed-in creator can still read their own
-- campaigns through PostgREST if a future feature wants it.

alter table public.campaign_actions enable row level security;
alter table public.campaigns enable row level security;

do $$
declare p record;
begin
  -- campaign_actions: drop every policy. Writes are service-role only
  -- (participate route), reads are service-role only (analytics, exports).
  for p in
    select policyname from pg_policies
    where schemaname = 'public' and tablename = 'campaign_actions'
  loop
    execute format('drop policy if exists %I on public.campaign_actions', p.policyname);
  end loop;

  -- campaigns: drop every SELECT policy that is not scoped to the creator.
  for p in
    select policyname, qual from pg_policies
    where schemaname = 'public' and tablename = 'campaigns' and cmd = 'SELECT'
  loop
    if p.qual is null or position('auth.uid()' in p.qual) = 0 then
      execute format('drop policy if exists %I on public.campaigns', p.policyname);
    end if;
  end loop;
end $$;

-- Creator-scoped read, idempotent.
drop policy if exists "campaigns_creator_select" on public.campaigns;
create policy "campaigns_creator_select" on public.campaigns
  for select to authenticated
  using (creator_id = auth.uid());

-- Verification (run after applying, with the anon key):
--   select count(*) from campaign_actions;  -> 0 rows via PostgREST
--   select count(*) from campaigns;         -> 0 rows via PostgREST
