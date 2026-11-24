/**
 * A Wisconsin example campaign on the jared@mydemocracy.app account, for
 * showing the product to WECA.
 *
 * Sibling of scripts/seed-ga-example.ts, and the header there applies here
 * for the same reasons. The short version:
 *
 * The slug MUST keep its demo- prefix. Four separate protections key on it,
 * and none of them look at visibility: public trends excludes demo- rows
 * (src/app/api/trends/route.ts), so do the homepage stats (src/app/page.tsx),
 * and campaign update emails are never sent to a demo- campaign's
 * participants (src/lib/campaign-updates.ts). The 08-11 incident was exactly
 * this: synthetic rows slugged with a -demo SUFFIX slipped the prefix filter
 * and 125 fabricated messages counted toward public trends.
 *
 * The campaign carries no bill, for the same reason the Georgia one does not.
 * The 2025-2026 Legislature has finished its regular floor periods, so nothing
 * introduced is still moving, and the next Legislature convenes in January.
 * Wisconsin writes its budget biennially, and the 2027-29 bill is introduced
 * early in the year and signed around the summer. A pre-budget ask is what a
 * Wisconsin early-childhood organization is actually running in November, and
 * it has no bill number or bill status to go stale.
 *
 * The programs named are the durable ones -- Wisconsin Shares, 4K, YoungStar
 * -- rather than any single appropriation, so the copy does not rot between
 * the demo and the call.
 *
 * The organization is fictional. Legislators, districts, parties and emails
 * are the real roster from src/data/states/WI.json. Participants are
 * simulated.
 *
 * Cleanup:
 *   delete from messages where campaign_id = (select id from campaigns where slug = 'demo-wi-child-care-2027');
 *   delete from campaign_actions where campaign_id = (select id from campaigns where slug = 'demo-wi-child-care-2027');
 *   delete from campaigns where slug = 'demo-wi-child-care-2027';
 *
 * Usage:
 *   npx tsx scripts/seed-wi-example.ts           # prints the plan, writes nothing
 *   npx tsx scripts/seed-wi-example.ts --apply   # writes
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mydemocracy.supabase.co';
const OWNER_ID = '5b807805-8a66-4497-8f46-cf9b92bff610'; // jared@mydemocracy.app
const SLUG = 'demo-wi-child-care-2027';

/** Same lookup as scripts/seed-ga-example.ts: env first, then .env.local. */
function serviceKey(): string {
  const fromEnv = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SECRET_KEY;
  if (fromEnv && fromEnv !== '...') return fromEnv;
  try {
    const envFile = fs.readFileSync('.env.local', 'utf8');
    for (const name of ['SUPABASE_SERVICE_KEY', 'SUPABASE_SECRET_KEY']) {
      const m = envFile.match(new RegExp(`^${name}=["']?([^"'\n]+)`, 'm'));
      if (m?.[1]?.trim()) return m[1].trim();
    }
  } catch {
    // fall through
  }
  throw new Error(
    'No service key.\n' +
    '  Either fill SUPABASE_SECRET_KEY in .env.local (it is there but empty),\n' +
    '  or prefix the command with SUPABASE_SERVICE_KEY=<the key>.\n' +
    '  Supabase dashboard, Project Settings, API keys, service_role.'
  );
}

// Deterministic, so a rerun after cleanup produces the same example.
let seed = 20261123;
function rnd(): number {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];

// --- Real Wisconsin roster -------------------------------------------------
type StateLeg = { id: string; name: string; chamber: 'upper' | 'lower'; party: string; district: string };
const wiLegs = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'src/data/states/WI.json'), 'utf-8')
) as StateLeg[];
const assembly = wiLegs.filter((l) => l.chamber === 'lower');
const senate = wiLegs.filter((l) => l.chamber === 'upper');
if (assembly.length !== 99 || senate.length !== 33) {
  throw new Error(`Unexpected WI roster: ${assembly.length} Assembly, ${senate.length} Senate`);
}

// Legislators who already carry the issue, so the example shows both the
// thank and the persuade path rather than one wall of asks.
const champions = new Set(wiLegs.filter(() => rnd() < 0.18).map((l) => l.id));

