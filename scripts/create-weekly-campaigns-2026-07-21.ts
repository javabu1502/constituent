/**
 * Weekly official weigh-in batch, 2026-07-21. Five neutral, bill-linked
 * campaigns (3 federal, 2 state). Created as status 'pending' /
 * approval_status 'pending' per ops process; Jared activates via admin PATCH.
 *
 * The Maryland mid-decade redistricting campaign from this week's draft was
 * intentionally NOT created (flagged for explicit go-ahead; "for" source
 * still unsourced).
 *
 * Facts verified 2026-07-21 against GovInfo BILLSTATUS (federal),
 * malegislature.gov and palegis.us (state). Corrections from verification:
 * KOSA sponsor is Blackburn (Blumenthal relabeled co-author/lead cosponsor);
 * "large platforms" -> "covered online platforms"; CLARITY passed the House
 * 294-134 and bundles anti-CBDC provisions; PA HB 1200 removed as a
 * "companion" (different state-store model, rejected in Senate committee).
 * Open States links redirect to a JS-only app, so official legislature URLs
 * are used for bill_url; Open States links kept in distribution_plan.
 *
 * Usage: npx tsx scripts/create-weekly-campaigns-2026-07-21.ts
 * Requires NEXT_PUBLIC_SUPABASE_URL + SUPABASE_SECRET_KEY (.env.local).
 */

import * as path from 'path';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY.');
  process.exit(1);
}
const admin = createClient(url, key);

// MyDemocracy official account: creator of 25 of 28 existing official
// campaigns (ADMIN_USER_IDS is not set in any local/Vercel env).
const OFFICIAL_CREATOR_ID = '284a14f7-e3ae-48f5-ad14-97995950c168';

interface WeeklyCampaign {
  slug: string;
  headline: string;
  description: string;
  issue_area: string;
  issue_subtopic: string | null;
  target_level: 'federal' | 'state' | 'both';
  distribution_plan: string;
  case_for: string;
  case_against: string;
  source_for_label: string;
  source_for_url: string;
  source_against_label: string;
  source_against_url: string;
  is_bill_specific: boolean;
  bill_congress: number | null;
  bill_type: string | null;
  bill_number: string | null;
  bill_level: 'federal' | 'state';
  bill_state: string | null;
  bill_ref: string;
  bill_title: string;
  bill_url: string;
}

