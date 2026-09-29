/**
 * Maryland mid-decade redistricting weigh-in (the flagged sixth campaign from
 * the 2026-07-21 weekly batch, greenlit by Jared same day). Created PENDING;
 * activation only after a second adversarial neutrality pass per the ops flag.
 *
 * Facts verified 2026-07-21: special session Aug 3-5 2026 confirmed (announced
 * 7/7); the amendment changes constitutional STANDARDS for congressional
 * map-drawing (undoing the 2022 Szeliga ruling's standards), does NOT itself
 * redraw the map (any redraw would be for 2028); three-fifths of both chambers
 * sends it to a Nov 3, 2026 referendum; not conditional on other states.
 * No bill number exists yet on mgaleg.maryland.gov; RE-VERIFY bill number and
 * enrolled text shortly before Aug 3 and update bill_ref/bill_url.
 *
 * Usage: SUPABASE_SECRET_KEY=... npx tsx scripts/create-maryland-redistricting-2026-07-21.ts
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

const OFFICIAL_CREATOR_ID = '284a14f7-e3ae-48f5-ad14-97995950c168';
const SLUG = 'maryland-mid-decade-redistricting';

const campaign = {
  creator_id: OFFICIAL_CREATOR_ID,
  slug: SLUG,
  campaign_type: 'advocacy',
  visibility: 'public',
  is_official: true,
  status: 'pending',
  approval_status: 'pending',
  message_template: null,
  action_count: 0,
  headline: 'Should states redraw congressional maps between once-a-decade censuses?',
  description: `Maryland lawmakers will meet in special session August 3 to 5 to consider a constitutional amendment changing the standards for drawing the state's congressional districts, undoing the effect of a 2022 court ruling, as states led by both parties have redrawn maps between censuses in 2025 and 2026. The amendment would not itself redraw the map, and any new map would likely not apply before 2028. If three fifths of both chambers approve, the measure goes to voters in a November 2026 referendum. Should states redraw between censuses, and who should control the process? Where do you stand?`,
  issue_area: 'civil-rights',
  issue_subtopic: 'redistricting / voting rights',
  target_level: 'state' as const,
  distribution_plan:
    'Sixth campaign of the 2026-07-21 weekly batch; flagged topic, second neutrality pass required before activation. Bill number not yet assigned; re-verify text and update bill_ref/bill_url from mgaleg.maryland.gov shortly before the Aug 3-5 session. Session announced 2026-07-07 by the presiding officers; scope limited to congressional redistricting.',
  case_for: `Supporters argue elected legislatures are directly accountable to voters and that map-drawing standards should be able to respond to court rulings, population shifts, and changes other states are making. With states led by both parties having redrawn maps mid-decade in 2025 and 2026, they say a state that cannot adjust its own standards leaves its voters at a structural disadvantage.`,
  case_against: `Opponents argue redrawing outside the normal decennial cycle entrenches whoever holds power, cuts competition, and erodes trust in elections. They favor independent commissions and stable maps, warning that a state versus state exchange of redraws leaves voters in districts drawn for partisan advantage rather than around real communities.`,
  source_for_label: `Maryland Governor's Office (amendment proponent; argues states must be able to act)`,
  source_for_url: 'https://governor.maryland.gov/news/press-releases/governor-moore-statement-special-session',
  source_against_label: 'Brennan Center for Justice (democracy-reform advocacy group; opposes mid-decade redistricting)',
  source_against_url: 'https://www.brennancenter.org/our-work/research-reports/redistricting-mid-cycle-assessment',
  is_bill_specific: false,
  bill_congress: null,
  bill_type: null,
  bill_number: null,
  bill_level: 'state' as const,
  bill_state: 'MD',
  bill_ref: '2026 special session amendment',
  bill_title: 'Maryland constitutional amendment on congressional redistricting standards (pending introduction)',
  bill_url: 'https://mgaleg.maryland.gov/mgawebsite/',
};

async function run() {
  const { data: existing } = await admin.from('campaigns').select('id').eq('slug', SLUG).maybeSingle();
  if (existing) {
    console.log(`SKIP ${SLUG} (slug already exists)`);
    return;
  }
  const { error } = await admin.from('campaigns').insert(campaign);
  if (error) {
    console.error(`FAIL ${SLUG}:`, error.message);
    process.exit(1);
  }
  console.log(`OK ${SLUG} (pending; neutrality pass before activation)`);
}

run().catch((err) => {
  console.error('Script failed:', err);
  process.exit(1);
});
