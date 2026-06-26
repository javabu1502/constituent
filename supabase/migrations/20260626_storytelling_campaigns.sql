-- Storytelling Campaigns: a second campaign type alongside advocacy.
-- Advocacy orgs create a storytelling campaign, share an (unlisted) link, and
-- people use the Assistant to develop + submit a personal story.

-- 1. Campaign type discriminator
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS campaign_type text NOT NULL DEFAULT 'advocacy'
    CHECK (campaign_type IN ('advocacy', 'storytelling'));

-- 2. Visibility: public = listed in the public directory; unlisted = link-only.
--    Storytelling campaigns are always unlisted (enforced in the app).
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS visibility text NOT NULL DEFAULT 'public'
    CHECK (visibility IN ('public', 'unlisted'));

-- 3. Moderation decision. Kept separate from the live-state `status` field
--    (active/paused/archived). The share link is inactive until approved.
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'pending'
    CHECK (approval_status IN ('pending', 'approved', 'rejected'));
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS approved_at timestamptz;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS review_note text;

-- 4. Storytelling-specific fields (null for advocacy campaigns)
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS story_prompt text;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS usage_statement text;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS usage_tags text[];
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS attribution_options text[];
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS edit_revoke_policy text;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS recipient_email text;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS story_count integer NOT NULL DEFAULT 0;

-- 5. Backfill existing rows: all advocacy already; map their live state onto
--    the new approval_status so nothing currently live disappears.
UPDATE public.campaigns
SET approval_status = CASE
  WHEN status = 'rejected' THEN 'rejected'
  WHEN status = 'pending'  THEN 'pending'
  ELSE 'approved'                        -- active / paused / archived
END;

-- 6. Stories — persisted ONLY for logged-in storytellers, as a saved record.
--    Anonymous submissions are counted but never stored. The body stored is the
--    attribution-applied version the storyteller actually sent.
CREATE TABLE IF NOT EXISTS public.stories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text,
  body text NOT NULL,
  attribution_level text NOT NULL CHECK (attribution_level IN ('named', 'first_name_only', 'anonymous')),
  consent_at timestamptz NOT NULL DEFAULT now(),
  consent_usage_snapshot jsonb NOT NULL,   -- usage_statement + usage_tags at time of consent
  status text NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  revoked_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_stories_user ON public.stories (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_stories_campaign ON public.stories (campaign_id, created_at DESC);

-- RLS: reads/writes go through the service-role admin client (like campaigns).
-- This policy only governs direct client access — users see their own stories.
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own stories" ON public.stories;
CREATE POLICY "Users can view own stories"
  ON public.stories FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
