-- H.R. 139 Sunshine Protection Act: neutral official weigh-in on making
-- daylight saving time permanent. Adapted from the user's
-- create-hr139-campaign.mjs spec: campaign_type 'advocacy' (weigh-in ===
-- is_official), explicit approved/public, bill_title/bill_url fallback.
-- issue_area corrected to Congress.gov policy area 'Science, Technology,
-- Communications' (spec had 'Transportation and Public Works').
-- Both source URLs verified 200 + correct lean on 2026-07-16. Slug-dupe safe.
-- Run: npx supabase db query --linked --file scripts/create-hr139-campaign-2026-07-16.sql

begin;

insert into campaigns
  (creator_id, slug, campaign_type, visibility, approval_status, is_official, headline, description, issue_area, target_level, message_template, status, action_count, distribution_plan,
   case_for, case_against, source_for_label, source_for_url, source_against_label, source_against_url,
   is_bill_specific, bill_congress, bill_type, bill_number, bill_title, bill_url)
select
  (select creator_id from campaigns order by created_at asc limit 1),
  'should-daylight-saving-time-be-permanent-dst139', 'advocacy', 'public', 'approved', true,
  'Should daylight saving time be permanent?',
  'The House passed the Sunshine Protection Act (H.R. 139), which would make daylight saving time permanent and end the twice-yearly clock change, putting the country on the time it now observes from March to November. Supporters say more evening daylight and no more switching is worth it; sleep scientists counter that if we stop switching, permanent standard time is the healthier choice. It now goes to the Senate. Where do you stand?',
  'Science, Technology, Communications',
  'federal', null, 'active', 0,
  'Weekly hot-legislation weigh-in; featured in the social rotation. Sponsor Rep. Vern Buchanan (R-FL); House-passed 308-117 on 2026-07-14, now in the Senate.',
  'Supporters argue the twice-yearly switch is disruptive and that permanent daylight saving time means more usable evening light year round, which they link to more time outdoors, more evening commerce, and fewer of the health and safety problems tied to changing the clocks.',
  'Sleep and medical groups argue that permanent daylight saving time means dark winter mornings, with people commuting and children heading to school before sunrise. They say standard time better matches the body''s internal clock, and that if the country locks the clock it should lock it on standard time.',
  'House Energy and Commerce Committee (supports the bill)',
  'https://energycommerce.house.gov/posts/house-passes-legislation-to-make-daylight-saving-time-permanent',
  'American Academy of Sleep Medicine (favors permanent standard time)',
  'https://aasm.org/advocacy/position-statements/permanent-standard-time-is-the-optimal-choice-for-health-and-safety/',
  true, 119, 'hr', '139',
  'Sunshine Protection Act of 2025',
  'https://www.congress.gov/bill/119th-congress/house-bill/139'
where not exists (select 1 from campaigns where slug = 'should-daylight-saving-time-be-permanent-dst139');

commit;
