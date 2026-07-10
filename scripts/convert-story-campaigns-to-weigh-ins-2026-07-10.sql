-- Convert the two legacy storytelling campaigns to neutral weigh-ins (2026-07-10).
--
-- Social posts already treat both as weigh-ins; their pages contradicted the
-- posts. The 6 + 3 collected story rows remain in the stories table
-- untouched (they are simply no longer surfaced, since these campaigns are
-- no longer storytelling type).
-- Run via: npx supabase db query --linked --file scripts/convert-story-campaigns-to-weigh-ins-2026-07-10.sql

begin;

update campaigns set
  campaign_type = 'advocacy',
  visibility = 'public',
  headline = 'What Should the Federal Role in Child Care Be?',
  description = 'Child care often costs more than rent or in-state college tuition in much of the country. Some want major federal investment to lower costs; others favor tax credits, deregulation, or leaving it to states and families. Where do you stand?',
  case_for = 'Affordable child care lets parents work and boosts the economy; supporters say direct federal investment or subsidies are the fastest way to cut costs families can''t shoulder alone.',
  case_against = 'Large federal programs are costly and can push prices up; critics prefer tax credits, cutting regulations that raise costs, or state and community solutions.',
  issue_area = 'Families',
  target_level = 'federal',
  is_bill_specific = false,
  message_template = null,
  story_prompt = null,
  updated_at = now()
where slug = 'tell-your-child-care-story-xqqt5m';

update campaigns set
  campaign_type = 'advocacy',
  visibility = 'public',
  headline = 'Who Should Pay for the Data-Center Power Boom?',
  description = 'Data centers powering AI are consuming enormous amounts of electricity, and in some regions utility costs are being passed on to households. Some want large energy users to pay their full share of grid costs; others warn new charges could chill investment and jobs. Where do you stand?',
  case_for = 'Supporters of making large users pay say households shouldn''t subsidize the grid strain of the biggest electricity consumers, and that cost-causers paying their way keeps rates fair.',
  case_against = 'Critics warn that special charges on data centers could push investment and jobs elsewhere, and that grid upgrades benefit everyone, so costs should be shared broadly.',
  issue_area = 'Energy',
  target_level = 'both',
  is_bill_specific = false,
  message_template = null,
  story_prompt = null,
  updated_at = now()
where slug = 'no-data-centers-w7bwco';

commit;
