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
