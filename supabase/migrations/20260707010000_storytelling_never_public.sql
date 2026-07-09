-- Storytelling campaigns are shared by link only — NEVER public.
--
-- The create route already forces visibility='unlisted' for storytelling,
-- but nothing guaranteed it at the database level. Normalize any stray rows,
-- then enforce it with a CHECK constraint so no future code path can flip a
-- storytelling campaign public.
-- Idempotent.

UPDATE public.campaigns
SET visibility = 'unlisted'
WHERE campaign_type = 'storytelling' AND visibility IS DISTINCT FROM 'unlisted';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'storytelling_never_public'
  ) THEN
    ALTER TABLE public.campaigns
      ADD CONSTRAINT storytelling_never_public
      CHECK (campaign_type <> 'storytelling' OR visibility = 'unlisted');
  END IF;
END $$;
