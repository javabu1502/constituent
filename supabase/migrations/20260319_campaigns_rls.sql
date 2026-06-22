-- Enable RLS on campaigns table to prevent unauthorized creation via PostgREST anon key.
-- App queries use the admin (service-role) client, which bypasses RLS.

ALTER TABLE public.campaigns ENABLE ROW LEVEL SECURITY;

-- Anyone can view active campaigns (public discovery)
CREATE POLICY "Allow public read of active campaigns"
  ON public.campaigns FOR SELECT
  USING (status = 'active');

-- Authenticated users can view all their own campaigns regardless of status
CREATE POLICY "Allow creators to view own campaigns"
  ON public.campaigns FOR SELECT
  TO authenticated
  USING (auth.uid() = creator_id);

-- Only authenticated users can create campaigns, scoped to themselves
CREATE POLICY "Allow authenticated users to create own campaigns"
  ON public.campaigns FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = creator_id);

-- Only campaign creator can update their own campaigns
CREATE POLICY "Allow creators to update own campaigns"
  ON public.campaigns FOR UPDATE
  TO authenticated
  USING (auth.uid() = creator_id)
  WITH CHECK (auth.uid() = creator_id);

-- Only campaign creator can delete their own campaigns
CREATE POLICY "Allow creators to delete own campaigns"
  ON public.campaigns FOR DELETE
  TO authenticated
  USING (auth.uid() = creator_id);
