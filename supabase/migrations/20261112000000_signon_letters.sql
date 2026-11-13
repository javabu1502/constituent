-- Sign-on letters: many people putting their name to one letter, instead of
-- many people sending one letter each.
--
-- Congressional offices discount identical form mail, and a staffer who
-- opens four hundred names from across the country discards the list. One
-- letter carrying "here are the 47 people who signed in your district, with
-- addresses" is a different instrument. Delivery is the organization's own:
-- they email it to a staffer they know. Nothing here is sent through CWC,
-- which is per-constituent by design and has no shape for a letter signed by
-- five hundred people.
--
-- Addresses are collected and kept because the point is to prove the signers
-- are constituents. The signer is told plainly that their name and address go
-- to their lawmaker and to the organization running the letter, and that is
-- not optional. Showing their name on the public page is, and defaults off.

-- A third kind of campaign, alongside advocacy and storytelling.
alter table public.campaigns
  drop constraint if exists campaigns_campaign_type_check;

alter table public.campaigns
  add constraint campaigns_campaign_type_check
  check (campaign_type in ('advocacy', 'storytelling', 'signon'));

-- The letter people are signing. Null for every other campaign type.
alter table public.campaigns
  add column if not exists letter_body text;

comment on column public.campaigns.letter_body is
  'Sign-on campaigns only: the single letter signatories put their name to.';

create table if not exists public.campaign_signatures (
  id uuid primary key default gen_random_uuid(),
  campaign_id uuid not null references public.campaigns(id) on delete cascade,
  name text not null,
  email text not null,
  -- Address as given. Kept rather than reduced to a district, because a
  -- district assignment that cannot be re-derived cannot be corrected when
  -- boundaries are redrawn, and because the address is the evidence of
  -- constituency that makes the letter worth reading.
  street text,
  city text,
  state text,
  zip text,
  -- Resolved at signing from the Census geocoder, matching org_supporters.
  congressional_district text,
  state_upper_district text,
  state_lower_district text,
  -- False when the street could not be geocoded: the signature still counts,
  -- but it is not filed under a district rather than filed under the wrong one.
  district_resolved boolean not null default false,
  -- Optional line in the signer's own words, shown to the office with their name.
  personal_note text,
  -- The signer's choice, and only about the public page. Sharing with the
  -- lawmaker and the organization is a condition of signing, not a checkbox.
  show_name_publicly boolean not null default false,
  -- The words the signer was shown when they agreed, kept verbatim so a
  -- later change to the copy cannot rewrite what they consented to.
  consent_text text,
  consented_at timestamptz,
  withdrawn_at timestamptz,
  created_at timestamptz not null default now()
);

-- One signature per person per letter. Signing twice updates rather than
-- duplicates, which is the bug campaign_actions has: it holds one row per
-- visit, so a person who came back was counted as two people until
-- 2026-11-12. Lowercased by the route before writing, as org_supporters does.
create unique index if not exists campaign_signatures_campaign_email_idx
  on public.campaign_signatures (campaign_id, email);

-- The export groups by office, so these are the reads that matter.
create index if not exists campaign_signatures_campaign_cd_idx
  on public.campaign_signatures (campaign_id, congressional_district);
create index if not exists campaign_signatures_campaign_upper_idx
  on public.campaign_signatures (campaign_id, state_upper_district);
create index if not exists campaign_signatures_campaign_lower_idx
  on public.campaign_signatures (campaign_id, state_lower_district);

-- Service-role only, like every other operational table here. No policies, so
-- the anon key cannot read a signatory list or anyone's address, including
-- the names whose owners chose to show them: the public page renders those
-- through the admin client, filtered.
alter table public.campaign_signatures enable row level security;

comment on table public.campaign_signatures is
  'Signatories on a sign-on letter. Addresses are shared with the lawmaker and the organization by design; show_name_publicly governs the public page only.';
