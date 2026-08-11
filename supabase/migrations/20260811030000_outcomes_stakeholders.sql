-- Campaign outcomes + stakeholder organizations.
-- Outcomes close the loop for the impact report: a campaign ends passed,
-- failed, died in committee, vetoed — judged against the campaign's own goal
-- (an oppose campaign counts a dead bill as the WIN).
-- Stakeholders are the coalition map: which orgs supported or opposed, what
-- they said publicly, and (via campaign_notes.stakeholder_id) whether we
-- talked to them.

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS outcome text
  CHECK (outcome IN ('passed', 'failed', 'died_committee', 'vetoed', 'withdrawn'));

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS outcome_note text;

CREATE TABLE IF NOT EXISTS public.campaign_stakeholders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creator_id uuid NOT NULL,
  campaign_id uuid NOT NULL REFERENCES public.campaigns(id) ON DELETE CASCADE,
  name text NOT NULL,
  side text NOT NULL CHECK (side IN ('support', 'oppose', 'neutral')),
  -- Their public position, in their words ("what did they say").
  statement text,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.campaign_notes
  ADD COLUMN IF NOT EXISTS stakeholder_id uuid REFERENCES public.campaign_stakeholders(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS campaign_stakeholders_campaign_idx ON public.campaign_stakeholders (campaign_id);

ALTER TABLE public.campaign_stakeholders ENABLE ROW LEVEL SECURITY;

COMMENT ON COLUMN public.campaigns.outcome IS
  'How the legislation ended; interpret against the campaign''s direction (oppose + died = win).';
COMMENT ON TABLE public.campaign_stakeholders IS
  'Coalition map per campaign: supporting/opposing organizations, their public statements; conversations live in campaign_notes.stakeholder_id.';
