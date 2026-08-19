/**
 * Build representative Senate CWC deliveries with our builder and write them to
 * /tmp so xmllint can validate them against the authoritative Senate RelaxNG.
 * Import the builder directly (relative) to avoid the '@/' alias chain.
 */
import * as fs from 'fs';
import { buildCwcXml } from '../src/lib/cwc/xml';
import { buildCampaignId } from '../src/lib/cwc/campaign-id';
import type { CwcDelivery } from '../src/lib/cwc/types';

process.env.CWC_DELIVERY_AGENT ||= 'My Democracy LLC';
process.env.CWC_ACK_EMAIL ||= 'ack@mydemocracy.app';
process.env.CWC_CONTACT_NAME ||= 'Jared Busker';
process.env.CWC_CONTACT_EMAIL ||= 'jared@busker.consulting';
process.env.CWC_CONTACT_PHONE ||= '815-988-4475';

const base = {
  chamber: 'senate' as const,
  officeCode: 'SNY01',
  campaignId: buildCampaignId({ topicKey: 'Health / Insulin', stance: 'pro' }),
  constituent: {
    prefix: 'Ms.' as const, firstName: 'Jane', lastName: 'Doe',
    address1: '350 5th Ave', city: 'New York', state: 'NY', zip: '10118-0110', email: 'jane.doe@example.com',
  },
};

const samples: Record<string, CwcDelivery> = {
  'minimal': {
    ...base,
    message: { subject: 'Please support this', topics: ['Health'], constituentMessage: 'This matters to my family.' },
  },
  'full-with-hconres-bill': {
    ...base,
    constituent: { ...base.constituent, middleName: 'A.', suffix: 'Jr.', title: 'Nurse', address2: 'Apt 4', phone: '212-555-0142', addressValidated: true, emailValidated: true },
    organization: { name: 'Example Coalition', contactName: 'Org Rep', contactEmail: 'rep@example.org', contactPhone: '202-555-0100', about: 'A coalition.' },
    message: {
      subject: 'Regarding this concurrent resolution',
      topics: ['Health', 'Government Operations and Politics'],
      bills: [{ congress: 119, type: 'hconres', number: 12 }, { congress: 119, type: 's', number: 233 }],
      stance: 'pro',
      organizationStatement: 'Our coalition urges support.',
      constituentMessage: 'As a nurse, I see this every day.',
      moreInfoUrl: 'https://example.org/issue',
      responseRequested: true,
      newsletterOptIn: false,
    },
  },
  'org-statement-only': {
    ...base,
    message: { subject: 'Support the measure', topics: ['Health'], organizationStatement: 'We urge you to support this measure for our members.' },
  },
};

for (const [name, d] of Object.entries(samples)) {
  fs.writeFileSync(`/tmp/cwc-${name}.xml`, buildCwcXml(d));
  console.log(`wrote /tmp/cwc-${name}.xml`);
}
