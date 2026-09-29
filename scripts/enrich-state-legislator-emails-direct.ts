/**
 * Direct email enricher — NO Open States calls (its 250/day quota is easily
 * exhausted). Uses the candidate/official URL already captured in the coverage
 * audit's `missing[].fallback` field, visits each page with Playwright, and
 * extracts the published email with domain + name scoring.
 *
 * Skips homepage-only fallbacks (root URLs) — those are almost all statewide
 * executives (Governor/AG/Treasurer) that are webform-only and have no
 * scrapeable personal address. We target the specific-path legislator pages.
 *
 * Input:  src/data/state-legislator-coverage.json
 * Output: src/data/state-legislator-email-overrides.json
 * Run:    npx tsx scripts/enrich-state-legislator-emails-direct.ts
 */
import * as fs from 'fs';
import { chromium, type Browser } from 'playwright';

const COVERAGE = 'src/data/state-legislator-coverage.json';
const OUT = 'src/data/state-legislator-email-overrides.json';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const EMAIL_RE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/g;
const GENERIC = /^(no-?reply|noreply|webmaster|postmaster|mailer-daemon|info|contact|help|support|admin|donotreply)@/i;

type Missing = { state: string; name: string; url: string; specific: boolean };

function loadMissing(): Missing[] {
  const cov = JSON.parse(fs.readFileSync(COVERAGE, 'utf-8')) as {
    states: Array<{ state: string; missing?: Array<{ name: string; fallback?: string }> }>;
  };
  const out: Missing[] = [];
  for (const s of cov.states) {
    for (const m of s.missing ?? []) {
      const url = (m.fallback?.match(/https?:\/\/\S+/) ?? [''])[0];
      if (!url) continue;
      const path = url.replace(/https?:\/\/[^/]+/, '');
      out.push({ state: s.state, name: m.name, url, specific: path.length > 1 });
    }
  }
  return out;
}

function scoreEmail(email: string, name: string): number {
  const [local, domain = ''] = email.toLowerCase().split('@');
  if (GENERIC.test(email)) return -5;
  let s = 0;
  if (/\b(leg|senate|house|assembly|gov)\b/.test(domain) || domain.endsWith('.us') || domain.endsWith('.gov')) s += 3;
  const last = name.toLowerCase().split(/\s+/).pop() ?? '';
  if (last.length > 2 && local.includes(last.replace(/[^a-z]/g, ''))) s += 3;
  if (domain.includes('openstates') || domain.includes('example')) s -= 5;
  return s;
}

async function extractEmail(browser: Browser, url: string, name: string): Promise<{ email: string; source: string } | null> {
  let best: { email: string; source: string; score: number } | null = null;
  const page = await browser.newPage({
    userAgent:
      'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  });
  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 20000 });
    const html = await page.content();
    const mailtos = (html.match(/mailto:([^"'>\s]+)/gi) ?? []).map((m) => m.slice(7));
    const found = [...new Set([...mailtos, ...(html.match(EMAIL_RE) ?? [])])];
    for (const email of found) {
      if (!/^[^@]+@[^@]+\.[a-z]{2,}$/i.test(email)) continue;
      const score = scoreEmail(email, name);
      if (score >= 0 && (!best || score > best.score)) best = { email, source: url, score };
    }
  } catch {
    /* unreachable — skip */
  } finally {
    await page.close();
  }
  return best ? { email: best.email, source: best.source } : null;
}

async function run() {
  const all = loadMissing();
  const targets = all.filter((m) => m.specific); // skip homepage-only (execs/webform)
  const skippedGeneric = all.length - targets.length;
  console.log(`Direct-scraping ${targets.length} specific legislator pages (${skippedGeneric} homepage-only skipped)...\n`);

  const browser = await chromium.launch({ headless: true });
  const overrides: Array<{ state: string; name: string; email: string; source: string }> = [];
  const unresolved: Array<{ state: string; name: string; url: string }> = [];

  let n = 0;
  for (const m of targets) {
    n++;
    const hit = await extractEmail(browser, m.url, m.name);
    if (hit) {
      overrides.push({ state: m.state, name: m.name, ...hit });
      console.log(`[${n}/${targets.length}] ✓ ${m.name} (${m.state}) → ${hit.email}`);
    } else {
      unresolved.push({ state: m.state, name: m.name, url: m.url });
      console.log(`[${n}/${targets.length}] ✗ ${m.name} (${m.state})`);
    }
    if (n % 10 === 0) fs.writeFileSync(OUT, JSON.stringify({ overrides, unresolved }, null, 2));
    await sleep(1000);
  }
  await browser.close();

  fs.writeFileSync(
    OUT,
    JSON.stringify(
      {
        summary: {
          totalMissing: all.length,
          homepageOnlySkipped: skippedGeneric,
          attempted: targets.length,
          found: overrides.length,
          unresolved: unresolved.length,
        },
        overrides,
        unresolved,
        generatedFrom: COVERAGE,
        note: 'homepageOnlySkipped are mostly statewide executives (Governor/AG/Treasurer) that are webform-only.',
      },
      null,
      2,
    ),
  );
  console.log(`\n=== DIRECT ENRICHMENT DONE ===`);
  console.log(`found ${overrides.length}/${targets.length} emails; ${unresolved.length} unresolved; ${skippedGeneric} homepage-only skipped`);
  console.log(`Saved: ${OUT}`);
}
run().catch((e) => {
  console.error(e);
  process.exit(1);
});
