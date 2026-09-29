/**
 * DOM-based CAPTCHA audit of U.S. Senate contact forms. No AI/API key needed —
 * inspects each form's DOM for reCAPTCHA / hCaptcha / Turnstile / generic
 * CAPTCHA markers, and records the TYPE (token-based modern CAPTCHAs can't be
 * screenshot-and-relayed; simple ones can). Answers: of senators with a public
 * contact form, how many are CAPTCHA-gated and of what kind.
 *
 * Run: npx tsx scripts/audit-senate-captcha.ts
 */
import * as fs from 'fs';
import * as path from 'path';
import { parse } from 'yaml';
import { chromium } from 'playwright';

const OUT = path.join(process.cwd(), 'src', 'data', 'senate-captcha-audit.json');

function senators(): Array<{ bioguideId: string; name: string; url: string }> {
  const file = path.join(process.cwd(), 'src', 'data', 'legislators', 'federal', 'legislators-current.yaml');
  const legs = parse(fs.readFileSync(file, 'utf-8')) as Array<{
    id: { bioguide: string };
    name: { official_full?: string; first: string; last: string };
    terms: Array<{ type?: string; contact_form?: string }>;
  }>;
  const out: Array<{ bioguideId: string; name: string; url: string }> = [];
  for (const l of legs) {
    const cur = l.terms?.[l.terms.length - 1];
    if (cur?.type === 'sen' && cur.contact_form) {
      out.push({ bioguideId: l.id.bioguide, name: l.name.official_full || `${l.name.first} ${l.name.last}`, url: cur.contact_form });
    }
  }
  return out;
}

type Finding = { name: string; url: string; hasCaptcha: boolean; type: string; relayable: boolean | null; error?: string };

async function run() {
  const reps = senators();
  console.log(`Auditing ${reps.length} senators with contact forms...\n`);
  const browser = await chromium.launch({ headless: true });
  const findings: Finding[] = [];

  for (let i = 0; i < reps.length; i++) {
    const r = reps[i];
    const page = await browser.newPage({ userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' });
    try {
      await page.goto(r.url, { waitUntil: 'domcontentloaded', timeout: 25000 });
      await page.waitForTimeout(1500); // let CAPTCHA widgets inject
      // Pass as a STRING (not a function) so tsx/esbuild doesn't inject its
      // __name helper into the browser-evaluated code.
      const type = (await page.evaluate(`(function(){
        var html = document.documentElement.outerHTML.toLowerCase();
        function has(s){ return html.indexOf(s) !== -1; }
        if (has('challenges.cloudflare.com') || document.querySelector('.cf-turnstile')) return 'turnstile';
        if (has('hcaptcha.com') || document.querySelector('.h-captcha')) return 'hcaptcha';
        if (has('recaptcha') || document.querySelector('.g-recaptcha') || window.grecaptcha) return 'recaptcha';
        if (document.querySelector('img[src*="captcha" i], input[name*="captcha" i], [id*="captcha" i], [class*="captcha" i]')) return 'image-or-custom';
        return 'none';
      })()`)) as string;
      const hasCaptcha = type !== 'none';
      // Modern token CAPTCHAs (recaptcha/hcaptcha/turnstile) are origin-bound —
      // can't be screenshot-and-relayed. Simple image/custom ones can.
      const relayable = !hasCaptcha ? null : type === 'image-or-custom';
      findings.push({ name: r.name, url: r.url, hasCaptcha, type, relayable });
      console.log(`[${i + 1}/${reps.length}] ${hasCaptcha ? '⚠ ' + type : '✓ none'}  ${r.name}`);
    } catch (e) {
      findings.push({ name: r.name, url: r.url, hasCaptcha: false, type: 'error', relayable: null, error: (e as Error).message.slice(0, 80) });
      console.log(`[${i + 1}/${reps.length}] ✗ error  ${r.name}`);
    } finally {
      await page.close();
    }
  }
  await browser.close();

  const withCaptcha = findings.filter((f) => f.hasCaptcha);
  const byType: Record<string, number> = {};
  for (const f of withCaptcha) byType[f.type] = (byType[f.type] || 0) + 1;
  const errors = findings.filter((f) => f.type === 'error').length;
  const summary = {
    totalWithForm: reps.length,
    captchaFree: findings.filter((f) => !f.hasCaptcha && f.type !== 'error').length,
    withCaptcha: withCaptcha.length,
    modernTokenCaptcha: withCaptcha.filter((f) => !f.relayable).length,
    relayableCaptcha: withCaptcha.filter((f) => f.relayable).length,
    errors,
    byType,
  };
  fs.writeFileSync(OUT, JSON.stringify({ summary, findings }, null, 2));
  console.log('\n=== SENATE CAPTCHA AUDIT ===');
  console.log(JSON.stringify(summary, null, 2));
  console.log(`\nSaved: ${OUT}`);
}
run().catch((e) => { console.error(e); process.exit(1); });
