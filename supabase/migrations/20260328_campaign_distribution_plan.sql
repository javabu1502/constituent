-- Add distribution_plan column to campaigns table
ALTER TABLE public.campaigns
  ADD COLUMN IF NOT EXISTS distribution_plan text;
