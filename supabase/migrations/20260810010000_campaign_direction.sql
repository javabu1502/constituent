-- Directional stance for user/advocacy-created campaigns.
-- Policy: official My Democracy weigh-ins stay NEUTRAL (the participant picks
-- Support/Oppose). User/advocacy campaigns are DIRECTIONAL — one way only — and
-- the creator chooses that direction when they create the campaign. This column
-- stores that choice so message generation, the campaign page, and reporting
-- all reflect the same position. Null for neutral official weigh-ins and for
-- storytelling campaigns.
alter table public.campaigns
  add column if not exists direction text check (direction in ('support', 'oppose'));

comment on column public.campaigns.direction is
  'For user/advocacy campaigns: the single position (support|oppose) the creator is asking constituents to take. Null for neutral official weigh-ins and storytelling.';
