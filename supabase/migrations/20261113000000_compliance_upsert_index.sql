-- Every passing CWC message has been held for review since 2026-10-25.
--
-- That day's migration made the audit trail's unique index PARTIAL:
--
--   CREATE UNIQUE INDEX ... ON message_compliance (message_key)
--     WHERE message_key IS NOT NULL;
--
-- The gate writes its verdict with upsert(..., { onConflict: 'message_key' }),
-- which PostgREST sends as ON CONFLICT (message_key). Postgres will not match
-- that to a partial index unless the statement repeats the index predicate,
-- and PostgREST does not emit one. So the write failed every time, and the
-- gate holds a message whose verdict it could not record. Correctly: an
-- unrecorded verdict must not be delivered unattended. The verdict itself was
-- "pass" each time.
--
-- The audit table has not taken a row since 2026-10-20. The partial predicate
-- bought nothing: Postgres already treats NULLs as distinct in a unique
-- index, so a plain one still lets any number of unenqueued verdicts in while
-- keeping one row per queue message.
DROP INDEX IF EXISTS public.idx_message_compliance_message_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_message_compliance_message_key
  ON public.message_compliance (message_key);

COMMENT ON INDEX public.idx_message_compliance_message_key IS
  'One verdict row per queue message. NOT partial: ON CONFLICT (message_key) cannot match a partial index, and a failed verdict write holds the message.';
