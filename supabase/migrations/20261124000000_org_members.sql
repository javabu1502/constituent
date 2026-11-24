-- Organization teams: an organization is more than one person.
--
-- Until now an organization WAS a profile row. profiles.org_slug is unique,
-- the dashboard reads campaigns where creator_id is the signed-in user, and
-- org_supporters keys to a single org_user_id. So a second person at the same
-- organization could only ever become a second organization.
--
-- That has already happened. The Children's Cabinet exists twice, as
-- lgonzales@ and storytelling@, created ten weeks apart and differing in the
-- display name only by a curly apostrophe. Neither account can see the
-- other's campaigns or stories. WECA then asked for four people on one
-- account, which under the old model was not a thing that could be granted.
--
-- Rather than move every org field off profiles and rewrite four tables, this
-- keeps the owning profile as the organization's record and adds membership
-- beside it. The owner's user_id remains the organization's identity, so
-- profiles.org_slug, org_supporters.org_user_id and org_target_lists.user_id
-- keep working untouched.

create table if not exists public.org_members (
  org_user_id uuid not null references auth.users (id) on delete cascade,
  member_user_id uuid not null references auth.users (id) on delete cascade,
  -- owner is the profile that holds the org's name, slug and branding, and is
  -- the only role that cannot be removed. admin may invite and remove others.
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  invited_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  primary key (org_user_id, member_user_id)
);

-- A person belongs to exactly one organization. Resolution has to be
-- unambiguous: if someone could be a member of two, every query would need to
-- ask "which one am I acting for", and there is nowhere in the product to ask
-- it. A person who genuinely works for two organizations uses two addresses,
-- which is also how the sign-in code reaches them.
create unique index if not exists org_members_member_idx
  on public.org_members (member_user_id);

create index if not exists org_members_org_idx on public.org_members (org_user_id);

comment on table public.org_members is
  'Who may act for an organization. The org is identified by its owning '
  'profile''s user_id (org_user_id). Resolution lives in src/lib/org-context.ts.';

-- Every existing organization becomes the sole member of itself, so that
-- resolution has one shape rather than two: look the person up here, and fall
-- back to "you are your own organization" only for accounts that are not
-- organizations at all.
insert into public.org_members (org_user_id, member_user_id, role)
select user_id, user_id, 'owner'
from public.profiles
where account_type = 'organization'
on conflict do nothing;

-- Which organization owns this campaign, as distinct from which person typed
-- it. creator_id stays and keeps meaning the author, so a campaign still
-- records who made it once a team has four people in it.
alter table public.campaigns add column if not exists org_user_id uuid;

-- Backfill: every campaign that exists today was made by its organization's
-- only account, so the author is the owner.
update public.campaigns set org_user_id = creator_id where org_user_id is null;

create index if not exists campaigns_org_user_idx on public.campaigns (org_user_id);

comment on column public.campaigns.org_user_id is
  'The organization this campaign belongs to (owner profile user_id). '
  'creator_id remains the individual author.';

-- Same posture as every other table here: the application reads and writes
-- through the service-role client, which bypasses RLS, and no browser client
-- queries this table. RLS enabled with no policy denies everything else, so
-- the public anonymous key cannot read who works where.
alter table public.org_members enable row level security;

do $$
declare p record;
begin
  for p in
    select tablename, policyname from pg_policies
    where schemaname = 'public' and tablename = 'org_members'
  loop
    execute format('drop policy if exists %I on public.%I', p.policyname, p.tablename);
  end loop;
end $$;

revoke all on public.org_members from anon;

-- Transferring ownership.
--
-- Identifying the organization by its owner's user_id kept org_slug,
-- org_supporters and org_target_lists working untouched, at the cost of
-- weaving that id through five tables. So "Kelly leaves WECA" is a rewrite,
-- not a one-row update, and a rewrite half-done would strand an organization
-- between two owners: its campaigns under one, its supporters under another.
--
-- A function, so it is one transaction and cannot land half-done.
--
-- The organization's identity lives on the owner's profile, so it moves with
-- the role. The outgoing owner stays on as an admin rather than being dropped:
-- losing your own organization because someone handed you the keys would be a
-- surprising way to find out.
create or replace function public.transfer_org_ownership(
  old_owner uuid,
  new_owner uuid
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  org record;
begin
  if old_owner = new_owner then
    raise exception 'transfer_org_ownership: old and new owner are the same person';
  end if;

  select account_type, org_name, org_slug, org_url, org_logo_url, brand_color, org_about
    into org
  from public.profiles
  where user_id = old_owner;

  -- FOUND rather than `org is null`: a record of all-null columns is itself
  -- null, so the two cases are indistinguishable without it.
  if not found or org.account_type is distinct from 'organization' then
    raise exception 'transfer_org_ownership: % does not own an organization', old_owner;
  end if;

  if not exists (
    select 1 from public.org_members
    where org_user_id = old_owner and member_user_id = new_owner
  ) then
    raise exception 'transfer_org_ownership: % is not a member of that organization', new_owner;
  end if;

  -- The slug is unique across profiles, so it has to leave the old row before
  -- it can land on the new one.
  update public.profiles
     set org_slug = null,
         account_type = 'constituent',
         org_name = null, org_url = null, org_logo_url = null,
         brand_color = null, org_about = null
   where user_id = old_owner;

  update public.profiles
     set account_type = 'organization',
         org_name = org.org_name,
         org_slug = org.org_slug,
         org_url = org.org_url,
         org_logo_url = org.org_logo_url,
         brand_color = org.brand_color,
         org_about = org.org_about
   where user_id = new_owner;

  -- Everything the organization owns follows its identity.
  update public.campaigns        set org_user_id = new_owner where org_user_id = old_owner;
  update public.org_supporters   set org_user_id = new_owner where org_user_id = old_owner;
  update public.org_target_lists set user_id     = new_owner where user_id     = old_owner;

  -- Re-key membership last, so a failure above leaves the team intact.
  update public.org_members set org_user_id = new_owner where org_user_id = old_owner;
  update public.org_members set role = 'owner' where org_user_id = new_owner and member_user_id = new_owner;
  update public.org_members set role = 'admin' where org_user_id = new_owner and member_user_id = old_owner;
end;
$$;

comment on function public.transfer_org_ownership(uuid, uuid) is
  'Move an organization to a new owner atomically. The outgoing owner stays '
  'on as an admin. Called from src/lib/org-context.ts.';

revoke all on function public.transfer_org_ownership(uuid, uuid) from anon, authenticated;
