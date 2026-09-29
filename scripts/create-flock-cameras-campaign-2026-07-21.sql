-- Neutral official weigh-in on Flock Safety automated license plate reader
-- (ALPR) camera networks. Not bill-specific: ALPR policy is being decided in
-- city councils, state legislatures, and Congress, so target_level 'both'.
-- Follows the create-s4825-campaign-2026-07-14.sql pattern: campaign_type
-- 'advocacy' (weigh-in === is_official), explicit approved/public.
-- Both source URLs verified 200 on 2026-07-21. Slug-dupe safe.
-- Run: npx supabase db query --linked --file scripts/create-flock-cameras-campaign-2026-07-21.sql

begin;

insert into campaigns
  (creator_id, slug, campaign_type, visibility, approval_status, is_official, headline, description, issue_area, target_level, message_template, status, action_count, distribution_plan,
   case_for, case_against, source_for_label, source_for_url, source_against_label, source_against_url,
   is_bill_specific)
select
  (select creator_id from campaigns order by created_at asc limit 1),
  'flock-license-plate-cameras-w4kx2n', 'advocacy', 'public', 'approved', true,
  'Should your community use Flock license plate cameras?',
  'Flock Safety''s automated license plate readers now scan traffic in thousands of U.S. communities, logging every passing plate into searchable databases that are often shared across agencies. Police departments credit the cameras with solving crimes and recovering stolen vehicles; privacy advocates warn they build a location history of innocent drivers with little oversight. Cities and states are now deciding whether to expand, regulate, or remove these networks. Where do you stand?',
  'Crime and Law Enforcement',
  'both', null, 'active', 0,
  'Official My Democracy weigh-in on local surveillance technology; featured in the campaign directory and social rotation. Timely: multiple city councils and state legislatures are actively debating Flock contracts and ALPR regulation in 2026.',
  'Supporters say ALPR networks are a force multiplier for understaffed police departments: they generate leads that help recover stolen vehicles, locate missing persons flagged in AMBER and Silver Alerts, and identify suspect vehicles after serious crimes, using cameras that photograph plates rather than faces.',
  'Critics say the networks amount to warrantless mass tracking: they log the movements of millions of drivers who are suspected of nothing, retain and share that data across jurisdictions with limited oversight, and have produced wrongful stops when plates were misread or hotlists were stale.',
  'Flock Safety (manufacturer, supports)',
  'https://www.flocksafety.com/',
  'Electronic Frontier Foundation (opposes)',
  'https://sls.eff.org/technologies/automated-license-plate-readers-alprs',
  false
where not exists (select 1 from campaigns where slug = 'flock-license-plate-cameras-w4kx2n');

commit;
