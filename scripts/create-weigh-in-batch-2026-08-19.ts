/**
 * Weigh-in batch 2026-08-19: 6 federal topics built around the September
 * crunch — funding expires Oct 1, NFIP and surface transportation expire
 * Sept 30, the twice-blocked FY2027 NDAA gets a third attempt after the
 * Senate returns Sept 14, Section 702 has been lapsed since June, and the
 * hemp-THC ban bites Nov 12. Research pass 2026-08-19; every bill's number,
 * title, sponsor, and latest action independently re-verified against
 * GovInfo BILLSTATUS XML the same day.
 *
 * Vehicle gotchas from verification (do not "fix" these):
 * - The FISA reauthorization passed the House as a substitute to S. 1318
 *   (Roll 142, 235-191). H.R. 8035 — the number most press coverage uses —
 *   died when its rule failed Apr 17 and never passed. The row keeps a
 *   non-parsing bill ref so is_bill_specific stays false and the campaign
 *   page never fetches S. 1318's unrelated shell title.
 * - The Senate's 90-6 CR rode H.R. 6500 (message to House Aug 10), not the
 *   House's own H.R. 9770.
 * No Nevada item this week: the Legislature is out (biennial), and both
 * certified 2026 ballot measures already have weigh-ins.
 *
 * Inserted as status 'pending' / approval_status 'pending' per ops process —
 * Jared activates via admin PATCH. NOTE for review: the NDAA row is
 * partisan-charged (Iran-war blockade); per the Maryland-redistricting
 * precedent it should get an explicit go + a second adversarial neutrality
 * pass before activation.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY in the env.
 * Run: npx tsx scripts/create-weigh-in-batch-2026-08-19.ts
 */
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.');
  process.exit(1);
}
const admin = createClient(url, key);
const OFFICIAL_CREATOR_ID = '284a14f7-e3ae-48f5-ad14-97995950c168';

type Row = {
  slug: string; headline: string; description: string; area: string; sub: string;
  level: 'federal' | 'state'; state?: string;
  ref: string | null; title: string; billUrl: string;
  cfor: string; cagainst: string; sfor: string; sagainst: string;
};

