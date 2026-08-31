-- Two kinds of accounts: constituents (contact their officials, share
-- stories) and advocacy organizations (run campaigns; they have no elected
-- officials of their own and never send constituent messages). Campaign
-- creation is org-only from here on; the dashboard renders per type.

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'constituent'
  CHECK (account_type IN ('constituent', 'organization'));

COMMENT ON COLUMN public.profiles.account_type IS
  'constituent = individual using rep-contact/story flows; organization = advocacy group running campaigns (no officials, no message sending).';
