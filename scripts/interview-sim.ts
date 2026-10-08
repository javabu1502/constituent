/**
 * Interview simulator: runs a fake constituent through the REAL guided chat
 * and the REAL draft step, then prints what went in next to what came out,
 * with a fact audit. Nothing is written to the database: the chat routes only
 * read the campaign, stories/compose and generate-core-message only draft.
 *
 * Usage (needs a dev server with full creds and the Turnstile test secret):
 *   (set -a; . ~/Desktop/constituent/.env.local; set +a; \
 *     TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA npx next dev -p 3123 &)
 *   (set -a; . ~/Desktop/constituent/.env.local; set +a; \
 *     npx tsx scripts/interview-sim.ts story terse-parent)
 *   npx tsx scripts/interview-sim.ts advocacy commuter-oppose
 *   npx tsx scripts/interview-sim.ts all
 *
 * The fake constituent is a model told to answer ONLY from a fact sheet, in a
 * fixed voice (terse, medium, rich). The audit then checks the draft for
 * numbers that appear nowhere in the fact sheet or the transcript, and for
 * machine-writing shapes.
 */
import { callClaude } from '../src/lib/claude';
import { detectAiCadence } from '../src/lib/message-quality';

const BASE = process.env.SIM_BASE_URL || 'http://localhost:3123';
const STORY_SLUG = process.env.SIM_STORY_SLUG || 'champion-the-first-5-years-mxddzm';
const ADVOCACY_SLUG = process.env.SIM_ADVOCACY_SLUG || 'build-america-250-surface-transportation';

type Flow = 'story' | 'advocacy';
interface Persona {
  key: string;
  flow: Flow;
  stance?: 'support' | 'oppose';
  voice: 'terse' | 'medium' | 'rich';
  facts: string[];
}

const PERSONAS: Persona[] = [
  {
    key: 'terse-parent',
    flow: 'story',
    voice: 'terse',
    facts: [
      'Two kids, ages 4 and 1.',
      'Daycare for both is $1,650 a month.',
      'Works at a warehouse in Sparks, day shift.',
      'Wife is a CNA, works nights so one of them is always home.',
      'The YMCA waitlist was 8 months; they got in last March.',
      'Wants more slots and help paying for them.',
    ],
  },
  {
    key: 'provider-medium',
    flow: 'story',
    voice: 'medium',
    facts: [
      'Runs a home child care in Reno, 11 years.',
      'Licensed for 8 children, currently has 6.',
      'Lost two families in September when their subsidy ended after a small raise.',
      'Each empty spot is about $900 a month.',
      'Has not raised her own pay in four years.',
      'Her assistant quit in June for a job at Costco paying $4 more an hour.',
      'Wants the subsidy cliff fixed and provider pay raised.',
    ],
  },
  {
    key: 'commuter-oppose',
    flow: 'advocacy',
    stance: 'oppose',
    voice: 'terse',
    facts: [
      'Drives a delivery truck, Reno to Fernley, five days a week.',
      'I-80 near Fernley was repaved three times in five years, same stretch.',
      'The weigh station bathrooms have been broken since 2023.',
      'Thinks the money is not the problem; how it gets spent is.',
      'Wants a no vote until there is an audit of what was already spent.',
    ],
  },
  {
    key: 'contractor-support',
    flow: 'advocacy',
    stance: 'support',
    voice: 'medium',
    facts: [
      'Owns a small paving company, 14 employees.',
      'Lost a county bridge job in 2025 when federal funding lapsed for 7 months.',
      'Laid off 4 people that winter.',
      'Has bid on projects that got cancelled twice because of short-term funding extensions.',
      'Wants a five-year bill so counties can plan and crews can keep working.',
    ],
  },
];

const VOICE_RULES: Record<Persona['voice'], string> = {
  terse: 'Answer in one short sentence, 5 to 14 words. No elaboration. Sound tired and plain.',
  medium: 'Answer in one or two plain sentences, 15 to 35 words. Give one concrete detail when you have one.',
  rich: 'Answer in two to four sentences, 40 to 80 words, with concrete detail and a little feeling.',
};

type Msg = { role: 'user' | 'assistant'; content: string };

async function fakeAnswer(persona: Persona, transcript: Msg[]): Promise<string> {
  const system = `You are a real person answering a guide's questions in a chat. You are NOT an assistant.
FACTS ABOUT YOU (the only facts you may use; never invent others):
${persona.facts.map((f) => `- ${f}`).join('\n')}
${VOICE_RULES[persona.voice]}
If the question asks for something not in your facts, say "I'd rather not say" or give a short general answer with no new facts. Never repeat a fact you already gave. First person. No dashes.`;
  const history = transcript.map((m) => `${m.role === 'assistant' ? 'Guide' : 'You'}: ${m.content}`).join('\n');
  const text = await callClaude(system, `${history}\n\nYour next reply (one message):`, 200);
  return text.trim().replace(/^You:\s*/i, '').replace(/\s*[—–]\s*/g, ', ');
}

