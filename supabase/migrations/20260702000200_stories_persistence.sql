-- Activate the `stories` table for storytelling-campaign persistence.
--
-- Storytelling campaigns now retain submitted stories so the organizer can
-- track and follow up (they were previously never stored). Store-by-default
-- with a client opt-out. Identity is persisted ONLY at the attribution level
-- the storyteller chose (the route writes NULLs for anonymous), so the DB never
-- holds more identity than was consented to.
--
-- The base table (id, campaign_id, user_id, title, body, attribution_level,
-- consent_at, consent_usage_snapshot, status, revoked_at, created_at, updated_at)
-- and its RLS "view own stories" SELECT policy come from 20260626_storytelling_campaigns.
-- Idempotent.

-- Anonymous storytellers have no account.
ALTER TABLE public.stories ALTER COLUMN user_id DROP NOT NULL;

-- Optional contact + location, captured per the storyteller's sharing choices.
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS storyteller_email text;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS state text;
-- Salted hash of the sender IP for anonymous submissions (never a raw IP).
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS ip_hash text;

COMMENT ON COLUMN public.stories.storyteller_email IS 'Optional contact email; NULL for anonymous attribution.';
COMMENT ON COLUMN public.stories.city IS 'Shared only when the storyteller opts into location sharing; NULL for anonymous.';

-- Creator export / dashboard reads only active stories, newest first.
CREATE INDEX IF NOT EXISTS idx_stories_campaign_active
  ON public.stories (campaign_id, created_at DESC)
  WHERE status = 'active';
