/**
 * HOUSE UAT SEND — House UAT environment ONLY.
 *
 * Malcolm (House CWC, 2026-09-18): "you need to send a few messages to the
 * UAT instance." This posts a small, clearly-labeled set of test messages to
 * uat-cwc.house.gov POST /v2/message through sendCwcDelivery, the SAME gated
 * path production uses (compliance gate, maintenance window, idempotent
 * DeliveryId, rate permit, delivery log). UAT messages stay in the CAO
 * sandbox and never reach real offices.
 *
 * Shape mirrors the SCWC acceptance run: three campaigns (bill+Pro, the same
 * bill+Con as a SEPARATE campaign, and a no-bill topic campaign) to a small
 * office set that exercises the cases we probed: a standard district, an
 * at-large seat, and the American Samoa delegate (HAQ00, whose code differs
 * from the state's address abbreviation). Bill type goes out lowercase per
 * the 2026-09-18 /v2/validate probe.
 *
 * SAFETY — refuses to run unless BOTH hold:
 *   CWC_HOUSE_UAT_CONFIRM=YES
 *   CWC_HOUSE_UAT_ENV=test
 * and environment is HARDCODED to 'test' (mode 'uat'); no production path.
 *
 * Usage:
 *   CWC_HOUSE_UAT_CONFIRM=YES CWC_HOUSE_UAT_ENV=test npx tsx scripts/house-uat-send.ts
 */

import * as path from 'path';
import dotenv from 'dotenv';
import { buildCampaignId } from '../src/lib/cwc/campaign-id';
import { assertCwcSendable } from '../src/lib/cwc/content';
import { sendCwcDelivery } from '../src/lib/cwc/send';
import type { CwcDelivery, CwcMessageContent } from '../src/lib/cwc/types';
import { ALLOWED_PREFIXES } from '../src/lib/cwc/constants';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const ENVIRONMENT = 'test' as const; // mode 'uat' → uat-cwc.house.gov, never production

if (process.env.CWC_HOUSE_UAT_CONFIRM !== 'YES') {
  console.error('Refusing to run: set CWC_HOUSE_UAT_CONFIRM=YES to confirm a UAT send.');
  process.exit(1);
}
if (process.env.CWC_HOUSE_UAT_ENV !== 'test') {
  console.error('Refusing to run: set CWC_HOUSE_UAT_ENV=test (this script only targets House UAT).');
  process.exit(1);
}
if (!process.env.CWC_HOUSE_UAT_API_KEY) {
  console.error('Refusing to run: CWC_HOUSE_UAT_API_KEY is not set.');
  process.exit(1);
}
if (!process.env.QUOTAGUARD_URL) {
  console.error('Refusing to run: QUOTAGUARD_URL is not set (sends must egress from the whitelisted IPs).');
  process.exit(1);
}

process.env.CWC_DELIVERY_AGENT ||= 'My Democracy LLC';
process.env.CWC_ACK_EMAIL ||= 'jared@mydemocracy.app';
process.env.CWC_CONTACT_NAME ||= 'Jared Busker';
process.env.CWC_CONTACT_EMAIL ||= 'jared@busker.consulting';
process.env.CWC_CONTACT_PHONE ||= '815-988-4475';

// Offices confirmed present in the UAT GET /v2/offices payload (probe
// 2026-09-18): standard districts, an at-large seat, and the AS delegate.
const OFFICES = ['HNY01', 'HAZ01', 'HAK00', 'HAQ00'] as const;

// The office code embeds the House's state token; the constituent address
// uses the postal abbreviation (they differ for American Samoa: AQ vs AS).
const OFFICE_LOCALE: Record<(typeof OFFICES)[number], { state: string; city: string; zip: string }> = {
  HNY01: { state: 'NY', city: 'Albany', zip: '12207' },
  HAZ01: { state: 'AZ', city: 'Phoenix', zip: '85007' },
  HAK00: { state: 'AK', city: 'Juneau', zip: '99801' },
  HAQ00: { state: 'AS', city: 'Pago Pago', zip: '96799' },
};

const UAT_BILL = { congress: 119, type: 'hr' as const, number: 22 };

interface UatCampaign {
  slug: string;
  campaignId: string;
  message: CwcMessageContent;
}