async function guideTurn(persona: Persona, messages: Msg[], slug: string): Promise<string> {
  const path = persona.flow === 'story' ? '/api/chat/story-interview' : '/api/chat/campaign-interview';
  const res = await fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ campaignSlug: slug, messages, stance: persona.stance, turnstileToken: 'test' }),
  });
  if (!res.ok) throw new Error(`${path} ${res.status}: ${await res.text()}`);
  return (await res.text()).trim();
}

const HANDOFF = /Turn this into my story|Draft my message|Convertir esto en mi historia|Redactar mi mensaje/i;

async function runPersona(persona: Persona) {
  const slug = persona.flow === 'story' ? STORY_SLUG : ADVOCACY_SLUG;
  const opener =
    persona.flow === 'story'
      ? 'Hi. I’m here to help you put your experience into words. There is no rush, and you can skip anything.\n\nTo start: what has your experience been with child care?'
      : 'Hi. I’m here to help you say why this matters to you. To start: what is your connection to this issue, or what has happened that makes you care about it?';
  const messages: Msg[] = [{ role: 'assistant', content: opener }];

  for (let turn = 0; turn < 6; turn++) {
    const answer = await fakeAnswer(persona, messages);
    messages.push({ role: 'user', content: answer });
    const reply = await guideTurn(persona, messages, slug);
    messages.push({ role: 'assistant', content: reply });
    if (HANDOFF.test(reply)) break;
  }

  const userTurns = messages.filter((m) => m.role === 'user').map((m) => m.content);
  const tellerWords = userTurns.join(' ').split(/\s+/).filter(Boolean).length;

  let output = '';
  let title = '';
  if (persona.flow === 'story') {
    const res = await fetch(`${BASE}/api/stories/compose`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ campaignSlug: slug, messages, turnstileToken: 'test' }),
    });
    const d = await res.json();
    output = d.body || `ERROR: ${d.error}`;
    title = d.title || '';
  } else {
    const res = await fetch(`${BASE}/api/generate-core-message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        campaignSlug: slug,
        stance: persona.stance,
        personalWhy: userTurns.join('\n\n').slice(0, 4000),
        interview: messages,
        turnstileToken: 'test',
      }),
    });
    const d = await res.json();
    output = d.body ? `${d.opening ? d.opening + '\n\n' : ''}${d.body}\n\n${d.ask ?? ''}` : `ERROR: ${d.error}`;
    title = d.subject || '';
  }

  // Fact audit: numbers in the output that appear nowhere in the facts or
  // the transcript, and machine-writing shapes.
  const NUM = /\$?\d[\d,.]*/g;
  const norm = (n: string) => n.replace(/[,$]/g, '').replace(/\.$/, '');
  const known = new Set([...persona.facts.join(' ').matchAll(NUM), ...userTurns.join(' ').matchAll(NUM)].map((m) => norm(m[0])));
  const unknownNums = [...new Set([...output.matchAll(NUM)].map((m) => norm(m[0])))].filter((n) => n && !known.has(n));
  const cadence = detectAiCadence(output);
  const factsUsed = persona.facts.filter((f) => {
    const keys = f.toLowerCase().match(/[a-z]{5,}|\$?\d[\d,.]*/g) ?? [];
    return keys.some((k) => output.toLowerCase().includes(k));
  }).length;

  console.log(`\n${'='.repeat(78)}\n${persona.key.toUpperCase()}  (${persona.flow}, ${persona.voice}${persona.stance ? ', ' + persona.stance : ''})\n${'='.repeat(78)}`);
  console.log('\nFACT SHEET:\n' + persona.facts.map((f) => '  - ' + f).join('\n'));
  console.log('\nTRANSCRIPT:');
  for (const m of messages) console.log(`  ${m.role === 'assistant' ? 'GUIDE' : 'USER '}: ${m.content.replace(/\n+/g, ' ')}`);
  console.log(`\nINPUT: ${userTurns.length} answers, ${tellerWords} words  ->  OUTPUT: ${output.split(/\s+/).filter(Boolean).length} words`);
  if (title) console.log(`TITLE/SUBJECT: ${title}`);
  console.log('\n' + output.split('\n').map((l) => '  ' + l).join('\n'));
  console.log('\nAUDIT:');
  console.log(`  facts from sheet that surfaced: ${factsUsed}/${persona.facts.length}`);
  console.log(`  numbers not in facts or transcript: ${unknownNums.length ? unknownNums.join(', ') : 'none'}`);
  console.log(`  machine-writing shapes: ${cadence.length ? cadence.map((c) => `"${c}"`).join('; ') : 'none'}`);
}

(async () => {
  const [flowArg = 'all', keyArg] = process.argv.slice(2);
  const selected = PERSONAS.filter((p) => (flowArg === 'all' || p.flow === flowArg) && (!keyArg || p.key === keyArg));
  if (selected.length === 0) {
    console.error('No persona matched. Known:', PERSONAS.map((p) => `${p.flow}/${p.key}`).join(', '));
    process.exit(1);
  }
  for (const p of selected) {
    try {
      await runPersona(p);
    } catch (err) {
      console.error(`\n${p.key} FAILED:`, err instanceof Error ? err.message : err);
    }
  }
})();
