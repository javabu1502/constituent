-- Campaign language: which language the participation and storyteller flows
-- speak to participants in. Campaign content is free text in any language
-- already; this drives the UI chrome and the AI guide's language. A Spanish
-- participant's letter is bilingual regardless (their Spanish + an English
-- rendering), keyed off what they actually write, not this column.
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS language text NOT NULL DEFAULT 'en'
  CHECK (language IN ('en', 'es'));
