-- MyDemocracy — Campaign refresh + expansion (2026-07-07)
-- Refreshes the 7 active ADVOCACY campaigns with fresh, current copy and
-- inserts 5 new advocacy campaigns tied to current federal debates.
--
-- DELIBERATELY SKIPPED (they are STORYTELLING campaigns with collected
-- stories — 6 and 3 respectively — so their copy is the context those
-- storytellers consented to; do not rewrite it under them):
--   tell-your-child-care-story-xqqt5m
--   no-data-centers-w7bwco
--
-- Safe by design: wrapped in a transaction.

begin;

-- ─────────────────────────────────────────────────────────────
-- REFRESH EXISTING ADVOCACY CAMPAIGNS (matched by current slug)
-- ─────────────────────────────────────────────────────────────

-- 1. Stale SAVE Act → live voting-rights campaign
update campaigns set
  headline = 'Protect the Freedom to Vote',
  description = 'New proof-of-citizenship and documentation requirements are making it harder for eligible Americans — including married women who changed their names, rural voters, and seniors — to register and stay registered. Federal data shows noncitizen registration is vanishingly rare, so these rules block far more lawful voters than they stop. Tell your representatives to protect secure, straightforward access to the ballot and reject unnecessary registration barriers.',
  issue_area = 'Civil Rights and Liberties, Minority Issues',
  target_level = 'both',
  message_template = 'As your constituent, I urge you to protect the freedom to vote and oppose burdensome proof-of-citizenship registration requirements that block eligible voters. Secure elections and easy access to the ballot can coexist.',
  status = 'active',
  updated_at = now()
where slug = 'prevent-voter-suppression-vote-no-on-the-save-act-bqq31c'
  and campaign_type = 'advocacy';

-- 2. Refresh: Protect Fed independence
update campaigns set
  headline = 'Protect the Fed From Political Pressure',
  description = 'The Federal Reserve should set interest rates based on economic data — not the political calendar. Growing pressure to cut rates for short-term political gain risks reigniting inflation and destabilizing the economy for years. Tell Congress to defend the Fed''s independence and safeguard long-term economic stability.',
  issue_area = 'Economics and Public Finance',
  target_level = 'federal',
  message_template = 'As your constituent, I am asking you to defend the independence of the Federal Reserve. Monetary policy should be guided by economic data, not political pressure, so that we avoid higher inflation and instability.',
  status = 'active',
  updated_at = now()
where slug = 'protect-fed-independence'
  and campaign_type = 'advocacy';

-- 3. Refresh: Immigration
update campaigns set
  headline = 'Fix Immigration With Dignity and Common Sense',
  description = 'Our immigration system is broken, and neither enforcement-only crackdowns nor an open border serve the country well. Tell your representatives to pursue durable reform that secures the border, respects due process, treats people humanely, and creates fair, workable legal pathways.',
  issue_area = 'Immigration',
  target_level = 'federal',
  message_template = 'As your constituent, I am asking you to support comprehensive, humane immigration reform that secures the border, protects due process, and creates fair legal pathways. We need lasting solutions, not endless crisis.',
  status = 'active',
  updated_at = now()
where slug = 'humane-immigration-reform'
  and campaign_type = 'advocacy';

-- 4. Refresh: End the shutdown cycle
update campaigns set
  headline = 'End Governing by Crisis: Pass a Real Budget',
  description = 'Repeated shutdown threats and last-minute stopgaps hurt federal workers, delay essential services, and waste taxpayer money. Congress keeps kicking the can with short-term continuing resolutions instead of doing its core job. Demand that your representatives pass full-year appropriations and end governing from one manufactured crisis to the next.',
  issue_area = 'Economics and Public Finance',
  target_level = 'federal',
  message_template = 'As your constituent, I am urging you to end the cycle of shutdown threats and stopgap funding. Please pass full-year appropriations bills so our government can function without lurching from crisis to crisis.',
  status = 'active',
  updated_at = now()
where slug = 'end-the-shutdown-cycle-pass-a-real-budget'
  and campaign_type = 'advocacy';

-- 5. Refresh: ACA subsidies (updated with current numbers)
update campaigns set
  headline = 'Reverse the Health Premium Spike',
  description = 'Enhanced Affordable Care Act subsidies expired at the start of 2026, and marketplace premiums are more than doubling on average — from about $888 to roughly $1,900 a year for subsidized enrollees. The House passed a multi-year extension, but it is stalled in the Senate. Tell your Senators to restore the subsidies before more families are priced out of coverage.',
  issue_area = 'Health',
  target_level = 'federal',
  message_template = 'As your constituent, I am asking you to restore the enhanced ACA premium tax credits. Premiums have more than doubled for many families, and people in our community are being priced out of health coverage.',
  status = 'active',
  updated_at = now()
where slug = 'protect-healthcare-restore-aca-subsidies'
  and campaign_type = 'advocacy';

-- 6. Refresh: Iran/War Powers → broader, current "No War Without a Vote"
update campaigns set
  headline = 'No War Without a Vote',
  description = 'The Constitution gives Congress — not the President — the power to take the nation to war. Before any new or expanded U.S. military action abroad, your representatives should be required to debate and vote under the War Powers Act. Tell Congress to reclaim its constitutional role and refuse open-ended, unauthorized conflicts.',
  issue_area = 'Armed Forces and National Security',
  target_level = 'federal',
  message_template = 'As your constituent, I am asking you to insist on a formal congressional debate and vote under the War Powers Act before any new or expanded U.S. military action abroad. Congress must not hand over its constitutional war powers.',
  status = 'active',
  updated_at = now()
