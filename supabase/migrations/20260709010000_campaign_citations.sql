-- Campaign citations: one credible source per side, labeled by lean/stance.
--
-- Each issue links the specific bill (existing bill_title/bill_url columns)
-- plus a source backing the case for and one backing the case against, so
-- readers can go deeper than our two summaries. Idempotent.

ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS source_for_label text;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS source_for_url text;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS source_against_label text;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS source_against_url text;
