-- Where a supporter is sent after they act.
--
-- Organizations ask for this so their own analytics record the conversion:
-- the supporter lands on the organization's thank-you page, that page's
-- tracking fires on the organization's own domain, under the organization's
-- own privacy policy. It is what lets us keep running no third-party
-- analytics on campaign pages.
--
-- The host is checked against the campaign's own org_url / custom_domain in
-- src/lib/redirect-target.ts before this is written. That check cannot live
-- here, because "is this host the organization's" depends on columns that can
-- change after the redirect is set. The constraint below is the floor, not
-- the check: https only, so no javascript:, data: or vbscript: target can be
-- stored even if an API route is ever added that forgets to validate.

alter table public.campaigns
  add column if not exists redirect_url text;

alter table public.campaigns
  drop constraint if exists campaigns_redirect_url_https;

alter table public.campaigns
  add constraint campaigns_redirect_url_https
  check (
    redirect_url is null
    or (redirect_url like 'https://%' and redirect_url not like '%@%')
  );

comment on column public.campaigns.redirect_url is
  'Optional https page on the organization own domain to send a supporter to after they act. Host validated against org_url/custom_domain by src/lib/redirect-target.ts; the CHECK here only guarantees the scheme.';
