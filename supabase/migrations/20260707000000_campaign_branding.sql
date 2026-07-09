-- White-label branding for UNLISTED (privately shared) campaigns.
--
-- Advocacy orgs running private campaigns can present their own identity:
-- logo, org name, link, brand color, and optionally a custom domain that
-- serves the campaign page directly (host-routed in middleware; the domain
-- must also be attached to the Vercel project and CNAME'd by the org).
-- Public directory campaigns stay My Democracy-branded.
-- Idempotent.

ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS org_name text;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS org_url text;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS org_logo_url text;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS brand_color text;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS custom_domain text;

-- One campaign per domain; lookups happen per-request in middleware.
CREATE UNIQUE INDEX IF NOT EXISTS idx_campaigns_custom_domain
  ON public.campaigns (lower(custom_domain))
  WHERE custom_domain IS NOT NULL;

COMMENT ON COLUMN public.campaigns.custom_domain IS
  'Host that serves this campaign as its homepage (white label). Only honored for approved, unlisted campaigns; requires the domain to be attached to the hosting project.';

-- Public bucket for campaign logos. Uploads go through the server-side admin
-- client only (service role bypasses storage RLS); public read comes free
-- with a public bucket.
INSERT INTO storage.buckets (id, name, public)
VALUES ('campaign-logos', 'campaign-logos', true)
ON CONFLICT (id) DO NOTHING;
