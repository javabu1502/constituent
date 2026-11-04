/**
 * Which state legislators have a contact form on their website, and which of
 * those forms are CAPTCHA-gated.
 *
 * Why it matters: state messages are delivered today by opening the sender's
 * own mail app. A legislator with a CAPTCHA-free contact form is one we could
 * file for them, the way the Senate webform sender already does for the 24
 * non-CWC senators. This audit is the input to that decision.
 *
 * Plain HTTP, not a headless browser: at 7,300+ legislators Playwright would
 * take hours. The trade is that a form injected by JavaScript after load is
 * invisible here, so a "none" is a floor, not a certainty. Hosts flagged
 * `jsHeavy` are the ones worth a browser pass afterwards.
 *
 * Politeness: hosts are crawled in parallel, but each host is crawled
 * SERIALLY with a delay. Thirteen states put every legislator on one
 * government host, and firing 200 requests at a state legislature at once is
 * both rude and a good way to get blocked.
 *
 *   node scripts/audit-state-contact-forms.mjs [--states NV,CA] [--limit 50]
 */
import fs from 'fs';
import path from 'path';
import { execFile } from 'child_process';

const OUT = path.join(process.cwd(), 'src', 'data', 'state-contact-form-audit.json');
// The per-legislator rows run to ~3.5MB and are regenerable, so they stay out
// of git (see 0553d05). The committed summary is what the delivery decision
// actually needs: per-state rates, and the legislators whose forms we could
// file without solving a CAPTCHA.
const SUMMARY = path.join(process.cwd(), 'src', 'data', 'state-contact-form-summary.json');
// A browser UA, matching scripts/audit-senate-captcha.ts. Several state
// legislature hosts 403 anything that does not look like a browser, and a
// 403 recorded as "no contact form" is a wrong answer rather than a missing
// one. The request rate stays deliberately slow regardless.
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
const HOST_DELAY_MS = 500;
const HOST_CONCURRENCY = 14;
const TIMEOUT_MS = 15000;

const argv = process.argv.slice(2);
const argVal = (f) => { const i = argv.indexOf(f); return i >= 0 ? argv[i + 1] : null; };
const onlyStates = (argVal('--states') || '').split(',').map((s) => s.trim().toUpperCase()).filter(Boolean);
const limit = Number(argVal('--limit') || 0);

function loadLegislators() {
  const dir = path.join(process.cwd(), 'src', 'data', 'states');
  const out = [];
  for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.json'))) {
    const st = f.slice(0, 2).toUpperCase();
    if (onlyStates.length && !onlyStates.includes(st)) continue;
    let raw;
    try { raw = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); } catch { continue; }
    const legs = Array.isArray(raw) ? raw : raw.legislators || [];
    for (const l of legs) {
      if (!l.website) continue;
      out.push({ state: st, id: l.id, name: l.name, chamber: l.chamber, district: l.district, url: l.website, email: l.email || null });
    }
  }
  return limit ? out.slice(0, limit) : out;
}

const CAPTCHA_PATTERNS = [
  [/recaptcha\/api\.js|g-recaptcha|grecaptcha/i, 'recaptcha'],
  [/hcaptcha\.com|h-captcha/i, 'hcaptcha'],
  [/challenges\.cloudflare\.com\/turnstile|cf-turnstile/i, 'turnstile'],
  [/captcha/i, 'generic'],
];

