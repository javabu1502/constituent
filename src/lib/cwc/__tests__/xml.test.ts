import { describe, it, expect, beforeEach } from 'vitest';
import { buildCwcXml, CwcValidationError, formatPhone, newDeliveryId } from '../xml';
import { buildCampaignId } from '../campaign-id';
import type { CwcDelivery } from '../types';

// Delivery-agent identity comes from env; set it for the builder.
beforeEach(() => {
  process.env.CWC_DELIVERY_AGENT = 'My Democracy LLC';
  process.env.CWC_ACK_EMAIL = 'ack@mydemocracy.app';
  process.env.CWC_CONTACT_NAME = 'Jared Busker';
  process.env.CWC_CONTACT_EMAIL = 'jared@busker.consulting';
  process.env.CWC_CONTACT_PHONE = '202-555-0142';
});

function validDelivery(overrides: Partial<CwcDelivery> = {}): CwcDelivery {
  return {
    chamber: 'senate',
    officeCode: 'SNY01',
    campaignId: buildCampaignId({ topicKey: 'Health / Insulin pricing', stance: 'pro' }),
    constituent: {
      prefix: 'Ms.',
      firstName: 'Jane',
      lastName: 'Doe',
      address1: '350 5th Ave',
      city: 'New York',
      state: 'NY',
      zip: '10118-0110',
      email: 'jane.doe@example.com',
    },
    message: {
      subject: 'Please support lowering insulin prices',
      topics: ['Health'],
      constituentMessage: 'As a nurse, I see the cost of insulin hurt my patients every week.',
    },
    ...overrides,
  };
}

