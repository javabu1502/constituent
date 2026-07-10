-- Hard separation: OFFICIAL (curated) vs USER-CREATED campaigns.
--
-- Official campaigns are My Democracy's neutral weigh-ins: public directory,
-- indexable, promotable on social. User-created campaigns (advocacy or
-- storytelling, in the creator's own voice, no neutrality requirement) are
-- ALWAYS unlisted: reachable by direct link and the creator's dashboard only,
-- never in the directory, discover, sitemap, or promotion surfaces.
--
-- Note: the existing campaign_type column ('advocacy' | 'storytelling') is
-- kept as-is; "weigh-in" === is_official = true. Approval still controls
-- live-ness; official/public is a separate curated flag set only by us.
-- Idempotent.

ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS is_official boolean NOT NULL DEFAULT false;

-- Backfill: the current curated set is exactly the approved, public advocacy
-- campaigns (all authored by My Democracy).
UPDATE public.campaigns
SET is_official = true
WHERE campaign_type = 'advocacy'
  AND visibility = 'public'
  AND approval_status = 'approved'
  AND is_official = false;

-- User-created campaigns must be unlisted, always.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'user_campaigns_unlisted'
  ) THEN
    ALTER TABLE public.campaigns
      ADD CONSTRAINT user_campaigns_unlisted
      CHECK (is_official OR visibility = 'unlisted');
  END IF;
END $$;

COMMENT ON COLUMN public.campaigns.is_official IS
  'Curated My Democracy weigh-in: public, indexable, promotable. False = user-created, always unlisted/link-only, never promoted.';
