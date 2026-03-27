-- Add 'pending' and 'rejected' as valid campaign statuses.
-- New campaigns default to 'pending' and require admin approval to go 'active'.

-- Update default status for new campaigns
ALTER TABLE public.campaigns
  ALTER COLUMN status SET DEFAULT 'pending';

-- Update RLS: pending/rejected campaigns are only visible to their creator
-- The existing "Allow public read of active campaigns" policy already handles
-- only showing active campaigns publicly. No RLS changes needed since the app
-- uses the admin (service-role) client for queries.
