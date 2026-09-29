/**
 * One-off DEMO seed: a FEDERAL campaign for the sales walkthrough — fictional
 * H.R. 2184 school-meals bill, cosponsor + committee stages (real House
 * Education & Workforce roster, real members by bioguide), whip positions,
 * a logged meeting with hours, coalition orgs, @example.com advocate emails.
 *
 * Usage: SUPABASE_SERVICE_KEY=... npx tsx scripts/seed-federal-demo.ts
 */
import { createClient } from '@supabase/supabase-js';
import { listCommittees, getCommitteeMembers } from '../src/lib/committees';
import { getAllFederalLegislators } from '../src/lib/legislators';

const OWNER = '5b807805-8a66-4497-8f46-cf9b92bff610';
const db = createClient('https://mydemocracy.supabase.co', process.env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } });

let seed = 2184;
function rnd(): number {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)];
const FIRST = ['Maria', 'James', 'Ana', 'Robert', 'Linda', 'Carlos', 'Susan', 'David', 'Jennifer', 'Miguel', 'Karen', 'Brian', 'Sofia', 'Kevin', 'Amanda', 'Rachel'];
const LAST = ['Garcia', 'Smith', 'Johnson', 'Martinez', 'Nguyen', 'Brown', 'Lee', 'Rodriguez', 'Wilson', 'Kim', 'Thompson', 'Lopez', 'Clark', 'Ramirez'];
const PLACES: [string, string][] = [['Columbus', 'OH'], ['Phoenix', 'AZ'], ['Charlotte', 'NC'], ['Pittsburgh', 'PA'], ['Madison', 'WI'], ['Atlanta', 'GA'], ['Tucson', 'AZ'], ['Cleveland', 'OH'], ['Raleigh', 'NC'], ['Milwaukee', 'WI'], ['Savannah', 'GA'], ['Erie', 'PA']];

