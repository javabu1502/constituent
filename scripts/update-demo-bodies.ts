/**
 * One-off: regenerate the demo-ab156-* message bodies as full-length letters
 * (~170-260 words), the way the real AI writer produces them — persona,
 * personal story, local detail, one stat, and a stage-specific ask. Keeps
 * every row's recipient/intent/timestamp; only message_body changes.
 *
 * Usage: SUPABASE_SERVICE_KEY=... npx tsx scripts/update-demo-bodies.ts
 */

import { createClient } from '@supabase/supabase-js';

const db = createClient('https://mydemocracy.supabase.co', process.env.SUPABASE_SERVICE_KEY!, {
  auth: { persistSession: false },
});

let seed = 424242;
function rnd(): number {
  seed |= 0; seed = (seed + 0x6d2b79f5) | 0;
  let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
const pick = <T,>(arr: T[]): T => arr[Math.floor(rnd() * arr.length)];

// --- Letter components ------------------------------------------------------

const PERSONAS = [
  { who: 'I\'m a mother of three in [CITY], and two of my kids are at our neighborhood elementary school', story: 'Mornings in our house are a sprint. I leave for my shift at 6:15, before the kids are even up, and there are days when I honestly don\'t know whether breakfast happened. When their school piloted free breakfast for one semester, my middle son\'s teacher told me she could tell the difference in his focus by the second week. That semester ended, and so did the program.' },
  { who: 'I\'ve taught fourth grade in [CITY] for eleven years', story: 'I keep a drawer of granola bars in my classroom because I know which of my students come in hungry, and I know Mondays are the worst because some of them haven\'t had a real meal since Friday\'s school lunch. I spend a few hundred dollars of my own money on that drawer every year. I love my students, but a drawer of granola bars is not a nutrition policy.' },
  { who: 'I\'m a school nurse at a middle school here in [CITY]', story: 'The kids who show up in my office at 9:30 with a "stomachache" are, more often than anyone wants to admit, just hungry. I can spot it within a minute of talking to them. I keep crackers on hand, send them back to class, and log another visit that never should have happened. The pattern is so predictable it hurts.' },
  { who: 'My husband and I are raising our two grandkids in [CITY]', story: 'We\'re on a fixed income, and the last week of every month gets thin. I grew up believing you don\'t ask for help, so it took me a long time to admit that the school breakfast program the next county over would have made a real difference for us. Pride shouldn\'t be the reason a seven-year-old starts class hungry.' },
  { who: 'I\'m a pediatrician who has practiced in [CITY] for nearly two decades', story: 'I see the downstream effects of childhood food insecurity in my exam rooms every single week: kids with headaches and fatigue that have no medical cause beyond an empty stomach, families juggling rent against groceries. Universal school breakfast is one of the few interventions where the evidence is genuinely unambiguous.' },
  { who: 'I work in the cafeteria at an elementary school in [CITY]', story: 'I\'m the one who sees which kids hover near the line at breakfast but don\'t come through it, because the reduced-price paperwork didn\'t get filed or because they don\'t want the other kids to see. When breakfast is free for everyone, that shame disappears overnight. I\'ve watched it happen. The line just becomes the line.' },
  { who: 'I\'m the PTA president at our elementary school in [CITY]', story: 'Last year our PTA ran a weekend backpack food program for 40 families. The need we found once we started asking was double what we\'d planned for, and we\'re volunteers with a bake-sale budget. We patched what we could. It shouldn\'t take a bake sale to make sure kids in our state can eat before class.' },
  { who: 'I drive a school bus in [CITY], first route at 6:40 in the morning', story: 'You learn a lot about kids from the bus. The ones who get on quiet and put their heads against the window aren\'t sleepy, half the time — they\'re hungry, and they\'ll tell you so if you ask gently. I started keeping a box of breakfast bars up front years ago. Nobody asked me to. Somebody had to.' },
  { who: 'I own a small diner in [CITY] and employ nine people', story: 'Three of my employees are parents working split shifts, and I hear what their mornings look like. I also know what it does to a business when the local schools struggle — families move, the neighborhood hollows out. Feeding kids breakfast is about the cheapest economic development policy Nevada could buy.' },
  { who: 'I volunteer at our food bank\'s school pantry program in [CITY]', story: 'Every Friday we pack weekend bags, and every Friday I\'m struck that most of the parents picking them up are working — some at two jobs. The math of feeding a family here just doesn\'t work for a lot of households anymore. School breakfast is the one meal we could simply take off their list of impossible choices.' },
  { who: 'I\'m a high school senior in [CITY], and I have a little brother in second grade', story: 'My parents both work early, so getting my brother ready for school is my job. Most mornings we do fine. But I\'m seventeen and I\'m the breakfast plan, and on the mornings when we\'re out of cereal or out of time, he goes to school with nothing and I sit in my first-period class thinking about it instead of the lesson.' },
  { who: 'I recently retired after 26 years as an elementary school principal in [CITY]', story: 'If you gave me one lever to raise attendance, cut morning discipline referrals, and improve test scores at a struggling school, I would pick universal breakfast without hesitating — because I ran that experiment myself with grant funding for two years, and I watched every one of those numbers move.' },
];

const STATS = [
  'Roughly one in six Nevada children lives in a household that struggles to reliably put food on the table.',
  'Schools that adopt universal breakfast consistently report better attendance and fewer visits to the nurse\'s office — the research on this is about as settled as education research gets.',
  'When breakfast is universal instead of means-tested, participation among eligible low-income kids jumps dramatically, because the stigma of the "free breakfast line" disappears.',
  'Teachers across Nevada report spending their own money on food for hungry students — a quiet subsidy that shows up in no budget line anywhere.',
  'Kids who eat breakfast at school perform measurably better on math and reading assessments, and the gains are largest for the students furthest behind.',
];

const ASKS: Record<string, string[]> = {
  cosponsor_persuade: [
    'AB 156, the Breakfast for Every Nevada Student Act, would make free school breakfast universal in our K-12 schools. I\'m asking you to add your name as a cosponsor. Early support is what carries a bill like this through the session, and I\'d be proud to see your name on it.',
    'I\'m writing to ask you to cosponsor AB 156. Cosponsorship isn\'t a symbolic gesture — it tells the committee this bill has real support behind it. Nevada families like mine are watching, hopeful.',
  ],
  cosponsor_thank: [
    'I saw that you\'ve signed on to AB 156, and I wanted you to hear from a constituent that it matters. Thank you. My ask now is simple: talk to your colleagues who haven\'t joined yet. Your voice carries weight with them that mine doesn\'t.',
    'Thank you for cosponsoring AB 156 — genuinely. Decisions like that are why I tell my neighbors it\'s worth engaging with Carson City at all. Please keep pushing to get it a strong hearing and a floor vote this session.',
  ],
  committee: [
    'AB 156 is now in front of your committee, and I\'m asking you to vote yes and move it to the floor. You\'re one of a handful of people who decide whether this bill lives or dies this month, which is exactly why I\'m writing to you and not someone else.',
    'As a member of the Assembly Education Committee, you have the direct say on AB 156 that most legislators don\'t. I\'m respectfully asking for your yes vote at the hearing, and for you to speak up for it in the work session.',
  ],
  floor_house: [
    'AB 156 has cleared committee and is coming to the Assembly floor. I\'m asking for your yes vote. This is one of those rare bills where the policy is simple, the evidence is strong, and the beneficiaries are seven-year-olds.',
    'When AB 156 comes up for a floor vote this week, please vote yes. I\'ve followed this bill since it was introduced, and I\'ll be following the roll call too.',
  ],
  floor_senate: [
    'AB 156 passed the Assembly 28-14 and now comes to the Senate. I\'m asking for your yes vote to send it to the Governor\'s desk. Nevada kids are one vote away from starting every school day fed.',
    'The Assembly has done its part on AB 156 with a strong bipartisan vote. I\'m asking you to finish the job in the Senate. Please vote yes.',
  ],
  floor_senate_thank: [
    'I understand you\'ve already said you\'ll support AB 156 when it reaches the floor — thank you for that. I\'m writing anyway, because I want you to know constituents notice, and because I hope you\'ll encourage colleagues who are still undecided before the vote.',
  ],
  thank_you: [
    'AB 156 has passed both chambers, and I wanted to write one more time — not to ask for anything, but to say thank you. Your vote will mean thousands of Nevada kids start the school day ready to learn. That\'s the kind of result that restores a person\'s faith in state government.',
    'Now that AB 156 has passed, I wanted to thank you for supporting it. It would have been easy for a bill like this to die quietly in the shuffle of a session. It didn\'t, because legislators like you decided it mattered. My family noticed, and we\'re grateful.',
  ],
};

const BRIDGES = [
  'That\'s why AB 156 matters so much to me.',
  'This bill would change that, for my family and thousands of others.',
  'It doesn\'t have to be this way, and this session Nevada has the chance to prove it.',
  'This is a solvable problem, and the solution is sitting in front of the legislature right now.',
];

// One persona per PERSON: the same advocate must tell the same story across
// every message they send (Miguel can't be a bus driver in one letter and a
// school nurse in the next).
const personaByAdvocate = new Map<string, (typeof PERSONAS)[number]>();
function personaFor(advocate: string): (typeof PERSONAS)[number] {
  let p = personaByAdvocate.get(advocate);
  if (!p) {
    p = pick(PERSONAS);
    personaByAdvocate.set(advocate, p);
  }
  return p;
}

function letter(stageGoal: string, intent: string | null, city: string, advocate: string): string {
  const p = personaFor(advocate);
  const stat = pick(STATS);
  const bridge = pick(BRIDGES);
  let askKey = stageGoal;
  if (stageGoal === 'cosponsor') askKey = intent === 'thank' ? 'cosponsor_thank' : 'cosponsor_persuade';
  if (stageGoal === 'floor_senate' && intent === 'thank') askKey = 'floor_senate_thank';
  const ask = pick(ASKS[askKey] ?? ASKS.floor_house);

  return [
    `${p.who.replace('[CITY]', city)}.`,
    p.story.replace('[CITY]', city),
    `${stat} ${bridge}`,
    ask,
  ].join('\n\n');
}

async function main() {
  const { data: camps, error: cErr } = await db
    .from('campaigns')
    .select('id, slug, stage_goal')
    .like('slug', 'demo-ab156-%');
  if (cErr) throw cErr;
  const goalById = new Map(camps!.map((c) => [c.id as string, (c.stage_goal as string) || 'custom']));

  const { data: msgs, error: mErr } = await db
    .from('messages')
    .select('id, campaign_id, message_intent, advocate_city, advocate_name')
    .in('campaign_id', [...goalById.keys()])
    .order('created_at', { ascending: true })
    .limit(1000);
  if (mErr) throw mErr;

  console.log(`Rewriting ${msgs!.length} message bodies...`);
  let done = 0;
  for (const m of msgs!) {
    const body = letter(
      goalById.get(m.campaign_id as string) ?? 'custom',
      m.message_intent as string | null,
      (m.advocate_city as string) || 'Las Vegas',
      (m.advocate_name as string) || 'anon'
    );
    const { error } = await db.from('messages').update({ message_body: body }).eq('id', m.id);
    if (error) throw error;
    done++;
    if (done % 50 === 0) console.log(`  ${done}/${msgs!.length}`);
  }
  console.log(`Done: ${done} bodies rewritten.`);
}

main().catch((err) => { console.error(err); process.exit(1); });
