/**
 * SCWC ACCEPTANCE HARNESS — Senate TEST environment ONLY.
 *
 * Implements the SOAPBox acceptance requirement: POST multiple distinct test
 * campaigns exercising ALL 100 Senate test office codes. In the SCWC test
 * environment every one of the 100 Member offices accepts (messages stay in
 * the SAA sandbox); the codes are the 100 static Senate seat codes, exported
 * from code as SENATE_TEST_OFFICE_CODES (offices.ts) — the docs folder is
 * never read. After a run, email saacwc@saa.senate.gov that campaigns are in
 * the testing environment.
 *
 * Campaigns (per George: one campaign per specific issue; bill ⇒ stance; pro
 * and con are SEPARATE campaigns):
 *   1. federal bill + Pro
 *   2. the SAME bill + Con (distinct campaign id — stance is in the key)
 *   3. no-bill topic campaign
 * Each campaign goes to all 100 codes through sendCwcDelivery — the SAME
 * gated path production uses (compliance gate, maintenance-window deferral,
 * idempotent DeliveryId, cross-instance rate permit at the POST choke point,
 * outcome + raw response logged). Re-running after a partial failure retries
 * with the SAME ids (409 = the prior attempt landed) instead of duplicating.
 * The ONLY departures from the production path, both inherent to the SCWC
 * test env: skipActiveOfficeCheck (all 100 test offices accept; the list
 * does not indicate participation) and constituent verification off
 * (fixture constituents are not real people).
 *
 * SAFETY — the script refuses to run unless BOTH hold:
 *   CWC_ACCEPTANCE_CONFIRM=YES
 *   CWC_ACCEPTANCE_ENV=test
 * and it is HARDCODED to the test endpoint (mode 'uat', environment 'test');
 * there is no code path to production here.
 *
 * Usage (do not run until Lee approves + the hard no-send gate is lifted):
 *   CWC_ACCEPTANCE_CONFIRM=YES CWC_ACCEPTANCE_ENV=test npx tsx scripts/cwc-acceptance-run.ts
 */

import * as path from 'path';
import dotenv from 'dotenv';
import { buildCampaignId } from '../src/lib/cwc/campaign-id';
import { assertCwcSendable } from '../src/lib/cwc/content';
import { SENATE_TEST_OFFICE_CODES } from '../src/lib/cwc/offices';
import { sendCwcDelivery } from '../src/lib/cwc/send';
import type { CwcDelivery, CwcMessageContent } from '../src/lib/cwc/types';
import { ALLOWED_PREFIXES } from '../src/lib/cwc/constants';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

// ---- SAFETY GATES (both required; environment is hardcoded to test) ----
const ENVIRONMENT = 'test' as const; // never production — prod acceptance does not exist
// environment 'test' → sendCwcDelivery uses the SCWC TESTING endpoint (mode 'uat')

if (process.env.CWC_ACCEPTANCE_CONFIRM !== 'YES') {
  console.error('Refusing to run: set CWC_ACCEPTANCE_CONFIRM=YES to confirm a test-environment acceptance run.');
  process.exit(1);
}
if (process.env.CWC_ACCEPTANCE_ENV !== 'test') {
  console.error("Refusing to run: set CWC_ACCEPTANCE_ENV=test (this harness only ever targets the SCWC test environment).");
  process.exit(1);
}
if (!process.env.SCWC_TEST_API_KEY) {
  console.error('Refusing to run: SCWC_TEST_API_KEY is not set.');
  process.exit(1);
}

// Delivery-agent identity (same values the builder validates).
process.env.CWC_DELIVERY_AGENT ||= 'My Democracy LLC';
process.env.CWC_ACK_EMAIL ||= 'ack@mydemocracy.app';
process.env.CWC_CONTACT_NAME ||= 'Jared Busker';
process.env.CWC_CONTACT_EMAIL ||= 'jared@busker.consulting';
process.env.CWC_CONTACT_PHONE ||= '815-988-4475';

// ---- The three acceptance campaigns (≥3 distinct topics/stances) ----
const ACCEPTANCE_BILL = { congress: 119, type: 's' as const, number: 2296 };

interface AcceptanceCampaign {
  slug: string;
  campaignId: string;
  message: CwcMessageContent;
}

