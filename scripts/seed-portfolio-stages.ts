/**
 * One-off: give every portfolio demo bill its journey. Creates stage
 * sub-campaigns per bill (truncated where the bill died — a bill that died in
 * committee never gets floor stages), partitions the parent's existing
 * actions/messages into the stages chronologically, and retargets message
 * recipients to fit each stage (committee stages → committee members, floor
 * stages → that chamber, thank-you stages → intent 'thank').
 *
 * Usage: SUPABASE_SERVICE_KEY=... npx tsx scripts/seed-portfolio-stages.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const OWNER = '5b807805-8a66-4497-8f46-cf9b92bff610';
const db = createClient('https://mydemocracy.supabase.co', process.env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } });

let seed = 77;
function rnd(): number {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)];

type Leg = { id: string; name: string; chamber: 'upper' | 'lower'; party: string };
const legs = JSON.parse(fs.readFileSync('src/data/states/NV.json', 'utf-8')) as Leg[];
const assembly = legs.filter((l) => l.chamber === 'lower');
const senators = legs.filter((l) => l.chamber === 'upper');
type Cmte = { id: string; name: string; chamber: string; classification: string; members: string[] };
const committees = JSON.parse(fs.readFileSync('src/data/state-committees/NV.json', 'utf-8')) as Cmte[];
function findCmte(chamber: string, namePart: string): Cmte | null {
  return committees.find((c) => c.classification === 'committee' && c.chamber === chamber && c.name.toLowerCase().includes(namePart.toLowerCase())) ?? null;
}

interface StageDef { goal: string; frac: number; headline: string; cmte?: Cmte | null }

const PLANS: Record<string, StageDef[]> = {
  'demo-nv-ab201-prek': [
    { goal: 'cosponsor', frac: 0.35, headline: 'Ask your Assemblymember to cosponsor AB 201' },
    { goal: 'committee', frac: 0.2, headline: 'Tell Assembly Education: pass AB 201', cmte: findCmte('lower', 'Education') },
    { goal: 'floor_house', frac: 0.2, headline: 'AB 201 heads to the Assembly floor — vote YES' },
    { goal: 'floor_senate', frac: 0.15, headline: 'Last vote: tell your state Senator to pass AB 201' },
    { goal: 'thank_you', frac: 0.1, headline: 'Pre-K passed — thank your legislators' },
  ],
  'demo-nv-sb118-counselors': [
    { goal: 'cosponsor', frac: 0.4, headline: 'Ask your state Senator to cosponsor SB 118' },
    { goal: 'committee', frac: 0.25, headline: 'Tell Senate Education: pass SB 118', cmte: findCmte('upper', 'Education') },
    { goal: 'floor_senate', frac: 0.25, headline: 'SB 118 heads to the Senate floor — vote YES' },
    { goal: 'thank_you', frac: 0.1, headline: 'Counselors funded — thank your legislators' },
  ],
  'demo-nv-ab342-social-media': [
    { goal: 'cosponsor', frac: 0.4, headline: 'Ask your Assemblymember to cosponsor AB 342' },
    { goal: 'committee', frac: 0.3, headline: 'Tell Assembly Commerce & Labor: pass AB 342', cmte: findCmte('lower', 'Commerce') },
    { goal: 'floor_house', frac: 0.3, headline: 'AB 342 heads to the Assembly floor — vote YES' },
  ],
  'demo-nv-sb89-childcare-wages': [
    { goal: 'cosponsor', frac: 0.55, headline: 'Ask your state Senator to cosponsor SB 89' },
    { goal: 'committee', frac: 0.45, headline: 'Tell Senate Finance: fund SB 89', cmte: findCmte('upper', 'Finance') },
  ],
  'demo-nv-ab233-sugary-drinks': [
    { goal: 'cosponsor', frac: 0.4, headline: 'Ask your Assemblymember to cosponsor AB 233' },
    { goal: 'committee', frac: 0.25, headline: 'Tell Assembly Health & Human Services: pass AB 233', cmte: findCmte('lower', 'Health') },
    { goal: 'floor_house', frac: 0.35, headline: 'AB 233 heads to the Assembly floor — vote YES' },
  ],
  'demo-nv-sb264-child-labor': [
    { goal: 'committee', frac: 0.8, headline: 'Tell Senate Commerce & Labor: vote NO on SB 264', cmte: findCmte('upper', 'Commerce') },
    { goal: 'thank_you', frac: 0.2, headline: 'SB 264 is dead — thank the senators who voted no' },
  ],
  'demo-nv-ab410-foster-housing': [
    { goal: 'cosponsor', frac: 1, headline: 'Ask your Assemblymember to champion AB 410' },
  ],
};

function recipientsFor(goal: string, cmte: Cmte | null | undefined): Leg[] {
  if (goal === 'committee' && cmte) {
    const members = legs.filter((l) => cmte.members.includes(l.id));
    if (members.length) return members;
  }
  if (goal === 'floor_house') return assembly;
  if (goal === 'floor_senate') return senators;
  return legs;
}

async function main() {
  for (const [slug, plan] of Object.entries(PLANS)) {
    const { data: parent, error: pe } = await db
      .from('campaigns')
      .select('*')
      .eq('slug', slug)
      .single();
    if (pe || !parent) { console.log('skip', slug, pe?.message); continue; }

    const { data: existingStages } = await db.from('campaigns').select('id').eq('parent_campaign_id', parent.id);
    if (existingStages && existingStages.length > 0) { console.log(slug, 'already has stages — skipping'); continue; }

    const [{ data: actions }, { data: msgs }] = await Promise.all([
      db.from('campaign_actions').select('id, created_at').eq('campaign_id', parent.id).order('created_at'),
      db.from('messages').select('id, created_at, message_intent').eq('campaign_id', parent.id).order('created_at'),
    ]);
    const acts = actions ?? [];
    const mm = msgs ?? [];

    // Partition chronologically by plan fractions.
    let aStart = 0;
    let mStart = 0;
    for (let i = 0; i < plan.length; i++) {
      const s = plan[i];
      const aCount = i === plan.length - 1 ? acts.length - aStart : Math.round(acts.length * s.frac);
      const mCount = i === plan.length - 1 ? mm.length - mStart : Math.round(mm.length * s.frac);
      const aSlice = acts.slice(aStart, aStart + aCount);
      const mSlice = mm.slice(mStart, mStart + mCount);
      aStart += aCount; mStart += mCount;

      const createdAt = aSlice[0]?.created_at ?? parent.created_at;
      const { data: stage, error: se } = await db.from('campaigns').insert({
        creator_id: OWNER, campaign_type: 'advocacy', visibility: 'unlisted', approval_status: 'approved', status: 'active',
        slug: `${slug}-${s.goal.replace('_', '-')}`,
        headline: s.headline,
        description: `${s.headline}. A stage of the ${parent.bill_ref} campaign.`,
        issue_area: parent.issue_area, target_level: 'state', direction: parent.direction,
        bill_level: 'state', bill_state: 'NV', bill_ref: parent.bill_ref, bill_title: parent.bill_title,
        message_template: parent.message_template, org_name: parent.org_name, brand_color: parent.brand_color,
        distribution_plan: 'Stage of the initiative.',
        parent_campaign_id: parent.id, stage_goal: s.goal,
        target_filter: s.goal === 'committee' && s.cmte ? { type: 'committee', committee_id: s.cmte.id, state: 'NV' } : null,
        created_at: createdAt, action_count: aSlice.length,
      }).select('id').single();
      if (se) throw new Error(`${slug}/${s.goal}: ${se.message}`);

      if (aSlice.length) {
        const { error } = await db.from('campaign_actions').update({ campaign_id: stage.id }).in('id', aSlice.map((a) => a.id));
        if (error) throw error;
      }
      // Move messages + retarget recipients to fit the stage.
      const pool = recipientsFor(s.goal, s.cmte);
      for (const m of mSlice) {
        const leg = pick(pool);
        const { error } = await db.from('messages').update({
          campaign_id: stage.id,
          legislator_id: leg.id, legislator_name: leg.name, legislator_party: leg.party, legislator_chamber: leg.chamber,
          message_intent: s.goal === 'thank_you' ? 'thank' : 'persuade',
        }).eq('id', m.id);
        if (error) throw error;
      }
      console.log(`  ${slug} → ${s.goal}: ${aSlice.length} actions, ${mSlice.length} messages${s.cmte ? ` (→ ${s.cmte.name})` : ''}`);
    }
  }
  console.log('\nAll journeys seeded.');
}

main().catch((e) => { console.error(e); process.exit(1); });