// --- Simulated participants ------------------------------------------------
// Wisconsin names: German, Polish and Scandinavian surnames alongside the
// Hmong communities in Wausau, Eau Claire, Green Bay and Sheboygan, and the
// Black and Latino communities in Milwaukee, Racine and Kenosha.
const FIRST = ['Katie', 'Derek', 'Marissa', 'Tyler', 'Jessica', 'Nathan', 'Amanda', 'Jordan', 'Brittany', 'Cole', 'Stephanie', 'Mai', 'Alyssa', 'Pang', 'Courtney', 'Isaiah', 'Rachel', 'Tou', 'Danielle', 'Marcus', 'Kelsey', 'Rosa', 'Brandon', 'Shannon', 'Miguel', 'Erin', 'Jamal', 'Paige', 'Lucas', 'Yesenia', 'Brett', 'Monique', 'Hannah', 'Devin', 'Claire'];
const LAST = ['Schmidt', 'Johnson', 'Olson', 'Nowak', 'Krueger', 'Hoffman', 'Larson', 'Zimmerman', 'Kowalski', 'Becker', 'Wagner', 'Vang', 'Thao', 'Xiong', 'Peterson', 'Wisniewski', 'Bauer', 'Hernandez', 'Ramirez', 'Washington', 'Robinson', 'Schultz', 'Lindgren', 'Dombrowski', 'Keller'];
// Weighted roughly like where Wisconsinites live.
const CITIES = [
  ...Array(8).fill('Milwaukee'), ...Array(4).fill('Madison'), ...Array(3).fill('Green Bay'),
  ...Array(2).fill('Kenosha'), ...Array(2).fill('Racine'), ...Array(2).fill('Appleton'),
  ...Array(2).fill('Waukesha'), 'Eau Claire', 'Oshkosh', 'Janesville', 'West Allis',
  'La Crosse', 'Sheboygan', 'Wauwatosa', 'Fond du Lac', 'Wausau', 'Brookfield',
  'Beloit', 'New Berlin', 'Manitowoc', 'Sun Prairie', 'Superior', 'Stevens Point',
  'Neenah', 'Menomonee Falls',
];
const person = () => ({ name: `${pick(FIRST)} ${pick(LAST)}`, city: pick(CITIES) });

function at(day: string): string {
  const h = 7 + Math.floor(rnd() * 15);
  const m = Math.floor(rnd() * 60);
  return `${day}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00-06:00`;
}

// Launch spike, decay, a bump the week a provider closure made the news.
const CURVE: Record<string, number> = {
  '2026-11-09': 15, '2026-11-10': 12, '2026-11-11': 8, '2026-11-12': 6, '2026-11-13': 4,
  '2026-11-14': 2, '2026-11-15': 3, '2026-11-16': 8, '2026-11-17': 6, '2026-11-18': 4,
  '2026-11-19': 3, '2026-11-20': 3, '2026-11-21': 2, '2026-11-22': 2, '2026-11-23': 6,
};

const BODIES_PERSUADE = [
  'I am a parent in [CITY] and we have been waiting on a child care spot since spring. I am asking you to make Wisconsin Shares and the early childhood workforce priorities in the next state budget.',
  'I run a child care center in [CITY]. I have a room sitting empty because I cannot hire teachers at what I can afford to pay them. Please fund child care assistance and provider support in the 2027-29 budget.',
  'Child care for our two kids in [CITY] costs more than our mortgage. I dropped to four days a week because we could not cover the fifth. Please treat child care as a budget priority this session.',
  'I teach in a 4K classroom in [CITY]. Families plan their work around this program. I am asking you to protect it and to fund the child care that families need before and after the school day.',
  'The center my son attended in [CITY] closed in August and the nearest opening is a half hour the wrong way down the highway. Please put child care assistance near the front of the next budget.',
  'I am a family child care provider in [CITY] and I have been doing this for eleven years. Reimbursement has not kept up with what it costs me to stay open. Please fund Wisconsin Shares at a rate providers can actually operate on.',
];
const BODIES_THANK = [
  'Thank you for the work you have already done on early learning. I am a parent in [CITY] and it matters to our family. Please keep child care in front of your colleagues when the budget is written.',
  'I know you have supported early childhood funding before, and I wanted to say thank you from [CITY]. Please stay with it through the 2027-29 budget.',
];
const body = (intent: 'persuade' | 'thank', city: string) =>
  pick(intent === 'thank' ? BODIES_THANK : BODIES_PERSUADE).replace('[CITY]', city);

// --- The campaign ----------------------------------------------------------
const campaign = {
  creator_id: OWNER_ID,
  slug: SLUG,
  campaign_type: 'advocacy',
  visibility: 'unlisted',
  approval_status: 'approved',
  status: 'active',
  is_official: false,
  language: 'en',
  issue_area: 'Families',
  issue_subtopic: 'Child Care',
  target_level: 'state',
  // No bill, but the campaign still belongs to a state, and bill_state is the
  // column the org dashboard reads for its section heading.
  bill_state: 'WI',
  direction: 'support',
  headline: 'Ask Wisconsin legislators to fund child care in the next state budget',
  description:
    'Families across Wisconsin are waiting months for a child care spot, and programs cannot hire enough teachers to open the rooms they already have. The Legislature convenes in January and writes the 2027-29 state budget over the first half of the year. This campaign asks your state senator and your state representative to treat child care assistance and the early childhood workforce as budget priorities.',
  ask: 'Tell your committee and your caucus leadership that Wisconsin Shares and early childhood workforce funding belong in the 2027-29 budget, and vote for the appropriation that funds them.',
  message_template: [
    'Child care in Wisconsin costs many families more than their housing, and Wisconsin Shares does not reach everyone who qualifies for it.',
    'Programs are turning families away because they cannot staff classrooms at the pay they can offer today.',
    '4K and YoungStar-rated programs are what working parents build their schedules around.',
    'The biennial budget decides what both child care assistance and the workforce behind it can do for the next two years.',
  ].join('\n'),
  talking_points_coverage: 'fit',
  distribution_plan: 'Email list, partner child care centers and family providers, parent groups, regional early-learning coalitions.',
  org_name: 'Badger State Families Alliance',
  brand_color: '#166534',
  created_at: '2026-11-09T08:00:00-06:00',
  action_count: 0,
};

