-- Atomic story-count increment for storytelling campaigns.
-- Mirrors increment_campaign_action_count. Every submission (anonymous or
-- logged-in) increments the running total; only logged-in stories are persisted.
CREATE OR REPLACE FUNCTION public.increment_campaign_story_count(campaign_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.campaigns
  SET story_count = story_count + 1
  WHERE slug = campaign_slug;
END;
$$;
