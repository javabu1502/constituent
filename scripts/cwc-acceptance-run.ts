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

// Capital city + a real zip for each state, so SCWC admins reading the test
// messages see internally consistent constituents (a WY address with zip
// 12345 reads sloppy during human evaluation; schema-valid isn't the bar).
const STATE_CITY_ZIP: Record<string, { city: string; zip: string }> = {
  AL: { city: 'Montgomery', zip: '36104' }, AK: { city: 'Juneau', zip: '99801' },
  AZ: { city: 'Phoenix', zip: '85007' }, AR: { city: 'Little Rock', zip: '72201' },
  CA: { city: 'Sacramento', zip: '95814' }, CO: { city: 'Denver', zip: '80203' },
  CT: { city: 'Hartford', zip: '06106' }, DE: { city: 'Dover', zip: '19901' },
  FL: { city: 'Tallahassee', zip: '32301' }, GA: { city: 'Atlanta', zip: '30334' },
  HI: { city: 'Honolulu', zip: '96813' }, ID: { city: 'Boise', zip: '83702' },
  IL: { city: 'Springfield', zip: '62701' }, IN: { city: 'Indianapolis', zip: '46204' },
  IA: { city: 'Des Moines', zip: '50319' }, KS: { city: 'Topeka', zip: '66612' },
  KY: { city: 'Frankfort', zip: '40601' }, LA: { city: 'Baton Rouge', zip: '70802' },
  ME: { city: 'Augusta', zip: '04330' }, MD: { city: 'Annapolis', zip: '21401' },
  MA: { city: 'Boston', zip: '02133' }, MI: { city: 'Lansing', zip: '48933' },
  MN: { city: 'Saint Paul', zip: '55155' }, MS: { city: 'Jackson', zip: '39201' },
  MO: { city: 'Jefferson City', zip: '65101' }, MT: { city: 'Helena', zip: '59601' },
  NE: { city: 'Lincoln', zip: '68508' }, NV: { city: 'Carson City', zip: '89701' },
  NH: { city: 'Concord', zip: '03301' }, NJ: { city: 'Trenton', zip: '08608' },
  NM: { city: 'Santa Fe', zip: '87501' }, NY: { city: 'Albany', zip: '12207' },
  NC: { city: 'Raleigh', zip: '27601' }, ND: { city: 'Bismarck', zip: '58501' },
  OH: { city: 'Columbus', zip: '43215' }, OK: { city: 'Oklahoma City', zip: '73102' },
  OR: { city: 'Salem', zip: '97301' }, PA: { city: 'Harrisburg', zip: '17101' },
  RI: { city: 'Providence', zip: '02903' }, SC: { city: 'Columbia', zip: '29201' },
  SD: { city: 'Pierre', zip: '57501' }, TN: { city: 'Nashville', zip: '37219' },
  TX: { city: 'Austin', zip: '78701' }, UT: { city: 'Salt Lake City', zip: '84111' },
  VT: { city: 'Montpelier', zip: '05602' }, VA: { city: 'Richmond', zip: '23219' },
  WA: { city: 'Olympia', zip: '98501' }, WV: { city: 'Charleston', zip: '25301' },
  WI: { city: 'Madison', zip: '53703' }, WY: { city: 'Cheyenne', zip: '82001' },
};

/** A clearly-labeled test constituent whose city/state/zip are consistent. */
function testConstituent(officeCode: string, i: number): CwcDelivery['constituent'] {
  const state = officeCode.slice(1, 3); // seat code embeds the state
  const loc = STATE_CITY_ZIP[state];
  if (!loc) throw new Error(`no city/zip fixture for state ${state} (office ${officeCode})`);
  return {
    prefix: ALLOWED_PREFIXES[i % ALLOWED_PREFIXES.length],
    firstName: 'Scwc',
    lastName: `Acceptance${i}`,
    address1: '123 Test Harness Way',
    city: loc.city,
    state,
    zip: loc.zip,
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
        if (outcome.sent && outcome.result.status === 409 && !outcome.retried) {
          // 409 means duplicate DeliveryId. On a RETRY that's success (the
          // prior attempt landed) — but on a fresh id it means a collision or
          // a mint bug, which acceptance must not paper over.
          counts.error++;
          console.error(`  409 ON FRESH DeliveryId for ${d.officeCode} — collision/mint bug, investigate before continuing`);
        } else if (outcome.sent && (outcome.result.ok || outcome.result.status === 409)) counts.delivered++;
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
