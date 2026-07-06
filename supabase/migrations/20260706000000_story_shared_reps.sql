-- Store the storyteller's matched representatives with their story.
--
-- The submit flow already looks these up (StorytellerFlow -> /api/representatives)
-- and the location-sharing consent explicitly covers them ("Share my city, state,
-- and representatives with this campaign"), but they were only ever used for the
-- since-removed notification email. Persisting them lets campaign creators filter
-- stories by the exact officials who represent each storyteller — including House
-- members, which city/state alone can't resolve.
--
-- Written only when location sharing is on and attribution isn't anonymous
-- (same gate as city/state). Shape: [{ name, title, level, chamber, party, state }].
-- Idempotent.

ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS shared_reps jsonb;

COMMENT ON COLUMN public.stories.shared_reps IS
  'Representatives matched from the storyteller''s address at submit time; shared only with location-sharing consent, NULL for anonymous.';