where slug = 'authorize-military-force-demand-congress-vote-on-iran'
  and campaign_type = 'advocacy';

-- 7. Refresh: Walkable communities → federal safe-streets funding
update campaigns set
  headline = 'Fund Safe Streets and Walkable Communities',
  description = 'Federal transportation dollars still overwhelmingly favor car-only infrastructure, even as pedestrian deaths climb and families ask for safer, more walkable neighborhoods. Tell Congress to prioritize safe streets, public transit, and mixed-use development in federal infrastructure funding.',
  issue_area = 'Transportation and Public Works',
  target_level = 'both',
  message_template = 'As your constituent, I am asking you to prioritize safe streets, public transit, and walkable, mixed-use development in federal transportation funding. Our communities deserve more than car-only design.',
  status = 'active',
  updated_at = now()
where slug = 'develop-mixed-use-and-walkable-communities-co5nb4'
  and campaign_type = 'advocacy';

-- ─────────────────────────────────────────────────────────────
-- INSERT 5 NEW ADVOCACY CAMPAIGNS (current federal debates)
-- Explicitly approved + public so they actually appear in the
-- directory, discovery, and sitemap. creator_id reuses the
-- earliest existing campaign's creator.
-- ─────────────────────────────────────────────────────────────

insert into campaigns
  (creator_id, slug, campaign_type, visibility, approval_status, headline, description, issue_area, target_level, message_template, status, action_count, distribution_plan)
values
  (
    (select creator_id from campaigns order by created_at asc limit 1),
    'real-guardrails-for-ai-9k2m4x',
    'advocacy', 'public', 'approved',
    'Real Guardrails for AI, Not Blank Checks',
    'Congress is deciding whether to wipe out state AI protections while setting few federal rules of its own. Americans deserve real accountability for artificial intelligence — transparency, safety testing, and protection from deepfakes and discrimination — without stripping states of the power to protect their residents. Tell Congress to pass meaningful AI guardrails and reject blanket federal preemption.',
    'Science, Technology, Communications',
    'federal',
    'As your constituent, I am asking you to support strong federal accountability rules for AI and to oppose blanket preemption of state AI protections. We need real guardrails, not a blank check for the AI industry.',
    'active',
    0,
    'Featured on the MyDemocracy homepage and shared across our social channels (X, Bluesky, TikTok).'
  ),
  (
    (select creator_id from campaigns order by created_at asc limit 1),
    'demand-a-vote-on-tariffs-7p3q8w',
    'advocacy', 'public', 'approved',
    'Demand a Vote Before the Tariff Deadline',
    'A key tariff authority expires this month, creating a rare moment for Congress to weigh in on trade. Tariffs raise prices on everyday goods, and Americans deserve a transparent debate — not a rubber stamp. Tell your representatives to hold an open vote and reassert Congress''s constitutional authority over tariffs.',
    'Foreign Trade and International Finance',
    'federal',
    'As your constituent, I am asking you to demand a transparent congressional vote on tariff policy and to reassert Congress''s authority over trade. Families are paying more, and we deserve real debate and accountability.',
    'active',
    0,
    'Featured on the MyDemocracy homepage and shared across our social channels (X, Bluesky, TikTok).'
  ),
  (
    (select creator_id from campaigns order by created_at asc limit 1),
    'stop-the-medicaid-coverage-cliff-5r9t2v',
    'advocacy', 'public', 'approved',
    'Stop the Medicaid Coverage Cliff',
    'New work-reporting rules, twice-a-year eligibility checks, and narrowed eligibility are set to strip health coverage from millions of working Americans, seniors, and people with disabilities — often over paperwork, not actual eligibility. Tell Congress to protect Medicaid and cut the red tape that drops eligible people from coverage.',
    'Health',
    'federal',
    'As your constituent, I am asking you to protect Medicaid and stop new red-tape requirements that will drop eligible working families, seniors, and people with disabilities from coverage.',
    'active',
    0,
    'Featured on the MyDemocracy homepage and shared across our social channels (X, Bluesky, TikTok).'
  ),
  (
    (select creator_id from campaigns order by created_at asc limit 1),
    'ban-congressional-stock-trading-8h4n6c',
    'advocacy', 'public', 'approved',
    'Ban Members of Congress From Trading Stocks',
    'Members of Congress vote on laws that move markets — and then trade individual stocks on the side. Large bipartisan majorities of Americans want it to stop. Tell your representatives to pass a ban on individual stock trading by members of Congress and their immediate families. Public service should not be a portfolio strategy.',
    'Government Operations and Politics',
    'federal',
    'As your constituent, I am asking you to support a ban on individual stock trading by members of Congress and their families. Lawmakers should not profit from information their office gives them.',
    'active',
    0,
    'Featured on the MyDemocracy homepage and shared across our social channels (X, Bluesky, TikTok).'
  ),
  (
    (select creator_id from campaigns order by created_at asc limit 1),
    'lower-drug-prices-medicare-3w7k1z',
    'advocacy', 'public', 'approved',
    'Lower Drug Prices: Let Medicare Negotiate More',
    'Americans pay far more for prescription drugs than people in any other wealthy country. Medicare has only just begun negotiating prices on a handful of medications — Congress can expand that power to cover many more drugs and cap out-of-pocket costs. Tell your representatives to put patients ahead of pharmaceutical profits.',
    'Health',
    'federal',
    'As your constituent, I am asking you to expand Medicare''s authority to negotiate prescription drug prices and to cap out-of-pocket costs. No American should ration medication because of price.',
    'active',
    0,
    'Featured on the MyDemocracy homepage and shared across our social channels (X, Bluesky, TikTok).'
  );

commit;
