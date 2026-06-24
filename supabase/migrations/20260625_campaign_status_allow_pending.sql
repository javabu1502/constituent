-- The campaign approval workflow (20260327) set the default campaign status to
-- 'pending' but never updated the status CHECK constraint, so every new campaign
-- insert (status = 'pending') violated campaigns_status_check and failed with
-- "Failed to create campaign". Allow the approval-workflow states.

ALTER TABLE public.campaigns DROP CONSTRAINT IF EXISTS campaigns_status_check;
ALTER TABLE public.campaigns
  ADD CONSTRAINT campaigns_status_check
  CHECK (status IN ('active', 'paused', 'archived', 'pending', 'rejected'));
