/**
 * One-off DEMO seed: a storytelling campaign run by the same fictional org as
 * the child-policy portfolio demo, so the org dashboard's Storytelling section
 * has a walkable example alongside the AB 156 advocacy journey.
 *
 * "The Real Cost of Child Care" — Nevada Children First Coalition collects
 * first-person stories about finding and affording child care. 27 active
 * stories (+1 revoked, to demo the revocation flag) spread over ~8 weeks,
 * with varied attribution levels, varied consent grants, and shared_reps
 * pointing at real NV legislators. Ends by generating the v2 story insights.
 *
 * Everything is UNLISTED and owned by jared@mydemocracy.app. Cleanup:
 *   delete from stories where campaign_id in (select id from campaigns where slug = 'demo-stories-childcare');
 *   delete from story_subjects where campaign_id in (select id from campaigns where slug = 'demo-stories-childcare');
 *   delete from campaign_insights where campaign_id in (select id from campaigns where slug = 'demo-stories-childcare');
 *   delete from campaigns where slug = 'demo-stories-childcare';
 *
 * Usage (service key injected; placeholders satisfy env() for unused vars):
 *   SUPABASE_SECRET_KEY=... CONGRESS_API_KEY=x npx tsx --env-file=.env.local scripts/seed-storytelling-demo.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ldrpgurvxkwkxrbszwld.supabase.co';
const OWNER_ID = '5b807805-8a66-4497-8f46-cf9b92bff610'; // jared@mydemocracy.app

const key = process.env.SUPABASE_SECRET_KEY;
if (!key) throw new Error('SUPABASE_SECRET_KEY required');
const db = createClient(SUPABASE_URL, key, { auth: { persistSession: false } });

// Deterministic PRNG so reruns after cleanup produce the same demo.
let seed = 20260815;
function rnd(): number {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];

type StateLeg = { id: string; name: string; chamber: 'upper' | 'lower'; party: string };
const nvLegs = JSON.parse(fs.readFileSync(path.join(process.cwd(), 'src/data/states/NV.json'), 'utf-8')) as StateLeg[];
const assembly = nvLegs.filter((l) => l.chamber === 'lower');
const senators = nvLegs.filter((l) => l.chamber === 'upper');

function repsFor(): Array<{ name: string; title: string; level: string; chamber: string; party: string | null; state: string }> {
  const a = pick(assembly);
  const s = pick(senators);
  return [
    { name: a.name, title: 'State Assemblymember', level: 'state', chamber: 'lower', party: a.party || null, state: 'NV' },
    { name: s.name, title: 'State Senator', level: 'state', chamber: 'upper', party: s.party || null, state: 'NV' },
  ];
}

function at(day: string): string {
  const h = 7 + Math.floor(rnd() * 14);
  const m = Math.floor(rnd() * 60);
  return `${day}T${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(Math.floor(rnd() * 60)).padStart(2, '0')}-07:00`;
}

// One entry per story: the human being. Bodies are name-free (the platform
// de-identifies excerpts anyway); attribution lives in the metadata columns.
type Def = {
  day: string;
  attribution: 'named' | 'first_name_only' | 'anonymous';
  first: string;
  last?: string;
  city: string | null;
  subject: string;
  body: string;
  uses: string[];
  reps?: boolean; // include shared_reps
  revoked?: boolean;
};

const ALL_USES = [
  'shared_with_legislators',
  'published_web_social',
  'included_in_reports',
  'shared_with_media',
  'used_in_campaign_messaging',
  'contact_me_followup',
];
const QUIET = ['shared_with_legislators', 'included_in_reports'];
const NO_PRESS = ['shared_with_legislators', 'included_in_reports', 'used_in_campaign_messaging'];
const PRESS_OK = ['shared_with_legislators', 'included_in_reports', 'shared_with_media', 'contact_me_followup'];

const DEFS: Def[] = [
  // ---- Launch week: the org emails its list (June 20-26) ----
  { day: '2026-06-20', attribution: 'named', first: 'Marisol', last: 'Vega', city: 'Las Vegas', reps: true, uses: ALL_USES,
    subject: 'Two years on a waitlist',
    body: 'I put my daughter on an infant care waitlist when I was four months pregnant. She turned two last month and we are still number 41. My mother watches her three days a week and I patch the rest together with a neighbor and my sister. I am a dental assistant. I have turned down two full-time offers because I cannot promise anyone five days of coverage. People talk about getting women back into the workforce. I never left. I am just doing two jobs and getting paid for half of one.' },
  { day: '2026-06-20', attribution: 'first_name_only', first: 'Dawn', city: 'Reno', uses: PRESS_OK,
    subject: 'Care costs more than our mortgage',
    body: 'We pay $1,480 a month for our son and $1,290 for our daughter. Our mortgage is $2,100. Child care is the biggest line in our budget and it is not close. We are both teachers. We sat down last spring and did the math on whether one of us should quit, and the only reason we did not is that we would lose our health insurance. Every August we hold our breath waiting to hear if tuition is going up again. It always goes up.' },
  { day: '2026-06-21', attribution: 'anonymous', first: '', city: null, uses: QUIET,
    subject: 'Night shift, no options',
    body: 'I work overnights at a distribution center because the differential is the only way I can make rent. There is no licensed care in this state open at 10 p.m. None that I have ever found. My kids are 7 and 9 and they sleep at my mom\'s apartment five nights a week. She is 71 and tired. If anything happens to her, I honestly do not know what we do. Nobody builds child care for people who work when everyone else is asleep, and we are the people keeping everything running at night.' },
  { day: '2026-06-22', attribution: 'named', first: 'Brianna', last: 'Holt', city: 'Henderson', reps: true, uses: NO_PRESS,
    subject: 'The subsidy cliff took our raise',
    body: 'My husband got a $1.75 an hour raise last year and we celebrated for about a week, until our child care subsidy got recalculated. We went from paying $210 a month to paying $940. The raise comes to about $280 a month. We are worse off because he is better at his job now. I called the office to ask if I was reading it right and the woman on the phone said, quietly, that a lot of families turn down raises for exactly this reason. What kind of system asks people to do that?' },
  { day: '2026-06-23', attribution: 'first_name_only', first: 'Sam', city: 'Sparks', uses: QUIET,
    subject: 'Closed with three weeks notice',
    body: 'Our center closed in March with three weeks notice. Not because families left, the director said enrollment was full with a waitlist. She could not hire. She was paying $14 an hour and the warehouse up the road pays $19 to start. Three weeks to find care for 60 kids in a town where every other center already has a list. My daughter cried for a month, she loved her teachers. Her favorite one drives a forklift now.' },
  { day: '2026-06-24', attribution: 'named', first: 'Consuelo', last: 'Reyes', city: 'North Las Vegas', reps: true, uses: ALL_USES,
    subject: 'A provider\'s side of it',
    body: 'I have run a licensed family child care home for 16 years. I am up at 5, kids arrive at 6:30, the last one leaves at 6. After food, insurance, licensing, and my one assistant, I cleared about $31,000 last year. Parents think I am expensive and I am going broke at the same time, and we are both right. That is the whole problem in one sentence. Three homes on my street have closed since 2023. I am 58. When my knees give out, that is twelve more families with nowhere to go.' },
  { day: '2026-06-25', attribution: 'anonymous', first: '', city: null, uses: NO_PRESS,
    subject: 'Choosing between diapers and a deposit',
    body: 'Every center in driving distance wants first and last month up front, some want a nonrefundable application fee just to get on the list. We paid $75 apiece to get on four waitlists. That was our grocery money for a week and a half, spent on the chance that someday, somebody calls back. One of them did call back, eleven months later. We had already moved in with my in-laws by then.' },
  { day: '2026-06-26', attribution: 'first_name_only', first: 'Katie', city: 'Las Vegas', uses: PRESS_OK,
    subject: 'I do the math every single month',
    body: 'I am a single mom and a hotel housekeeper on the Strip. After the union rate I bring home about $3,100 a month. Infant care near us runs $1,350. Rent is $1,500. You can do that math as well as I can. My son goes to an unlicensed lady in our complex for $600 and I spend every shift trying not to think about it. It is not that I do not know better. It is that better costs $750 a month I do not have.' },

  // ---- Steady trickle (July) ----
  { day: '2026-07-01', attribution: 'named', first: 'Gerald', last: 'Okafor', city: 'Las Vegas', reps: true, uses: NO_PRESS,
    subject: 'Grandpa is the child care system',
    body: 'I retired from the water district in 2022. I now provide, by my count, 47 hours a week of child care for my three grandchildren so both of my kids can keep their jobs. I love those babies more than my own life. I also had my own plans, and I am 69 with a bad hip. Every report about the child care shortage should have a chapter about grandparents, because we are the invisible system holding up the visible one, and we are getting old.' },
  { day: '2026-07-03', attribution: 'first_name_only', first: 'Priya', city: 'Reno', uses: QUIET,
    subject: 'Special needs, no spots',
    body: 'My son is four and autistic. He is sweet and curious and he needs an aide-level ratio to be safe. I have called 23 programs. I keep a spreadsheet. Nineteen said no outright, politely, the moment I said IEP. Two said yes and then unsaid it after his trial day. He is on two waitlists now for programs that can actually support him, both over a year long. I left a job I was good at. It was not a choice. There was no other end to that spreadsheet.' },
  { day: '2026-07-06', attribution: 'anonymous', first: '', city: null, uses: QUIET,
    subject: 'Rural means two hours of driving',
    body: 'We ranch outside Winnemucca. The nearest licensed infant room is 52 miles one way. For a while I did the drive, four hours a day of driving for eight hours of care. Do that in January in a ground blizzard and tell me it is a system. Now a hired hand\'s wife watches the baby, cash, no receipt, and we are grateful every day. Out here nobody even says the words child care crisis. It is like complaining there is no subway. There was never anything to lose.' },
  { day: '2026-07-08', attribution: 'named', first: 'Alyssa', last: 'Tran', city: 'Henderson', reps: true, uses: ALL_USES,
    subject: 'I left nursing over a schedule',
    body: 'I was an ER nurse for nine years. Twelve-hour shifts, 6:45 to 7:15 if I was lucky. Every center in Henderson opens at 6:30 and closes at 6. You cannot be at handoff at 6:45 and at pickup by 6. Late fees are a dollar a minute and the third time they ask you to leave. I do telehealth intake now from my kitchen, for $11 an hour less, so that pickup exists. The hospital is short nurses. I am short a career. The schedule did that, nothing else.' },
  { day: '2026-07-10', attribution: 'first_name_only', first: 'Marcus', city: 'Spring Valley', uses: NO_PRESS,
    subject: 'Two incomes, still underwater',
    body: 'My wife and I both work full time, IT help desk and county admin. We are exactly the family this is all supposedly working for. Between our two kids we pay $2,340 a month, which is more than we save for retirement, college, and emergencies combined, which is easy math because that number is zero. We are not asking for luxury. We are asking for the boring version of the deal we were promised: work hard, cover your bills, put a little away. Child care is the reason that deal is dead in our house.' },
  { day: '2026-07-13', attribution: 'named', first: 'Rosa', last: 'Jimenez', city: 'Las Vegas', uses: PRESS_OK, reps: true,
    subject: 'The 4 a.m. handoff',
    body: 'My husband starts at the bakery at 4 a.m. I clean rooms 8 to 4. He gets home at 12:30, sleeps until the school run, and we hand the little one off in the parking lot of a gas station halfway between, most days without touching. We have been married eleven years and we see each other awake on Sundays. People call that making it work. It is two people taking turns drowning so the kids never touch the water.' },
  { day: '2026-07-15', attribution: 'anonymous', first: '', city: null, uses: QUIET,
    subject: 'What the application doesn\'t ask',
    body: 'I got approved for the subsidy after four months of paperwork, pay stubs, a letter from my boss, my lease, my kids\' birth certificates twice because the first copies were the wrong kind of copy. Then came the real surprise: almost nobody near me takes it. The reimbursement is too low and it pays late, providers told me straight out. So I have a piece of paper that says the state will help me and a list of centers that cannot afford the state\'s help. Both things are true and my kid is still at home.' },

  // ---- Newsletter + local news mention surge (July 20-26) ----
  { day: '2026-07-20', attribution: 'first_name_only', first: 'Jenna', city: 'Reno', uses: PRESS_OK,
    subject: 'The interview question I dread',
    body: 'Every interview ends the same way: is there anything that would affect your availability? And I smile and say no, because the true answer, I have a two-year-old and care that covers three days a week, ends interviews. I have been underemployed for two years, not for lack of skill or will, but for lack of Tuesdays and Thursdays. I do not need a program or a pamphlet. I need two more days a week that do not cost more than the job pays.' },
  { day: '2026-07-21', attribution: 'named', first: 'Denise', last: 'Whitfield', city: 'North Las Vegas', reps: true, uses: ALL_USES,
    subject: '28 years in this work',
    body: 'I have taught pre-K for 28 years. I can watch a room of four-year-olds and tell you which ones were read to, which ones are hungry, and which ones are going to struggle in kindergarten, and I can usually do something about all three. For this I make $16.40 an hour. The young teachers I train leave within two years, for the school district if we are lucky, for a casino cage if we are not. You cannot build a system for children on the backs of women you refuse to pay. I have watched us try for three decades.' },
  { day: '2026-07-21', attribution: 'first_name_only', first: 'Omar', city: 'Las Vegas', uses: NO_PRESS,
    subject: 'New to the country, no village',
    body: 'We moved here in 2023. Back home my mother and my aunts were the child care, that is the whole system, the family. Here it is just my wife and me, and jobs that do not bend. The lists all want references and history we do not have yet. My wife had an engineering degree evaluated and ready, and she is home with our daughters instead, three years now. This country asked for her skills and then priced her out of using them.' },
  { day: '2026-07-22', attribution: 'anonymous', first: '', city: null, uses: QUIET,
    subject: 'I hid my pregnancy at work',
    body: 'I did not tell my manager I was pregnant until I physically could not hide it, because the last woman on my team who had a baby came back to fewer hours and a worse schedule and everybody knew why. I have already toured the centers. The infant room near my apartment is $1,410 a month and has nine names ahead of mine. I am due in November. I lie awake doing arithmetic that never comes out right, next to a man who does the same math and pretends he was asleep.' },
  { day: '2026-07-23', attribution: 'named', first: 'Heather', last: 'Kim', city: 'Boulder City', reps: true, uses: PRESS_OK,
    subject: 'Small town, one center',
    body: 'Boulder City has one licensed center for infants. One. When it is full, and it is always full, your options are a commute to Henderson against dam traffic or leaving your job. When their toddler room flooded last year, fourteen families lost care overnight, and you could trace the ripples through town, the pharmacy cut hours, the school lost a aide, my dentist\'s hygienist just never came back. One pipe burst and you could watch the local economy limp for a month. That is how thin the whole thing is.' },
  { day: '2026-07-24', attribution: 'first_name_only', first: 'Tasha', city: 'Las Vegas', uses: NO_PRESS,
    subject: 'The good place costs a car payment more',
    body: 'There is a center by my work where the toddlers garden and the teachers have been there ten years and the director knows every kid\'s name and grandma\'s name. It costs $410 more a month than the place we can afford, where the turnover is so bad my son asks me in the car who his teacher will be today. Every morning I drop him off knowing the difference between what he gets and what he could get is a number on my pay stub. That feeling does not wash off.' },
  { day: '2026-07-26', attribution: 'first_name_only', first: 'Bill', city: 'Fernley', uses: QUIET,
    subject: 'Single dad, swing shift',
    body: 'I have my kids Thursday through Monday and I work swing at the plant, 2 to 10:30. Those two facts do not fit together and there is nothing in this state that makes them fit. My solution is a 16-year-old neighbor kid I pay $60 a night, and prayer. My ex and I do not agree on much but we agree on this: neither of our schedules was designed by anyone who ever had a child, and neither was anything else in this system.' },

  // ---- August tail ----
  { day: '2026-08-02', attribution: 'named', first: 'Angela', last: 'Moss', city: 'Las Vegas', reps: true, uses: ALL_USES,
    subject: 'I turned down the promotion',
    body: 'I was offered assistant manager in April. More money, salaried, and mandatory Saturdays plus closing twice a week. My daughter\'s center does neither. I said no in the same conversation, did not even take the night to think, because there was nothing to think about. My district manager, a woman, just nodded. She knew. Somewhere up the chain someone is writing a report about why women stall out at shift lead, and I could save them the consultant fees: it is the hours child care keeps, the end.' },
  { day: '2026-08-05', attribution: 'anonymous', first: '', city: null, uses: NO_PRESS,
    subject: 'We stopped at one',
    body: 'We always talked about two kids, maybe three. Our son is five now and he is going to be an only child, and it is not because anything changed about what we wanted. We ran the numbers when he was two, again when he was three, kept the spreadsheet like a scab we could not stop picking. Care for two under five would have been $2,700 a month. People make this decision quietly all over this state and nobody counts it anywhere. Put it in a report somewhere: the shortage is also a sibling that never happened.' },
  { day: '2026-08-08', attribution: 'first_name_only', first: 'Lupe', city: 'Mesquite', uses: PRESS_OK,
    subject: 'The van that stopped coming',
    body: 'Out here the school district used to run a van for the pre-K kids from the far neighborhoods. Budget cut, van gone, and just like that four families I know dropped out of the program, because a free program you cannot get to is not free and is not a program. My niece watches two of those kids now for gas money. Everyone in this story is doing their best and the kids still lost their classroom. Somebody with a budget line item did that and will never meet them.' },
  { day: '2026-08-11', attribution: 'named', first: 'Steve', last: 'Carranza', city: 'Sparks', reps: true, uses: NO_PRESS,
    subject: 'Second shift at the second job',
    body: 'I coach JV football, teach middle school science, and drive for a delivery app from 8 to midnight three nights a week, and the app money goes to one thing: the gap between what care costs and what teaching pays. I sat down once and figured out I net about $9 an hour driving after gas. It is worth it because the alternative is my wife quitting the job that carries our insurance. I am not tired of working. I am tired of the math never being done.' },
  { day: '2026-08-14', attribution: 'first_name_only', first: 'Grace', city: 'Carson City', uses: ALL_USES,
    subject: 'It worked once, briefly',
    body: 'For seven months in 2024 we had it: a spot two blocks from my office, a teacher my daughter ran to every morning, a rate the pandemic-era grant kept at something we could pay. Then the grant lapsed, tuition jumped $340 a month in one letter, and the teacher left for the district. I keep thinking about those seven months. Nothing about them was impossible. We built it, briefly, by accident, with temporary money. I am not asking for the moon. I am asking for the thing we already did, on purpose this time.' },

  // ---- The revoked one (submitted July, revoked in August) ----
  { day: '2026-07-11', attribution: 'first_name_only', first: 'Renee', city: 'Las Vegas', uses: QUIET, revoked: true,
    subject: 'Withdrawn by storyteller',
    body: 'This story was withdrawn by the storyteller.' },
];

async function main() {
  // Idempotent: clear any prior run of this demo first.
  const { data: existing } = await db.from('campaigns').select('id').eq('slug', 'demo-stories-childcare');
  for (const c of existing ?? []) {
    await db.from('stories').delete().eq('campaign_id', c.id);
    await db.from('story_subjects').delete().eq('campaign_id', c.id);
    await db.from('campaign_insights').delete().eq('campaign_id', c.id);
    await db.from('campaigns').delete().eq('id', c.id);
  }

  console.log('Creating storytelling campaign...');
  const { data: camp, error } = await db
    .from('campaigns')
    .insert({
      slug: 'demo-stories-childcare',
      creator_id: OWNER_ID,
      campaign_type: 'storytelling',
      visibility: 'unlisted',
      approval_status: 'approved',
      status: 'active',
      headline: 'The Real Cost of Child Care: Nevada Stories',
      description:
        'Nevada Children First Coalition is collecting first-person stories about finding, affording, and providing child care in Nevada — from parents, grandparents, and providers. These stories power our testimony, reports, and conversations with legislators ahead of the 2027 session.',
      story_prompt:
        'Tell us what child care actually looks like for your family — the waitlists, the costs, the schedules, the trade-offs. What did it change about your work, your family, or your plans? If you are a provider, tell us that side too.',
      usage_statement:
        'We use these stories in legislative testimony, published reports, meetings with lawmakers, and (only with your specific permission) with press. You choose exactly which uses you are comfortable with, and you can edit or withdraw your story at any time.',
      usage_tags: ALL_USES,
      attribution_options: ['named', 'first_name_only', 'anonymous'],
      edit_revoke_policy: 'Storytellers can edit or revoke at any time from their account; revoked stories are hidden everywhere immediately.',
      issue_area: 'Families',
      target_level: 'state',
      org_name: 'Nevada Children First Coalition',
      brand_color: '#B45309',
      created_at: '2026-06-18T09:00:00-07:00',
      story_count: 0,
    })
    .select('id')
    .single();
  if (error) throw new Error(`campaign insert failed: ${error.message}`);
  const campaignId = camp.id as string;

  console.log('Inserting stories + subjects...');
  let active = 0;
  for (const d of DEFS) {
    const createdAt = at(d.day);
    const name =
      d.attribution === 'anonymous' ? null : d.attribution === 'named' ? `${d.first} ${d.last}` : d.first;
    const email =
      d.attribution === 'named' && d.uses.includes('contact_me_followup') && d.last
        ? `${d.first.toLowerCase()}.${d.last.toLowerCase()}@example.com`
        : null;
    const revoked = !!d.revoked;
    const { error: se } = await db.from('stories').insert({
      campaign_id: campaignId,
      user_id: OWNER_ID,
      title: revoked ? null : d.subject,
      body: d.body,
      attribution_level: d.attribution,
      storyteller_name: revoked ? null : name,
      storyteller_email: revoked ? null : email,
      city: revoked ? null : d.city,
      state: revoked ? null : 'NV',
      consent_at: createdAt,
      consent_usage_snapshot: { granted_uses: d.uses, usage_statement_version: '2026-06-18' },
      shared_reps: !revoked && d.reps ? repsFor() : null,
      status: revoked ? 'revoked' : 'active',
      revoked_at: revoked ? at('2026-08-06') : null,
      created_at: createdAt,
    });
    if (se) throw new Error(`story insert failed (${d.subject}): ${se.message}`);
    if (!revoked) {
      active += 1;
      const { error: je } = await db.from('story_subjects').insert({ campaign_id: campaignId, title: d.subject, created_at: createdAt });
      if (je) throw new Error(`subject insert failed (${d.subject}): ${je.message}`);
    }
  }
  await db.from('campaigns').update({ story_count: active }).eq('id', campaignId);
  console.log(`Done: ${active} active stories (+${DEFS.length - active} revoked).`);

  console.log('Generating v2 story insights...');
  const { generateCampaignInsights } = await import('../src/lib/insights');
  const insights = await generateCampaignInsights(campaignId, 'stories');
  if (!insights) throw new Error('insights generation returned null');
  console.log(`Insights: ${insights.themes.length} themes from ${insights.sourceCount} stories.`);
  for (const t of insights.themes) console.log(`  - ${t.label} (${t.prevalence})`);

  console.log('\nView as jared@mydemocracy.app:');
  console.log('  https://www.mydemocracy.app/campaign/demo-stories-childcare/analytics');
  console.log('  https://www.mydemocracy.app/campaign/demo-stories-childcare/report');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
