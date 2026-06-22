-- Reconcile ai_usage_logs for anonymous (IP-keyed) usage tracking.
--
-- The original 20260323 migration was already applied to production with a
-- NOT NULL user_id and no ip_hash column. The durable AI quota now keys
-- anonymous traffic by a hashed IP, so production needs these columns and
-- constraints retrofitted. Written idempotently so it is also a no-op on any
-- environment created from the updated 20260323 migration.

ALTER TABLE public.ai_usage_logs ALTER COLUMN user_id DROP NOT NULL;

ALTER TABLE public.ai_usage_logs ADD COLUMN IF NOT EXISTS ip_hash text;

-- Every row must be attributable to a user OR an anonymous IP hash
ALTER TABLE public.ai_usage_logs DROP CONSTRAINT IF EXISTS ai_usage_identity;
ALTER TABLE public.ai_usage_logs
  ADD CONSTRAINT ai_usage_identity CHECK (user_id IS NOT NULL OR ip_hash IS NOT NULL);

CREATE INDEX IF NOT EXISTS idx_ai_usage_ip_action_date
  ON public.ai_usage_logs (ip_hash, action_type, created_at DESC)
  WHERE ip_hash IS NOT NULL;
