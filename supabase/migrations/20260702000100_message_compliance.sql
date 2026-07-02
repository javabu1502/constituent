-- Pre-send compliance audit trail.
--
-- Every CWC delivery attempt is screened by an LLM compliance gate before it
-- can be sent. This table is the durable paper trail of those verdicts — it
-- retains the decision even for BLOCKED messages (which never create a
-- deliverable `messages` row), so we can always show the diligence performed.
--
-- Admin-only: RLS is enabled with NO client policies, so the anon/authenticated
-- keys cannot read it. All access is via the service-role admin client, matching
-- the lockdown convention used for admin-only tables (see 20260626 story_subjects).

CREATE TABLE IF NOT EXISTS public.message_compliance (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  -- Null for blocked attempts (no deliverable message was created) and for
  -- messages later hard-deleted.
  message_id uuid REFERENCES public.messages(id) ON DELETE SET NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ip_hash text,
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
