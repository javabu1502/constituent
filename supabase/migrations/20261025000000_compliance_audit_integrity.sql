-- Compliance audit integrity.
--
-- Two problems, both found in the 2026-10-25 review.
--
-- 1. `message_compliance` has no unique constraint on `message_key`. A
--    retried /api/track-send re-screens the same letter (fresh model spend)
--    and inserts a second audit row for the same queue message. The admin
--    review queue then shows one letter twice, and resolving one leaves the
--    other pending forever, because the resolve is keyed on the verdict row.
--
-- 2. The pending-queue index only covers `decision = 'review'`. The queue now
--    lists refused messages too, so that query no longer uses the index.
--
-- The duplicate cleanup keeps the OLDEST row per message_key: it is the
-- verdict the queue acted on, and any review already recorded sits on it.

-- Resolve existing duplicates before adding the constraint.
DELETE FROM public.message_compliance mc
USING public.message_compliance keep
WHERE mc.message_key IS NOT NULL
  AND mc.message_key = keep.message_key
  AND (
    keep.created_at < mc.created_at
    OR (keep.created_at = mc.created_at AND keep.id < mc.id)
  );

-- One verdict row per queue message. NULL message_key rows are unaffected,
-- which is correct: a verdict with no key was never enqueued.
CREATE UNIQUE INDEX IF NOT EXISTS idx_message_compliance_message_key
  ON public.message_compliance (message_key)
  WHERE message_key IS NOT NULL;

-- The review queue reads every unreviewed verdict that is not a pass, so the
-- index has to cover a refusal as well as a hold.
DROP INDEX IF EXISTS public.idx_message_compliance_pending;
CREATE INDEX IF NOT EXISTS idx_message_compliance_pending
  ON public.message_compliance (created_at)
  WHERE decision IN ('review', 'block') AND reviewed_at IS NULL;
