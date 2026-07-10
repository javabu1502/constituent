-- Fresh Bucks / fresh produce bill-specific official weigh-in (2026-07-10).
-- Adapted from user's create-fresh-produce-campaign.mjs: campaign_type
-- 'advocacy' (weigh-in === is_official), explicit approved/public, and
-- bill_title/bill_url set as the fallback for the live Congress.gov card.
-- First campaign with is_bill_specific = true.

begin;

insert into campaigns
  (creator_id, slug, campaign_type, visibility, approval_status, is_official, headline, description, issue_area, target_level, message_template, status, action_count, distribution_plan,
   case_for, case_against, source_for_label, source_for_url, source_against_label, source_against_url,
   is_bill_specific, bill_congress, bill_type, bill_number, bill_title, bill_url)
values (
  (select creator_id from campaigns order by created_at asc limit 1),
  'fresh-produce-benefit-fb9x2k',
  'advocacy', 'public', 'approved', true,
  'Should the Government Help Families Buy More Fresh Produce?',
  'Rep. Pramila Jayapal introduced the Fresh Bucks for Fresh Produce Act (H.R. 9581), a five-year USDA pilot that would give states grants to provide $60 a month to households at or below 80% of area median income to buy fresh, frozen, or dried fruit and vegetables. Some see a low-cost way to cut food insecurity and improve nutrition; others question new federal spending and a produce-only program alongside SNAP. Where do you stand?',
  'Agriculture and Food',
  'federal',
  null,
  'active',
  0,
  'Quote-tweet rapid response to the bill announcement; featured in rotation.',
  'Supporters say a modest monthly produce benefit is a cheap, targeted way to fight food insecurity and diet-related disease, pointing to Seattle''s Fresh Bucks program and studies showing incentive programs meaningfully raise fruit and vegetable purchases.',
  'Critics question adding new federal spending and a separate produce-only pilot on top of SNAP, arguing food aid is better delivered through existing programs or left to states, and that SNAP already carries high costs.',
  'American Cancer Society Cancer Action Network (supports produce incentives)',
  'https://www.fightcancer.org/sites/default/files/snap_fruit_and_vegetable_incentives_final_fact_sheet_1.05.24.pdf',
  'Cato Institute (critical of new SNAP spending)',
  'https://www.cato.org/briefing-paper/snap-high-costs-low-nutrition',
  true, 119, 'hr', '9581',
  'Fresh Bucks for Fresh Produce Act',
  'https://www.congress.gov/bill/119th-congress/house-bill/9581'
);

commit;
