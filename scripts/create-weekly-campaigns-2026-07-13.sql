-- Weekly bill-specific weigh-ins (week of 2026-07-13): KIDS Act, CLARITY
-- Act, Farm Bill 2026, SAVE America Act. All neutral official weigh-ins with
-- live Congress.gov bill linkage (is_bill_specific = true).
--
-- Adapted from the user's create-weekly-campaigns-2026-07-13.mjs spec:
-- campaign_type 'advocacy' (weigh-in === is_official in this schema),
-- explicit approved/public, bill_title/bill_url fallbacks for the live card.
-- Source swap (verified 2026-07-13): the Heritage press URL redirects to
-- their homepage; replaced with sponsor Rep. Chip Roy's official press
-- release on H.R. 7296 (same pro/election-integrity lean, on-bill).
-- Slug-dupe safe: ON CONFLICT-style guard via WHERE NOT EXISTS.
-- Run: npx supabase db query --linked --file scripts/create-weekly-campaigns-2026-07-13.sql

begin;

insert into campaigns
  (creator_id, slug, campaign_type, visibility, approval_status, is_official, headline, description, issue_area, target_level, message_template, status, action_count, distribution_plan,
   case_for, case_against, source_for_label, source_for_url, source_against_label, source_against_url,
   is_bill_specific, bill_congress, bill_type, bill_number, bill_title, bill_url)
select
  (select creator_id from campaigns order by created_at asc limit 1),
  v.slug, 'advocacy', 'public', 'approved', true, v.headline, v.description, v.issue_area, 'federal', null, 'active', 0, v.distribution_plan,
  v.case_for, v.case_against, v.source_for_label, v.source_for_url, v.source_against_label, v.source_against_url,
  true, 119, v.bill_type, v.bill_number, v.bill_title, v.bill_url
