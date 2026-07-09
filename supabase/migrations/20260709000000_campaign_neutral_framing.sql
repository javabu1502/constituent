-- Neutral "Where Do You Stand" reframing.
--
-- Campaigns no longer tell people what position to take: each one presents
-- the issue with a fair case for and against, the participant picks their own
-- stance, and the generated message carries THAT stance. These columns hold
-- the two sides; the copy rewrite ships separately as a data script.
-- Idempotent.

ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS case_for text;
ALTER TABLE public.campaigns ADD COLUMN IF NOT EXISTS case_against text;

COMMENT ON COLUMN public.campaigns.case_for IS
  'Fair, neutral summary of the case in favor of the campaign question.';
COMMENT ON COLUMN public.campaigns.case_against IS
  'Fair, neutral summary of the case against the campaign question.';
