-- Use log + permission loop for collected stories.
--
-- Every time an organization uses a story it records the use here. A use the
-- storyteller already granted at consent is simply logged. A use they did not
-- grant becomes a permission request: the storyteller gets an email with
-- approve/decline links and the row's status records their answer. Approval
-- covers that one described use, never a blanket grant.
-- Service-role only: RLS on, no policies.
CREATE TABLE IF NOT EXISTS public.story_uses (
  id            uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  story_id      uuid NOT NULL REFERENCES public.stories(id) ON DELETE CASCADE,
  campaign_id   uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  requested_by  uuid NOT NULL,            -- campaign creator (auth user id)
  use_type      text NOT NULL,            -- a STORY_USAGE_OPTIONS value
  note          text NOT NULL,            -- what, where, when (shown to the storyteller)
  status        text NOT NULL CHECK (status IN ('logged', 'requested', 'approved', 'declined')),
  created_at    timestamptz NOT NULL DEFAULT now(),
  responded_at  timestamptz,
  response_note text
);
CREATE INDEX IF NOT EXISTS story_uses_story_idx ON public.story_uses (story_id, created_at DESC);
CREATE INDEX IF NOT EXISTS story_uses_campaign_idx ON public.story_uses (campaign_id, created_at DESC);
ALTER TABLE public.story_uses ENABLE ROW LEVEL SECURITY;
