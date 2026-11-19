/**
 * A Georgia example campaign on the jared@mydemocracy.app account, for
 * showing the product to a Georgia organization.
 *
 * The slug MUST keep its demo- prefix. Four separate protections key on it,
 * and none of them look at visibility: public trends excludes demo- rows
 * (src/app/api/trends/route.ts), so do the homepage stats (src/app/page.tsx),
 * and campaign update emails are never sent to a demo- campaign's
 * participants (src/lib/campaign-updates.ts). The 08-11 incident was exactly
 * this: synthetic rows slugged with a -demo SUFFIX slipped the prefix filter
 * and 125 fabricated messages counted toward public trends.
 *
 * The cost of the prefix is that /demo/dashboard serves this campaign to the
 * public alongside the Nevada portfolio, under one name for the whole demo
 * org, Silver State Families Alliance (src/lib/demo.ts). A Georgia campaign
 * under a Nevada coalition reads oddly. That is a cosmetic problem and
 * polluting public trends is a data-integrity one, so the prefix stays.
 * Renaming DEMO_ORG_NAME to something state-neutral would settle it.
 *
 * The campaign carries no bill. The Georgia General Assembly's 2025-2026
 * biennium ended at sine die, so nothing filed is still alive, and the next
 * session convenes in January 2027. A pre-session budget ask is the campaign
 * a Georgia early-childhood organization would actually be running in
 * November, and it has no bill number or bill status to go stale.
 *
 * The organization is fictional. Legislators, districts, parties and emails
 * are the real roster from src/data/states/GA.json. Participants are
 * simulated.
 *
 * Cleanup:
 *   delete from messages where campaign_id = (select id from campaigns where slug = 'demo-ga-child-care-2027');
 *   delete from campaign_actions where campaign_id = (select id from campaigns where slug = 'demo-ga-child-care-2027');
 *   delete from campaigns where slug = 'demo-ga-child-care-2027';
 *
 * Usage:
 *   npx tsx scripts/seed-ga-example.ts           # prints the plan, writes nothing
 *   npx tsx scripts/seed-ga-example.ts --apply   # writes
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://mydemocracy.supabase.co';
const OWNER_ID = '5b807805-8a66-4497-8f46-cf9b92bff610'; // jared@mydemocracy.app
const SLUG = 'demo-ga-child-care-2027';

/** Same lookup as scripts/repair-demo-copy.ts: env first, then .env.local. */
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
let seed = 20261118;
function rnd(): number {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];

// --- Real Georgia roster ---------------------------------------------------
type StateLeg = { id: string; name: string; chamber: 'upper' | 'lower'; party: string; district: string };
const gaLegs = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'src/data/states/GA.json'), 'utf-8')
) as StateLeg[];
const house = gaLegs.filter((l) => l.chamber === 'lower');
const senate = gaLegs.filter((l) => l.chamber === 'upper');
if (house.length !== 180 || senate.length !== 56) {
  throw new Error(`Unexpected GA roster: ${house.length} House, ${senate.length} Senate`);
}

// Legislators who already carry the issue, so the example shows both the
// thank and the persuade path rather than one wall of asks.
const champions = new Set(gaLegs.filter(() => rnd() < 0.18).map((l) => l.id));

// --- Simulated participants ------------------------------------------------
const FIRST = ['Tanya', 'Marcus', 'Emily', 'DeShawn', 'Rebecca', 'Jamal', 'Laura', 'Christopher', 'Keisha', 'Daniel', 'Monica', 'Andre', 'Hannah', 'Terrence', 'Alicia', 'Brandon', 'Yolanda', 'Patrick', 'Simone', 'Gregory', 'Natalie', 'Omar', 'Cynthia', 'Travis', 'Latoya', 'Ethan', 'Brianna', 'Reginald', 'Megan', 'Darius', 'Claudia', 'Nathan', 'Imani', 'Sophia', 'Vincent'];
const LAST = ['Williams', 'Johnson', 'Harris', 'Davis', 'Jackson', 'Freeman', 'Whitfield', 'Carter', 'Mitchell', 'Dawson', 'Pruitt', 'Hollis', 'Bryant', 'Greene', 'Tillman', 'Saxon', 'Boykin', 'Arnold', 'Waters', 'Kirkland', 'Dowdy', 'Stovall', 'Pennington', 'Rucker', 'Means'];
// Weighted roughly like where Georgians live.
const CITIES = [
  ...Array(8).fill('Atlanta'), ...Array(3).fill('Savannah'), ...Array(3).fill('Augusta'),
  ...Array(2).fill('Columbus'), ...Array(2).fill('Macon'), ...Array(2).fill('Athens'),
  ...Array(2).fill('Marietta'), 'Sandy Springs', 'Roswell', 'Johns Creek', 'Alpharetta',
  'Warner Robins', 'Albany', 'Valdosta', 'Smyrna', 'Dunwoody', 'Rome', 'Gainesville',
  'Peachtree City', 'Brunswick', 'Dalton', 'Douglasville', 'LaGrange', 'Statesboro',
];
const person = () => ({ name: `${pick(FIRST)} ${pick(LAST)}`, city: pick(CITIES) });

