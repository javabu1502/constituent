-- Optional "related bill" on campaigns (federal or state), used to ground
-- participant messages. All columns nullable; campaigns without a bill are
-- fine. Inherits the existing campaigns RLS policies.

ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS bill_level text CHECK (bill_level IN ('federal', 'state')),
  ADD COLUMN IF NOT EXISTS bill_state text,   -- 2-letter; null for federal
  ADD COLUMN IF NOT EXISTS bill_ref text,      -- e.g. "H.R. 22" or "AB 1234" as entered
  ADD COLUMN IF NOT EXISTS bill_title text,    -- resolved official title
  ADD COLUMN IF NOT EXISTS bill_url text;      -- resolved canonical/official link
