/**
 * HOUSE UAT PROBES — answers the two open questions from the 2026-08-31
 * compliance verification, using ONLY endpoints that never save or deliver:
 *
 *  1. GET /v2/offices — does the House list American Samoa as AQ00 or AS00
 *     (we emit HAQ00 per the doc's prose note; the member roster says AS00)?
 *  2. POST /v2/validate — which BillTypeAbbreviation casing does the House
 *     validator accept? Our builder emits the Senate-RNG form ("H.Con.Res",
 *     Title-case, no trailing dot); the House doc's own samples are lowercase
 *     ("hconres"/"hr") and its standards tab shows "H.Con.Res." (with dot).
 *
 * Validate "checks the request and returns errors; it does NOT save" (House
 * API doc). Probes are paced ~1/sec, far under the ceiling.
 *
 * Run: npx tsx scripts/house-uat-probe.ts   (needs CWC_HOUSE_UAT_API_KEY +
 * QUOTAGUARD_URL in ../.env.local)
 */
import * as path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { ProxyAgent, fetch as undiciFetch } from 'undici';
import { buildCwcXml } from '../src/lib/cwc/xml';
import { buildCampaignId } from '../src/lib/cwc/campaign-id';
import { getActiveOffices, validateHouse } from '../src/lib/cwc/client';
import type { CwcDelivery } from '../src/lib/cwc/types';

process.env.CWC_DELIVERY_AGENT ||= 'My Democracy LLC';
process.env.CWC_ACK_EMAIL ||= 'ack@mydemocracy.app';
process.env.CWC_CONTACT_NAME ||= 'Jared Busker';
process.env.CWC_CONTACT_EMAIL ||= 'jared@busker.consulting';
process.env.CWC_CONTACT_PHONE ||= '815-988-4475';

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function baseDelivery(officeCode: string): CwcDelivery {
  return {
    chamber: 'house',
    officeCode,
    campaignId: buildCampaignId({ campaignRef: 'house-uat-validation-probe' }),
    constituent: {
      prefix: 'Ms.', firstName: 'Uat', lastName: 'Probe',
      address1: '123 Test Harness Way', city: 'Albany', state: 'NY', zip: '12207',
      email: 'uat.probe@example.com',
    },
    message: {
      subject: 'CWC UAT validation probe (please disregard)',
      topics: ['Government Operations and Politics'],
      constituentMessage: 'This is a My Democracy schema-validation probe against the House UAT validate endpoint. Please disregard.',
    },
  };
}

/** POST hand-modified XML to /v2/validate (bypasses the builder on purpose —
 *  that's the point of a casing probe). Same proxy + key as the client. */
async function rawValidate(xml: string): Promise<{ status: number; body: string }> {
  const key = process.env.CWC_HOUSE_UAT_API_KEY;
  if (!key) throw new Error('CWC_HOUSE_UAT_API_KEY not set');
  const proxy = process.env.QUOTAGUARD_URL ? new ProxyAgent(process.env.QUOTAGUARD_URL) : undefined;
  const res = await undiciFetch(`https://uat-cwc.house.gov/v2/validate?apikey=${encodeURIComponent(key)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/xml' },
    body: xml,
    dispatcher: proxy,
  });
  return { status: res.status, body: (await res.text()).slice(0, 500) };
}

async function run(): Promise<void> {
  // --- Probe 1: active offices + American Samoa code ---
  console.log('=== GET /v2/offices (UAT) ===');
  const data = await getActiveOffices('uat');
  const raw = JSON.stringify(data);
  const codes = raw.match(/H?[A-Z]{2}\d{2}/g) ?? [];
  console.log(`offices payload: ${raw.length} chars, ${codes.length} code-shaped tokens`);
  for (const needle of ['AQ00', 'AS00', 'HAQ00', 'HAS00']) {
    console.log(`  contains "${needle}": ${raw.includes(needle)}`);
  }
  const samoa = raw.match(/.{0,80}(AQ00|AS00).{0,80}/g);
  if (samoa) samoa.slice(0, 3).forEach((s) => console.log(`  context: …${s}…`));

  // Pick a real office from the list for the validate probes; fall back HNY12.
  const office = codes.find((c) => c.startsWith('HNY') || c.startsWith('NY')) ?? codes[0] ?? 'HNY12';
  const officeCode = office.startsWith('H') ? office : `H${office}`;
  console.log(`\nusing office ${officeCode} for validate probes`);

  // --- Probe 2a: baseline no-bill validate through the real client path ---
  console.log('\n=== POST /v2/validate — baseline (no bill, builder output) ===');
  await sleep(1000);
  const base = await validateHouse(baseDelivery(officeCode), 'uat');
  console.log(`  status=${base.status} ok=${base.ok} errors=${JSON.stringify(base.errors ?? null)}`);
  if (base.raw) console.log(`  raw: ${base.raw.slice(0, 300)}`);

  // --- Probe 2b: bill-type casing variants ---
  const withBill: CwcDelivery = {
    ...baseDelivery(officeCode),
    message: {
      ...baseDelivery(officeCode).message,
      subject: 'CWC UAT bill-type probe (please disregard)',
      bills: [{ congress: 119, type: 'hconres', number: 45 }],
      stance: 'pro',
    },
  };
  const builderXml = buildCwcXml(withBill);
  const ourForm = /<BillTypeAbbreviation>([^<]+)<\/BillTypeAbbreviation>/.exec(builderXml)?.[1];
  console.log(`\n=== bill-type casing probes (builder emits "${ourForm}") ===`);
  const variants = ['H.Con.Res', 'H.Con.Res.', 'hconres', 'hr', 'H.R.'];
  for (const v of variants) {
    await sleep(1000);
    const xml = builderXml.replace(
      /<BillTypeAbbreviation>[^<]+<\/BillTypeAbbreviation>/,
      `<BillTypeAbbreviation>${v}</BillTypeAbbreviation>`,
    );
    // "hr"/"H.R." pair with a plausible bill number; keep 45 — validate only.
    try {
      const r = await rawValidate(xml);
      console.log(`  "${v}": HTTP ${r.status} ${r.body.includes('<Error') ? '— ' + r.body.replace(/\s+/g, ' ').slice(0, 160) : r.status < 300 ? '— ACCEPTED' : '— ' + r.body.replace(/\s+/g, ' ').slice(0, 160)}`);
    } catch (e) {
      console.log(`  "${v}": request failed — ${(e as Error).message}`);
    }
  }

  console.log('\nDone. Nothing was saved or delivered (validate-only endpoints).');
}

run().catch((e) => {
  console.error('probe failed:', e);
  process.exit(1);
});
