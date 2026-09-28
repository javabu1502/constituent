-- Signatures asking a NON-participating Senate office to accept constituent
-- mail through Communicating With Congress. Collected (opt-in checkbox) when
-- a constituent sends a message to such an office by email/webform, so the
-- platform can later show the office how many of its own constituents asked.
-- Service-role only: RLS on, no policies.
CREATE TABLE IF NOT EXISTS public.cwc_adoption_signatures (
  id            bigserial PRIMARY KEY,
  senator_id    text NOT NULL,            -- bioguide id
  senator_name  text NOT NULL,
  state         text NOT NULL,            -- 2-letter
  office_code   text,                     -- e.g. SNV03 (seat), when known
  signer_name   text NOT NULL,
  signer_email  text NOT NULL,            -- stored lowercased
  signer_city   text,
  signer_zip    text,
  source        text NOT NULL CHECK (source IN ('contact', 'campaign')),
  campaign_id   uuid,
  ip_hash       text,
  created_at    timestamptz NOT NULL DEFAULT now()
);
-- One signature per person per senator.
CREATE UNIQUE INDEX IF NOT EXISTS cwc_adoption_signatures_unique
  ON public.cwc_adoption_signatures (senator_id, signer_email);
CREATE INDEX IF NOT EXISTS cwc_adoption_signatures_senator_idx
  ON public.cwc_adoption_signatures (senator_id, created_at DESC);
ALTER TABLE public.cwc_adoption_signatures ENABLE ROW LEVEL SECURITY;
