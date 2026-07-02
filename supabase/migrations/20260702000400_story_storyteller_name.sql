-- Missing column: the story-persistence code stores the storyteller's name (at
-- their chosen attribution level), but neither the base 20260626 table nor the
-- 20260702000200 migration created this column, so inserts + reads failed.
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS storyteller_name text;