describe('buildCwcXml', () => {
  it('renders a valid Senate delivery with each tag on its own line', () => {
    const xml = buildCwcXml(validDelivery());
    expect(xml.startsWith('<?xml version="1.0" encoding="UTF-8" ?>\n<CWC>')).toBe(true);
    expect(xml).toContain('<CWCVersion>2.0</CWCVersion>');
    expect(xml).toContain('<MemberOffice>SNY01</MemberOffice>');
    expect(xml).toContain('<DeliveryAgent>My Democracy LLC</DeliveryAgent>');
    // one tag per line: no line carries two closing tags
    for (const line of xml.split('\n')) {
      expect((line.match(/<\/[A-Za-z]/g) || []).length).toBeLessThanOrEqual(1);
    }
  });

  it('generates a 32-char alphanumeric DeliveryId', () => {
    expect(newDeliveryId()).toMatch(/^[a-zA-Z0-9]{32}$/);
    const xml = buildCwcXml(validDelivery());
    const id = xml.match(/<DeliveryId>([^<]+)<\/DeliveryId>/)![1];
    expect(id).toMatch(/^[a-zA-Z0-9]{32}$/);
  });

  it('escapes XML-special characters in text content', () => {
    const xml = buildCwcXml(
      validDelivery({
        message: {
          subject: 'Fund R&D <now>',
          topics: ['Science, Technology, Communications'],
          constituentMessage: 'Support "science" & progress <for all>',
        },
      }),
    );
    expect(xml).toContain('<Subject>Fund R&amp;D &lt;now&gt;</Subject>');
    expect(xml).toContain('&quot;science&quot; &amp; progress &lt;for all&gt;');
  });

  it('rejects a prefix outside the five allowed values', () => {
    // @ts-expect-error deliberately invalid prefix
    const bad = validDelivery({ constituent: { ...validDelivery().constituent, prefix: 'Mx.' } });
    expect(() => buildCwcXml(bad)).toThrow(CwcValidationError);
    try {
      buildCwcXml(bad);
    } catch (e) {
      expect((e as CwcValidationError).problems.join()).toMatch(/prefix/);
    }
  });

  it('rejects a House code used on a Senate delivery and vice versa', () => {
    expect(() => buildCwcXml(validDelivery({ officeCode: 'HNY12' }))).toThrow(/seat code/);
    expect(() => buildCwcXml(validDelivery({ chamber: 'house', officeCode: 'HNY12' }))).not.toThrow();
    expect(() => buildCwcXml(validDelivery({ chamber: 'house', officeCode: 'SNY01' }))).toThrow(/seat code/);
  });

  it('requires at least one of organizationStatement / constituentMessage', () => {
    expect(() =>
      buildCwcXml(validDelivery({ message: { subject: 'A subject line', topics: ['Health'] } })),
    ).toThrow(/organizationStatement and\/or constituentMessage/);
  });

  it('rejects an unknown Library of Congress topic', () => {
    expect(() =>
      // @ts-expect-error invalid topic
      buildCwcXml(validDelivery({ message: { ...validDelivery().message, topics: ['Healthcare'] } })),
    ).toThrow(/not a valid LOC policy area/);
  });

  it('enforces the 6-char minimum subject length', () => {
    expect(() =>
      buildCwcXml(validDelivery({ message: { ...validDelivery().message, subject: 'Hi' } })),
    ).toThrow(/subject must be/);
  });

  it('emits schema-exact bill type abbreviations and pro/con', () => {
    const xml = buildCwcXml(
      validDelivery({
        message: {
          subject: 'Support this bill',
          topics: ['Health'],
          bills: [{ congress: 118, type: 'hr', number: 233 }],
          stance: 'pro',
          constituentMessage: 'I support this measure for my community.',
        },
      }),
    );
    expect(xml).toContain('<BillTypeAbbreviation>H.R.</BillTypeAbbreviation>');
    expect(xml).toContain('<BillCongress>118</BillCongress>');
    expect(xml).toContain('<ProOrCon>Pro</ProOrCon>');
  });

  it('emits H.Con.Res WITHOUT a trailing period (the Senate RNG branch has none)', () => {
    const xml = buildCwcXml(
      validDelivery({
        message: {
          subject: 'Regarding this resolution',
          topics: ['Government Operations and Politics'],
          bills: [{ congress: 119, type: 'hconres', number: 12 }],
          constituentMessage: 'I want to weigh in on this concurrent resolution.',
        },
      }),
    );
    expect(xml).toContain('<BillTypeAbbreviation>H.Con.Res</BillTypeAbbreviation>');
    expect(xml).not.toContain('H.Con.Res.'); // the trailing-dot form is rejected by the RNG
  });

  it('orders OrganizationStatement before ConstituentMessage when both present', () => {
    const xml = buildCwcXml(
      validDelivery({
        message: {
          subject: 'Support this bill',
          topics: ['Health'],
          organizationStatement: 'Our coalition urges support for affordable insulin.',
          constituentMessage: 'My family is directly affected by insulin costs.',
        },
      }),
    );
    expect(xml.indexOf('<OrganizationStatement>')).toBeLessThan(xml.indexOf('<ConstituentMessage>'));
  });

  it('collects multiple problems into one error', () => {
    try {
      buildCwcXml(
        validDelivery({
          officeCode: 'ZZ99',
          constituent: { ...validDelivery().constituent, state: 'ZZ', zip: 'abcde', email: 'nope' },
        }),
      );
      throw new Error('should have thrown');
    } catch (e) {
      const problems = (e as CwcValidationError).problems;
      expect(problems.length).toBeGreaterThanOrEqual(4);
    }
  });
});

describe('formatPhone', () => {
  it('normalizes to XXX-XXX-XXXX and strips a leading country code', () => {
    expect(formatPhone('(202) 555-0142')).toBe('202-555-0142');
    expect(formatPhone('1-202-555-0142')).toBe('202-555-0142');
    expect(formatPhone('555-0142')).toBeNull();
  });
});

describe('buildCampaignId', () => {
  it('is stable for the same inputs and differs by stance and subtopic', () => {
    const a = buildCampaignId({ topicKey: 'Health / Insulin', stance: 'pro' });
    const b = buildCampaignId({ topicKey: 'Health / Insulin', stance: 'pro' });
    const con = buildCampaignId({ topicKey: 'Health / Insulin', stance: 'con' });
    const other = buildCampaignId({ topicKey: 'Health / Vaccines', stance: 'pro' });
    expect(a).toBe(b);
    expect(a).not.toBe(con);
    expect(a).not.toBe(other);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });
});
