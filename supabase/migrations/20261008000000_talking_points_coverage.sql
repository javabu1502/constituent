-- How a campaign's talking points are used in each participant's letter.
--   all: every point is made, in the participant's own words (default; it is
--        what an organization is asking for).
--   fit: only the points that connect to what the participant wrote.
-- Official weigh-ins ignore this and always use "fit".
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS talking_points_coverage text NOT NULL DEFAULT 'all'
  CHECK (talking_points_coverage IN ('all', 'fit'));
