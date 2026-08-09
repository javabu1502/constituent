import { describe, it, expect } from 'vitest';
import { chooseDeliveryChannel, routeDelivery } from '../delivery-router';
import type { Official } from '@/lib/types';

const senator = (o: Partial<Official> = {}): Official => ({
  id: 'b1', name: 'Test Senator', title: 'Senator', level: 'federal', chamber: 'senate',
  party: 'D', state: 'NY', senateClass: 1, ...o,
});

const active = (codes: string[]) => ({ activeOfficeCodes: new Set(codes) });

describe('chooseDeliveryChannel', () => {
  it('routes to CWC when the office participates', () => {
    const d = chooseDeliveryChannel(senator(), active(['SNY01']));
    expect(d).toMatchObject({ channel: 'cwc', officeCode: 'SNY01' });
  });

  it('routes a non-participating office with a clean webform to automation', () => {
    const d = chooseDeliveryChannel(
      senator({ contactForm: 'https://senator.senate.gov/contact' }),
      active([]), // not on CWC
    );
    expect(d).toMatchObject({ channel: 'webform', formUrl: 'https://senator.senate.gov/contact' });
  });

  it('falls back to email when the webform is CAPTCHA-blocked', () => {
    const s = senator({ id: 'b9', contactForm: 'https://x.senate.gov/contact', email: 'staff@senate.gov' });
    const d = chooseDeliveryChannel(s, { activeOfficeCodes: new Set(), captchaBlockedIds: new Set(['b9']) });
    expect(d).toMatchObject({ channel: 'email', email: 'staff@senate.gov' });
    expect(d.reason).toMatch(/CAPTCHA/);
  });

  it('falls back to email when there is no form', () => {
    const d = chooseDeliveryChannel(senator({ email: 'staff@senate.gov' }), active([]));
    expect(d.channel).toBe('email');
  });

  it('uses phone only when nothing else exists', () => {
    const d = chooseDeliveryChannel(senator({ phone: '202-555-0100' }), active([]));
    expect(d.channel).toBe('phone');
  });

  it('reports none when unreachable', () => {
    expect(chooseDeliveryChannel(senator(), active([])).channel).toBe('none');
  });
});

describe('routeDelivery summary', () => {
  it('counts coverage across channels — the CWC vs the other ~46 split', () => {
    const officials = [
      senator({ id: 'a', state: 'NY', senateClass: 1 }), // SNY01 participating
      senator({ id: 'b', state: 'NY', senateClass: 3, contactForm: 'https://s.senate.gov/c' }), // SNY03 not participating → webform
      senator({ id: 'c', state: 'CA', senateClass: 1, email: 'staff@senate.gov' }), // SCA01 not participating, no form → email
    ];
    const { summary } = routeDelivery(officials, active(['SNY01']));
    expect(summary.cwc).toBe(1);
    expect(summary.webform).toBe(1);
    expect(summary.email).toBe(1);
    expect(summary.none).toBe(0);
  });
});
