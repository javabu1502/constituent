-- Let a campaign target a city or county body.
--
-- target_level was federal, state or both, which is every legislature but no
-- council. A Reno rezoning is decided by a planning commission and a city
-- council, so an organization working that case had nowhere to put it: the
-- participation flow would have routed the comment to Congress.
--
-- The representatives API already returns local officials, and the delivery
-- resolver already falls back from email to a contact form, which is what a
-- council seat usually publishes. Widening this constraint was the gap.
alter table public.campaigns
  drop constraint if exists campaigns_target_level_check;

alter table public.campaigns
  add constraint campaigns_target_level_check
  check (target_level in ('federal', 'state', 'both', 'local'));

comment on column public.campaigns.target_level is
  'Which officials the campaign writes to: federal, state, both, or local (city/county bodies).';
