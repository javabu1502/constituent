-- Bill-specific campaign flag + structured bill identifiers.
--
-- Campaigns are neutral "where do you stand" issues by default and must not
-- reference a specific bill. A campaign surfaces its bill (rich Congress.gov
-- detail card + bill-aware message ask) ONLY when is_bill_specific = true.
-- The identifiers are stored dormant so flipping the flag is a one-field
-- change. Idempotent.

ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS is_bill_specific boolean NOT NULL DEFAULT false;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS bill_congress integer;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS bill_type text;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS bill_number text;

COMMENT ON COLUMN public.campaigns.is_bill_specific IS
  'When true, the campaign is explicitly an action on the bill identified by bill_congress/bill_type/bill_number and may reference it; otherwise no bill appears anywhere.';
