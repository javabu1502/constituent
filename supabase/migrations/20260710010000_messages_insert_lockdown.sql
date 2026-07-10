-- Security audit follow-up: messages writes go through the service role only.
--
-- The legacy "Anyone can create messages" INSERT policy let anyone holding
-- the public anon key insert arbitrary message rows directly, bypassing
-- track-send's validation, rate limiting, and Turnstile. All legitimate
-- inserts happen server-side via the service-role client, which bypasses RLS
-- anyway — so the open policy only served attackers. Idempotent.

DROP POLICY IF EXISTS "Anyone can create messages" ON public.messages;