/** A form is a CONTACT form when its fields look like a message, not a search. */
function classifyHtml(html) {
  const lower = html.toLowerCase();
  const forms = lower.match(/<form[\s\S]*?<\/form>/g) || [];
  let hasContactForm = false;
  for (const f of forms) {
    const hasEmail = /type=["']?email|name=["'][^"']*e-?mail|id=["'][^"']*e-?mail/.test(f);
    const hasMessage = /<textarea|name=["'][^"']*(message|comment|question|body|inquiry)/.test(f);
    const isSearch = /role=["']search|name=["'](q|s|search|keyword)["']/.test(f) && !hasMessage;
    if (isSearch) continue;
    if (hasMessage && (hasEmail || /name=["'][^"']*(name|subject)/.test(f))) { hasContactForm = true; break; }
  }
  let captcha = null;
  for (const [re, kind] of CAPTCHA_PATTERNS) { if (re.test(html)) { captcha = kind; break; } }
  const contactLink = (() => {
    const m = html.match(/<a[^>]+href=["']([^"']+)["'][^>]*>((?:(?!<\/a>)[\s\S]){0,120})<\/a>/gi) || [];
    for (const a of m) {
      const href = (a.match(/href=["']([^"']+)["']/i) || [])[1];
      if (!href) continue;
      const text = a.replace(/<[^>]+>/g, ' ');
      if (/contact|email\s*me|write\s*(to\s*)?(me|us)|message/i.test(text) || /contact/i.test(href)) {
        if (/^mailto:/i.test(href)) continue;
        return href;
      }
    }
    return null;
  })();
  // Legislature contact forms are very often iframed in from a central
  // system rather than written into the member's page: every one of
  // California's 120 members embeds lcmspubcontact.lc.ca.gov. Looking only
  // for <form> marked the entire state as having no contact form.
  const iframeForm = (() => {
    const frames = html.match(/<iframe[^>]+src=["']([^"']+)["'][^>]*>/gi) || [];
    for (const f of frames) {
      const src = (f.match(/src=["']([^"']+)["']/i) || [])[1];
      if (!src) continue;
      if (/googletagmanager|google-analytics|doubleclick|youtube|vimeo|facebook|twitter|maps\.google/i.test(src)) continue;
      if (/contact|message|email|form|comment|lcmspubcontact|formstack|wufoo|jotform|cognitoforms|gravityforms/i.test(f)) return src;
    }
    return null;
  })();

  const mailto = /href=["']mailto:/i.test(html);
  // A near-empty body with heavy script usually means the page builds itself.
  const textLen = lower.replace(/<script[\s\S]*?<\/script>/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim().length;
  const jsHeavy = textLen < 400 && /<script/.test(lower);
  return { hasContactForm, captcha, contactLink, iframeForm, mailto, jsHeavy };
}

// Fetching goes through curl rather than Node's fetch.
//
// Government TLS is frequently misconfigured: a66.asmdc.org and many others
// serve an incomplete certificate chain. Node's fetch rejects those outright
// (UNABLE_TO_VERIFY_LEAF_SIGNATURE), which on the first smoke test turned
// ~60% of California into "fetch failed" that the summary would then have
// reported as "no contact form". curl completes the same chain from the
// system trust store and verifies it properly, so this is a correctness fix
// and not a relaxation: certificate verification stays fully on.
const curl = (args) =>
  new Promise((resolve) => {
    execFile('curl', args, { maxBuffer: 8 * 1024 * 1024, timeout: TIMEOUT_MS + 5000 }, (err, stdout) =>
      resolve({ err, stdout: stdout || '' }),
    );
  });

async function get(url) {
  const { err, stdout } = await curl([
    '-sSL',
    '--max-time', String(Math.round(TIMEOUT_MS / 1000)),
    '--compressed',
    '-A', UA,
    '-H', 'Accept: text/html,application/xhtml+xml,*/*',
    '-H', 'Accept-Language: en-US,en;q=0.9',
    '-w', '\n__MDSTATUS__%{http_code}\n__MDURL__%{url_effective}',
    url,
  ]);
  const sIdx = stdout.lastIndexOf('__MDSTATUS__');
  if (sIdx === -1) return { status: 0, html: '', error: err ? 'curl failed' : 'no response' };
  const tail = stdout.slice(sIdx);
  const status = Number((tail.match(/__MDSTATUS__(\d+)/) || [])[1] || 0);
  const finalUrl = (tail.match(/__MDURL__(.*)$/) || [])[1] || url;
  const body = stdout.slice(0, sIdx);
  if (status === 0) return { status: 0, html: '', error: 'unreachable' };
  if (status >= 400) return { status, html: '', finalUrl };
  if (!/<html|<!doctype|<body|<form/i.test(body.slice(0, 4000))) return { status, html: '', finalUrl };
  return { status, html: body.slice(0, 600000), finalUrl };
}

/** Fetch an embedded contact form and say whether it really is one. */
async function followIframe(src, baseUrl) {
  if (!src) return null;
  let abs;
  try { abs = new URL(src, baseUrl).toString(); } catch { return null; }
  await new Promise((r) => setTimeout(r, 200));
  const res = await get(abs);
  if (!res.html) return null;
  const c = classifyHtml(res.html);
  if (!c.hasContactForm) return null;
  return { url: abs, captcha: c.captcha };
}

async function auditOne(leg) {
  const base = { ...leg, hasForm: false, captcha: null, checkedUrl: leg.url, via: null, status: 0, error: null, jsHeavy: false, mailto: false };
  const r = await get(leg.url);
  base.status = r.status;
  if (r.error) base.error = r.error;
  if (!r.html) return base;

  const c = classifyHtml(r.html);
  base.jsHeavy = c.jsHeavy;
  base.mailto = c.mailto;
  if (c.hasContactForm) {
    return { ...base, hasForm: true, captcha: c.captcha, via: 'profile' };
  }
  const framed = await followIframe(c.iframeForm, r.finalUrl || leg.url);
  if (framed) return { ...base, hasForm: true, captcha: framed.captcha, checkedUrl: framed.url, via: 'iframe' };
  // One hop to a linked contact page. Most legislature sites put the profile
  // and the form on separate pages.
  if (c.contactLink) {
    let next;
    try { next = new URL(c.contactLink, r.finalUrl || leg.url).toString(); } catch { return base; }
    await new Promise((res) => setTimeout(res, 250));
    const r2 = await get(next);
    if (r2.html) {
      const c2 = classifyHtml(r2.html);
      if (c2.hasContactForm) {
        return { ...base, hasForm: true, captcha: c2.captcha, checkedUrl: next, via: 'contact-link', jsHeavy: c2.jsHeavy, mailto: c2.mailto || base.mailto };
      }
      const framed2 = await followIframe(c2.iframeForm, next);
      if (framed2) {
        return { ...base, hasForm: true, captcha: framed2.captcha, checkedUrl: framed2.url, via: 'contact-link-iframe', mailto: c2.mailto || base.mailto };
      }
      return { ...base, checkedUrl: next, via: 'contact-link', jsHeavy: c2.jsHeavy, mailto: c2.mailto || base.mailto, captcha: c2.captcha };
    }
  }
  return base;
}

async function run() {
  const legs = loadLegislators();
  console.log(`Auditing ${legs.length} state legislators with websites…`);

  const byHost = new Map();
  for (const l of legs) {
    let h;
    try { h = new URL(l.url).host; } catch { h = 'invalid'; }
    if (!byHost.has(h)) byHost.set(h, []);
    byHost.get(h).push(l);
  }
  console.log(`${byHost.size} distinct hosts. Crawling ${HOST_CONCURRENCY} hosts at a time, serially within each.\n`);

  const results = [];
  const hosts = [...byHost.entries()].sort((a, b) => b[1].length - a[1].length);
  let done = 0;
  let idx = 0;

  async function worker() {
    while (idx < hosts.length) {
      const [host, items] = hosts[idx++];
      for (const leg of items) {
        results.push(await auditOne(leg));
        done++;
        if (done % 250 === 0) console.log(`  …${done}/${legs.length}`);
        if (items.length > 1) await new Promise((r) => setTimeout(r, HOST_DELAY_MS));
      }
      void host;
    }
  }
  await Promise.all(Array.from({ length: Math.min(HOST_CONCURRENCY, hosts.length) }, worker));

  // "Could not reach the page" is not the same answer as "there is no
  // contact form", and merging them would understate coverage: the Assembly
  // Republican Caucus host 403s us for two California members who certainly
  // have forms. Rates below are over REACHABLE members only, with unreachable
  // reported separately so the gap is visible rather than silently folded in.
  const byState = {};
  for (const r of results) {
    const st = (byState[r.state] ||= { total: 0, reachable: 0, unreachable: 0, withForm: 0, captchaFree: 0, captcha: 0, jsHeavy: 0 });
    st.total++;
    const reachable = r.status >= 200 && r.status < 400;
    if (reachable) st.reachable++; else st.unreachable++;
    if (r.hasForm) { st.withForm++; r.captcha ? st.captcha++ : st.captchaFree++; }
    if (r.jsHeavy) st.jsHeavy++;
  }
  for (const st of Object.values(byState)) {
    st.formRateOfReachable = st.reachable ? Math.round((st.withForm / st.reachable) * 100) : null;
  }

  const generatedAt = new Date().toISOString();
  fs.writeFileSync(OUT, JSON.stringify({ generatedAt, method: 'http+html', total: results.length, byState, results }, null, 1));

  const captchaFree = results
    .filter((r) => r.hasForm && !r.captcha)
    .map((r) => ({ state: r.state, name: r.name, chamber: r.chamber, district: r.district, formUrl: r.checkedUrl, via: r.via }));
  const deadLinks = results
    .filter((r) => r.status === 404 || r.status === 410)
    .map((r) => ({ state: r.state, name: r.name, url: r.url, status: r.status }));
  const blockedHosts = {};
  for (const r of results) {
    if (![401, 403, 429, 999].includes(r.status)) continue;
    let h; try { h = new URL(r.url).host; } catch { h = 'invalid'; }
    blockedHosts[h] = (blockedHosts[h] || 0) + 1;
  }
  fs.writeFileSync(
    SUMMARY,
    JSON.stringify({ generatedAt, method: 'http+html', total: results.length, byState, captchaFree, deadLinks, blockedHosts }, null, 1),
  );
  console.log(`Wrote ${SUMMARY}`);
  const withForm = results.filter((r) => r.hasForm);
  const reachable = results.filter((r) => r.status >= 200 && r.status < 400);
  console.log(`\nDone.`);
  console.log(`  legislators audited: ${results.length}`);
  console.log(`  reachable:           ${reachable.length}  (unreachable: ${results.length - reachable.length})`);
  console.log(`  with a contact form: ${withForm.length}  (${Math.round((withForm.length / Math.max(reachable.length, 1)) * 100)}% of reachable)`);
  console.log(`    CAPTCHA-free:      ${withForm.filter((r) => !r.captcha).length}`);
  console.log(`    CAPTCHA-gated:     ${withForm.filter((r) => r.captcha).length}`);
  console.log(`Wrote ${OUT}`);
}

run().catch((e) => { console.error(e); process.exit(1); });