const CAMPAIGNS: UatCampaign[] = [
  {
    slug: 'bill-pro',
    campaignId: buildCampaignId({ campaignRef: 'house-uat-hr22', bill: UAT_BILL, stance: 'pro' }),
    message: {
      subject: 'House CWC UAT test: support for H.R. 22 (please disregard)',
      topics: ['Government Operations and Politics'],
      bills: [UAT_BILL],
      stance: 'pro',
      constituentMessage:
        'This is a My Democracy UAT test message in the House testing environment, expressing SUPPORT for H.R. 22. Please disregard.',
    },
  },
  {
    slug: 'bill-con',
    campaignId: buildCampaignId({ campaignRef: 'house-uat-hr22', bill: UAT_BILL, stance: 'con' }),
    message: {
      subject: 'House CWC UAT test: opposition to H.R. 22 (please disregard)',
      topics: ['Government Operations and Politics'],
      bills: [UAT_BILL],
      stance: 'con',
      constituentMessage:
        'This is a My Democracy UAT test message in the House testing environment, expressing OPPOSITION to H.R. 22. Please disregard.',
    },
  },
  {
    slug: 'no-bill',
    campaignId: buildCampaignId({ campaignRef: 'house-uat-connectivity' }),
    message: {
      subject: 'House CWC UAT test: general connectivity (please disregard)',
      topics: ['Health'],
      constituentMessage:
        'This is a My Democracy UAT test message in the House testing environment with no bill reference. Please disregard.',
    },
  },
];

function testConstituent(officeCode: (typeof OFFICES)[number], i: number): CwcDelivery['constituent'] {
  const loc = OFFICE_LOCALE[officeCode];
  return {
    prefix: ALLOWED_PREFIXES[i % ALLOWED_PREFIXES.length],
    firstName: 'House',
    lastName: `UatTest${i}`,
    address1: '123 Test Harness Way',
    city: loc.city,
    state: loc.state,
    zip: loc.zip,
    email: `house.uat.${i}@example.com`,
  };
}

async function run(): Promise<void> {
  console.log(`House UAT send: ${CAMPAIGNS.length} campaigns x ${OFFICES.length} offices (environment: ${ENVIRONMENT})`);

  const summary: Array<Record<string, string | number>> = [];

  for (const campaign of CAMPAIGNS) {
    const billLevel = campaign.message.bills ? ('federal' as const) : ('none' as const);
    assertCwcSendable({ message: campaign.message, billLevel });

    const counts = { delivered: 0, rejected: 0, deferred: 0, error: 0 };

    for (const [i, officeCode] of OFFICES.entries()) {
      const delivery: CwcDelivery = {
        chamber: 'house',
        officeCode,
        campaignId: campaign.campaignId,
        constituent: testConstituent(officeCode, i),
        message: campaign.message,
      };
      const messageKey = `house-uat:${campaign.slug}:${officeCode}`;
      try {
        const outcome = await sendCwcDelivery(delivery, {
          messageKey,
          environment: ENVIRONMENT,
          billLevel,
        });
        if (outcome.sent && outcome.result.status === 409 && !outcome.retried) {
          counts.error++;
          console.error(`  409 ON FRESH DeliveryId for ${officeCode}: collision/mint bug, investigate`);
        } else if (outcome.sent && (outcome.result.ok || outcome.result.status === 409)) {
          counts.delivered++;
        } else if (!outcome.sent && outcome.fallback === 'retry-later') {
          counts.deferred++;
          console.warn(`  DEFERRED ${officeCode}: ${outcome.reason}`);
        } else if (outcome.sent) {
          counts.rejected++;
          console.error(`  REJECTED ${officeCode}: HTTP ${outcome.result.status} ${JSON.stringify(outcome.result.errors ?? outcome.result.raw ?? '').slice(0, 300)}`);
        } else {
          counts.error++;
          console.error(`  UNEXPECTED fallback for ${officeCode}: ${outcome.fallback}: ${outcome.reason}`);
        }
      } catch (e) {
        counts.error++;
        console.error(`  ERROR ${officeCode}: ${(e as Error).message}`);
      }
    }

    summary.push({ campaign: campaign.slug, campaignId: `${campaign.campaignId.slice(0, 12)}…`, ...counts });
    console.log(`  ${campaign.slug}: delivered=${counts.delivered} rejected=${counts.rejected} deferred=${counts.deferred} error=${counts.error}`);
  }

  console.log('\nHouse UAT send summary:');
  console.table(summary);
  console.log('Next: review cwc_deliveries for non-2xx rows, then tell Malcolm the messages are in UAT.');
}

run().catch((e) => {
  console.error('House UAT send failed:', e);
  process.exit(1);
});
