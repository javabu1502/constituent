/**
 * State legislator contact-coverage audit via Open States (v2 — robust).
 * Fixes the earlier fetch failures (retries + never accepts an empty page as
 * final) and recovers emails the first pass missed by checking the FULLER
 * record: top-level email, then office emails, then mailto links. Captures the
 * best fallback (webform/phone) for anyone with no email.
 * Output: src/data/state-legislator-coverage.json
 * Run: npx tsx scripts/audit-state-legislator-coverage.ts
 */
import * as fs from 'fs';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const KEY = process.env.OPENSTATES_API_KEY;
if (!KEY) { console.error('No OPENSTATES_API_KEY'); process.exit(1); }
const OUT = 'src/data/state-legislator-coverage.json';

const STATES = [
  'Alabama','Alaska','Arizona','Arkansas','California','Colorado','Connecticut','Delaware','Florida','Georgia',
  'Hawaii','Idaho','Illinois','Indiana','Iowa','Kansas','Kentucky','Louisiana','Maine','Maryland','Massachusetts',
  'Michigan','Minnesota','Mississippi','Missouri','Montana','Nebraska','Nevada','New Hampshire','New Jersey',
  'New Mexico','New York','North Carolina','North Dakota','Ohio','Oklahoma','Oregon','Pennsylvania','Rhode Island',
  'South Carolina','South Dakota','Tennessee','Texas','Utah','Vermont','Virginia','Washington','West Virginia',
  'Wisconsin','Wyoming','District of Columbia',
];

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function getJson(url: string, tries = 5): Promise<Record<string, unknown>> {
  let lastErr = '';
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url, { headers: { 'X-API-Key': KEY as string } });
      if (res.status === 429) { await sleep(8000 * (i + 1)); continue; }
      if (!res.ok) { lastErr = `HTTP ${res.status}`; await sleep(2500 * (i + 1)); continue; }
      return (await res.json()) as Record<string, unknown>;
    } catch (e) { lastErr = (e as Error).message; await sleep(2500 * (i + 1)); }
  }
  throw new Error(lastErr || 'failed');
}

type Person = { name: string; email?: string; offices?: Array<{ email?: string; voice?: string; classification?: string }>; links?: Array<{ url?: string }> };

function bestEmail(p: Person): string | null {
  if (p.email && p.email.trim()) return p.email.trim();
  for (const o of p.offices ?? []) if (o.email && o.email.trim()) return o.email.trim();
  for (const l of p.links ?? []) if (l.url && l.url.toLowerCase().startsWith('mailto:')) return l.url.slice(7).trim();
  return null;
}
function fallbackContact(p: Person): string {
  const voice = (p.offices ?? []).find((o) => o.voice)?.voice;
  const web = (p.links ?? []).find((l) => l.url && !l.url.toLowerCase().startsWith('mailto:'))?.url;
  return web ? `webform/site: ${web}` : voice ? `phone: ${voice}` : 'no contact found';
}

type StateRow = { state: string; total: number; withEmail: number; withoutEmail: number; pct: number; recovered: number; missing: Array<{ name: string; fallback: string }> };

async function run() {
  const rows: StateRow[] = [];
  for (const state of STATES) {
    let page = 1, maxPage = 1, total = 0, withEmail = 0, recovered = 0;
    const missing: Array<{ name: string; fallback: string }> = [];
    try {
      do {
        const url = `https://v3.openstates.org/people?jurisdiction=${encodeURIComponent(state)}&per_page=50&page=${page}&include=offices&include=links`;
        const j = await getJson(url);
        const results = (j.results as Person[]) ?? [];
        maxPage = (j.pagination as { max_page?: number })?.max_page ?? 1;
        if (results.length === 0 && page === 1 && maxPage <= 1) throw new Error('empty result (retrying whole state)');
        for (const p of results) {
          total++;
          const email = bestEmail(p);
          if (email) { withEmail++; if (!(p.email && p.email.trim())) recovered++; }
          else missing.push({ name: p.name, fallback: fallbackContact(p) });
        }
        page++;
        await sleep(1600);
      } while (page <= maxPage);
    } catch (e) {
      // one full-state retry after a longer pause
      console.log(`  ${state}: ${(e as Error).message} — retrying once after pause`);
      await sleep(10000);
      try {
        const j = await getJson(`https://v3.openstates.org/people?jurisdiction=${encodeURIComponent(state)}&per_page=50&page=1&include=offices&include=links`);
        maxPage = (j.pagination as { max_page?: number })?.max_page ?? 1;
        for (let pg = 1; pg <= maxPage; pg++) {
          const jj = pg === 1 ? j : await getJson(`https://v3.openstates.org/people?jurisdiction=${encodeURIComponent(state)}&per_page=50&page=${pg}&include=offices&include=links`);
          for (const p of ((jj.results as Person[]) ?? [])) {
            total++; const email = bestEmail(p);
            if (email) { withEmail++; if (!(p.email && p.email.trim())) recovered++; }
            else missing.push({ name: p.name, fallback: fallbackContact(p) });
          }
          await sleep(1600);
        }
      } catch (e2) { console.log(`  ${state}: STILL FAILED ${(e2 as Error).message}`); }
    }
    const withoutEmail = total - withEmail;
    const pct = total ? Math.round((withEmail / total) * 1000) / 10 : 0;
    rows.push({ state, total, withEmail, withoutEmail, pct, recovered, missing: missing.slice(0, 300) });
    console.log(`${state.padEnd(22)} ${String(withEmail).padStart(4)}/${String(total).padStart(4)} email (${pct}%)${recovered ? `  [+${recovered} recovered]` : ''}`);
  }

  const totalLeg = rows.reduce((a, r) => a + r.total, 0);
  const totalEmail = rows.reduce((a, r) => a + r.withEmail, 0);
  const totalRecovered = rows.reduce((a, r) => a + r.recovered, 0);
  const summary = {
    totalLegislators: totalLeg,
    withEmail: totalEmail,
    withoutEmail: totalLeg - totalEmail,
    overallPct: totalLeg ? Math.round((totalEmail / totalLeg) * 1000) / 10 : 0,
    recoveredFromOfficesOrLinks: totalRecovered,
    statesWithZero: rows.filter((r) => r.total === 0).map((r) => r.state),
    missingByState: rows.filter((r) => r.withoutEmail > 0).map((r) => `${r.state}: ${r.withoutEmail}`),
  };
  fs.writeFileSync(OUT, JSON.stringify({ summary, states: rows }, null, 2));
  console.log('\n=== COVERAGE SUMMARY ===');
  console.log(JSON.stringify(summary, null, 2));
  console.log(`\nSaved: ${OUT}`);
}
run().catch((e) => { console.error(e); process.exit(1); });