async function main() {
  const apply = process.argv.includes('--apply');
  const total = Object.values(CURVE).reduce((a, b) => a + b, 0);

  const actions: Record<string, unknown>[] = [];
  const messages: Record<string, unknown>[] = [];
  for (const [day, count] of Object.entries(CURVE)) {
    for (let i = 0; i < count; i++) {
      const p = person();
      const ts = at(day);
      // A state campaign resolves to the participant's own senator and
      // representative. Some people write to one seat and stop.
      const seats: StateLeg[] = [pick(assembly)];
      if (rnd() < 0.78) seats.push(pick(senate));

      actions.push({
        campaign_id: null, // filled in after the campaign row exists
        participant_name: p.name,
        participant_city: p.city,
        participant_state: 'WI',
        messages_sent: seats.length,
        stance: 'support',
        created_at: ts,
      });
      for (const leg of seats) {
        const intent = champions.has(leg.id) ? 'thank' : 'persuade';
        messages.push({
          campaign_id: null,
          advocate_name: p.name,
          advocate_city: p.city,
          advocate_state: 'WI',
          legislator_name: leg.name,
          legislator_id: leg.id,
          legislator_party: leg.party,
          legislator_level: 'state',
          legislator_chamber: leg.chamber,
          issue_area: 'Families',
          issue_subtopic: 'Child Care',
          message_body: body(intent, p.city),
          delivery_method: 'email',
          delivery_status: 'sent',
          message_intent: intent,
          created_at: ts,
        });
      }
    }
  }

  const thanks = messages.filter((m) => m.message_intent === 'thank').length;
  console.log(`campaign:     ${campaign.headline}`);
  console.log(`slug:         ${SLUG} (unlisted, no bill, state level, support)`);
  console.log(`owner:        jared@mydemocracy.app`);
  console.log(`org shown:    ${campaign.org_name} (fictional)`);
  console.log(`participants: ${actions.length} across ${Object.keys(CURVE).length} days (curve total ${total})`);
  console.log(`messages:     ${messages.length} to real WI seats (${thanks} thank, ${messages.length - thanks} persuade)`);
  const seatsHit = new Set(messages.map((m) => m.legislator_id));
  console.log(`seats reached: ${seatsHit.size} of 132`);

  if (!apply) {
    console.log('\nDry run. Nothing written. Re-run with --apply to write.');
    return;
  }

  const db = createClient(SUPABASE_URL, serviceKey(), { auth: { persistSession: false } });

  const { data: existing } = await db.from('campaigns').select('id').eq('slug', SLUG).maybeSingle();
  if (existing) {
    throw new Error(`Campaign ${SLUG} already exists (${existing.id}). Run the cleanup in this file's header first.`);
  }

  const { data: created, error: createErr } = await db
    .from('campaigns')
    .insert(campaign)
    .select('id')
    .single();
  if (createErr) throw new Error(`campaign insert failed: ${createErr.message}`);
  const campaignId = created.id as string;
  console.log(`\nCreated campaign ${campaignId}`);

  for (const row of actions) row.campaign_id = campaignId;
  for (const row of messages) row.campaign_id = campaignId;

  for (let i = 0; i < actions.length; i += 200) {
    const { error } = await db.from('campaign_actions').insert(actions.slice(i, i + 200));
    if (error) throw new Error(`actions insert failed: ${error.message}`);
  }
  for (let i = 0; i < messages.length; i += 200) {
    const { error } = await db.from('messages').insert(messages.slice(i, i + 200));
    if (error) throw new Error(`messages insert failed: ${error.message}`);
  }
  await db.from('campaigns').update({ action_count: actions.length }).eq('id', campaignId);

  console.log(`Inserted ${actions.length} actions and ${messages.length} messages.`);
  console.log('\nOpen as jared@mydemocracy.app:');
  console.log(`  Campaign:  https://www.mydemocracy.app/campaign/${SLUG}`);
  console.log(`  Manage:    https://www.mydemocracy.app/campaign/${SLUG}/manage`);
  console.log(`  Analytics: https://www.mydemocracy.app/campaign/${SLUG}/analytics`);
  console.log(`  Report:    https://www.mydemocracy.app/campaign/${SLUG}/report`);
}

main().catch((err) => { console.error(err); process.exit(1); });
