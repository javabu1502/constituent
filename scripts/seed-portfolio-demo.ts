/**
 * DEMO seed #2: the "Nevada Children First Coalition" portfolio — 8
 * child-focused bills across the 2026 session with the full arc: some
 * passed, some failed on the floor, some died in Finance, one bad bill
 * STOPPED (oppose campaign win), one ongoing. Each carries stakeholder
 * orgs (supporters/opponents + what they said + conversations), whip
 * positions, meeting notes, and constituent activity.
 *
 * AB 156 (existing demo) gets its outcome + coalition. All slugs demo-*
 * (excluded from public stats). Cleanup: same as seed-stage-demo-nv.ts
 * plus campaign_stakeholders/legislator_positions/campaign_notes cascade
 * on campaign delete.
 *
 * Usage: SUPABASE_SERVICE_KEY=... npx tsx scripts/seed-portfolio-demo.ts
 */
import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';

const OWNER = '5b807805-8a66-4497-8f46-cf9b92bff610';
const db = createClient('https://mydemocracy.supabase.co', process.env.SUPABASE_SERVICE_KEY!, { auth: { persistSession: false } });

let seed = 8156;
function rnd(): number {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T,>(a: T[]): T => a[Math.floor(rnd() * a.length)];
const FIRST = ['Maria', 'James', 'Ana', 'Robert', 'Linda', 'Carlos', 'Susan', 'David', 'Jennifer', 'Miguel', 'Karen', 'Brian', 'Sofia', 'Kevin', 'Amanda', 'Rachel', 'Tyler', 'Nicole', 'Marcus', 'Elena'];
const LAST = ['Garcia', 'Smith', 'Johnson', 'Martinez', 'Nguyen', 'Brown', 'Lee', 'Rodriguez', 'Wilson', 'Kim', 'Thompson', 'Lopez', 'Clark', 'Ramirez', 'Baker', 'Chen', 'Torres', 'Ward'];
const CITIES = [...Array(8).fill('Las Vegas'), ...Array(4).fill('Henderson'), ...Array(4).fill('Reno'), ...Array(2).fill('North Las Vegas'), 'Sparks', 'Carson City', 'Elko', 'Pahrump'];

type Leg = { id: string; name: string; chamber: 'upper' | 'lower'; party: string };
const legs = JSON.parse(fs.readFileSync('src/data/states/NV.json', 'utf-8')) as Leg[];

interface Bill {
  slug: string; ref: string; title: string; headline: string; desc: string; template: string;
  direction: 'support' | 'oppose';
  outcome: string | null; outcomeNote: string | null;
  window: [string, string]; // action date range
  volume: number; // participants
  supporters: [string, string][]; // [org, statement]
  opponents: [string, string][];
  convos: [string, string, string][]; // [org, date, note]
  whip?: { spread: Record<string, number>; notes: [string, string][] }; // position->count; [date, note] legislator notes
}

const BILLS: Bill[] = [
  {
    slug: 'demo-nv-ab201-prek', ref: 'AB 201', title: 'Universal Pre-K Expansion Act',
    headline: 'Pass AB 201: Pre-K for Every Nevada 4-Year-Old',
    desc: 'AB 201 phases in universal pre-kindergarten across Nevada school districts over four years.',
    template: 'AB 201 phases in universal pre-K statewide. Every dollar invested in early education returns up to seven in reduced remediation and social costs. 14 states have moved first — Nevada families should not be left behind.',
    direction: 'support', outcome: 'passed', outcomeNote: 'Signed June 2. Phase one launches in Clark and Washoe counties fall 2027.',
    window: ['2026-02-10', '2026-05-28'], volume: 48,
    supporters: [['Nevada Association for the Education of Young Children', 'Universal pre-K is the single highest-leverage investment this legislature can make.'], ['Clark County Education Association', 'Our kindergarten teachers see the readiness gap every August. AB 201 closes it.'], ['Vegas Chamber', 'Child care access is a workforce issue. We support a phased, funded approach.']],
    opponents: [['Nevada Policy Research Institute', 'A new entitlement Nevada cannot sustain past the biennium.']],
    convos: [['Vegas Chamber', '2026-03-04', 'Their gov-affairs lead confirmed testimony in support at the Assembly hearing — wants the workforce framing front and center.'], ['Nevada Policy Research Institute', '2026-03-18', 'Met at the building. They will not move, but agreed to keep opposition to the fiscal note, not the concept.']],
    whip: { spread: { for: 6, committed: 5, uncommitted: 3, against: 2 }, notes: [['2026-03-12', 'Committee chair committed after the district readiness data landed. Wants a parent panel at the hearing.'], ['2026-04-02', 'Swing member moved to committed — the Chamber endorsement did it.']] },
  },
  {
    slug: 'demo-nv-sb118-counselors', ref: 'SB 118', title: "Children's Mental Health Access Act",
    headline: 'SB 118: A Counselor in Every Nevada School',
    desc: 'SB 118 funds school counselors to bring Nevada from one of the worst counselor-to-student ratios in the nation to the recommended standard.',
    template: 'Nevada ranks near last in school counselor ratios — one counselor per 464 students against a recommended 250. SB 118 funds the gap over three bienniums. Early intervention in schools is suicide prevention.',
    direction: 'support', outcome: 'passed', outcomeNote: 'Passed both chambers with bipartisan margins; signed May 30.',
    window: ['2026-02-15', '2026-05-25'], volume: 41,
    supporters: [['NAMI Nevada', 'This bill is suicide prevention, full stop.'], ['Nevada PTA', 'Parents have begged for this for a decade.']],
    opponents: [],
    convos: [['NAMI Nevada', '2026-02-20', 'Joint press conference planned for hearing week; they bring family testimony, we bring constituent volume.']],
  },
  {
    slug: 'demo-nv-ab342-social-media', ref: 'AB 342', title: 'Youth Social Media Safety Act',
    headline: 'AB 342: Design Standards to Protect Nevada Kids Online',
    desc: 'AB 342 requires age-appropriate design defaults and parental controls for minors on large social platforms.',
    template: 'AB 342 requires safety-by-default design for minors: no algorithmic feeds for under-16s without opt-in, night-time notification curfews, and real parental controls. Platform design is a product-safety issue.',
    direction: 'support', outcome: 'died_committee', outcomeNote: 'Died in Senate Finance — the chair declined to schedule a work session after tech-industry fiscal objections.',
    window: ['2026-02-20', '2026-04-30'], volume: 63,
    supporters: [['Nevada PTA', 'Parents cannot out-engineer a thousand product designers. The defaults have to change.'], ['Children\'s Advocacy Alliance', 'The evidence on adolescent mental health is overwhelming.']],
    opponents: [['TechNet', 'A state-by-state patchwork of design mandates is unworkable and likely unconstitutional.'], ['Nevada Resort Association', 'Concerned about spillover definitions capturing loyalty apps.']],
    convos: [['TechNet', '2026-03-25', 'Call with their state director. Offered amendment language narrowing scope to under-16 defaults; they stayed opposed but softened public posture.'], ['Nevada Resort Association', '2026-04-01', 'Their concern resolved with the definitions amendment — moved to neutral in testimony, though they never updated their letter.']],
    whip: { spread: { for: 4, committed: 3, uncommitted: 6, against: 3 }, notes: [['2026-04-18', 'Senate Finance chair non-committal in person; staff signaled the fiscal note is the shield, not the reason.'], ['2026-04-24', 'Vice chair told us plainly: not moving without leadership sign-off. It ends here this session.']] },
  },
  {
    slug: 'demo-nv-sb89-childcare-wages', ref: 'SB 89', title: 'Child Care Worker Wage Supplement',
    headline: 'SB 89: Keep Nevada Child Care Workers in the Classroom',
    desc: 'SB 89 creates a wage supplement for licensed child care workers to stem turnover that closes classrooms statewide.',
    template: 'Child care classrooms close because workers earn less at a warehouse. SB 89 funds a wage supplement that keeps trained caregivers in the field — without it, waitlists grow and parents leave the workforce.',
    direction: 'support', outcome: 'died_committee', outcomeNote: 'Died in Senate Finance alongside three other appropriations in the end-of-session triage.',
    window: ['2026-03-01', '2026-05-10'], volume: 29,
    supporters: [['Nevada Child Care Association', 'We lose a teacher a week to the Amazon warehouse. This is the fix.']],
    opponents: [['Nevada Taxpayers Association', 'Recurring obligations require recurring revenue; this has neither.']],
    convos: [['Nevada Child Care Association', '2026-03-10', 'They can turn out 30 providers for the hearing on two days notice.']],
  },
  {
    slug: 'demo-nv-ab233-sugary-drinks', ref: 'AB 233', title: 'Healthy Kids Marketing Act',
    headline: 'AB 233: End Sugary-Drink Marketing Aimed at Nevada Kids',
    desc: 'AB 233 restricts sugary-beverage advertising targeted at children under 12 on state-regulated media and school properties.',
    template: 'One in five Nevada kindergartners is already obese. AB 233 ends sugary-drink marketing aimed at children under 12 on school property and state-regulated media — modest, evidence-backed, overdue.',
    direction: 'support', outcome: 'failed', outcomeNote: 'Failed on the Assembly floor 19-23 after an aggressive beverage-industry fly-in.',
    window: ['2026-03-05', '2026-05-15'], volume: 22,
    supporters: [['American Heart Association — Nevada', 'Marketing restrictions are among the most cost-effective obesity interventions we have.']],
    opponents: [['American Beverage Association', 'Parents, not Carson City, decide what their kids drink.'], ['Nevada Retail Association', 'Enforcement burden lands on small stores.']],
    convos: [['American Beverage Association', '2026-04-20', 'No meeting granted — they went straight to leadership. Their fly-in flipped four rural members in one week.']],
  },
  {
    slug: 'demo-nv-sb264-child-labor', ref: 'SB 264', title: 'Youth Employment Flexibility Act',
    headline: 'Stop SB 264: Protect Limits on School-Night Work Hours for Minors',
    desc: 'SB 264 would extend permissible school-night working hours for 14- and 15-year-olds. We opposed it: homework and sleep are not workforce inefficiencies.',
    template: 'SB 264 extends school-night work hours for 14- and 15-year-olds to 10pm. Pediatricians, teachers, and parents agree: later shifts mean less sleep and lower grades for the youngest workers. Nevada should not join the race to loosen child labor protections.',
    direction: 'oppose', outcome: 'failed', outcomeNote: 'Defeated in Senate Commerce 3-4 — our two flipped members held. The bill is dead for the session.',
    window: ['2026-03-10', '2026-04-25'], volume: 38,
    supporters: [['Nevada State AFL-CIO', 'Child labor rollbacks dressed up as flexibility.'], ['Nevada State Medical Association', 'Adolescent sleep loss is a public health issue.']],
    opponents: [['Nevada Restaurant Association', 'Teens and parents are asking for schedule flexibility; this is opt-in.']],
    convos: [['Nevada Restaurant Association', '2026-03-28', 'Their lobbyist floated a compromise at 9pm. We declined to negotiate against pediatrician guidance and said so respectfully.'], ['Nevada State Medical Association', '2026-04-02', 'They signed our joint opposition letter and sent a pediatrician to testify.']],
    whip: { spread: { against: 4, uncommitted: 2, for: 1 }, notes: [['2026-04-10', 'Committee swing vote committed to NO after hearing from 22 constituent parents in her district — we showed her the message thread.'], ['2026-04-15', 'Second swing moved our way; cited the medical association letter.']] },
  },
  {
    slug: 'demo-nv-ab410-foster-housing', ref: 'AB 410', title: 'Foster Youth Housing Bridge Act',
    headline: 'AB 410: No Nevada Foster Youth Ages Out Into Homelessness',
    desc: 'AB 410 funds transitional housing vouchers for youth aging out of foster care, bridging 18 to 21.',
    template: 'A third of foster youth experience homelessness within four years of aging out. AB 410 funds a housing bridge from 18 to 21 — a voucher and a caseworker instead of a garbage bag and a bus ticket.',
    direction: 'support', outcome: null, outcomeNote: null,
    window: ['2026-06-20', '2026-08-08'], volume: 33,
    supporters: [['Children\'s Advocacy Alliance', 'The single most preventable pipeline into homelessness in this state.'], ['Nevada Homeless Alliance', 'Cheaper than the alternative by every measure we track.']],
    opponents: [],
    convos: [['Children\'s Advocacy Alliance', '2026-07-08', 'Coordinating a joint interim-committee presentation; they bring former foster youth speakers.']],
    whip: { spread: { for: 3, committed: 2, uncommitted: 5 }, notes: [['2026-07-22', 'Interim committee chair receptive; wants county-level cost data before the session.']] },
  },
];

// AB 156's coalition + outcome (the existing flagship demo).
const AB156 = {
  outcome: 'passed', outcomeNote: 'Passed the Assembly 28-14 and the Senate 14-7; signed August 8. Universal breakfast begins statewide January 2027.',
  supporters: [
    ['Nevada PTA', 'No child can learn hungry. This is the most parent-supported bill of the session.'],
    ['Three Square Food Bank', 'School breakfast reaches kids our pantries cannot.'],
    ['Nevada State Education Association', 'Teachers have subsidized hungry classrooms out of pocket for years.'],
  ] as [string, string][],
  opponents: [
    ['Nevada Taxpayers Association', 'A universal benefit where a targeted one already exists is fiscal creep.'],
  ] as [string, string][],
  convos: [
    ['Three Square Food Bank', '2026-06-20', 'They shared county-level food-insecurity data for the committee packet and co-signed the support letter.'],
    ['Nevada Taxpayers Association', '2026-07-02', 'Met for coffee. They stayed opposed but agreed our federal-match numbers were accurate — took the temperature down at the hearing.'],
  ] as [string, string, string][],
};

function at(day: string): string {
  return `${day}T${String(8 + Math.floor(rnd() * 12)).padStart(2, '0')}:${String(Math.floor(rnd() * 60)).padStart(2, '0')}:00-07:00`;
}
function dateRange(start: string, end: string, n: number): string[] {
  const s = new Date(start).getTime();
  const e = new Date(end).getTime();
  return Array.from({ length: n }, () => new Date(s + rnd() * (e - s)).toISOString().slice(0, 10)).sort();
}

const MSG = [
  'As a parent in [CITY], this bill is personal for our family. [POINT] I am asking for your support because the kids in your district are counting on it, and so are we.',
  'I have lived in [CITY] for years and rarely write my legislators, but this one matters. [POINT] Please give it your vote.',
  'I work with kids in [CITY] every day and see exactly what this bill addresses. [POINT] I would be glad to share what I see on the ground if it would help your decision.',
  'Our neighborhood in [CITY] has been talking about this around kitchen tables for months. [POINT] I hope we can count on you.',
];

async function main() {
  const shared = {
    creator_id: OWNER, campaign_type: 'advocacy', visibility: 'unlisted', approval_status: 'approved',
    status: 'active', issue_area: 'Families & Children', target_level: 'state', bill_level: 'state', bill_state: 'NV',
    org_name: 'Nevada Children First Coalition', brand_color: '#B45309',
  };

  for (const b of BILLS) {
    const { data: camp, error } = await db.from('campaigns').insert({
      ...shared, slug: b.slug, headline: b.headline, description: b.desc, message_template: b.template,
      direction: b.direction, bill_ref: b.ref, bill_title: b.title,
      distribution_plan: 'Coalition email lists, partner orgs, earned media.',
      outcome: b.outcome, outcome_note: b.outcomeNote,
      created_at: at(b.window[0]), action_count: b.volume,
    }).select('id').single();
    if (error) throw new Error(`${b.slug}: ${error.message}`);
    const cid = camp.id as string;

    // Constituent activity.
    const days = dateRange(b.window[0], b.window[1], b.volume);
    const actions: Record<string, unknown>[] = [];
    const messages: Record<string, unknown>[] = [];
    for (const day of days) {
      const name = `${pick(FIRST)} ${pick(LAST)}`;
      const city = pick(CITIES);
      const ts = at(day);
      const leg = pick(legs);
      const point = b.template.split('. ').slice(0, 2).join('. ') + '.';
      actions.push({ campaign_id: cid, participant_name: name, participant_city: city, participant_state: 'NV', messages_sent: 1, stance: b.direction, created_at: ts });
      messages.push({
        advocate_name: name, advocate_city: city, advocate_state: 'NV',
        legislator_name: leg.name, legislator_id: leg.id, legislator_party: leg.party, legislator_level: 'state', legislator_chamber: leg.chamber,
        issue_area: 'Families & Children', issue_subtopic: b.title,
        message_body: pick(MSG).replace('[CITY]', city).replace('[POINT]', point),
        delivery_method: 'email', delivery_status: 'sent', message_intent: b.direction === 'oppose' ? 'persuade' : 'persuade',
        campaign_id: cid, created_at: ts,
      });
    }
    for (let i = 0; i < actions.length; i += 200) {
      const { error: e1 } = await db.from('campaign_actions').insert(actions.slice(i, i + 200));
      if (e1) throw e1;
      const { error: e2 } = await db.from('messages').insert(messages.slice(i, i + 200));
      if (e2) throw e2;
    }

    // Coalition.
    const stakeRows = [
      ...b.supporters.map(([name, statement]) => ({ creator_id: OWNER, campaign_id: cid, name, side: 'support', statement })),
      ...b.opponents.map(([name, statement]) => ({ creator_id: OWNER, campaign_id: cid, name, side: 'oppose', statement })),
    ];
    const { data: stakes, error: se } = await db.from('campaign_stakeholders').insert(stakeRows).select('id, name');
    if (se) throw se;
    const stakeByName = new Map((stakes ?? []).map((s) => [s.name as string, s.id as string]));
    const convoRows = b.convos
      .filter(([org]) => stakeByName.has(org))
      .map(([org, date, body]) => ({ creator_id: OWNER, campaign_id: cid, stakeholder_id: stakeByName.get(org), body, created_at: `${date}T15:00:00-07:00` }));
    if (convoRows.length) {
      const { error: ce } = await db.from('campaign_notes').insert(convoRows);
      if (ce) throw ce;
    }

    // Whip + legislator meeting notes.
    if (b.whip) {
      const pool = [...legs].sort(() => rnd() - 0.5);
      const posRows: Record<string, unknown>[] = [];
      let idx = 0;
      for (const [pos, count] of Object.entries(b.whip.spread)) {
        for (let i = 0; i < count && idx < pool.length; i++, idx++) {
          const l = pool[idx];
          posRows.push({ creator_id: OWNER, campaign_id: cid, legislator_id: l.id, legislator_name: l.name, legislator_party: l.party, legislator_chamber: l.chamber, position: pos, created_at: at(b.window[0]), updated_at: at(b.window[1]) });
        }
      }
      const { error: pe } = await db.from('legislator_positions').insert(posRows);
      if (pe) throw pe;
      const noteRows = b.whip.notes.map(([date, body], i) => {
        const l = pool[i];
        return { creator_id: OWNER, campaign_id: cid, legislator_id: l.id, legislator_name: l.name, body, created_at: `${date}T13:00:00-07:00` };
      });
      const { error: ne } = await db.from('campaign_notes').insert(noteRows);
      if (ne) throw ne;
    }
    console.log(`${b.slug}: ${b.volume} actions, ${stakeRows.length} stakeholders${b.whip ? ', whip seeded' : ''} → ${b.outcome ?? 'ongoing'}`);
  }

  // AB 156: outcome + coalition on the existing flagship.
  const { data: ab156 } = await db.from('campaigns').select('id').eq('slug', 'demo-ab156-parent').single();
  if (ab156) {
    await db.from('campaigns').update({ outcome: AB156.outcome, outcome_note: AB156.outcomeNote }).eq('id', ab156.id);
    const rows = [
      ...AB156.supporters.map(([name, statement]) => ({ creator_id: OWNER, campaign_id: ab156.id, name, side: 'support', statement })),
      ...AB156.opponents.map(([name, statement]) => ({ creator_id: OWNER, campaign_id: ab156.id, name, side: 'oppose', statement })),
    ];
    const { data: stakes } = await db.from('campaign_stakeholders').insert(rows).select('id, name');
    const byName = new Map((stakes ?? []).map((s) => [s.name as string, s.id as string]));
    const convos = AB156.convos
      .filter(([org]) => byName.has(org))
      .map(([org, date, body]) => ({ creator_id: OWNER, campaign_id: ab156.id, stakeholder_id: byName.get(org), body, created_at: `${date}T15:00:00-07:00` }));
    if (convos.length) await db.from('campaign_notes').insert(convos);
    console.log('demo-ab156-parent: outcome=passed, coalition seeded');
  }

  console.log('\nPortfolio complete. Org dashboard: https://www.mydemocracy.app/dashboard (as jared@mydemocracy.app)');
}

main().catch((e) => { console.error(e); process.exit(1); });
