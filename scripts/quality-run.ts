/**
 * Quality run: fact-sheet-bound fake constituents through the REAL guides and
 * drafting, then an independent judge scores every story and letter.
 *
 *   (set -a; . ~/Desktop/constituent/.env.local; set +a; \
 *     TURNSTILE_SECRET_KEY=1x0000000000000000000000000000000AA npx next dev -p 3123 &)
 *   (set -a; . ~/Desktop/constituent/.env.local; set +a; \
 *     npx tsx scripts/quality-run.ts story 10 out.json)
 *   npx tsx scripts/quality-run.ts advocacy 15 out.json
 *
 * Each run uses its own X-Forwarded-For so local rate limits and daily quotas
 * do not collide. Nothing is written to the database: the chat routes only
 * read the campaign; compose and drafting only draft.
 */
import { callClaude, extractJSON } from '../src/lib/claude';
import { detectAiCadence } from '../src/lib/message-quality';
import * as fs from 'fs';

const BASE = process.env.SIM_BASE_URL || 'http://localhost:3123';
// Production rejects a present-but-invalid token; only the local server (with
// the Turnstile test secret) accepts the placeholder.
const TOKEN = /localhost|127\.0\.0\.1/.test(BASE) ? 'test' : undefined;
type Flow = 'story' | 'advocacy';
type Msg = { role: 'user' | 'assistant'; content: string };

interface Persona {
  key: string;
  flow: Flow;
  slug: string;
  language: 'en' | 'es';
  stance?: 'support' | 'oppose';
  voice: 'terse' | 'medium' | 'rich';
  facts: string[];
}

const STORY_EN = 'champion-the-first-5-years-mxddzm';
const STORY_ES = 'champion-the-first-5-years-es';
const ADV_STATE = 'demo-ab156-senate-floor';
const ADV_THANKS = 'demo-ab156-thanks';
const ADV_FED = 'build-america-250-surface-transportation';
const ADV_NFIP = 'nfip-long-term-reauthorization';

