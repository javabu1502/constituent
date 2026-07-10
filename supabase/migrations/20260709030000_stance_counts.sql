-- Stance capture + live reader-poll aggregates.
--
-- Participants pick support / oppose / undecided before acting; we store the
-- stance on their campaign_action row (never exposed individually — the
-- table is only touched through the service-role client) and keep atomic
-- aggregate counters on the campaign for the "how our readers have landed so
-- far" results bar. Aggregates are public; individual stances are not.
-- Idempotent.

ALTER TABLE public.campaign_actions ADD COLUMN IF NOT EXISTS stance text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'campaign_actions_stance_check'
  ) THEN
    ALTER TABLE public.campaign_actions
      ADD CONSTRAINT campaign_actions_stance_check
      CHECK (stance IS NULL OR stance IN ('support', 'oppose', 'undecided'));
  END IF;
END $$;

ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS support_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS oppose_count integer NOT NULL DEFAULT 0;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS undecided_count integer NOT NULL DEFAULT 0;

-- Atomic stance-counter increment. Mirrors increment_campaign_action_count:
-- SECURITY DEFINER with pinned search_path; validates the stance value.
CREATE OR REPLACE FUNCTION public.increment_campaign_stance_count(campaign_slug text, stance_value text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF stance_value = 'support' THEN
    UPDATE public.campaigns SET support_count = support_count + 1 WHERE slug = campaign_slug;
  ELSIF stance_value = 'oppose' THEN
    UPDATE public.campaigns SET oppose_count = oppose_count + 1 WHERE slug = campaign_slug;
  ELSIF stance_value = 'undecided' THEN
    UPDATE public.campaigns SET undecided_count = undecided_count + 1 WHERE slug = campaign_slug;
  END IF;
END;
$$;