const ROWS: Row[] = [
  {
    slug: 'fy2027-ndaa-senate-passage',
    headline: 'Should the Senate pass the FY2027 defense authorization bill?',
    description: 'The National Defense Authorization Act (S. 4784) sets Pentagon policy and authorizes weapons programs, readiness accounts, and military pay for fiscal 2027. Congress has enacted an NDAA every year since 1961, and the House passed its companion 216-212 in July. But Senate Democrats voted unanimously in July against taking the bill up, saying they will not advance a record defense bill while the administration fights a conflict with Iran that Congress never voted to authorize; the bill\'s supporters say a must-pass troop bill should not be held over a separate dispute senators can raise through amendments. A third floor attempt is expected after the Senate returns September 14. Where do you stand?',
    area: 'foreign policy', sub: 'defense authorization', level: 'federal',
    ref: 'S. 4784', title: 'National Defense Authorization Act for Fiscal Year 2027',
    billUrl: 'https://www.congress.gov/bill/119th-congress/senate-bill/4784',
    cfor: 'The Armed Services Committee approved the bill on a bipartisan basis, and it authorizes troop pay raises, equipment modernization, and readiness programs that stall without annual authorization. Supporters argue blocking the NDAA for the first time in 64 years punishes servicemembers over an unrelated dispute — and note senators can offer Iran amendments once debate opens, but only if the Senate proceeds to the bill.',
    cagainst: 'Senate Democrats argue that advancing a record defense authorization while the administration wages a war against Iran that Congress never authorized would make the bill a permission slip for further escalation. They contend the must-pass NDAA is Congress\'s real leverage to reassert its constitutional war powers, and that the topline favors defense while domestic programs face cuts.',
    sfor: 'https://www.armed-services.senate.gov/press-releases/sasc-completes-markup-of-national-defense-authorization-act-for-fiscal-year-2027',
    sagainst: 'https://www.democrats.senate.gov/news/press-releases/leader-schumer-floor-remarks-following-senate-democrats-unanimous-vote-against-the-ndaa-senate-democrats-will-not-be-a-rubber-stamp-for-trumps-disastrous-unauthorized-war',
  },
  {
    slug: 'cr-fund-government-december-11',
    headline: 'Should Congress pass the stopgap bill funding the government through December 11?',
    description: 'None of the twelve annual spending bills for fiscal 2027 has passed, and government funding runs out October 1. The Senate passed a stopgap 90-6 in August (riding H.R. 6500) that extends current funding through December 11 and adds provisions the House\'s narrower version lacked: delaying a new rule requiring political appointees to approve federal grants, delaying most of the new hemp-THC restrictions, and extending flood insurance and highway programs. The House passed its own version 220-205 largely along party lines and must now decide whether to accept the Senate bill when it returns in September. Where do you stand?',
    area: 'economy', sub: 'government funding', level: 'federal',
    ref: 'H.R. 6500', title: 'Continuing Appropriations and Extensions Act, 2027',
    billUrl: 'https://www.congress.gov/bill/119th-congress/house-bill/6500',
    cfor: 'Supporters say the stopgap averts an election-season shutdown, drew 90 bipartisan Senate votes, and gives federal workers, contractors, and state grant recipients certainty while full-year bills are negotiated. Rejecting it a month before the deadline would risk repeating last winter\'s record 76-day partial shutdown.',
    cagainst: 'The Appropriations Committee\'s ranking member calls the stopgap approach one-sided and not a serious attempt to govern: it freezes stale funding levels that ignore agencies\' updated needs and punts real decisions past the midterm elections. Critics in both parties add that governing by autopilot stopgaps erodes Congress\'s power of the purse.',
    sfor: 'https://appropriations.house.gov/news/press-releases/house-passes-hr-9770-providing-certainty-preventing-disruption-and-advancing',
    sagainst: 'https://democrats-appropriations.house.gov/news/press-releases/ranking-member-delauro-opposes-house-republican-continuing-resolution-current',
  },
  {
    slug: 'fisa-section-702-revival',
    headline: 'Should Congress revive the lapsed Section 702 foreign surveillance program?',
    description: 'Section 702 of FISA lets intelligence agencies collect the communications of non-Americans abroad from U.S. providers without individual warrants — and Americans\' messages swept in alongside them can be searched by the FBI. The House passed a three-year reauthorization in April (as an amendment to S. 1318), without the warrant requirement privacy advocates sought; the Senate declined to take it up, and the authority lapsed in June — an unprecedented gap for a program officials call the government\'s most valuable intelligence tool. Existing court certifications keep some collection running temporarily while negotiations continue this fall. Where do you stand?',
    area: 'civil rights', sub: 'government surveillance', level: 'federal',
    ref: 'S. 1318 (House substitute)', title: 'FISA Section 702 reauthorization (House-passed substitute to S. 1318)',
    billUrl: 'https://www.congress.gov/bill/119th-congress/senate-bill/1318',
    cfor: 'National security advocates call Section 702 the single most valuable U.S. intelligence authority — credited with disrupting terror plots, tracking fentanyl networks, and attributing cyberattacks — and note the 2024 reforms already added FBI query safeguards. They argue every month of lapse widens intelligence blind spots as court certifications expire, and Congress should renew promptly.',
    cagainst: 'Civil liberties advocates argue Section 702 has become a domestic surveillance tool: the FBI has run large numbers of warrantless "backdoor" searches for Americans\' communications, with documented abuses involving protesters, donors, and officials. They contend Congress should use the lapse as leverage to require warrants for U.S.-person queries before reviving the authority — a reform the House-passed bill omitted.',
    sfor: 'https://www.penncerl.org/the-rule-of-law-post/the-clock-is-ticking-on-americas-most-important-intelligence-program-it-is-time-to-renew-fisa-section-702/',
    sagainst: 'https://www.brennancenter.org/our-work/research-reports/section-702-foreign-intelligence-surveillance-act-fisa-2026-resource-page',
  },
  {
    slug: 'hemp-thc-ban-repeal-regulate',
    headline: 'Should Congress repeal the coming ban on hemp-derived THC products and regulate them instead?',
    description: 'A provision enacted in November 2025 rewrites the federal definition of hemp, which industry analysts estimate would make roughly 95% of current hemp-derived THC products — delta-8, gummies, beverages — federally unlawful starting November 12, 2026. The bipartisan Lawful Hemp Protection Act (H.R. 9830) would instead keep naturally derived hemp products legal under federal rules like age limits and testing while still targeting high-potency synthetic intoxicants. Thirty-five state attorneys general have urged Congress to keep the ban; the Senate\'s stopgap bill would delay most of it only to December 11, so Congress faces the choice this fall. Where do you stand?',
    area: 'agriculture', sub: 'hemp regulation', level: 'federal',
    ref: 'H.R. 9830', title: 'Lawful Hemp Protection Act',
    billUrl: 'https://www.congress.gov/bill/119th-congress/house-bill/9830',
    cfor: 'Supporters say the ban would wipe out a multibillion-dollar industry of farmers and small businesses and products many adults, including veterans, use legally today — pushing demand into unregulated illicit markets. They argue age limits, testing, packaging rules, and per-serving THC caps protect consumers better than prohibition, while the bill still cracks down on synthetic high-THC products.',
    cagainst: 'Opponents, including 35 state attorneys general of both parties, say intoxicating "gas station weed" exploited a Farm Bill loophole to sell unregulated, kid-accessible THC with no federal oversight, fueling poison-control calls and youth use. They argue Congress already settled this in 2025, and repealing or delaying the ban would reward industry pressure at the expense of public health.',
    sfor: 'https://hempsupporter.com/news/andy-barr-and-angie-craig-introduce-bipartisan-bill-to-repeal-hemp-ban-and-protect-hemp-products/',
    sagainst: 'https://learnaboutsam.org/2026/08/35-state-attorneys-general-urge-congress-to-reject-any-effort-to-delay-or-weaken-the-hemp-thc-ban/',
  },
  {
    slug: 'nfip-long-term-reauthorization',
    headline: 'Should Congress pass a long-term flood insurance extension before the program expires September 30?',
    description: 'The National Flood Insurance Program provides most residential flood coverage in the U.S., and its authorization expires September 30 — mid-hurricane season. In a lapse, FEMA generally cannot sell or renew policies, which can stall thousands of home closings in flood zones. For years Congress has extended the program in short increments attached to spending bills (the pending stopgap would push it only to December 11) rather than passing a multi-year reauthorization like the bipartisan H.R. 5484, while the program owes the Treasury more than $20 billion from past catastrophes. Where do you stand?',
    area: 'economy', sub: 'flood insurance', level: 'federal',
    ref: 'H.R. 5484', title: 'National Flood Insurance Program Reauthorization and Reform Act of 2025',
    billUrl: 'https://www.congress.gov/bill/119th-congress/house-bill/5484',
    cfor: 'Realtors, counties, and coastal-state lawmakers of both parties argue serial short-term extensions and lapse threats create needless uncertainty for homeowners — industry estimates put disrupted sales at over a thousand transactions per day during a lapse. A multi-year reauthorization would stabilize the only flood coverage most households can get while Congress debates bigger reforms.',
    cagainst: 'Taxpayer watchdogs argue Congress keeps extending a program more than $20 billion in debt without fixing it: below-risk premiums subsidize repetitive-loss and high-value coastal properties, encourage building in floodplains, and shift costs to taxpayers. They contend any extension should carry reforms — risk-based rates, means-tested help, updated flood maps — not another status-quo renewal.',
    sfor: 'https://www.nar.realtor/flood-insurance/faq-national-flood-insurance-program-expires-september-30-2026',
    sagainst: 'https://www.taxpayer.net/disaster/from-crisis-to-resilience-revamping-the-national-flood-insurance-program/',
  },
  {
    slug: 'build-america-250-surface-transportation',
    headline: 'Should Congress pass the five-year BUILD America 250 highway and transit bill?',
    description: 'The federal highway, transit, and rail programs authorized by the 2021 infrastructure law expire September 30. The House\'s five-year replacement — the BUILD America 250 Act (H.R. 8870), reported from committee 62-2 in May at a topline committee summaries put near $580 billion — would set national surface transportation policy into the 2030s. It awaits a tax-committee piece on Highway Trust Fund financing before a floor vote, the Senate has not released its own bill, and the pending stopgap would extend current programs only to December 11. Supporters and critics disagree over its balance between highways and transit, rail, and clean-transportation programs. Where do you stand?',
    area: 'infrastructure', sub: 'surface transportation', level: 'federal',
    ref: 'H.R. 8870', title: 'BUILD America 250 Act',
    billUrl: 'https://www.congress.gov/bill/119th-congress/house-bill/8870',
    cfor: 'A U.S. Chamber-led coalition of more than 400 state and local chambers, plus state transportation departments and construction and transit groups, argues the bill gives states five years of funding certainty, preserves formula-based funding, streamlines project permitting, and sustains millions of jobs — while lapses and short extensions delay projects and raise costs.',
    cagainst: 'Transportation-reform advocates argue the bill repeats the 2021 law\'s mistakes: it favors highway expansion while cutting transit, rail, and EV-charging programs, and does nothing to fix a Highway Trust Fund kept solvent by general-fund bailouts because the gas tax hasn\'t changed since 1993. They say Congress should prioritize repair, safety, and emissions instead of locking in the status quo for five more years.',
    sfor: 'https://www.uschamber.com/infrastructure/coalition-in-support-of-the-build-america-250-act',
    sagainst: 'https://t4america.org/2026/05/22/ten-things-to-know-about-the-build-acts-failure-to-produce-better-outcomes/',
  },
];

