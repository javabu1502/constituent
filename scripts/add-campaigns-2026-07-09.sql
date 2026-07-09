-- MyDemocracy — Add 6 new neutral campaigns (2026-07-09)
-- Coverage gaps: crypto, data privacy, Big Tech antitrust, housing supply,
-- energy permitting, Social Security. All neutral ("where do you stand")
-- with a fair case_for / case_against.
--
-- Adapted from scripts/add-campaigns-2026-07-09.mjs (user-provided) with
-- explicit campaign_type/visibility/approval_status so the rows are actually
-- visible in the directory, discovery, and sitemap.
--
-- PREREQUISITE: migration 20260709000000_campaign_neutral_framing.sql.
-- Run via: npx supabase db query --linked --file scripts/add-campaigns-2026-07-09.sql

begin;

insert into campaigns
  (creator_id, slug, campaign_type, visibility, approval_status, headline, description, issue_area, target_level, message_template, status, action_count, distribution_plan, case_for, case_against)
values
  (
    (select creator_id from campaigns order by created_at asc limit 1),
    'how-should-us-regulate-crypto-cr7m2x',
    'advocacy', 'public', 'approved',
    'How Should the U.S. Regulate Cryptocurrency?',
    'Congress is writing the rules for digital assets — which agency oversees them, how stablecoins are backed, and how much protection consumers get. Regulators face a mid-2026 deadline to finalize stablecoin rules, and a broader ''market structure'' bill is moving through the Senate. Where do you stand?',
    'Finance and Financial Sector',
    'federal', null, 'active', 0,
    'Featured on the MyDemocracy homepage and shared across our social channels (X, Bluesky).',
    'Supporters of comprehensive federal rules say clear lines — which agency regulates what, how stablecoins are backed — protect consumers from fraud and collapses, give honest businesses certainty, and keep crypto jobs in the U.S. instead of pushing them offshore.',
    'Skeptics argue the current bills tilt toward the industry (for example, stablecoin yield that could pull deposits from banks) and that moving fast risks locking in weak consumer protections. Some prefer applying existing securities law instead of writing new rules.'
  ),
  (
    (select creator_id from campaigns order by created_at asc limit 1),
    'national-data-privacy-law-pv4k9w',
    'advocacy', 'public', 'approved',
    'Should America Have a National Data Privacy Law?',
    'The U.S. still has no comprehensive federal law governing how companies collect, share, and sell your personal data — a patchwork of state laws fills the gap. Congress is again weighing a single national standard. Where do you land?',
    'Science, Technology, Communications',
    'federal', null, 'active', 0,
    'Featured on the MyDemocracy homepage and shared across our social channels (X, Bluesky).',
    'A single national standard, supporters say, would give everyone baseline privacy rights, make compliance simpler than 50 different state laws, and finally give Americans real control over their own data.',
    'Past bills stalled over the details: whether a federal law should override stronger state protections, and whether people can sue companies directly. A weak national law, critics warn, could preempt better state ones and lock in fewer rights.'
  ),
  (
    (select creator_id from campaigns order by created_at asc limit 1),
    'big-tech-self-preferencing-tp8n3v',
    'advocacy', 'public', 'approved',
    'Should Big Tech Be Barred From Favoring Its Own Products?',
    'A bipartisan bill would stop the largest online platforms from ranking their own products ahead of competitors'', using business customers'' data against them, or blocking data portability. Supporters call it fair competition; opponents call it government micromanagement. Where do you stand?',
    'Commerce',
    'federal', null, 'active', 0,
    'Featured on the MyDemocracy homepage and shared across our social channels (X, Bluesky).',
    'Supporters say dominant platforms use gatekeeper power to squeeze out rivals and raise prices, and that fair-competition rules would spur innovation and give consumers more choice.',
    'Opponents argue the rules could break popular free features, raise privacy and security risks, and amount to the government micromanaging product design — and that antitrust enforcers already have tools to act.'
  ),
  (
    (select creator_id from campaigns order by created_at asc limit 1),
    'tackle-the-housing-shortage-hs5r2k',
    'advocacy', 'public', 'approved',
    'How Should Washington Tackle the Housing Shortage?',
    'The U.S. is short millions of affordable homes, and rents and prices have outpaced incomes. A bipartisan housing-supply package is moving in Congress. Some favor federal incentives to build more; others favor cutting regulations or leaving it to states and localities. Where do you land?',
    'Housing and Community Development',
    'federal', null, 'active', 0,
    'Featured on the MyDemocracy homepage and shared across our social channels (X, Bluesky).',
    'Supporters of federal action point to a shortage of roughly 7 million affordable rentals (NLIHC) and argue that incentives to build more homes, plus tenant protections, are needed to bring costs down at scale.',
    'Others argue housing is mostly a local issue driven by zoning and permitting, and that the fastest fix is removing regulatory barriers to building — not new federal spending or mandates.'
  ),
  (
    (select creator_id from campaigns order by created_at asc limit 1),
    'build-energy-projects-faster-ep6m4z',
    'advocacy', 'public', 'approved',
    'Should Congress Make It Easier to Build Energy Projects?',
    'Building power lines, pipelines, and energy projects can take a decade under current permitting rules. A bipartisan push would streamline approvals to add capacity and lower costs; critics worry about weakening environmental and community review. Where do you stand?',
    'Energy',
    'federal', null, 'active', 0,
    'Featured on the MyDemocracy homepage and shared across our social channels (X, Bluesky).',
    'Faster permitting, supporters say, is essential to expand the grid, lower energy prices, and connect new power — both clean and traditional — before demand outpaces supply.',
    'Critics warn that speeding approvals can cut out environmental review and the voices of affected communities, and they disagree over whether reform would mostly help fossil-fuel or clean-energy projects.'
  ),
  (
    (select creator_id from campaigns order by created_at asc limit 1),
    'keep-social-security-solvent-ss3k7n',
    'advocacy', 'public', 'approved',
    'How Should We Keep Social Security Solvent?',
    'Social Security''s trust funds are projected to run short within about a decade, which would trigger automatic benefit cuts unless Congress acts. Options include raising the payroll tax cap, changing the retirement age, adjusting benefits, or a mix. Where do you stand?',
    'Social Welfare',
    'federal', null, 'active', 0,
    'Featured on the MyDemocracy homepage and shared across our social channels (X, Bluesky).',
    'Supporters of shoring up revenue — like lifting the cap on wages subject to the payroll tax — say benefits shouldn''t be cut for retirees who paid in their whole careers, and that higher earners can afford to contribute more.',
    'Others argue demographics make tax increases alone unsustainable and favor gradually raising the retirement age or slowing benefit growth, warning that revenue-only fixes don''t solve the long-term shortfall.'
  );

commit;