const PERSONAS: Persona[] = [
  // ---------- storytelling, English ----------
  { key: 'S1 single dad, waitlist', flow: 'story', slug: STORY_EN, language: 'en', voice: 'terse', facts: [
    'Single dad, son is 2.', 'Works nights stocking at a grocery store in Sparks.', 'Every center he called had a waitlist; the shortest was 7 months.', 'His mother watches the boy but she had a stroke last year and tires fast.', 'Wants more infant and toddler slots.'] },
  { key: 'S2 provider closing', flow: 'story', slug: STORY_EN, language: 'en', voice: 'medium', facts: [
    'Runs a licensed home child care in Carson City, 9 years.', 'Rent on her house went up $400 a month in January.', 'Charges $850 a month per child; cannot raise it because two families already pay late.', 'Her liability insurance doubled to $2,100 a year.', 'Is deciding whether to close by December.', 'Wants provider pay or a subsidy that follows the child.'] },
  { key: 'S3 grandmother, Medicaid dentist', flow: 'story', slug: STORY_EN, language: 'en', voice: 'rich', facts: [
    'Grandmother raising her granddaughter, age 4, in Las Vegas.', 'The girl had a toothache for six weeks; no dentist within 40 miles took Medicaid for kids under 5.', 'Finally drove to a clinic in Henderson; two teeth had to be pulled.', 'She is on Social Security, $1,480 a month.', 'Wants more dentists to take Medicaid for young kids.'] },
  { key: 'S4 teacher, pre-K cut', flow: 'story', slug: STORY_EN, language: 'en', voice: 'medium', facts: [
    'Pre-K teacher in Washoe County, 6 years.', 'Her classroom went from 16 kids to 22 when a neighboring program closed in August.', 'Has one aide for the whole room.', 'Two of the kids are still in diapers.', 'Wants funding so programs stop closing and class sizes come down.'] },
  { key: 'S5 WIC and formula', flow: 'story', slug: STORY_EN, language: 'en', voice: 'terse', facts: [
    'Mom of twins, 8 months old, in Elko.', 'On WIC.', 'Twice this year the only store in town that takes WIC was out of the formula brand WIC covers.', 'Drove 50 miles to Spring Creek and back for formula.', 'Wants WIC to cover more than one brand.'] },
  // ---------- storytelling, Spanish ----------
  { key: 'S6 madre, guardería cara', flow: 'story', slug: STORY_ES, language: 'es', voice: 'terse', facts: [
    'Madre de una niña de 3 años en Reno.', 'La guardería cuesta 1,350 dólares al mes.', 'Trabaja limpiando casas; gana unos 2,200 al mes.', 'Su esposo trabaja en construcción y los turnos cambian cada semana.', 'Quiere ayuda para pagar la guardería.'] },
  { key: 'S7 abuelo, pediatra', flow: 'story', slug: STORY_ES, language: 'es', voice: 'medium', facts: [
    'Abuelo que cuida a su nieto de 18 meses en North Las Vegas mientras la hija trabaja.', 'El pediatra dejó de aceptar su seguro en marzo.', 'La clínica nueva no tiene nadie que hable español; usan al nieto mayor de 12 años para traducir.', 'Quiere clínicas con personal que hable español.'] },
  { key: 'S8 proveedora, licencia', flow: 'story', slug: STORY_ES, language: 'es', voice: 'rich', facts: [
    'Cuida a 5 niños en su casa en Sparks desde hace 4 años.', 'Lleva 14 meses esperando la licencia estatal; los papeles le llegaron dos veces solo en inglés.', 'Sin licencia no puede aceptar a familias con subsidio.', 'Perdió a dos familias en agosto por eso.', 'Quiere que el proceso de licencia esté en español y sea más rápido.'] },
  { key: 'S9 papá, transporte', flow: 'story', slug: STORY_ES, language: 'es', voice: 'medium', facts: [
    'Papá de dos niños, 4 y 6 años, en Las Vegas.', 'No tiene carro; el autobús a la guardería más cercana tarda 55 minutos.', 'Llega tarde al trabajo dos o tres veces por semana.', 'Su supervisor ya le dio una advertencia por escrito.', 'Quiere guarderías cerca de las paradas de autobús o un pase gratis para padres.'] },
  { key: 'S10 mamá, Head Start', flow: 'story', slug: STORY_ES, language: 'es', voice: 'terse', facts: [
    'Mamá de un niño de 4 años en Reno.', 'El niño entró a Head Start en septiembre.', 'Ya dice las letras y come verduras que antes no probaba.', 'Ella pudo volver a trabajar medio tiempo en una panadería.', 'Quiere que Head Start siga abierto y con cupo para más niños.'] },

  // ---------- advocacy: state bill, all talking points ----------
  { key: 'A1 teacher, breakfast', flow: 'advocacy', slug: ADV_STATE, language: 'en', voice: 'medium', facts: [
    'Teaches third grade in Sparks.', 'Keeps granola bars in her desk; three or four kids a day come in hungry.', 'The kids who eat are calmer by 10 a.m.', 'Wants the Senate to pass AB 156.'] },
  { key: 'A2 bus driver', flow: 'advocacy', slug: ADV_STATE, language: 'en', voice: 'terse', facts: [
    'Drives a school bus in Washoe County.', 'Kids on his first route board at 6:40 a.m.; some have not eaten.', 'He has seen a kid faint on the bus once, last spring.', 'Wants the bill passed.'] },
  { key: 'A3 cafeteria manager', flow: 'advocacy', slug: ADV_STATE, language: 'en', voice: 'rich', facts: [
    'Runs the cafeteria at a middle school in Henderson.', 'Lunch debt at her school is about $9,000 this year.', 'She has watched kids put food back when told their account was negative.', 'Breakfast is the meal most kids skip.', 'Wants AB 156 passed so breakfast is free for every student.'] },
  { key: 'A4 parent, stigma', flow: 'advocacy', slug: ADV_STATE, language: 'en', voice: 'medium', facts: [
    'Mother of two in Reno, kids are 9 and 12.', 'Her older son stopped eating school breakfast because only the free-lunch kids ate it and he was embarrassed.', 'Family income is just above the cutoff.', 'Wants universal breakfast so no kid is singled out.'] },
  { key: 'A5 no story', flow: 'advocacy', slug: ADV_STATE, language: 'en', voice: 'terse', facts: [
    'Lives in Carson City.', 'No kids in school.', 'Thinks hungry kids cannot learn and that is reason enough.', 'Wants the Senate to pass AB 156.'] },
  // ---------- advocacy: thank-you step ----------
  { key: 'A6 thanks, school nurse', flow: 'advocacy', slug: ADV_THANKS, language: 'en', voice: 'medium', facts: [
    'School nurse in Las Vegas.', 'Sees stomachaches every morning that are really hunger.', 'Glad AB 156 passed both chambers.', 'Wants to thank legislators who voted yes.'] },
  { key: 'A7 thanks, grandfather', flow: 'advocacy', slug: ADV_THANKS, language: 'en', voice: 'terse', facts: [
    'Grandfather in Minden raising a 7-year-old.', 'The boy gets breakfast at school now.', 'Wants to say thank you.'] },
  { key: 'A8 thanks, PTA', flow: 'advocacy', slug: ADV_THANKS, language: 'en', voice: 'rich', facts: [
    'PTA president at an elementary school in Reno.', 'The PTA spent $3,200 last year on a snack closet.', 'Teachers reported fewer afternoon meltdowns after the free breakfast pilot.', 'Wants to thank legislators and ask them to keep it funded.'] },
  // ---------- advocacy: official federal weigh-ins ----------
  { key: 'A9 commuter, oppose', flow: 'advocacy', slug: ADV_FED, language: 'en', stance: 'oppose', voice: 'terse', facts: [
    'Drives a delivery truck Reno to Fernley five days a week.', 'I-80 near Fernley was repaved three times in five years.', 'Thinks the money is not the problem, how it gets spent is.', 'Wants a no vote until there is an audit.'] },
  { key: 'A10 contractor, support', flow: 'advocacy', slug: ADV_FED, language: 'en', stance: 'support', voice: 'medium', facts: [
    'Owns a paving company with 14 employees in Sparks.', 'Lost a county bridge job in 2025 when federal funding lapsed for 7 months.', 'Laid off 4 people that winter.', 'Wants a five-year bill so counties can plan.'] },
  { key: 'A11 rural nurse, support', flow: 'advocacy', slug: ADV_FED, language: 'en', stance: 'support', voice: 'rich', facts: [
    'Home health nurse covering Lyon County.', 'Drives about 300 miles a week on two-lane roads.', 'Two bridges on her route have had weight limits since 2024, adding 25 minutes each way.', 'One patient missed a dialysis appointment in March because of a road closure.', 'Wants the bill passed.'] },
  { key: 'A12 taxpayer, oppose', flow: 'advocacy', slug: ADV_FED, language: 'en', stance: 'oppose', voice: 'medium', facts: [
    'Retired accountant in Henderson.', 'Thinks a five-year commitment of this size should be paid for, not borrowed.', 'Has no personal road complaint.', 'Wants a no vote unless it is offset.'] },
  { key: 'A13 flood, support', flow: 'advocacy', slug: ADV_NFIP, language: 'en', stance: 'support', voice: 'medium', facts: [
    'Owns a home near the Truckee River in Reno.', 'Flood insurance is required by her mortgage.', 'The program lapsed twice in the last few years and each time her closing on a refinance was delayed.', 'Wants a long-term reauthorization.'] },
  { key: 'A14 flood, oppose', flow: 'advocacy', slug: ADV_NFIP, language: 'en', stance: 'oppose', voice: 'terse', facts: [
    'Lives in Fallon, not in a flood zone.', 'Thinks the program keeps rebuilding the same houses.', 'Wants reform first, not a long reauthorization.'] },
  { key: 'A15 realtor, support', flow: 'advocacy', slug: ADV_NFIP, language: 'en', stance: 'support', voice: 'rich', facts: [
    'Real estate agent in Sparks, 11 years.', 'Had three sales stall during the last lapse because buyers could not get a policy.', 'One buyer lost a rate lock and paid about $140 more a month.', 'Wants a five-year reauthorization.'] },
];