const HOST_LABELS: Record<string, string> = {
  'armed-services.senate.gov': 'Senate Armed Services Committee',
  'democrats.senate.gov': 'Senate Democratic Leadership',
  'appropriations.house.gov': 'House Appropriations Committee',
  'democrats-appropriations.house.gov': 'House Appropriations Committee Democrats',
  'penncerl.org': 'Penn Center for Ethics and the Rule of Law',
  'brennancenter.org': 'Brennan Center for Justice',
  'hempsupporter.com': 'U.S. Hemp Roundtable',
  'learnaboutsam.org': 'Smart Approaches to Marijuana',
  'nar.realtor': 'National Association of Realtors',
  'taxpayer.net': 'Taxpayers for Common Sense',
  'uschamber.com': 'U.S. Chamber of Commerce',
  't4america.org': 'Transportation for America',
};
function label(u: string): string {
  try { const h = new URL(u).hostname.replace(/^www\./, ''); return HOST_LABELS[h] || h; } catch { return 'Source'; }
}
function parseBill(ref: string): { type: string; number: string } {
  const m = ref.match(/^([A-Za-z.]+)\s*([0-9]+)$/);
  const raw = (m ? m[1] : ref).replace(/\./g, '').toLowerCase();
  return { type: raw, number: m ? m[2] : '' };
}

