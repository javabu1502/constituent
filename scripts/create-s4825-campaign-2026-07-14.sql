-- S. 4825 quote-tweet counterpart: neutral official weigh-in on the American
-- AI Sovereign Wealth Fund Act (Sen. Sanders). Adapted from the user's
-- create-s4825-campaign.mjs spec: campaign_type 'advocacy' (weigh-in ===
-- is_official), explicit approved/public, bill_title/bill_url fallback.
-- Both source URLs verified 200 on 2026-07-14. Slug-dupe safe.
-- Run: npx supabase db query --linked --file scripts/create-s4825-campaign-2026-07-14.sql

begin;

insert into campaigns
  (creator_id, slug, campaign_type, visibility, approval_status, is_official, headline, description, issue_area, target_level, message_template, status, action_count, distribution_plan,
   case_for, case_against, source_for_label, source_for_url, source_against_label, source_against_url,
   is_bill_specific, bill_congress, bill_type, bill_number, bill_title, bill_url)
select
  (select creator_id from campaigns order by created_at asc limit 1),
  'public-stake-in-big-ai-companies-ai7swf', 'advocacy', 'public', 'approved', true,
  'Should the public get an ownership stake in big AI companies?',
  'Sen. Bernie Sanders introduced the American AI Sovereign Wealth Fund Act (S. 4825), which would place a one-time 50% tax, paid in stock, on AI companies with over $200 million in annual AI revenue, putting those shares in a public fund that pays dividends to Americans. Supporters say it shares AI''s gains broadly; critics call it a government takeover that would chill investment. Where do you stand?',
  'Science, Technology, Communications',
  'federal', null, 'active', 0,
  'Quote-tweet rapid response to Sanders''s announcement (https://x.com/BernieSanders/status/2076702764336304387); featured in the social rotation. Sponsor Sen. Bernie Sanders; introduced 2026-06-18, 119th Congress.',
  'Supporters argue AI''s profits, built in part on public data, research, and infrastructure, are concentrating wealth among a few firms while automating jobs. A public ownership stake would return some of those gains to everyone through dividends and funding for services.',
  'Critics argue a 50% stake amounts to partial nationalization that would deter investment, punish success, and raise serious legal and valuation questions. They warn government as a major shareholder could distort the industry and slow innovation.',
  'Common Dreams (supports, progressive lean)',
  'https://www.commondreams.org/news/sanders-50-public-stake-in-ai',
  'Reason (opposes, libertarian lean)',
  'https://reason.com/2026/06/19/bernie-sanders-proposes-ai-tax-to-give-everyone-1000-a-month-his-bill-would-do-a-lot-more-than-that/',
  true, 119, 's', '4825',
  'American A.I. Sovereign Wealth Fund Act',
  'https://www.congress.gov/bill/119th-congress/senate-bill/4825'
where not exists (select 1 from campaigns where slug = 'public-stake-in-big-ai-companies-ai7swf');

commit;
