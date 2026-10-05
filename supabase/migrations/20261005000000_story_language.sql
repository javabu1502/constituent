-- Stories written in Spanish get an English rendering for the organization.
-- body stays the storyteller's own words in the language they wrote; body_en
-- is a faithful translation made at submit (and re-made on edit). English
-- stories leave body_en null.
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en'
  CHECK (language IN ('en', 'es'));
ALTER TABLE public.stories
  ADD COLUMN IF NOT EXISTS body_en text;