const CAMPAIGNS: WeeklyCampaign[] = [
  {
    slug: 'kids-online-safety-act-duty-of-care',
    headline: `Should online platforms have a legal "duty of care" to protect kids from harmful design?`,
    description: `The Kids Online Safety Act (S. 1748) would require covered online platforms to take reasonable steps to prevent and reduce harms to minors from features that maximize their engagement. Supporters say it finally holds platforms accountable for designs that hurt kids; critics warn the "duty of care" could pressure platforms to over-censor lawful speech. Where do you stand?`,
    issue_area: 'other',
    issue_subtopic: 'tech / online safety',
    target_level: 'federal',
    distribution_plan:
      'Weekly official weigh-in batch 2026-07-21. Append to docs/social-media-operations.md Section 5 rotation; promote only after admin approval. Sponsor Sen. Marsha Blackburn (R-TN); in Senate Commerce since 2025-05-14.',
    case_for: `Parents and clinicians point to features engineered to maximize minors' time online and say platforms have faced little real accountability for the results. A duty of care would require companies to design with kids' safety in mind, turn on default protections, and give families more control, similar to safety obligations in other consumer industries.`,
    case_against: `Civil-liberties groups argue the duty of care is triggered by categories of content, which turns it into a content-based rule that could push platforms to filter or remove lawful speech to avoid liability, including material that helps teens navigate mental health, sexuality, or recovery. They warn it could invite officials to target disfavored content and drive broad age-verification.`,
    source_for_label: 'Sen. Richard Blumenthal (co-author and lead cosponsor, supports)',
    source_for_url: 'https://www.blumenthal.senate.gov/about/issues/kids-online-safety-act',
    source_against_label: 'Electronic Frontier Foundation (civil-liberties, opposes)',
    source_against_url:
      'https://www.eff.org/deeplinks/2025/05/kids-online-safety-act-will-make-internet-worse-everyone',
    is_bill_specific: true,
    bill_congress: 119,
    bill_type: 's',
    bill_number: '1748',
    bill_level: 'federal',
    bill_state: null,
    bill_ref: 'S. 1748',
    bill_title: 'Kids Online Safety Act',
    bill_url: 'https://www.congress.gov/bill/119th-congress/senate-bill/1748',
  },
  {
    slug: 'clarity-act-crypto-market-structure',
    headline: 'Who should regulate crypto, and how much protection do buyers need?',
    description: `The Digital Asset Market Clarity Act of 2025 (H.R. 3633) would set federal rules for digital assets, largely splitting oversight between the SEC and the CFTC and defining when a token is a commodity versus a security. It also bars the Federal Reserve from issuing a central bank digital currency. The House passed it 294-134; it now awaits a Senate floor vote. Supporters say clear rules keep the industry onshore and protect consumers better than enforcement-by-lawsuit; opponents say the bill weakens investor protections and leaves gaps for fraud and conflicts of interest. Where do you stand?`,
    issue_area: 'economy',
    issue_subtopic: 'financial regulation / crypto',
    target_level: 'federal',
    distribution_plan:
      'Weekly official weigh-in batch 2026-07-21. Append to Section 5 rotation; promote only after admin approval. Passed House 2025-07-17 (294-134); reported from Senate Banking 2026-06-01, on Senate calendar.',
    case_for: `Industry and many lawmakers argue that today's "regulation by enforcement" leaves builders and consumers guessing and pushes activity offshore. A clear framework would assign regulators, define which tokens are commodities, and set disclosure and custody rules, which supporters say adds protections that do not exist now while keeping the U.S. competitive.`,
    case_against: `Consumer and financial-reform groups argue the bill creates weaker safeguards than apply to stocks and other investments, could let exchanges run conflicting lines of business, and leaves openings for fraud and illicit finance after consumers have already lost billions to crypto scams. They also raise ethics concerns about officials profiting from an industry they help regulate.`,
    source_for_label: 'The Digital Chamber (crypto-industry, supports; via Yahoo Finance coverage)',
    source_for_url:
      'https://finance.yahoo.com/markets/crypto/articles/clarity-act-news-digital-chamber-114030780.html',
    source_against_label: 'National Consumers League (consumer-protection coalition, opposes)',
    source_against_url:
      'https://nclnet.org/clarity-act-fails-to-protect-consumers-from-fraud-conflicts-of-interest-and-financial-instability-say-public-interest-groups/',
    is_bill_specific: true,
    bill_congress: 119,
    bill_type: 'hr',
    bill_number: '3633',
    bill_level: 'federal',
    bill_state: null,
    bill_ref: 'H.R. 3633',
    bill_title: 'Digital Asset Market Clarity Act of 2025',
    bill_url: 'https://www.congress.gov/bill/119th-congress/house-bill/3633',
  },
  {
    slug: 'firearm-merchant-codes-purchase-privacy',
    headline: 'Should payment networks be barred from flagging gun-store purchases with a special code?',
    description: `The House passed the Protecting Privacy in Purchases Act (H.R. 1181) in July 2026, and it is now before the Senate Banking Committee. The bill would bar payment networks and banks from assigning firearm retailers a distinct merchant category code that separates them from other stores. Supporters frame it as protecting lawful buyers' financial privacy; opponents say the codes help flag suspicious purchases tied to trafficking or mass shootings. Where do you stand?`,
    issue_area: 'civil-rights',
    issue_subtopic: 'financial privacy / firearms',
    target_level: 'federal',
    distribution_plan:
      'Weekly official weigh-in batch 2026-07-21. Append to Section 5 rotation; promote only after admin approval. Passed House 2026-07-14 (221-201); referred to Senate Banking 2026-07-15. Framing kept strictly to payment-data privacy vs financial red-flag tool.',
    case_for: `A firearm-specific code singles out a lawful, constitutionally protected purchase and creates what critics call a de facto registry of gun buyers held by private companies. Financial data can be breached, misused, or turned into watchlists, and coding by store type is a blunt tool that flags ordinary customers rather than criminals. Backers say a gun-store sale should be treated like any other retail transaction.`,
    case_against: `A firearm-specific code lets banks spot unusual patterns, such as a rapid buildup of guns and ammunition, and report them to law enforcement, which supporters say could help catch traffickers or prevent mass shootings. They argue the code does not record what was bought, only that a sale occurred at a firearms dealer, and that banning it removes a red flag that already exists for other retail categories.`,
    source_for_label: 'Rep. Riley Moore (sponsor, supports)',
    source_for_url:
      'https://rileymoore.house.gov/media/press-releases/congressman-riley-m-moores-protecting-privacy-purchases-act-passes-us-house',
    source_against_label: 'Everytown for Gun Safety (gun-safety; 2022 statement supporting merchant codes)',
    source_against_url:
      'https://www.everytown.org/press/everytown-applauds-new-banking-merchant-codes-to-crack-down-on-illegal-gun-sales/',
    is_bill_specific: true,
    bill_congress: 119,
    bill_type: 'hr',
    bill_number: '1181',
    bill_level: 'federal',
    bill_state: null,
    bill_ref: 'H.R. 1181',
    bill_title: 'Protecting Privacy in Purchases Act',
    bill_url: 'https://www.congress.gov/bill/119th-congress/house-bill/1181',
  },
  {
    slug: 'massachusetts-data-privacy-right-to-sue',
    headline: 'Should Massachusetts let residents sue companies that mishandle their personal data?',
    description: `The Massachusetts Data Privacy Act (S. 2619) would create the state's first comprehensive consumer privacy law, limiting how much personal data companies can collect and how they use it. After unanimous votes in both chambers, a conference committee is now deciding whether to keep the House-added "private right of action" that would let residents sue large data holders directly. Supporters say strong limits plus a right to sue give the law teeth; opponents warn it could spark settlement-driven lawsuits that burden businesses. Where do you stand?`,
    issue_area: 'other',
    issue_subtopic: 'data privacy',
    target_level: 'state',
    distribution_plan:
      'Weekly official weigh-in batch 2026-07-21. Append to Section 5 rotation; promote only after admin approval. In conference committee since June 2026 (Senate 40-0, House 146-0 on differing versions). Open States: https://openstates.org/ma/bills/194th/S2619/',
    case_for: `Supporters say data-minimization limits (collecting only what a service needs) plus a private right of action are what make a privacy law real, letting residents act when large companies misuse their data instead of relying only on state enforcement that can be under-resourced. They point to the unanimous votes in both chambers as evidence of broad agreement that residents deserve control over their information.`,
    case_against: `Business groups argue a private right of action invites settlement-driven litigation and a "cottage industry" of lawsuits that fall hardest on smaller firms, while rigid data-minimization rules could hamper the state's innovation economy. They favor enforcement by the attorney general over private suits, arguing there is little evidence such suits produce better outcomes for consumers.`,
    source_for_label: 'Consumer Reports (support letter, consumer)',
    source_for_url:
      'https://advocacy.consumerreports.org/wp-content/uploads/2025/10/House-Massachusetts-S.-2619-%E2%80%94-SUPPORT-.pdf',
    source_against_label: 'Greater Boston Chamber of Commerce (business, opposes House version)',
    source_against_url:
      'https://bostonchamber.com/policy-insights/coalition-of-business-leaders-highlight-concerns-with-house-data-privacy-bill/',
    is_bill_specific: false,
    bill_congress: null,
    bill_type: null,
    bill_number: null,
    bill_level: 'state',
    bill_state: 'MA',
    bill_ref: 'S. 2619',
    bill_title: 'An Act establishing the Massachusetts data privacy act',
    bill_url: 'https://malegislature.gov/Bills/194/S2619',
  },
  {
    slug: 'pennsylvania-legalize-recreational-marijuana',
    headline: 'Should Pennsylvania legalize and tax recreational marijuana for adults?',
    description: `Pennsylvania lawmakers remain split over legalizing adult-use cannabis. The bipartisan SB 120 would legalize, regulate, and tax marijuana for adults 21 and over, but it has sat in the Senate Law and Justice Committee since July 2025, and Senate Democrats filed a discharge petition in June 2026 to force a floor vote. Supporters point to new revenue, expungement, and an end to arrests for simple possession; opponents raise public-health, road-safety, and enforcement concerns and note it remains illegal under federal law. Where do you stand?`,
    issue_area: 'other',
    issue_subtopic: 'cannabis / criminal justice',
    target_level: 'state',
    distribution_plan:
      'Weekly official weigh-in batch 2026-07-21. Append to Section 5 rotation; promote only after admin approval. SB 120 (Laughlin R / Street D) stalled in Senate Law and Justice; discharge resolution filed 2026-06-29. HB 1200 (House-passed state-store model) removed from copy: Senate committee rejected it 3-7 in May 2025, not a companion. Open States: https://openstates.org/pa/bills/2025-2026/SB120/',
    case_for: `Supporters argue legalization would replace an illicit market with a regulated, taxed one, generating hundreds of millions in revenue for schools and services, allowing expungement of past low-level convictions, and ending arrests that fall unevenly across communities. They note most neighboring states have already legalized and that Pennsylvania is losing sales and tax dollars across its borders.`,
    case_against: `Opponents raise concerns about youth access, impaired driving, and the health effects of higher-potency products, and some argue the state should first settle issues with more agreement, like DUI standards and decriminalization. They also note marijuana remains illegal under federal law, which complicates banking, enforcement, and workplace rules.`,
    source_for_label: 'Marijuana Policy Project (reform, supports)',
    source_for_url: 'https://www.mpp.org/states/pennsylvania/',
    source_against_label: 'Spotlight PA (news report documenting Senate GOP leadership opposition)',
    source_against_url:
      'https://www.spotlightpa.org/news/2026/02/cannabis-marijuana-recreational-legalization-pennsylvania-shapiro-legislature-capitol/',
    is_bill_specific: false,
    bill_congress: null,
    bill_type: null,
    bill_number: null,
    bill_level: 'state',
    bill_state: 'PA',
    bill_ref: 'SB 120',
    bill_title: 'Pennsylvania Senate Bill 120 (adult-use cannabis legalization)',
    bill_url: 'https://www.palegis.us/legislation/bills/2025/sb120',
  },
];

async function run() {
  console.log('Creating weekly official weigh-in batch (5 campaigns, pending)...\n');
  let inserted = 0;
  let skipped = 0;
  let failed = 0;

  for (const c of CAMPAIGNS) {
    const { data: existing } = await admin
      .from('campaigns')
      .select('id')
      .eq('slug', c.slug)
      .maybeSingle();

    if (existing) {
      console.log(`  SKIP  ${c.slug} (slug already exists)`);
      skipped++;
      continue;
    }

    const { error } = await admin.from('campaigns').insert({
      creator_id: OFFICIAL_CREATOR_ID,
      campaign_type: 'advocacy',
      visibility: 'public',
      is_official: true,
      status: 'pending',
      approval_status: 'pending',
      message_template: null,
      action_count: 0,
      ...c,
    });

    if (error) {
      console.error(`  FAIL  ${c.slug}:`, error.message);
      failed++;
    } else {
      console.log(`  OK    ${c.slug} (pending)`);
      inserted++;
    }
  }

  console.log(`\nDone. Inserted: ${inserted}, Skipped: ${skipped}, Failed: ${failed}`);
  if (failed > 0) process.exit(1);
}

run().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
