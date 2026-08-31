-- Whip positions move to the 5-point scale orgs actually use:
--   leaning_yes / yes / uncommitted / leaning_no / no
-- ("committed" read as ambiguous — yes IS the commitment). Existing data maps
-- committed→yes, for→leaning_yes, against→no.
-- Also: lobbying time — notes can carry hours, so meetings roll up into
-- "N touchpoints · H lobbying hours" on reports.

ALTER TABLE public.legislator_positions DROP CONSTRAINT IF EXISTS legislator_positions_position_check;

UPDATE public.legislator_positions SET position = 'yes' WHERE position = 'committed';
UPDATE public.legislator_positions SET position = 'leaning_yes' WHERE position = 'for';
UPDATE public.legislator_positions SET position = 'no' WHERE position = 'against';

ALTER TABLE public.legislator_positions
  ADD CONSTRAINT legislator_positions_position_check
  CHECK (position IN ('leaning_yes', 'yes', 'uncommitted', 'leaning_no', 'no'));

ALTER TABLE public.campaign_notes
  ADD COLUMN IF NOT EXISTS hours numeric CHECK (hours IS NULL OR (hours >= 0 AND hours <= 24));

COMMENT ON COLUMN public.campaign_notes.hours IS
  'Optional lobbying time spent on this touchpoint, in hours.';
