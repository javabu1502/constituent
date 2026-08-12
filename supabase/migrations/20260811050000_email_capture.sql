-- Advocate email capture + suppression list.
-- Org campaigns collect the participant's email so the campaign can re-engage
-- them when the bill advances ("the committee hearing is Thursday — act
-- again"). Official weigh-ins stay email-free/low-friction. Suppressions are
-- keyed by bare email because most advocates have no account.

ALTER TABLE public.campaign_actions
  ADD COLUMN IF NOT EXISTS participant_email text;

CREATE TABLE IF NOT EXISTS public.email_suppressions (
  email text NOT NULL,
  -- Which mailing this suppression covers (campaign_updates for now).
  list text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (email, list)
);

ALTER TABLE public.email_suppressions ENABLE ROW LEVEL SECURITY;

COMMENT ON COLUMN public.campaign_actions.participant_email IS
  'Collected on org campaigns only, with notice, for campaign-update emails; NULL on official weigh-ins.';
COMMENT ON TABLE public.email_suppressions IS
  'Unsubscribes for account-less advocates, keyed by email + list.';