const VOICE_EN: Record<Persona['voice'], string> = {
  terse: 'Answer in one short sentence, 5 to 14 words. No elaboration. Sound tired and plain.',
  medium: 'Answer in one or two plain sentences, 15 to 35 words. Give one concrete detail when you have one.',
  rich: 'Answer in two to four sentences, 40 to 80 words, with concrete detail and a little feeling.',
};
const VOICE_ES: Record<Persona['voice'], string> = {
  terse: 'Responda en una oración corta, de 5 a 14 palabras, en español. Sin elaborar.',
  medium: 'Responda en una o dos oraciones sencillas, de 15 a 35 palabras, en español. Dé un detalle concreto cuando lo tenga.',
  rich: 'Responda en dos a cuatro oraciones, de 40 a 80 palabras, en español, con detalle concreto y algo de sentimiento.',
};

async function fakeAnswer(p: Persona, transcript: Msg[]): Promise<string> {
  const es = p.language === 'es';
  const system = es
    ? `Usted es una persona real que responde a las preguntas de un guía en un chat. NO es un asistente.
HECHOS SOBRE USTED (los únicos que puede usar; nunca invente otros):
${p.facts.map((f) => `- ${f}`).join('\n')}
${VOICE_ES[p.voice]}
Si la pregunta pide algo que no está en sus hechos, diga "Prefiero no decirlo" o dé una respuesta general sin hechos nuevos. No repita un hecho que ya dio. Primera persona. Sin guiones largos.`
    : `You are a real person answering a guide's questions in a chat. You are NOT an assistant.
FACTS ABOUT YOU (the only facts you may use; never invent others):
${p.facts.map((f) => `- ${f}`).join('\n')}
${VOICE_EN[p.voice]}
If the question asks for something not in your facts, say "I'd rather not say" or give a short general answer with no new facts. Never repeat a fact you already gave. First person. No dashes.`;
  const history = transcript.map((m) => `${m.role === 'assistant' ? 'Guide' : 'You'}: ${m.content}`).join('\n');
  const text = await callClaude(system, `${history}\n\nYour next reply (one message):`, 220);
  return text.trim().replace(/^(You|Usted):\s*/i, '').replace(/\s*[—–]\s*/g, ', ');
}