function at(day: string): string {
  const h = 7 + Math.floor(rnd() * 15);
  const m = Math.floor(rnd() * 60);
  return `${day}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00-05:00`;
}

// Launch spike, decay, a bump the week the budget hearings were announced.
const CURVE: Record<string, number> = {
  '2026-11-04': 16, '2026-11-05': 13, '2026-11-06': 9, '2026-11-07': 6, '2026-11-08': 3,
  '2026-11-09': 4, '2026-11-10': 7, '2026-11-11': 5, '2026-11-12': 5, '2026-11-13': 4,
  '2026-11-14': 2, '2026-11-15': 2, '2026-11-16': 9, '2026-11-17': 7, '2026-11-18': 4,
};

const BODIES_PERSUADE = [
  'I am a parent in [CITY] and we have been on a child care waiting list since the spring. I am asking you to treat child care assistance and Georgia Pre-K as priorities when the budget is written this session.',
  'I direct a child care center in [CITY] and I have two classrooms I cannot open because I cannot hire teachers at what I am able to pay. Please fund child care assistance and Georgia Pre-K in this session budget.',
  'Child care in [CITY] costs more than our mortgage. I had to cut my hours to part time to cover the days we could not afford. Please make child care funding a priority in the budget.',
  'I teach in a Georgia Pre-K classroom in [CITY]. The program works and families count on it. I am asking you to protect and grow its funding this session.',
  'My daughter lost her child care slot in [CITY] when the center closed, and the next opening we found is forty minutes away. Please put child care assistance near the front of the budget this year.',
];
const BODIES_THANK = [
  'Thank you for the work you have already done on early learning. I am a parent in [CITY] and it matters to us. Please keep child care funding in front of your colleagues as the budget comes together.',
  'I saw that you have backed early childhood funding before, and I wanted to say thank you from [CITY]. Please stay on it when the budget is written this session.',
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
  direction: 'support',
  headline: 'Ask Georgia legislators to fund child care in the 2027 session',
  description:
    'Georgia families are waiting months for a child care slot, and programs across the state cannot hire enough teachers to open the rooms they already have. The General Assembly convenes in January and writes the state budget in its first weeks. This campaign asks your state senator and your state representative to treat child care assistance and Georgia Pre-K as budget priorities.',
  ask: 'Tell your chamber leadership that child care assistance and Georgia Pre-K are priorities in this session budget, and vote for the appropriation that funds them.',
  message_template: [
    'Child care in Georgia costs more than many families earn, and the assistance program does not reach everyone who qualifies.',
    'Programs are turning families away because they cannot staff classrooms at current pay.',
    'Georgia Pre-K is one of the longest running state programs of its kind and families plan around it.',
    'The budget written in the first weeks of the session decides what both programs can do for the next year.',
  ].join('\n'),
  talking_points_coverage: 'fit',
  distribution_plan: 'Email list, partner child care centers, parent groups, county early-learning coalitions.',
  org_name: 'Peach State Families Alliance',
  brand_color: '#9A3412',
  created_at: '2026-11-04T08:00:00-05:00',
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
      const seats: StateLeg[] = [pick(house)];
      if (rnd() < 0.78) seats.push(pick(senate));

      actions.push({
        campaign_id: null, // filled in after the campaign row exists
        participant_name: p.name,
        participant_city: p.city,
        participant_state: 'GA',
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
          advocate_state: 'GA',
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
  console.log(`messages:     ${messages.length} to real GA seats (${thanks} thank, ${messages.length - thanks} persuade)`);
  const seatsHit = new Set(messages.map((m) => m.legislator_id));
  console.log(`seats reached: ${seatsHit.size} of 236`);

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
