/**
 * Weigh-in batch 2026-08-15: 4 Nevada state topics + 7 fresh federal topics,
 * verified by a research pass on 2026-08-15 (bill sponsors/status confirmed
 * against GovInfo BILLSTATUS; Nevada measures against Ballotpedia + NV SOS +
 * NELIS). Fills the state-coverage gap (NV is the beachhead state; Questions
 * 6 and 7 are on the November 3, 2026 ballot) and adds July-August news-cycle
 * federal topics the 08-09 batch didn't cover.
 *
 * Inserted as status 'pending' / approval_status 'pending' per ops process —
 * Jared activates via admin PATCH. NOTE for review: Question 7 (voter ID),
 * Question 6 (abortion), and Supreme Court term limits are partisan-charged;
 * per the Maryland-redistricting precedent they should get an explicit go +
 * a second adversarial neutrality pass before activation.
 *
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY in the env.
 * Run: npx tsx scripts/create-weigh-in-batch-2026-08-15.ts
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
  // ---------------- NEVADA (Nov 2026 ballot + 2027 session) ----------------
  {
    slug: 'nevada-question-7-voter-id',
    headline: 'Should Nevada require photo ID to vote? (Question 7)',
    description: 'Question 7 on Nevada\'s November 3, 2026 ballot would amend the state constitution to require photo identification to vote in person and the last four digits of a driver\'s license or Social Security number to vote by mail. Nevada constitutional initiatives must pass twice: voters approved it 73-27 in 2024, and this is the second, final vote. Supporters say verifying identity builds confidence in elections; opponents say it burdens eligible voters to address fraud that is extremely rare. Where do you stand?',
    area: 'civil rights', sub: 'voting access', level: 'state', state: 'NV',
    ref: 'Question 7', title: 'Nevada Require Voter Identification Initiative (2026, second approval)',
    billUrl: 'https://www.nvsos.gov/elections/2026-petitions',
    cfor: 'Supporters argue that voters verify their identity for everyday transactions and that requiring ID for voting is a common-sense safeguard most states already use in some form, strengthening public confidence that every ballot is cast by the person entitled to cast it.',
    cagainst: 'Opponents argue voter impersonation is vanishingly rare and that ID requirements fall hardest on low-income, elderly, disabled, and minority voters who are less likely to hold current photo ID, adding a barrier without addressing a demonstrated problem.',
    sfor: 'https://ballotpedia.org/Nevada_Question_7,_Require_Voter_Identification_Initiative_(2026)',
    sagainst: 'https://lasvegassun.com/news/2024/nov/10/voter-id-question-in-nevada-had-broad-support-but/',
  },
  {
    slug: 'nevada-question-6-abortion-rights',
    headline: 'Should Nevada write abortion rights into the state constitution? (Question 6)',
    description: 'Question 6 on Nevada\'s November 3, 2026 ballot would establish a state constitutional right to abortion until fetal viability, or when needed to protect the patient\'s life or health. Nevada statute already permits abortion up to 24 weeks under a 1990 voter referendum, so the amendment would not change current access — it would make those protections much harder to repeal. Voters approved it 64-36 in 2024; this is the second, final vote. Where do you stand?',
    area: 'healthcare', sub: 'reproductive rights', level: 'state', state: 'NV',
    ref: 'Question 6', title: 'Nevada Right to Abortion Initiative (2026, second approval)',
    billUrl: 'https://www.nvsos.gov/elections/2026-petitions',
    cfor: 'Supporters argue that after Dobbs, statutory protections can be rewritten by future legislatures, and only a constitutional amendment takes the decision durably out of politicians\' hands.',
    cagainst: 'Opponents argue Nevada\'s abortion law is already among the country\'s most protective and unchanged by Dobbs, and warn a broad constitutional right could override existing health regulations and parental-involvement rules for minors.',
    sfor: 'https://reproductivefreedomforall.org/resources/vote-yes-on-nevadas-question-6-the-2026-abortion-rights-ballot-measure-explained/',
    sagainst: 'https://ballotpedia.org/Nevada_Question_6,_Right_to_Abortion_Initiative_(2026)',
  },
  {
    slug: 'nevada-film-tax-credit-expansion',
    headline: 'Should Nevada expand film tax credits to anchor a Las Vegas studio campus?',
    description: 'A proposal to expand Nevada\'s film tax credit program by roughly $95 million a year for 15 years — anchoring the planned Summerlin Studios campus with Warner Bros. Discovery and Sony — has now failed twice: it passed the Assembly in the 2025 session but died in the Senate, and fell one vote short in a November 2025 special session. Backers are expected to try again in the 2027 session. Supporters say it would diversify Nevada\'s economy and create thousands of jobs; fiscal analysts told lawmakers the state would lose about 77 cents per dollar of credits. Where do you stand?',
    area: 'economy', sub: 'tax incentives', level: 'state', state: 'NV',
    ref: 'AB 238 / AB 5 (2025)', title: 'Nevada Studio Infrastructure Jobs and Workforce Training Act',
    billUrl: 'https://www.leg.state.nv.us/App/NELIS/REL/83rd2025/Bill/12258/Overview',
    cfor: 'Building trades and film-industry unions argue the credits would finally diversify a tourism-dependent economy, anchoring a permanent production industry with thousands of construction and studio jobs and workforce training pipelines.',
    cagainst: 'Fiscal analysts told lawmakers the state would recoup only about 23 cents of every credit dollar, making it one of the weakest uses of general-fund capacity compared to schools, housing, or direct services.',
    sfor: 'https://mynews4.com/news/local/unions-pick-sides-in-debate-over-possible-expansion-of-nevadas-film-tax-credit-program-subsidy-sony-warner-bros-summerlin-studios-legislature-special-session',
    sagainst: 'https://nevadacurrent.com/2025/11/14/lawmakers-debate-proposed-film-studio-bill-for-every-dollar-wed-lose-77-cents/',
  },
  {
    slug: 'nevada-senior-rent-stabilization',
    headline: 'Should Nevada cap annual rent increases for seniors?',
    description: 'AB 280 in Nevada\'s 2025 session would have capped annual rent increases at 5% for tenants 62 and older or those dependent on Social Security, and required landlords to itemize and justify fees. It passed both chambers, and Governor Lombardo vetoed it — his second veto of a senior rent-cap bill. Tenant advocates are using the interim to build support for a 2027 rerun. Supporters say seniors on fixed incomes are being priced out; the veto message argues rent control undermines housing affordability over time by discouraging investment. Where do you stand?',
    area: 'economy', sub: 'housing', level: 'state', state: 'NV',
    ref: 'AB 280 (2025)', title: 'Nevada senior rent stabilization and fee transparency (vetoed 2025)',
    billUrl: 'https://www.leg.state.nv.us/App/NELIS/REL/83rd2025/Bill/12333/Overview',
    cfor: 'Supporters argue seniors on fixed Social Security incomes have no way to absorb unlimited rent hikes and opaque fees in one of the nation\'s tightest housing markets, and that a temporary, targeted 5% cap protects the most vulnerable tenants without touching most of the market.',
    cagainst: 'The governor\'s veto message argues rent caps, though well-intentioned, are likely to undermine housing affordability over time by discouraging investment in rental housing — the supply problem that drives high rents in the first place.',
    sfor: 'https://nevadacurrent.com/2025/04/10/lawmaker-calls-out-realtors-association-for-flip-flopping-on-senior-rent-stabilization-bill/',
    sagainst: 'https://gov.nv.gov/uploadedFiles/gov2022nvgov/content/Newsroom/vetos/2025/AB280.pdf',
  },

  // ---------------- FEDERAL (July-August 2026 news cycle) ----------------
  {
    slug: 'college-athlete-pay-federal-rules',
    headline: 'Should Congress set national rules for paying college athletes?',
    description: 'The Protect College Sports Act (S. 4668) would create the first federal framework for college athletics: a statutory right for athletes to earn name, image, and likeness money, one national rulebook replacing state-by-state NIL laws, scholarship and healthcare guarantees, and limited antitrust protection letting the NCAA set eligibility and transfer rules. The Senate is set to take it up in September after a floor fight stalled before recess. Supporters say it stabilizes a chaotic system; player associations say it shields the NCAA from paying athletes what a free market would. Where do you stand?',
    area: 'education', sub: 'college sports', level: 'federal',
    ref: 'S. 4668', title: 'Protect College Sports Act of 2026',
    billUrl: 'https://www.congress.gov/bill/119th-congress/senate-bill/4668',
    cfor: 'Supporters argue athletes gain a guaranteed federal right to NIL earnings plus scholarship and healthcare protections, and that one national rulebook ends a chaotic patchwork of conflicting state laws and endless litigation that no one — schools or athletes — can plan around.',
    cagainst: 'The major professional players associations argue the bill\'s antitrust exemption lets the NCAA cap athlete compensation and block employment and collective bargaining — protections every other American worker and pro athlete has — locking in the schools\' power under the banner of reform.',
    sfor: 'https://www.commerce.senate.gov/press/rep/release/protect-college-sports-act-heads-to-senate-floor/',
    sagainst: 'https://www.athletes.org/news/the-protect-college-sports-act-does-anything-but-protect-them-a-statement-from-athletes-org/',
  },
  {
    slug: 'fema-independent-cabinet-agency',
    headline: 'Should FEMA become an independent, cabinet-level agency?',
    description: 'The FEMA Act (H.R. 4669) would pull FEMA out of the Department of Homeland Security and reestablish it as an independent, cabinet-level agency, while streamlining disaster aid — block-grant options, faster debris removal, and simpler help for survivors. The House committee approved it 57-3, and with a new FEMA administrator confirmed and hurricane season peaking, pressure is building for a floor vote. Supporters say independence cuts red tape and speeds aid; critics say the federal disaster role should shrink, not grow. Where do you stand?',
    area: 'infrastructure', sub: 'disaster response', level: 'federal',
    ref: 'H.R. 4669', title: 'Fixing Emergency Management for Americans (FEMA) Act of 2025',
    billUrl: 'https://www.congress.gov/bill/119th-congress/house-bill/4669',
    cfor: 'Bipartisan committee leaders argue an independent FEMA with direct presidential access — the arrangement that existed before 2003 — plus streamlined aid programs would cut layers of red tape that slow help to survivors after every major disaster.',
    cagainst: 'Critics argue the federal government subsidizes routine disasters that states should handle themselves, and that elevating FEMA expands a federal role that crowds out state preparedness — the reform should be a smaller FEMA focused only on truly catastrophic events.',
    sfor: 'https://transportation.house.gov/news/documentsingle.aspx?DocumentID=408993',
    sagainst: 'https://www.heritage.org/homeland-security/report/states-stop-subsidizing-fema-waste-and-manage-your-own-local-disasters',
  },
  {
    slug: 'credit-card-swipe-fee-competition',
    headline: 'Should Congress force competition in credit card swipe fees?',
    description: 'The Credit Card Competition Act (S. 3623) would require the largest card-issuing banks to enable at least two unaffiliated networks to route credit card transactions, breaking Visa and Mastercard\'s control over the 2-3% "swipe fees" merchants pay on every sale. Retailers are pushing for a 2026 vote while the card industry spends heavily to stop it — one of the hottest lobbying fights of the summer. Supporters say competition would save consumers billions in passed-through fees; opponents say it would gut card rewards and weaken security. Where do you stand?',
    area: 'economy', sub: 'consumer costs', level: 'federal',
    ref: 'S. 3623', title: 'Credit Card Competition Act of 2026',
    billUrl: 'https://www.congress.gov/bill/119th-congress/senate-bill/3623',
    cfor: 'Retailers argue U.S. swipe fees are the highest in the industrialized world because two networks control routing, and that competition would save merchants and consumers billions now baked into the price of everything.',
    cagainst: 'The payments industry argues routing mandates would gut the card rewards programs consumers value, push transactions onto less secure networks, and hand the savings to big-box retailers rather than shoppers — pointing to the debit-fee experiment that produced little consumer benefit.',
    sfor: 'https://nrf.com/advocacy/FedUpWithFees',
    sagainst: 'https://electronicpaymentscoalition.org/oppose-ccca/',
  },
  {
    slug: 'sports-prediction-markets-gambling',
    headline: 'Are sports prediction markets gambling — and should Congress treat them that way?',
    description: 'Platforms like Kalshi offer "event contracts" on sports outcomes under federal commodities law, bypassing state and tribal gambling regulation — including Nevada\'s. The Prediction Markets Are Gambling Act (S. 4160), co-sponsored by Nevada\'s Catherine Cortez Masto, would bar federally regulated exchanges from listing contracts that function as sports bets. This summer, 44 state attorneys general told the CFTC it lacks authority over sports contracts and New York sued Kalshi as an illegal gambling operation. Supporters say the loophole guts state consumer protections; opponents say these are legitimate, federally regulated markets with real informational value. Where do you stand?',
    area: 'economy', sub: 'gambling regulation', level: 'federal',
    ref: 'S. 4160', title: 'Prediction Markets Are Gambling Act',
    billUrl: 'https://www.congress.gov/bill/119th-congress/senate-bill/4160',
    cfor: 'The gaming industry and state regulators argue sports event contracts are nationwide sports betting in disguise — no age-21 checks, no problem-gambling safeguards, no state or tribal oversight — and that Congress should close a loophole that lets one federal agency preempt a century of state gambling law.',
    cagainst: 'Defenders argue prediction markets are legitimate financial instruments regulated by the CFTC, with genuine price-discovery and informational value, and note federal courts have repeatedly blocked state attempts to ban them — evidence the federal framework, not fifty state regimes, is the right home.',
    sfor: 'https://www.americangaming.org/sports-event-contracts/',
    sagainst: 'https://reason.com/2026/07/28/federal-judge-halts-minnesotas-prediction-market-ban-signaling-other-states-efforts-might-be-illegal-too/',
  },
  {
    slug: 'police-counter-drone-authority',
    headline: 'Should local police get power to disable threatening drones?',
    description: 'The Counter-UAS Authority Security, Safety, and Reauthorization Act (H.R. 5061) would renew federal counter-drone authorities and — for the first time — pilot letting designated state and local law enforcement detect, track, and disable drones that threaten stadiums, airports, and public events. The committee approved it 60-0, and the current state/local pilot authority expires September 30, 2026, forcing the question this fall. Supporters say expiring, patchwork authority leaves mass gatherings exposed; civil-liberties groups warn police could down journalists\' and protesters\' drones with no due process. Where do you stand?',
    area: 'technology', sub: 'drones', level: 'federal',
    ref: 'H.R. 5061', title: 'Counter-UAS Authority Security, Safety, and Reauthorization Act',
    billUrl: 'https://www.congress.gov/bill/119th-congress/house-bill/5061',
    cfor: 'Law enforcement and committee leaders argue hostile drones over stadiums, airports, and mass gatherings are a live threat that today\'s expiring, federal-only authorities cannot cover, and that trained local agencies need lawful tools to act in the minutes an incident actually unfolds.',
    cagainst: 'Civil-liberties groups warn counter-drone powers let authorities disable journalists\' and protesters\' drones with no warrant or due process, and argue any reauthorization needs judicial oversight, transparency reporting, and sunsets before thousands of local agencies get takedown authority.',
    sfor: 'https://transportation.house.gov/news/documentsingle.aspx?DocumentID=409042',
    sagainst: 'https://www.eff.org/deeplinks/2025/05/please-drone-responsibly-c-uas-legislation-needs-civil-liberties-safeguards',
  },
  {
    slug: 'supreme-court-term-limits',
    headline: 'Should Supreme Court justices serve 18-year terms instead of life?',
    description: 'The Supreme Court Term Limits and Regular Appointments Act (H.R. 1074) would establish 18-year active terms for Supreme Court justices, with a new appointment every two years; senior justices would rotate to a limited role rather than leave the bench, which sponsors argue makes the change possible by statute rather than constitutional amendment. Senate Democrats reintroduced a companion in July 2026 amid ongoing Court ethics controversies. Supporters say staggered terms lower the stakes of each confirmation; opponents say term limits defy the Constitution\'s lifetime-tenure guarantee and threaten judicial independence. Where do you stand?',
    area: 'civil rights', sub: 'courts', level: 'federal',
    ref: 'H.R. 1074', title: 'Supreme Court Term Limits and Regular Appointments Act of 2025',
    billUrl: 'https://www.congress.gov/bill/119th-congress/house-bill/1074',
    cfor: 'Reform advocates argue staggered 18-year terms would give every president the same number of appointments, end the randomness of death-and-retirement timing, lower the temperature of confirmation wars, and align the Court with the historical norm of much shorter tenures.',
    cagainst: 'Opponents argue the Constitution\'s "good Behaviour" clause means lifetime tenure, so statutory term limits are unconstitutional on their face — and that any scheme rotating justices off active service would make the Court answerable to the political branches it is supposed to check.',
    sfor: 'https://www.brennancenter.org/our-work/policy-solutions/supreme-court-term-limits',
    sagainst: 'https://firstliberty.org/news/supreme-court-term-limits-defy-the-constitution/',
  },
  {
    slug: 'nuclear-fuel-licensing-reform',
    headline: 'Should the U.S. fast-track licensing for domestic nuclear fuel plants?',
    description: 'The MORE American Fuel Act (S. 5249), a bipartisan bill introduced in August 2026, would streamline how the Nuclear Regulatory Commission licenses uranium enrichment facilities: construction could begin at the applicant\'s own risk once an application is docketed, and mandatory hearings would be dropped when no one requests one — while keeping environmental review and public hearing rights. The goal is cutting U.S. reliance on foreign enriched uranium as data-center electricity demand surges. Supporters say outdated licensing is the bottleneck to energy independence; critics warn trimming hearings erodes independent safety review. Where do you stand?',
    area: 'environment', sub: 'nuclear energy', level: 'federal',
    ref: 'S. 5249', title: 'MORE American Fuel Act of 2026',
    billUrl: 'https://www.congress.gov/bill/119th-congress/senate-bill/5249',
    cfor: 'Sponsors from both parties argue enrichment plants face slower, more duplicative licensing than other nuclear fuel facilities for no safety reason, and that aligning the rules is the fastest way to rebuild a domestic fuel supply now dependent on foreign — including Russian-origin — uranium.',
    cagainst: 'Nuclear-safety advocates warn that speeding NRC licensing and trimming hearing requirements chips away at the independent, adversarial safety review that has kept U.S. nuclear facilities safe, and that fuel-cycle facilities deserve more scrutiny as the industry scales up, not less.',
    sfor: 'https://www.kelly.senate.gov/newsroom/press-releases/kelly-lummis-introduce-bipartisan-bill-to-modernize-americas-nuclear-fuel-supply/',
    sagainst: 'https://www.ucsusa.org/resources/advanced-isnt-always-better',
  },
];

const HOST_LABELS: Record<string, string> = {
  'ballotpedia.org': 'Ballotpedia', 'lasvegassun.com': 'Las Vegas Sun', 'nevadacurrent.com': 'Nevada Current',
  'gov.nv.gov': 'Office of the Governor of Nevada', 'mynews4.com': 'KRNV News 4',
  'reproductivefreedomforall.org': 'Reproductive Freedom for All',
  'commerce.senate.gov': 'Senate Commerce Committee', 'athletes.org': 'Athletes.org',
  'transportation.house.gov': 'House Transportation Committee', 'heritage.org': 'Heritage Foundation',
  'nrf.com': 'National Retail Federation', 'electronicpaymentscoalition.org': 'Electronic Payments Coalition',
  'americangaming.org': 'American Gaming Association', 'reason.com': 'Reason',
  'eff.org': 'Electronic Frontier Foundation', 'brennancenter.org': 'Brennan Center',
  'firstliberty.org': 'First Liberty Institute', 'kelly.senate.gov': 'Sen. Mark Kelly',
  'ucsusa.org': 'Union of Concerned Scientists',
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
      // State rows keep is_bill_specific=false — true triggers the
      // Congress.gov fetch, which state refs and ballot questions can't satisfy.
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
