-- =============================================================================
-- Security Advisor Fixes — 2026-03-18
-- =============================================================================
-- Addresses: RLS disabled, overly permissive policies, mutable search_path
-- Safe to apply: all app queries use the admin (service-role) client,
-- which bypasses RLS. These policies protect against direct PostgREST abuse.
-- =============================================================================

-- ─────────────────────────────────────────────────────────────────────────────
-- PRIORITY 1: Enable RLS on tables that have it disabled
-- ─────────────────────────────────────────────────────────────────────────────

-- 1a. message_feedback — anonymous feedback, no user_id column
--     Enable RLS with no public policies. Admin client handles all access.
ALTER TABLE public.message_feedback ENABLE ROW LEVEL SECURITY;

-- 1b. profiles — user-owned data, has user_id column
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own profile"
  ON public.profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON public.profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON public.profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 1c. watched_bills — enable RLS (policies added in follow-up after schema check)
ALTER TABLE public.watched_bills ENABLE ROW LEVEL SECURITY;


-- ─────────────────────────────────────────────────────────────────────────────
-- PRIORITY 2: Replace USING (true) policies with proper scoping
-- ─────────────────────────────────────────────────────────────────────────────

-- 2a. campaign_actions — no user_id column, only inserted via admin client
--     Drop permissive UPDATE/DELETE; no one should modify these via PostgREST
DROP POLICY IF EXISTS "Enable update for all users" ON public.campaign_actions;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.campaign_actions;
DROP POLICY IF EXISTS "Allow update for all" ON public.campaign_actions;
DROP POLICY IF EXISTS "Allow delete for all" ON public.campaign_actions;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.campaign_actions;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.campaign_actions;

-- 2b. messages — has optional user_id
--     Drop permissive UPDATE/DELETE; add user-scoped policies
DROP POLICY IF EXISTS "Enable update for all users" ON public.messages;
DROP POLICY IF EXISTS "Enable delete for all users" ON public.messages;
DROP POLICY IF EXISTS "Allow update for all" ON public.messages;
DROP POLICY IF EXISTS "Allow delete for all" ON public.messages;
DROP POLICY IF EXISTS "Enable update for authenticated users only" ON public.messages;
DROP POLICY IF EXISTS "Enable delete for authenticated users only" ON public.messages;

CREATE POLICY "Users can update their own messages"
  ON public.messages FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own messages"
  ON public.messages FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);


-- ─────────────────────────────────────────────────────────────────────────────
-- PRIORITY 3: Fix mutable search_path on functions
-- ─────────────────────────────────────────────────────────────────────────────

-- 3a. update_updated_at_column — recreate with immutable search_path
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- 3b. increment_campaign_action_count — recreate with immutable search_path
CREATE OR REPLACE FUNCTION public.increment_campaign_action_count(campaign_slug text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.campaigns
  SET action_count = action_count + 1
  WHERE slug = campaign_slug;
END;
$$;


-- ─────────────────────────────────────────────────────────────────────────────
-- NOTE: The following tables need manual policy fixes after checking schemas
-- in the Supabase Dashboard (Table Editor > select table > view columns):
--
--   public.actions       — needs column name for user ownership (no user_id found)
--   public.watched_bills — RLS enabled above, but policies need column name
--
-- Also fix via Dashboard:
--   Authentication > Providers > Email > Enable "Leaked password protection"
-- ─────────────────────────────────────────────────────────────────────────────