async function post(path: string, body: unknown, ip: string): Promise<Response> {
  return fetch(`${BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip },
    body: JSON.stringify(body),
  });
}

const HANDOFF = /Turn this into my story|Draft my message|Convertir esto en mi historia|Redactar mi mensaje/i;

interface RunResult {
  key: string; flow: Flow; slug: string; language: string; stance?: string; voice: string;
  facts: string[]; transcript: Msg[]; inputWords: number; outputWords: number; title: string; output: string;
  unknownNumbers: string[]; cadence: string[]; error?: string;
  judge?: { fidelity: number; specificity: number; voice: number; structure: number; issues: string[]; verdict: string } | null;
}

async function judge(r: RunResult, campaignTemplate: string | null): Promise<RunResult['judge']> {
  const system = `You are a strict editor auditing an AI-written ${r.flow === 'story' ? 'first-person personal story collected by an advocacy organization' : 'constituent letter to an elected official'}. Score 1 to 5 on each:
- fidelity: every checkable fact in the output is in the FACT SHEET or TRANSCRIPT${campaignTemplate ? ' or the CAMPAIGN MATERIAL (bill numbers, dollar figures, vote counts, and dates from the campaign material are allowed)' : ''}. Invented names, numbers, places, events, diagnoses, family members, outcomes, changed gender or number of a person, or added frequency words ("every day") = 1 or 2. Developing meaning, stakes, or the feeling a moment plainly carries is fine and should not lower the score.
- specificity: concrete details that place the person (role, place, a moment, a number) and make it memorable.
- voice: reads like a real person wrote it. Machine shapes (not X but Y, lists of three, a twist ending, dashes, stock openers, "I'm not asking for much") lower it.
- structure: ${r.flow === 'story' ? 'who they are, a specific moment, what it cost them, what they want, in their own words.' : 'an opening in the sender\'s voice, their story, the case, a clear ask aimed at the reader; right length (state 130-200 words with a story, federal 180-250).'}
${r.language === 'es' ? 'The output should be in Spanish.' : ''}
Return ONLY JSON: {"fidelity":n,"specificity":n,"voice":n,"structure":n,"issues":["short, specific, quote the offending phrase"],"verdict":"pass"|"fix"}. verdict "fix" when any score is 2 or lower or fidelity is 3.`;
  const user = `FACT SHEET:\n${r.facts.map((f) => '- ' + f).join('\n')}\n\nTRANSCRIPT:\n${r.transcript.map((m) => `${m.role === 'assistant' ? 'Guide' : 'Person'}: ${m.content}`).join('\n')}\n${campaignTemplate ? `\nCAMPAIGN MATERIAL:\n${campaignTemplate}\n` : ''}\nOUTPUT:\n${r.output}`;
  try {
    const raw = await callClaude(system, user, 700);
    const j = extractJSON(raw) as RunResult['judge'];
    return j && typeof j.fidelity === 'number' ? j : null;
  } catch { return null; }
}

async function runOne(p: Persona, idx: number, templates: Record<string, string | null>): Promise<RunResult> {
  const ip = `10.77.${Math.floor(idx / 200)}.${(idx % 200) + 10}`;
  const opener = p.flow === 'story'
    ? (p.language === 'es'
      ? 'Hola. Estoy aquí para ayudarle a poner su experiencia en palabras. No hay prisa. Para empezar: cuéntenos sobre una vez que enfrentó un desafío al buscar cuidado infantil, educación temprana, atención médica, vivienda o alimentos para un niño pequeño. ¿Qué pasó?'
      : 'Hi. I’m here to help you put your experience into words. There is no rush. To start: tell us about a time when you faced a challenge while trying to access child care, early learning, health care, housing, food resources or another service for a young child. What happened?')
    : 'Hi. I’m here to help you say why this matters to you. To start: what is your connection to this issue, or what has happened that makes you care about it?';
  const messages: Msg[] = [{ role: 'assistant', content: opener }];
  const result: RunResult = { key: p.key, flow: p.flow, slug: p.slug, language: p.language, stance: p.stance, voice: p.voice, facts: p.facts, transcript: messages, inputWords: 0, outputWords: 0, title: '', output: '', unknownNumbers: [], cadence: [] };
  try {
    for (let turn = 0; turn < 6; turn++) {
      const answer = await fakeAnswer(p, messages);
      messages.push({ role: 'user', content: answer });
      const path = p.flow === 'story' ? '/api/chat/story-interview' : '/api/chat/campaign-interview';
      const res = await post(path, { campaignSlug: p.slug, messages, stance: p.stance, turnstileToken: TOKEN }, ip);
      if (!res.ok) throw new Error(`${path} ${res.status}: ${(await res.text()).slice(0, 200)}`);
      const reply = (await res.text()).trim();
      messages.push({ role: 'assistant', content: reply });
      if (HANDOFF.test(reply)) break;
    }
    const userTurns = messages.filter((m) => m.role === 'user').map((m) => m.content);
    result.inputWords = userTurns.join(' ').split(/\s+/).filter(Boolean).length;
    if (p.flow === 'story') {
      const res = await post('/api/stories/compose', { campaignSlug: p.slug, messages, turnstileToken: TOKEN }, ip);
      const d = await res.json();
      if (!res.ok) throw new Error(`compose ${res.status}: ${d.error}`);
      result.output = d.body || ''; result.title = d.title || '';
      // Submit in PREVIEW mode: runs the anonymization pass, saves nothing.
      const pv = await post('/api/stories', { campaignSlug: p.slug, preview: true, body: result.output, title: result.title, attribution_level: 'anonymous', granted_uses: ['shared_with_legislators'], consent_usage: true, consent_truthful: true, consent_adult: true, turnstileToken: TOKEN }, ip);
      const pd = await pv.json();
      if (!pv.ok) throw new Error(`submit preview ${pv.status}: ${pd.error}`);
      result.title = result.title || ''; (result as RunResult & { preview?: string }).preview = pd.final_body;
    } else {
      const res = await post('/api/generate-core-message', { campaignSlug: p.slug, stance: p.stance, personalWhy: userTurns.join('\n\n').slice(0, 4000), interview: messages, turnstileToken: TOKEN }, ip);
      const d = await res.json();
      if (!res.ok) throw new Error(`draft ${res.status}: ${d.error}`);
      result.output = `${d.opening ? d.opening + '\n\n' : ''}${d.body}\n\n${d.ask ?? ''}`.trim(); result.title = d.subject || '';
    }
    result.outputWords = result.output.split(/\s+/).filter(Boolean).length;
    const NUM = /\$?\d[\d,.]*/g;
    const norm = (n: string) => n.replace(/[,$]/g, '').replace(/\.$/, '');
    const known = new Set([...(p.facts.join(' ') + ' ' + userTurns.join(' ') + ' ' + (templates[p.slug] || '')).matchAll(NUM)].map((m) => norm(m[0])));
    result.unknownNumbers = [...new Set([...result.output.matchAll(NUM)].map((m) => norm(m[0])))].filter((n) => n && !known.has(n));
    result.cadence = detectAiCadence(result.output);
    result.judge = await judge(result, p.flow === 'advocacy' ? templates[p.slug] : null);
  } catch (err) {
    result.error = err instanceof Error ? err.message : String(err);
  }
  return result;
}

(async () => {
  const [flowArg = 'all', countArg = '100', outFile = 'quality-out.json'] = process.argv.slice(2);
  const selected = PERSONAS.filter((p) => flowArg === 'all' || p.flow === flowArg).slice(0, Number(countArg));
  // Campaign talking points, for the number audit and the judge.
  const templates: Record<string, string | null> = {};
  for (const slug of [...new Set(selected.map((p) => p.slug))]) {
    try {
      const res = await fetch(`${BASE}/api/campaigns/${slug}`);
      const d = await res.json();
      const c = d?.campaign ?? d ?? {};
      // Everything the drafter is allowed to draw on besides the person: the
      // campaign's headline, description, bill, talking points, and both cases.
      templates[slug] = [c.headline, c.description, c.bill_ref, c.bill_title, c.message_template, c.case_for, c.case_against].filter(Boolean).join('\n') || null;
    } catch { templates[slug] = null; }
  }
  const results: RunResult[] = [];
  // Three at a time: the model calls dominate, and each run has its own IP.
  for (let i = 0; i < selected.length; i += 3) {
    const batch = selected.slice(i, i + 3).map((p, j) => runOne(p, i + j + 1, templates));
    const done = await Promise.all(batch);
    for (const r of done) {
      results.push(r);
      const j = r.judge;
      console.log(`${r.key.padEnd(30)} ${r.error ? 'ERROR ' + r.error.slice(0, 80) : `${r.inputWords}w -> ${r.outputWords}w | F${j?.fidelity ?? '-'} S${j?.specificity ?? '-'} V${j?.voice ?? '-'} T${j?.structure ?? '-'} ${j?.verdict ?? ''} | nums:${r.unknownNumbers.join(',') || '-'} | cadence:${r.cadence.length}`}`);
    }
  }
  const existing = fs.existsSync(outFile) ? JSON.parse(fs.readFileSync(outFile, 'utf8')) : [];
  fs.writeFileSync(outFile, JSON.stringify([...existing, ...results], null, 1));
  console.log(`\nwrote ${results.length} results to ${outFile}`);
})();
