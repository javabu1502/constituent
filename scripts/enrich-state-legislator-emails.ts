/**
 * Layer-2 email enricher for state legislators missing an email in Open States.
 *
 * Input:  src/data/state-legislator-coverage.json (the coverage audit output —
 *         each state's `missing` list of names).
 * Method: re-query Open States for those states to get each missing legislator's
 *         OFFICIAL source/link URLs, visit those .gov pages with Playwright, and
 *         extract the published email with domain + name scoring (so we pick the
 *         legislator's real address, not webmaster@/no-reply@).
 * Output: src/data/state-legislator-email-overrides.json — an override table the
 *         rep resolver can consult when Open States lacks an email.
 *
 * Checkpointed + rate-limited (polite to .gov). Run AFTER the coverage audit.
 * Run: npx tsx scripts/enrich-state-legislator-emails.ts
 */
import * as fs from 'fs';
import * as dotenv from 'dotenv';
import { chromium, type Browser } from 'playwright';
dotenv.config({ path: '.env.local' });

const KEY = process.env.OPENSTATES_API_KEY;
if (!KEY) { console.error('No OPENSTATES_API_KEY'); process.exit(1); }
const COVERAGE = 'src/data/state-legislator-coverage.json';
const OUT = 'src/data/state-legislator-email-overrides.json';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const GENERIC = /^(no-?reply|noreply|webmaster|postmaster|mailer-daemon|info|contact|help|support|admin|donotreply)@/i;

type Missing = { state: string; name: string };
type Person = { name: string; email?: string; links?: Array<{ url?: string }>; sources?: Array<{ url?: string }>; offices?: Array<{ email?: string }> };

function loadMissing(): Missing[] {
  if (!fs.existsSync(COVERAGE)) { console.error(`Missing ${COVERAGE} — run the coverage audit first.`); process.exit(1); }
  const cov = JSON.parse(fs.readFileSync(COVERAGE, 'utf-8')) as { states: Array<{ state: string; missing?: Array<{ name: string }> }> };
  const out: Missing[] = [];
  for (const s of cov.states) for (const m of s.missing ?? []) out.push({ state: s.state, name: m.name });
  return out;
}

async function osGet(url: string, tries = 5): Promise<Record<string, unknown>> {
  for (let i = 0; i < tries; i++) {
    const res = await fetch(url, { headers: { 'X-API-Key': KEY as string } });
    if (res.status === 429) { await sleep(8000 * (i + 1)); continue; }
    if (res.ok) return (await res.json()) as Record<string, unknown>;
    await sleep(2000 * (i + 1));
  }
  throw new Error('open states fetch failed');
}

/** For each state with gaps, map missing legislator name -> candidate URLs. */
async function candidateUrls(states: string[], missingByState: Map<string, Set<string>>): Promise<Map<string, string[]>> {
  const urls = new Map<string, string[]>(); // key: `${state}|${name}`
  for (const state of states) {
    const wanted = missingByState.get(state)!;
    let page = 1, maxPage = 1;
    do {
      const j = await osGet(`https://v3.openstates.org/people?jurisdiction=${encodeURIComponent(state)}&per_page=50&page=${page}&include=links&include=sources`);
      maxPage = (j.pagination as { max_page?: number })?.max_page ?? 1;
      for (const p of ((j.results as Person[]) ?? [])) {
        if (!wanted.has(p.name)) continue;
        const cands = [...(p.links ?? []), ...(p.sources ?? [])]
          .map((x) => x.url).filter((u): u is string => !!u && !u.toLowerCase().startsWith('mailto:'));
        urls.set(`${state}|${p.name}`, [...new Set(cands)]);
      }
      page++;
      await sleep(1500);
    } while (page <= maxPage);
  }
  return urls;
}

function scoreEmail(email: string, state: string, name: string): number {
  const [local, domain = ''] = email.toLowerCase().split('@');
  if (GENERIC.test(email)) return -5;
  let s = 0;
  if (/\b(leg|senate|house|assembly|gov)\b/.test(domain) || domain.endsWith('.us') || domain.endsWith('.gov')) s += 3;
  const last = name.toLowerCase().split(/\s+/).pop() ?? '';
  if (last.length > 2 && local.includes(last.replace(/[^a-z]/g, ''))) s += 3;
  if (domain.includes('openstates') || domain.includes('example')) s -= 5;
  void state;
  return s;
}

async function extractEmail(browser: Browser, urls: string[], state: string, name: string): Promise<{ email: string; source: string } | null> {
  let best: { email: string; source: string; score: number } | null = null;
  for (const url of urls.slice(0, 4)) {
    const page = await browser.newPage({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' });
    try {
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
      const html = await page.content();
      const mailtos = (html.match(/mailto:([^"'>\s]+)/gi) ?? []).map((m) => m.slice(7));
      const found = [...new Set([...mailtos, ...(html.match(EMAIL_RE) ?? [])])];
      for (const email of found) {
        if (!/^[^@]+@[^@]+\.[a-z]{2,}$/i.test(email)) continue;
        const score = scoreEmail(email, state, name);
        if (score >= 0 && (!best || score > best.score)) best = { email, source: url, score };
      }
    } catch { /* skip unreachable */ }
    finally { await page.close(); }
    await sleep(1200);
    if (best && best.score >= 5) break; // strong match, stop early
  }
  return best ? { email: best.email, source: best.source } : null;
}

async function run() {
  const missing = loadMissing();
  const byState = new Map<string, Set<string>>();
  for (const m of missing) (byState.get(m.state) ?? byState.set(m.state, new Set()).get(m.state)!).add(m.name);
  const states = [...byState.keys()];
  console.log(`Enriching ${missing.length} legislators across ${states.length} states...\n`);

  const urls = await candidateUrls(states, byState);
  const browser = await chromium.launch({ headless: true });
  const overrides: Array<{ state: string; name: string; email: string; source: string }> = [];
  const unresolved: Array<{ state: string; name: string }> = [];

  let n = 0;
  for (const m of missing) {
    n++;
    const cands = urls.get(`${m.state}|${m.name}`) ?? [];
    const hit = cands.length ? await extractEmail(browser, cands, m.state, m.name) : null;
    if (hit) { overrides.push({ state: m.state, name: m.name, ...hit }); console.log(`[${n}/${missing.length}] ✓ ${m.name} (${m.state}) → ${hit.email}`); }
    else { unresolved.push({ state: m.state, name: m.name }); console.log(`[${n}/${missing.length}] ✗ ${m.name} (${m.state})`); }
    if (n % 15 === 0) fs.writeFileSync(OUT, JSON.stringify({ overrides, unresolved, generatedFrom: COVERAGE }, null, 2));
  }
  await browser.close();

  fs.writeFileSync(OUT, JSON.stringify({
    summary: { attempted: missing.length, found: overrides.length, unresolved: unresolved.length },
    overrides, unresolved, generatedFrom: COVERAGE,
  }, null, 2));
  console.log(`\n=== ENRICHMENT DONE ===\nfound ${overrides.length}/${missing.length} emails; ${unresolved.length} still unresolved`);
  console.log(`Saved: ${OUT}`);
}
run().catch((e) => { console.error(e); process.exit(1); });