const CAMPAIGNS: AcceptanceCampaign[] = [
  {
    slug: 'bill-pro',
    campaignId: buildCampaignId({ campaignRef: 'scwc-acceptance-insulin', bill: ACCEPTANCE_BILL, stance: 'pro' }),
    message: {
      subject: 'SCWC acceptance test — support for S. 2296 (please disregard)',
      topics: ['Health'],
      bills: [ACCEPTANCE_BILL],
      stance: 'pro',
      constituentMessage:
        'This is a My Democracy SCWC acceptance-test message in the testing environment, expressing SUPPORT for S. 2296. Please disregard.',
    },
  },
  {
    slug: 'bill-con',
    campaignId: buildCampaignId({ campaignRef: 'scwc-acceptance-insulin', bill: ACCEPTANCE_BILL, stance: 'con' }),
    message: {
      subject: 'SCWC acceptance test — opposition to S. 2296 (please disregard)',
      topics: ['Health'],
      bills: [ACCEPTANCE_BILL],
      stance: 'con',
      constituentMessage:
        'This is a My Democracy SCWC acceptance-test message in the testing environment, expressing OPPOSITION to S. 2296. Please disregard.',
    },
  },
  {
    slug: 'no-bill',
    campaignId: buildCampaignId({ campaignRef: 'scwc-acceptance-connectivity' }),
    message: {
      subject: 'SCWC acceptance test — general connectivity (please disregard)',
      topics: ['Government Operations and Politics'],
      constituentMessage:
        'This is a My Democracy SCWC acceptance-test message in the testing environment with no bill reference. Please disregard.',
    },
  },
];

/** A clearly-fake test constituent whose state matches the office code. */
function testConstituent(officeCode: string, i: number): CwcDelivery['constituent'] {
  return {
    prefix: ALLOWED_PREFIXES[i % ALLOWED_PREFIXES.length],
    firstName: 'Scwc',
    lastName: `Acceptance${i}`,
    address1: '123 Test Harness Way',
    city: 'Testville',
    state: officeCode.slice(1, 3), // seat code embeds the state
    zip: '12345',
    email: `scwc.acceptance.${i}@example.com`,
  };
}

function buildDeliveries(campaign: AcceptanceCampaign): CwcDelivery[] {
  return SENATE_TEST_OFFICE_CODES.map((officeCode, i) => ({
    chamber: 'senate' as const,
    officeCode,
    campaignId: campaign.campaignId,
    constituent: testConstituent(officeCode, i),
    message: campaign.message,
  }));
}

async function run(): Promise<void> {
  console.log(`SCWC acceptance run: ${CAMPAIGNS.length} campaigns × ${SENATE_TEST_OFFICE_CODES.length} test offices (environment: ${ENVIRONMENT})`);

  const summary: Array<Record<string, string | number>> = [];

  for (const campaign of CAMPAIGNS) {
    // billLevel is EXPLICIT either way — the gate fails closed on unknown.
    const billLevel = campaign.message.bills ? ('federal' as const) : ('none' as const);
    // Compliance gate up front — a gate failure should stop the whole run.
    assertCwcSendable({ message: campaign.message, billLevel });

    const deliveries = buildDeliveries(campaign);
    const counts = { delivered: 0, rejected: 0, deferred: 0, error: 0 };

    // Every send goes through sendCwcDelivery — the production path. Pacing
    // comes from the shared rate-permit allocator at the POST choke point;
    // maintenance windows surface as retry-later outcomes; each send logs to
    // cwc_deliveries with an idempotent DeliveryId (reused on re-run).
    for (const d of deliveries) {
      const messageKey = `scwc-acceptance:${campaign.slug}:${d.officeCode}`;
      try {
        const outcome = await sendCwcDelivery(d, {
          messageKey,
          environment: ENVIRONMENT,
          billLevel,
          skipActiveOfficeCheck: true, // SCWC test env: all 100 offices accept
        });
        if (outcome.sent && (outcome.result.ok || outcome.result.status === 409)) counts.delivered++;
        else if (!outcome.sent && outcome.fallback === 'retry-later') {
          counts.deferred++;
          console.warn(`  DEFERRED ${d.officeCode}: ${outcome.reason}`);
        } else if (outcome.sent) counts.rejected++;
        else {
          counts.error++;
          console.error(`  UNEXPECTED fallback for ${d.officeCode}: ${outcome.fallback} — ${outcome.reason}`);
        }
      } catch (e) {
        counts.error++;
        console.error(`  ERROR ${d.officeCode}: ${(e as Error).message}`);
      }
    }

    summary.push({
      campaign: campaign.slug,
      campaignId: `${campaign.campaignId.slice(0, 12)}…`,
      offices: deliveries.length,
      delivered: counts.delivered,
      rejected: counts.rejected,
      deferred: counts.deferred,
      error: counts.error,
    });
    console.log(`  ${campaign.slug}: delivered=${counts.delivered} rejected=${counts.rejected} deferred=${counts.deferred} error=${counts.error}`);
  }

  console.log('\nAcceptance run summary:');
  console.table(summary);
  console.log('Next: review cwc_deliveries for any 400/500-class rows, then email saacwc@saa.senate.gov that the campaigns are in the testing environment.');
}

run().catch((e) => {
  console.error('Acceptance run failed:', e);
  process.exit(1);
});