async function main() {
  const eduCommittee = listCommittees('house').find((c) => /education/i.test(c.name));
  if (!eduCommittee) throw new Error('House Education committee not found');
  const eduMembers = getCommitteeMembers(eduCommittee.id);
  const houseMembers = getAllFederalLegislators().filter((l) => l.chamber === 'house');
  console.log(`Committee: ${eduCommittee.name} (${eduCommittee.id}), ${eduMembers.length} members`);

  const shared = {
    creator_id: OWNER, campaign_type: 'advocacy', visibility: 'unlisted', approval_status: 'approved', status: 'active',
    issue_area: 'Families & Children', target_level: 'federal', direction: 'support',
    bill_level: 'federal', bill_ref: 'H.R. 2184', bill_title: 'School Meals Modernization Act',
    org_name: 'Nevada Children First Coalition', brand_color: '#B45309',
    distribution_plan: 'National partner network, earned media, member orgs in 12 states.',
  };

  const { data: parent, error: pe } = await db.from('campaigns').insert({
    ...shared,
    slug: 'demo-fed-hr2184-school-meals',
    headline: 'Pass H.R. 2184: Modernize School Meals Nationwide',
    description: 'H.R. 2184 updates federal school meal reimbursements and cuts paperwork so every district can serve every kid. We are following it through Congress step by step.',
    message_template: 'H.R. 2184 modernizes school meal reimbursement rates for the first time in a decade and streamlines eligibility paperwork. District nutrition directors in all 50 states report reimbursements no longer cover costs. The bill is bipartisan, fully offset, and endorsed by the School Nutrition Association.',
    created_at: '2026-06-01T08:00:00-07:00', action_count: 42,
  }).select('id, slug, headline').single();
  if (pe) throw pe;

  const stages = [
    { slug: 'demo-fed-hr2184-cosponsors', goal: 'cosponsor', headline: 'Ask your Representative to cosponsor H.R. 2184', filter: null, window: ['2026-06-01', '2026-07-10'], n: 28, pool: houseMembers },
    { slug: 'demo-fed-hr2184-committee', goal: 'committee', headline: `Tell ${eduCommittee.name.replace('House Committee on ', '')}: pass H.R. 2184`, filter: { type: 'committee', committee_id: eduCommittee.id }, window: ['2026-07-11', '2026-08-10'], n: 14, pool: houseMembers.filter((l) => eduMembers.some((m) => m.bioguide === l.id)) },
  ] as const;

  for (const st of stages) {
    const { data: stage, error: se } = await db.from('campaigns').insert({
      ...shared,
      slug: st.slug, headline: st.headline,
      description: `${st.headline}. A stage of the H.R. 2184 campaign.`,
      message_template: shared.bill_title, parent_campaign_id: parent.id, stage_goal: st.goal,
      target_filter: st.filter, created_at: `${st.window[0]}T09:00:00-07:00`, action_count: st.n,
    }).select('id').single();
    if (se) throw se;

    const actions: Record<string, unknown>[] = [];
    const messages: Record<string, unknown>[] = [];
    const start = new Date(st.window[0]).getTime();
    const span = new Date(st.window[1]).getTime() - start;
    for (let i = 0; i < st.n; i++) {
      const name = `${pick(FIRST)} ${pick(LAST)}`;
      const [city, state] = pick(PLACES);
      const ts = new Date(start + rnd() * span).toISOString();
      const leg = pick(st.pool as typeof houseMembers);
      const email = rnd() < 0.8 ? `${name.toLowerCase().replace(' ', '.')}${Math.floor(rnd() * 99)}@example.com` : null;
      actions.push({ campaign_id: stage.id, participant_name: name, participant_email: email, participant_city: city, participant_state: state, messages_sent: 1, stance: 'support', created_at: ts });
      messages.push({
        advocate_name: name, advocate_email: email, advocate_city: city, advocate_state: state,
        legislator_name: leg.name, legislator_id: leg.id, legislator_party: leg.party, legislator_level: 'federal', legislator_chamber: 'house',
        issue_area: 'Families & Children', issue_subtopic: 'School Nutrition',
        message_body: `As a parent in ${city}, school meals are how my kids get through the day ready to learn. H.R. 2184 fixes reimbursement rates that have not moved in a decade and cuts the paperwork that keeps eligible kids out. Please ${st.goal === 'cosponsor' ? 'cosponsor this bipartisan bill' : 'vote yes in committee'} — districts like ours are counting on it.`,
        delivery_method: 'email', delivery_status: 'sent', message_intent: 'persuade', campaign_id: stage.id, created_at: ts,
      });
    }
    await db.from('campaign_actions').insert(actions);
    await db.from('messages').insert(messages);
    console.log(`  ${st.goal}: ${st.n} actions/messages`);
  }

  // Whip: the committee, with the chair identified by role in vendored data.
  const posRows = eduMembers.slice(0, 20).map((m, i) => ({
    creator_id: OWNER, campaign_id: parent.id, legislator_id: m.bioguide, legislator_name: m.name,
    legislator_party: m.party, legislator_chamber: 'house',
    position: i < 4 ? 'yes' : i < 8 ? 'leaning_yes' : i < 15 ? 'uncommitted' : i < 18 ? 'leaning_no' : 'no',
  }));
  await db.from('legislator_positions').insert(posRows);

  const chair = eduMembers.find((m) => /chair/i.test(m.title ?? ''));
  if (chair) {
    await db.from('campaign_notes').insert({
      creator_id: OWNER, campaign_id: parent.id, legislator_id: chair.bioguide, legislator_name: chair.name,
      body: 'DC fly-in: 30 minutes with the chair and two staffers. Wants CBO score before markup and a district-level reimbursement gap table. Open to scheduling markup in September if the whip count holds.',
      hours: 2.5, created_at: '2026-07-22T11:00:00-04:00',
    });
  }

  const { data: stakes } = await db.from('campaign_stakeholders').insert([
    { creator_id: OWNER, campaign_id: parent.id, name: 'School Nutrition Association', side: 'support', statement: 'Reimbursement modernization is our top federal priority this Congress.' },
    { creator_id: OWNER, campaign_id: parent.id, name: 'AASA, The School Superintendents Association', side: 'support', statement: 'Paperwork reduction alone pays for itself in district staff time.' },
    { creator_id: OWNER, campaign_id: parent.id, name: 'National Taxpayers Union', side: 'oppose', statement: 'Rate indexing on autopilot is how small programs become big ones.' },
  ]).select('id, name');
  const sna = (stakes ?? []).find((s) => s.name === 'School Nutrition Association');
  if (sna) {
    await db.from('campaign_notes').insert({
      creator_id: OWNER, campaign_id: parent.id, stakeholder_id: sna.id,
      body: 'Joint Hill day planned for the week of markup; they bring 40 nutrition directors, we bring the constituent message volume by district.',
      hours: 1, created_at: '2026-07-24T14:00:00-04:00',
    });
  }

  console.log('\nFederal demo ready: /campaign/demo-fed-hr2184-school-meals/analytics');
}

main().catch((e) => { console.error(e); process.exit(1); });