async function run() {
  let inserted = 0, skipped = 0, failed = 0;
  for (const r of ROWS) {
    const { data: existing } = await admin.from('campaigns').select('id').eq('slug', r.slug).maybeSingle();
    if (existing) { console.log(`  SKIP  ${r.slug} (exists)`); skipped++; continue; }
    const isFederal = r.level === 'federal';
    const bill = isFederal && r.ref ? parseBill(r.ref) : null;
    const { error } = await admin.from('campaigns').insert({
      creator_id: OFFICIAL_CREATOR_ID, campaign_type: 'advocacy', visibility: 'public',
      is_official: true, status: 'pending', approval_status: 'pending', message_template: null, action_count: 0,
      slug: r.slug, headline: r.headline, description: r.description,
      issue_area: r.area, issue_subtopic: r.sub, target_level: r.level,
      case_for: r.cfor, case_against: r.cagainst,
      source_for_label: label(r.sfor), source_for_url: r.sfor,
      source_against_label: label(r.sagainst), source_against_url: r.sagainst,
      distribution_plan: 'Promoted through the My Democracy weigh-in feed and social channels to invite constituents to share their own view.',
      // A non-parsing ref (like the FISA substitute) keeps is_bill_specific
      // false so the campaign page never fetches an unrelated shell title.
      is_bill_specific: isFederal && !!bill?.number,
      bill_congress: isFederal && bill?.number ? 119 : null,
      bill_type: isFederal && bill?.number ? bill.type : null,
      bill_number: isFederal && bill?.number ? bill.number : null,
      bill_level: r.level, bill_state: r.state ?? null,
      bill_ref: r.ref, bill_title: r.title, bill_url: r.billUrl,
    });
    if (error) { console.error(`  FAIL  ${r.slug}: ${error.message}`); failed++; }
    else { console.log(`  OK    ${r.slug}`); inserted++; }
  }
  console.log(`\nInserted: ${inserted}, skipped: ${skipped}, failed: ${failed} (all pending — activate via admin)`);
  if (failed > 0) process.exit(1);
}
run().catch((e) => { console.error(e); process.exit(1); });
