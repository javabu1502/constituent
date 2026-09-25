-- Account-level organization identity. Campaigns keep their own branding
-- columns (each campaign may present differently), but these are the org's
-- defaults: shown on the dashboard and prefilled into new campaigns.
alter table public.profiles
  add column if not exists org_name text,
  add column if not exists org_url text,
  add column if not exists org_logo_url text,
  add column if not exists brand_color text;
