-- What an organization is, in its own words.
--
-- The org profile already carries a name, a website, a logo and a brand
-- color, and /org/[slug] has been a public page for a while. None of it says
-- who the organization is. A constituent deciding whether to put their name
-- and address behind a campaign has nothing to read, and the campaign page
-- carries a logo with no context.
--
-- Shown on the public org page and at the top of the organization's
-- campaigns.
alter table public.profiles
  add column if not exists org_about text;

alter table public.profiles
  drop constraint if exists profiles_org_about_len;

alter table public.profiles
  add constraint profiles_org_about_len
  check (org_about is null or char_length(org_about) <= 1000);

comment on column public.profiles.org_about is
  'Short description of the organization, shown on its public page and its campaigns. Max 1000 characters.';
