-- Usage tracking table for AI generation daily quotas and legislator cooldowns.
-- Enforced at the API layer; this table stores the log.
--
-- AI routes are auth-optional, so usage is keyed by EITHER the authenticated
-- user_id OR a hashed client IP (anonymous traffic). Exactly one is set per row.

CREATE TABLE public.ai_usage_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  ip_hash text,
  action_type text NOT NULL,  -- 'generate_message', 'generate_follow_up', 'generate_comment', 'chat', 'research'
  created_at timestamptz NOT NULL DEFAULT now(),
  -- Every row must be attributable to a user or an anonymous IP hash
  CONSTRAINT ai_usage_identity CHECK (user_id IS NOT NULL OR ip_hash IS NOT NULL)
);

-- Indexes for efficient per-identity daily quota queries
CREATE INDEX idx_ai_usage_user_action_date
  ON public.ai_usage_logs (user_id, action_type, created_at DESC)
  WHERE user_id IS NOT NULL;

CREATE INDEX idx_ai_usage_ip_action_date
  ON public.ai_usage_logs (ip_hash, action_type, created_at DESC)
  WHERE ip_hash IS NOT NULL;

-- RLS: quota checks and inserts run through the service-role admin client,
-- which bypasses RLS. These policies only govern direct client access.
ALTER TABLE public.ai_usage_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own usage"
  ON public.ai_usage_logs FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- No client INSERT/UPDATE/DELETE policies: only the server (service role) writes.

-- Auto-cleanup: delete logs older than 30 days (optional cron, or run manually).
-- For now we rely on the partial indexes + WHERE created_at filter for performance.
