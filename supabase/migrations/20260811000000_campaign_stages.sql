-- Campaign stages: a parent campaign (the initiative — usually a bill) with
-- child stage campaigns that follow the legislative journey: cosponsor push,
-- committee passage, House floor, Senate floor, thank-you. Each stage IS a
-- campaign, so participation, messages, analytics, and reports work per-stage
-- unchanged; the parent adds roll-up.
-- One level deep only: a stage cannot itself have stages (enforced in the API).

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS parent_campaign_id uuid REFERENCES public.campaigns(id) ON DELETE SET NULL;

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS stage_goal text
  CHECK (stage_goal IN ('cosponsor', 'committee', 'floor_house', 'floor_senate', 'thank_you', 'custom'));

-- Targeting rule for the stage, e.g. {"type":"committee","committee_id":"HSIF"}.
-- Consumed by the rep-matching step so messages only go to relevant offices
-- (committee stages must never hit non-committee members).
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS target_filter jsonb;

CREATE INDEX IF NOT EXISTS campaigns_parent_idx
  ON public.campaigns (parent_campaign_id)
  WHERE parent_campaign_id IS NOT NULL;

COMMENT ON COLUMN public.campaigns.parent_campaign_id IS
  'Set on stage campaigns: the initiative campaign this stage belongs to. One level only.';
COMMENT ON COLUMN public.campaigns.stage_goal IS
  'What this stage is trying to achieve in the legislative journey.';
COMMENT ON COLUMN public.campaigns.target_filter IS
  'Optional targeting rule limiting which officials this stage contacts (e.g. committee membership).';

-- Message mapping: on cosponsor stages a rep already on the bill gets a
-- thank-you, everyone else gets a persuade; thank_you stages thank everyone.
ALTER TABLE public.messages
  ADD COLUMN IF NOT EXISTS message_intent text
  CHECK (message_intent IN ('persuade', 'thank'));

COMMENT ON COLUMN public.messages.message_intent IS
  'Stage campaigns: whether the message thanked the official or tried to persuade them.';
