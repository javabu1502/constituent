-- "Join the campaign": an organization's own supporter list, and the org
-- identity it hangs off.
--
-- Asked for by the Nevada Children's Lobby (2026-11-03). Today the only way
-- someone enters an org's orbit is by sending a message: campaign_actions
-- carries participant_email, but only for people who completed an action on
-- one campaign. An org that wants a standing list of people to mobilise when
-- a bill moves has nowhere to put them, and nothing that survives from one
-- campaign to the next.
--
-- Districts are stored at signup, not derived later. The value an advocacy
-- org gets from this list is "40 supporters in Assembly District 24, whose
-- member is Erica Roth" — a sentence you can say in a meeting. That needs
-- the full street address, because ZIP codes cross district lines.

-- Org identity. An "organization" is a profiles row with account_type =
-- 'organization'; it had no public handle, so there was no org-level URL to
-- host or embed anything at.
alter table public.profiles
  add column if not exists org_slug text unique;

comment on column public.profiles.org_slug is
  'Public handle for an organization account: /org/<slug> and /embed/org/<slug>. Null for constituents.';

create table if not exists public.org_supporters (
  id uuid primary key default gen_random_uuid(),
  -- The organization that owns this supporter (profiles.user_id).
  org_user_id uuid not null,
  name text not null,
  email text not null,
  -- Address as given. Kept because a district assignment that cannot be
  -- re-derived cannot be corrected when boundaries are redrawn.
  street text,
  city text,
  state text,
  zip text,
  -- Resolved at signup from the Census geocoder. Bare numbers ("13", "24"),
  -- matching BASENAME and the district property in src/data/districts.
  state_upper_district text,
  state_lower_district text,
  congressional_district text,
  county_name text,
  -- False when the street could not be geocoded: the supporter still counts,
  -- but they are not placed on the map rather than being placed wrongly.
  district_resolved boolean not null default false,
  -- Where they signed up, so an org can tell its own site from ours.
  source text not null default 'org_page',
  -- Consent is per-organization and recorded with the words shown.
  consent_text text,
  consented_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz not null default now()
);

-- One row per person per org. Signing up twice updates rather than duplicates,
-- which keeps district counts honest.
--
-- Plain columns, not lower(email): ON CONFLICT has to name an index that
-- matches, and a functional index would not match the upsert the join route
-- issues. The route lowercases the address before writing instead.
create unique index if not exists org_supporters_org_email_idx
  on public.org_supporters (org_user_id, email);

create index if not exists org_supporters_org_upper_idx
  on public.org_supporters (org_user_id, state_upper_district);
create index if not exists org_supporters_org_lower_idx
  on public.org_supporters (org_user_id, state_lower_district);

-- Service-role only, like every other operational table here: the app reads
-- and writes through createAdminClient, which bypasses RLS. No policies, so
-- the anon key cannot read one org's supporter list (or anyone's address).
alter table public.org_supporters enable row level security;

comment on table public.org_supporters is
  'Per-organization supporter list from the "join" form. Not message senders; see campaign_actions for those.';
