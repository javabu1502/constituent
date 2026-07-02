-- Track storyteller edits so the campaign collector can be flagged when a story
-- was changed after submission (revocation is already tracked via status +
-- revoked_at from 20260626_storytelling_campaigns).
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS edited_at timestamptz;
