/**
 * One-off DEMO seed: a pretend Nevada advocacy campaign run start-to-finish
 * through the new stage system, with realistic participation curves.
 *
 * Fictional bill: AB 156 "Breakfast for Every Nevada Student".
 * Journey: cosponsor push -> Assembly Education committee -> Assembly floor
 * -> Senate floor -> thank-you. ~255 simulated constituents, ~335 messages,
 * real NV legislators + the real Assembly Education committee roster.
 *
 * Everything is UNLISTED and owned by jared@mydemocracy.app. Slugs are
 * prefixed demo-ab156- for easy cleanup:
 *   delete from messages where campaign_id in (select id from campaigns where slug like 'demo-ab156-%');
 *   delete from campaign_actions where campaign_id in (select id from campaigns where slug like 'demo-ab156-%');
 *   delete from campaigns where slug like 'demo-ab156-%';
 *
 * Usage: SUPABASE_SERVICE_KEY=... npx tsx scripts/seed-stage-demo-nv.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = 'https://mydemocracy.supabase.co';
const OWNER_ID = '5b807805-8a66-4497-8f46-cf9b92bff610'; // jared@mydemocracy.app

const key = process.env.SUPABASE_SERVICE_KEY;
if (!key) throw new Error('SUPABASE_SERVICE_KEY required');
const db = createClient(SUPABASE_URL, key, { auth: { persistSession: false } });

// Deterministic PRNG so reruns after cleanup produce the same demo.
let seed = 20260810;
function rnd(): number {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];

// --- Real NV data ---------------------------------------------------------
type StateLeg = { id: string; name: string; chamber: 'upper' | 'lower'; party: string };
const nvLegs = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/data/states/NV.json'), 'utf-8')) as StateLeg[];
const assembly = nvLegs.filter((l) => l.chamber === 'lower');
const senators = nvLegs.filter((l) => l.chamber === 'upper');

type StateCmte = { id: string; name: string; chamber: string; classification: string; members: string[] };
const nvCommittees = JSON.parse(
  fs.readFileSync(path.join(process.cwd(), 'src/data/state-committees/NV.json'), 'utf-8')
) as StateCmte[];
const education = nvCommittees.find((c) => c.chamber === 'lower' && /education/i.test(c.name) && c.classification === 'committee');
if (!education) throw new Error('NV Assembly Education committee not found');
const educationMembers = assembly.filter((l) => education.members.includes(l.id));

// ~30% of the Assembly is "already on the bill" for thank/persuade realism.
const sponsors = new Set(assembly.filter(() => rnd() < 0.3).map((l) => l.id));

// --- Simulated constituents ------------------------------------------------
const FIRST = ['Maria', 'James', 'Ana', 'Robert', 'Linda', 'Carlos', 'Susan', 'David', 'Jennifer', 'Miguel', 'Karen', 'Brian', 'Sofia', 'Kevin', 'Amanda', 'Jose', 'Rachel', 'Tyler', 'Nicole', 'Marcus', 'Elena', 'Derek', 'Priya', 'Sam', 'Grace', 'Hector', 'Wendy', 'Aaron', 'Denise', 'Luis'];
const LAST = ['Garcia', 'Smith', 'Johnson', 'Martinez', 'Nguyen', 'Brown', 'Lee', 'Rodriguez', 'Wilson', 'Kim', 'Thompson', 'Lopez', 'Clark', 'Ramirez', 'Baker', 'Chen', 'Torres', 'Ward', 'Rivera', 'Cook', 'Flores', 'Reyes', 'Bell', 'Ortiz', 'Ross'];
// Weighted like Nevada's population.
const CITIES = [
  ...Array(9).fill('Las Vegas'), ...Array(4).fill('Henderson'), ...Array(4).fill('Reno'),
  ...Array(3).fill('North Las Vegas'), ...Array(2).fill('Sparks'), ...Array(2).fill('Spring Valley'),
  'Carson City', 'Elko', 'Boulder City', 'Fernley', 'Mesquite', 'Fallon', 'Winnemucca', 'Pahrump',
];
function person() {
  return { name: `${pick(FIRST)} ${pick(LAST)}`, city: pick(CITIES) };
}
function at(day: string): string {
  const h = 7 + Math.floor(rnd() * 15);
  const m = Math.floor(rnd() * 60);
  return `${day}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:00-07:00`;
}

// Daily participation curves — launch spike, decay, event-driven surges.
type Curve = Record<string, number>;
const cosponsorCurve: Curve = {
  '2026-06-15': 18, '2026-06-16': 14, '2026-06-17': 10, '2026-06-18': 7, '2026-06-19': 5,
  '2026-06-20': 4, '2026-06-21': 3, '2026-06-22': 4, '2026-06-23': 3, '2026-06-24': 3,
  '2026-06-25': 9, '2026-06-26': 7, '2026-06-27': 4, '2026-06-28': 3, '2026-06-29': 3,
  '2026-06-30': 2, '2026-07-01': 3, '2026-07-02': 2, '2026-07-03': 2, '2026-07-04': 1,
  '2026-07-05': 3, '2026-07-06': 2,
}; // = 112
const committeeCurve: Curve = {
  '2026-07-07': 2, '2026-07-08': 2, '2026-07-09': 3, '2026-07-10': 2, '2026-07-11': 1,
  '2026-07-12': 2, '2026-07-13': 3, '2026-07-14': 6, '2026-07-15': 9, '2026-07-16': 3, '2026-07-17': 1,
}; // = 34
const asmFloorCurve: Curve = {
  '2026-07-18': 3, '2026-07-19': 4, '2026-07-20': 6, '2026-07-21': 7, '2026-07-22': 11,
  '2026-07-23': 15, '2026-07-24': 12, '2026-07-25': 3,
}; // = 61
const senFloorCurve: Curve = {
  '2026-07-26': 2, '2026-07-27': 3, '2026-07-28': 3, '2026-07-29': 4, '2026-07-30': 4,
  '2026-07-31': 5, '2026-08-01': 5, '2026-08-02': 6, '2026-08-03': 3, '2026-08-04': 1,
}; // = 36
const thanksCurve: Curve = {
  '2026-08-05': 5, '2026-08-06': 3, '2026-08-07': 2, '2026-08-08': 1, '2026-08-09': 1,
}; // = 12

const BODIES_PERSUADE = [
  'As a parent in [CITY], I see what a difference a real breakfast makes for my kids and their classmates. Please support AB 156 so no Nevada student starts the school day hungry.',
  'Teachers in our district spend their own money on granola bars because kids come in hungry. AB 156 fixes that statewide. I urge you to get behind it.',
  'Hungry kids cannot learn. AB 156 is a practical, proven step for Nevada students and I am asking for your support.',
  'I work two jobs and mornings are chaos. Universal school breakfast would take real pressure off families like mine. Please support AB 156.',
];
const BODIES_THANK = [
  'Thank you for standing up for Nevada kids on AB 156. It means a lot to families like mine. Please keep pushing your colleagues to get this across the finish line.',
  'I saw you are backing AB 156 and I just want to say thank you. Please keep championing it so every Nevada student benefits.',
];
function body(intent: 'persuade' | 'thank', city: string): string {
  return pick(intent === 'thank' ? BODIES_THANK : BODIES_PERSUADE).replace('[CITY]', city);
}

// --- Seed -------------------------------------------------------------------
async function createCampaign(row: Record<string, unknown>): Promise<string> {
  const { data, error } = await db.from('campaigns').insert(row).select('id').single();
  if (error) throw new Error(`campaign insert failed: ${error.message}`);
  return data.id as string;
}

async function main() {
  const shared = {
    creator_id: OWNER_ID,
    campaign_type: 'advocacy',
    visibility: 'unlisted',
    approval_status: 'approved',
    status: 'active',
    issue_area: 'Education',
    target_level: 'state',
    direction: 'support',
    bill_level: 'state',
    bill_state: 'NV',
    bill_ref: 'AB 156',
    bill_title: 'Breakfast for Every Nevada Student Act',
    org_name: 'Nevada Families for School Nutrition',
    brand_color: '#0F766E',
  };

  console.log('Creating parent + stages...');
  const parentId = await createCampaign({
    ...shared,
    slug: 'demo-ab156-parent',
    headline: 'Pass AB 156: Breakfast for Every Nevada Student',
    description: 'AB 156 would provide free school breakfast to every K-12 student in Nevada. We are following it through every step in Carson City — join the push at the stage that matters right now.',
    distribution_plan: 'Email list, PTA chapters, school-board public comment, local press.',
    created_at: '2026-06-15T08:00:00-07:00',
    action_count: 0,
  });

  const stageDefs = [
    { slug: 'demo-ab156-cosponsors', goal: 'cosponsor', headline: 'Ask your Assemblymember to cosponsor AB 156', desc: 'Before the session heats up, every added cosponsor makes committee passage easier. Ask your Assemblymember to put their name on AB 156.', created: '2026-06-15T08:05:00-07:00', curve: cosponsorCurve, filter: null },
    { slug: 'demo-ab156-committee', goal: 'committee', headline: 'Tell Assembly Education: pass AB 156', desc: 'AB 156 gets its hearing in the Assembly Education Committee on July 16. Committee members need to hear from the constituents they represent.', created: '2026-07-07T08:00:00-07:00', curve: committeeCurve, filter: { type: 'committee', committee_id: education!.id, state: 'NV' } },
    { slug: 'demo-ab156-assembly-floor', goal: 'floor_house', headline: 'AB 156 heads to the Assembly floor — ask for a YES', desc: 'The full Assembly votes the week of July 21. Tell your Assemblymember to vote yes on AB 156.', created: '2026-07-18T08:00:00-07:00', curve: asmFloorCurve, filter: null },
    { slug: 'demo-ab156-senate-floor', goal: 'floor_senate', headline: 'Last vote: tell your state Senator to pass AB 156', desc: 'AB 156 cleared the Assembly 28-14. Now it needs your state Senator.', created: '2026-07-26T08:00:00-07:00', curve: senFloorCurve, filter: null },
    { slug: 'demo-ab156-thanks', goal: 'thank_you', headline: 'AB 156 passed — thank your legislators', desc: 'Both chambers passed AB 156. Legislators remember gratitude. Take a minute to thank yours.', created: '2026-08-05T08:00:00-07:00', curve: thanksCurve, filter: null },
  ] as const;

  const actions: Record<string, unknown>[] = [];
  const messages: Record<string, unknown>[] = [];

  for (const s of stageDefs) {
    const total = Object.values(s.curve).reduce((a, b) => a + b, 0);
    const stageId = await createCampaign({
      ...shared,
      slug: s.slug,
      headline: s.headline,
      description: s.desc,
      distribution_plan: 'Stage of the AB 156 initiative.',
      parent_campaign_id: parentId,
      stage_goal: s.goal,
      target_filter: s.filter,
      created_at: s.created,
      action_count: total,
    });
    console.log(`  ${s.goal}: ${stageId} (${total} participants)`);

    for (const [day, count] of Object.entries(s.curve)) {
      for (let i = 0; i < count; i++) {
        const p = person();
        const ts = at(day);
        let recipients: { leg: StateLeg; intent: 'persuade' | 'thank' | null }[] = [];
        if (s.goal === 'cosponsor') {
          const rep = pick(assembly);
          recipients.push({ leg: rep, intent: sponsors.has(rep.id) ? 'thank' : 'persuade' });
          if (rnd() < 0.6) recipients.push({ leg: pick(senators), intent: 'persuade' });
        } else if (s.goal === 'committee') {
          recipients.push({ leg: pick(educationMembers), intent: 'persuade' });
        } else if (s.goal === 'floor_house') {
          recipients.push({ leg: pick(assembly), intent: 'persuade' });
        } else if (s.goal === 'floor_senate') {
          const sen = pick(senators);
          recipients.push({ leg: sen, intent: rnd() < 0.15 ? 'thank' : 'persuade' });
        } else {
          recipients.push({ leg: pick(assembly), intent: 'thank' });
          recipients.push({ leg: pick(senators), intent: 'thank' });
        }

        actions.push({
          campaign_id: stageId,
          participant_name: p.name,
          participant_city: p.city,
          participant_state: 'NV',
          messages_sent: recipients.length,
          stance: 'support',
          created_at: ts,
        });
        for (const r of recipients) {
          messages.push({
            advocate_name: p.name,
            advocate_city: p.city,
            advocate_state: 'NV',
            legislator_name: r.leg.name,
            legislator_id: r.leg.id,
            legislator_party: r.leg.party,
            legislator_level: 'state',
            legislator_chamber: r.leg.chamber,
            issue_area: 'Education',
            issue_subtopic: 'School Nutrition',
            message_body: body(r.intent ?? 'persuade', p.city),
            delivery_method: 'email',
            delivery_status: 'sent',
            message_intent: r.intent,
            campaign_id: stageId,
            created_at: ts,
          });
        }
      }
    }
  }

  console.log(`Inserting ${actions.length} actions, ${messages.length} messages...`);
  for (let i = 0; i < actions.length; i += 200) {
    const { error } = await db.from('campaign_actions').insert(actions.slice(i, i + 200));
    if (error) throw new Error(`actions insert failed: ${error.message}`);
  }
  for (let i = 0; i < messages.length; i += 200) {
    const { error } = await db.from('messages').insert(messages.slice(i, i + 200));
    if (error) throw new Error(`messages insert failed: ${error.message}`);
  }

  await db.from('campaigns').update({ action_count: actions.length }).eq('id', parentId);

  console.log('\nDone. View as jared@mydemocracy.app:');
  console.log('  Parent report:    https://www.mydemocracy.app/campaign/demo-ab156-parent/report');
  console.log('  Parent analytics: https://www.mydemocracy.app/campaign/demo-ab156-parent/analytics');
  for (const s of stageDefs) console.log(`  Stage: https://www.mydemocracy.app/campaign/${s.slug}/analytics`);
}

main().catch((err) => { console.error(err); process.exit(1); });
