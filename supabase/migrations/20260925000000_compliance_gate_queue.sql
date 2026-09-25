-- Content-compliance gate for CWC delivery.
--
-- 1. message_compliance: durable audit trail of every pre-send content screen
--    (threats / fake identity / spam / gibberish / split abuse). Retains the
--    verdict even for BLOCKED messages, so we can always show the diligence
--    performed. Admin-only: RLS enabled with NO policies — service-role
--    access only. (Designed in the July PR #1 draft; created here because
--    that migration was never applied.)
-- 2. `held` queue status: messages the gate flags 'review' enqueue as 'held'
--    — invisible to claim_cwc_send_jobs (which only claims 'queued' /
--    expired leases) until an admin approves them at /admin/compliance.
-- 3. message_compliance.message_key: the queue keys messages by messageKey
--    (logical message), and blocked/held CWC attempts may have no messages
--    row at all. The key lets the admin review release exactly the held
--    queue rows the verdict covers.

CREATE TABLE IF NOT EXISTS public.message_compliance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Null for blocked attempts (no deliverable message was created) and for
  -- messages later hard-deleted.
  message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_hash text,
  -- Queue identity of the screened logical message (cwc_send_queue.message_key).
  message_key text,
  decision text NOT NULL CHECK (decision IN ('pass', 'review', 'block')),
  reasons jsonb NOT NULL DEFAULT '[]'::jsonb,
  categories jsonb NOT NULL DEFAULT '{}'::jsonb,
  -- Truncated copy of the screened message, so a reviewer can see what was
  -- flagged without joining back to a (possibly never-created) messages row.
  message_excerpt text,
  legislator_name text,
  -- Ids of the recent messages the gate compared against (split-abuse context).
  recent_message_ids jsonb NOT NULL DEFAULT '[]'::jsonb,
  model text,
  prompt_version text,
  raw_verdict jsonb,
  -- Manual review outcome for rows that landed on 'review'.
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  review_decision text CHECK (review_decision IN ('approved', 'rejected')),
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.message_compliance ENABLE ROW LEVEL SECURITY;
-- No policies on purpose: admin-only access through the service-role client.

-- Pending human-review queue (oldest first is handled in the app).
CREATE INDEX IF NOT EXISTS idx_message_compliance_pending
  ON public.message_compliance (created_at DESC)
  WHERE decision = 'review' AND reviewed_at IS NULL;

-- Look up a sender's compliance history.
CREATE INDEX IF NOT EXISTS idx_message_compliance_user
  ON public.message_compliance (user_id, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_message_compliance_message
  ON public.message_compliance (message_id)
  WHERE message_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS message_compliance_message_key_idx
  ON public.message_compliance (message_key);

-- Send-queue: allow the 'held' state.
ALTER TABLE public.cwc_send_queue DROP CONSTRAINT IF EXISTS cwc_send_queue_status_check;
ALTER TABLE public.cwc_send_queue ADD CONSTRAINT cwc_send_queue_status_check
  CHECK (status IN ('queued', 'held', 'leased', 'sent', 'routed', 'refused', 'failed'));

CREATE INDEX IF NOT EXISTS cwc_send_queue_held_idx
  ON public.cwc_send_queue (message_key) WHERE status = 'held';