from (values
  (
    'should-platforms-protect-kids-online-k7d3n2',
    'Should online platforms be legally required to protect kids?',
    'The House passed the KIDS Act (H.R. 7757), which would require online platforms to add parental controls, limit minors'' access to certain content, and make AI chatbots disclose information to underage users. Supporters see overdue protection for children; critics raise free speech, privacy, and age-verification concerns. It now heads to the Senate. Where do you stand?',
    'Technology and Online Safety',
    'Kids face real risks online, from harmful content to addictive design and unclear AI chatbots. Baseline safeguards like parental controls and age-appropriate defaults put responsibility on the platforms that profit from young users, not just on parents.',
    'Broad safety mandates can push platforms to over-remove lawful speech and expand age verification that collects sensitive data on everyone, including adults. Critics also warn the rules could burden smaller sites and limit teens'' access to legitimate information.',
    'Public Knowledge (supports the KIDS Act, child-safety lean)',
    'https://publicknowledge.org/the-kids-act-finally-gets-kids-online-safety-mostly-right/',
    'Electronic Frontier Foundation (opposes, digital-rights/free-speech lean)',
    'https://www.eff.org/deeplinks/2026/07/house-passed-kids-act-senate-should-reject-it',
    'hr', '7757', 'KIDS Act', 'https://www.congress.gov/bill/119th-congress/house-bill/7757',
    'Weekly hot-legislation weigh-in; featured in the social rotation. Sponsor Rep. Brett Guthrie (R-KY); House-passed 267-117 on 2026-06-29, now in the Senate.'
  ),
  (
    'should-congress-set-crypto-rules-clr8ty',
    'Should Congress set clear federal rules for crypto?',
    'The CLARITY Act (H.R. 3633) would split oversight of digital assets between the SEC and CFTC and create a federal framework for crypto trading, custody, and disclosures. Supporters say clear rules protect consumers and keep the industry in the US; critics say the current version is too weak on investor protection and conflicts of interest. It sits on the Senate calendar. Where do you stand?',
    'Financial Regulation',
    'A defined framework replaces today''s patchwork of enforcement actions with clear standards for custody, disclosure, and operations. Supporters argue that gives investors more transparency and keeps digital-asset businesses onshore instead of moving overseas.',
    'Critics argue the bill''s investor protections are thin, that it could let some risky products avoid tougher securities rules, and that it preempts state consumer safeguards while leaving conflicts of interest among officials tied to crypto unaddressed.',
    'Blockchain Association (supports, industry lean)',
    'https://theblockchainassociation.org/posts/crypto-council-for-innovation-blockchain-association-express-strong-support-for-markup-of-the-clarity-act',
    'Consumer Reports (opposes as written, consumer-protection lean)',
    'https://advocacy.consumerreports.org/press_release/house-approves-clarity-act-without-needed-protections-for-consumers-and-investors/',
    'hr', '3633', 'CLARITY Act', 'https://www.congress.gov/bill/119th-congress/house-bill/3633',
    'Weekly hot-legislation weigh-in; featured in the social rotation. House-passed 294-134 (2025); cleared Senate Banking 15-9; on the Senate calendar with a new draft expected mid-July 2026.'
  ),
  (
    'how-to-fund-farms-and-food-aid-fm7b26',
    'How should Congress fund farm programs and food assistance?',
    'The Farm, Food, and National Security Act of 2026 (H.R. 7567) would reauthorize crop subsidies, conservation, and nutrition programs through 2031. The central fight is over SNAP: whether to keep recent reductions and cost shifts to states, or restore that funding. The Senate is now writing its version. Where do you stand?',
    'Agriculture and Food',
    'A multi-year farm bill gives farmers and rural communities certainty. Supporters argue that tightening SNAP through work expectations and shared state costs targets aid to those who need it while controlling federal spending.',
    'Anti-hunger advocates say the SNAP reductions and cost shifts would drop families and states off a cliff during high grocery prices, and argue nutrition funding should be restored before the bill moves forward.',
    'Senate Agriculture Committee, Majority (supports the reauthorization, program-reform lean)',
    'https://www.agriculture.senate.gov/newsroom/rep/press/release/what-they-are-saying-support-grows-for-chairman-boozmans-farm-bill-20-discussion-draft',
    'Just Harvest (opposes SNAP cuts, anti-hunger lean)',
    'https://www.justharvest.org/blog/farm-bill-passes-house-vote',
    'hr', '7567', 'Farm, Food, and National Security Act of 2026', 'https://www.congress.gov/bill/119th-congress/house-bill/7567',
    'Weekly hot-legislation weigh-in; featured in the social rotation. House-passed 224-200 on 2026-04-30; Senate Agriculture Committee markup underway July 2026, SNAP the central dispute.'
  ),
  (
    'proof-of-citizenship-to-register-save-sv9k4x',
    'Should voters have to show proof of citizenship to register?',
    'The SAVE America Act (H.R. 7296) would require documentary proof of U.S. citizenship to register for federal elections and direct states to remove noncitizens from voter rolls. Supporters say it protects election integrity; critics say it could burden millions of eligible citizens. The House has passed it and it is stalled in the Senate. Where do you stand?',
    'Elections and Voting',
    'Supporters argue that citizenship is a basic requirement to vote, and that documentary proof plus ongoing list maintenance closes gaps that could let noncitizens register. They say clear requirements strengthen public confidence in federal elections.',
    'Critics point to research showing noncitizen voting is very rare, and warn that documentary proof requirements could disenfranchise eligible citizens who lack easy access to a passport or birth certificate, including married people whose names have changed and rural, elderly, or low-income voters.',
    'Rep. Chip Roy, sponsor (supports, election-integrity lean)',
    'https://roy.house.gov/media/press-releases/rep-roys-save-america-act-passes-house-representatives',
    'Campaign Legal Center (opposes, voting-access lean)',
    'https://campaignlegal.org/update/what-you-need-know-about-save-act',
    'hr', '7296', 'SAVE America Act', 'https://www.congress.gov/bill/119th-congress/house-bill/7296',
    'Weekly hot-legislation weigh-in; featured in the social rotation. Sponsor Rep. Chip Roy (R-TX); House-passed 218-213 (Feb 2026, as amendment to S.1383), stalled in the Senate.'
  )
) as v(slug, headline, description, issue_area, case_for, case_against, source_for_label, source_for_url, source_against_label, source_against_url, bill_type, bill_number, bill_title, bill_url, distribution_plan)
where not exists (select 1 from campaigns c where c.slug = v.slug);

commit;
