-- Lightweight, non-identifying record of storytelling submissions.
-- We deliberately do NOT store the story body, the storyteller, attribution, or
-- any personal data — only a short, topical title ("subject") plus which campaign
-- and when. This lets a creator see the subjects of stories collected without us
-- retaining anyone's personal story (those live only in the creator's inbox).
CREATE TABLE IF NOT EXISTS public.story_subjects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  title text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_story_subjects_campaign ON public.story_subjects (campaign_id, created_at DESC);

-- No public policies: only the service-role admin client (which bypasses RLS) touches this.
ALTER TABLE public.story_subjects ENABLE ROW LEVEL SECURITY;
