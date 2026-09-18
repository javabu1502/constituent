/**
 * HOUSE UAT DELIVERY-AGENT PROBE — finds the vendor-name string the House
 * registered for our UAT key. The 2026-09-18 send run got "DeliveryAgent
 * Mismatch" for "My Democracy LLC" (the Senate-registered string), and
 * /v2/validate does not exercise the agent check, so we probe /v2/message in
 * UAT with one clearly-labeled test message per candidate. UAT only.
 *
 * Run: CWC_HOUSE_UAT_CONFIRM=YES npx tsx scripts/house-uat-agent-probe.ts
 */

import * as path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

import { buildCwcXml } from '../src/lib/cwc/xml';
import { buildCampaignId } from '../src/lib/cwc/campaign-id';
import { ProxyAgent, fetch as undiciFetch } from 'undici';
import type { CwcDelivery } from '../src/lib/cwc/types';

if (process.env.CWC_HOUSE_UAT_CONFIRM !== 'YES') {
  console.error('Refusing to run: set CWC_HOUSE_UAT_CONFIRM=YES.');
  process.exit(1);
}
const key = process.env.CWC_HOUSE_UAT_API_KEY;
if (!key) throw new Error('CWC_HOUSE_UAT_API_KEY not set');
if (!process.env.QUOTAGUARD_URL) throw new Error('QUOTAGUARD_URL not set');

process.env.CWC_ACK_EMAIL ||= 'jared@mydemocracy.app';
process.env.CWC_CONTACT_NAME ||= 'Jared Busker';
process.env.CWC_CONTACT_EMAIL ||= 'jared@busker.consulting';
process.env.CWC_CONTACT_PHONE ||= '815-988-4475';

const CANDIDATES = [
  'My Democracy LLC',
  'My Democracy',
  'My Democracy, LLC',
  'MyDemocracy',
  'mydemocracy.app',
];

function delivery(i: number): CwcDelivery {
  return {
    chamber: 'house',
    officeCode: 'HNY01',
    campaignId: buildCampaignId({ campaignRef: 'house-uat-agent-probe' }),
    constituent: {
      prefix: 'Ms.', firstName: 'Agent', lastName: `Probe${i}`,
      address1: '123 Test Harness Way', city: 'Albany', state: 'NY', zip: '12207',
      email: `agent.probe.${i}@example.com`,
    },
    message: {
      subject: 'House CWC UAT vendor-name probe (please disregard)',
      topics: ['Government Operations and Politics'],
      constituentMessage: 'This is a My Democracy UAT probe to confirm our registered delivery-agent string. Please disregard.',
    },
  };
}

async function main() {
  const proxy = new ProxyAgent(process.env.QUOTAGUARD_URL!);
  for (const [i, agent] of CANDIDATES.entries()) {
    process.env.CWC_DELIVERY_AGENT = agent;
    const xml = buildCwcXml(delivery(i));
    const res = await undiciFetch(`https://uat-cwc.house.gov/v2/message?apikey=${encodeURIComponent(key!)}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/xml' },
      body: xml,
      dispatcher: proxy,
    });
    const body = await res.text();
    console.log(`"${agent}" -> HTTP ${res.status} ${body.slice(0, 160)}`);
    if (res.status >= 200 && res.status < 300) {
      console.log(`\nMATCH: the House-registered delivery agent is "${agent}"`);
      break;
    }
    await new Promise((r) => setTimeout(r, 1100));
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
