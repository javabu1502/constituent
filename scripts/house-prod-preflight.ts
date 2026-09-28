/**
 * HOUSE PRODUCTION PRE-FLIGHT — POST /v2/validate on cwc.house.gov (validate
 * only; the House doc says it "does NOT save"). Confirms the production API
 * key is active + the prod IP whitelist holds, using a realistic HNV02 payload.
 *
 * Run: npx tsx scripts/house-prod-preflight.ts
 * Needs CWC_HOUSE_API_KEY + QUOTAGUARD_URL in the env file it loads.
 */
import * as path from 'path';
import dotenv from 'dotenv';
dotenv.config({ path: process.env.CWC_ENV_FILE ?? path.resolve(__dirname, '../.env.local') });

import { buildCampaignId } from '../src/lib/cwc/campaign-id';
import { validateHouse, checkEgressIp } from '../src/lib/cwc/client';
import type { CwcDelivery } from '../src/lib/cwc/types';

const delivery: CwcDelivery = {
  chamber: 'house',
  officeCode: 'HNV02',
  campaignId: buildCampaignId({ campaignRef: 'head-start-performance-standards-rule' }),
  constituent: {
    prefix: 'Mr.', firstName: 'Jared', lastName: 'Busker',
    address1: '770 W Golden Valley Rd', city: 'Reno', state: 'NV', zip: '89506',
    email: 'jared@mydemocracy.app',
  },
  message: {
    subject: 'Please urge HHS to rescind the Head Start proposed rule (Docket ACF-2026-0595)',
    topics: ['Families'],
    constituentMessage:
      'I live in Reno and have spent my career in child and family policy. I am writing about the proposed rule HHS published on August 7, "Reducing Federal Burden for Head Start Programs" (Docket ACF-2026-0595). The proposal would rescind more than 1,400 provisions of the Head Start Program Performance Standards, including requirements on classroom group sizes and adult-child ratios, staff background checks, and transportation safety. Please urge the Department of Health and Human Services to rescind the proposed rule and preserve the standards. The comment period closes October 6.',
  },
};

async function run(): Promise<void> {
  console.log('egress IP:', await checkEgressIp());
  const res = await validateHouse(delivery, 'production', false);
  console.log('status:', res.status, 'ok:', res.ok);
  console.log('errors:', JSON.stringify(res.errors));
  console.log('raw:', (res.raw ?? "").slice(0, 600));
  process.exit(res.ok ? 0 : 1);
}
run().catch((e) => { console.error('FAILED:', e); process.exit(2); });
