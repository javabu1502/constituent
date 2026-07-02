-- CWC (Communicating With Congress) server-side delivery.
--
-- Adds per-message delivery-tracking columns to the existing `messages` table.
-- The table predates the committed migration history and `delivery_method` /
-- `delivery_status` are free-text at the DB layer (validated by zod in the app,
-- see src/lib/schemas.ts), so we intentionally do NOT add restrictive CHECK
-- constraints here — legacy rows use status values like 'email_opened' that a
-- narrow CHECK would reject. New CWC values ('cwc', 'pending_review', 'sent',
-- 'blocked') are enforced at the application layer.
--
-- Idempotent, matching repo convention.

ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS cwc_message_id text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS cwc_status text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS cwc_error text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS compliance_decision text;
-- Salted-hash of the sender IP for anonymous deliveries, so the compliance gate
-- can correlate an anonymous sender's recent messages (split-abuse detection).
-- Never a raw IP. Null for signed-in sends (correlated by user_id instead).
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS ip_hash text;
-- Street + ZIP are required by CWC but are NOT retained for normal sends. They
-- are stored ONLY while a message is held for review (so it can be delivered on
-- approval) and cleared once the message is delivered or rejected.
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS advocate_street text;
ALTER TABLE public.messages ADD COLUMN IF NOT EXISTS advocate_zip text;

COMMENT ON COLUMN public.messages.cwc_message_id IS 'CWC delivery/tracking id returned on accepted submission.';
COMMENT ON COLUMN public.messages.cwc_status IS 'Normalized CWC delivery status: sent | error | pending.';
COMMENT ON COLUMN public.messages.cwc_error IS 'CWC error code/message when delivery failed.';
COMMENT ON COLUMN public.messages.compliance_decision IS 'Pre-send compliance gate decision: pass | review | block.';

-- Find messages awaiting human review efficiently.
CREATE INDEX IF NOT EXISTS idx_messages_pending_review
  ON public.messages (created_at DESC)
  WHERE delivery_status = 'pending_review';

-- Anonymous sender history lookup for the compliance gate.
CREATE INDEX IF NOT EXISTS idx_messages_ip_hash
  ON public.messages (ip_hash, created_at DESC)
  WHERE ip_hash IS NOT NULL;
