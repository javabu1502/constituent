import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { Official } from '@/lib/types';

// Mock the geocoder so we can drive each verification branch deterministically.
vi.mock('@/lib/geocode', () => ({ geocodeAddress: vi.fn() }));
import { geocodeAddress } from '@/lib/geocode';
import { verifyConstituent } from '../verify';

const mockGeo = geocodeAddress as unknown as ReturnType<typeof vi.fn>;

const addr = { street: '350 5th Ave', city: 'New York', state: 'NY', zip: '10118' };
const official = (o: Partial<Official>): Official => ({
  id: 'x', name: 'Test', title: 'Rep', level: 'federal', party: 'D', state: 'NY', ...o,
});
const geo = (o: Record<string, unknown>) => ({
  street: '', city: '', state: 'New York', stateCode: 'NY', zip: '10118', congressionalDistrict: '12', ...o,
});

beforeEach(() => mockGeo.mockReset());

describe('verifyConstituent — House', () => {
  it('passes when the address district matches the target', async () => {
    mockGeo.mockResolvedValue(geo({ congressionalDistrict: '12' }));
    const r = await verifyConstituent(addr, official({ chamber: 'house', district: '12' }));
    expect(r).toEqual({ ok: true, officeCode: 'HNY12' });
  });

  it('blocks when the address is in a different district than the target', async () => {
    mockGeo.mockResolvedValue(geo({ congressionalDistrict: '10' }));
    const r = await verifyConstituent(addr, official({ chamber: 'house', district: '12' }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('DISTRICT_MISMATCH');
  });

  it('blocks an unresolved district against a numbered target (no guessing)', async () => {
    mockGeo.mockResolvedValue(geo({ congressionalDistrict: '0' }));
    const r = await verifyConstituent(addr, official({ chamber: 'house', district: '12' }));
    expect(r.ok).toBe(false);
    // '0' in a multi-seat state is an unresolved lookup, not district 00.
    // It used to be turned into a code for an at-large seat the state does
    // not have, which then failed as a mismatch. Now it is refused outright.
    if (!r.ok) expect(r.reason).toBe('UNRESOLVED');
  });

  it('allows a genuine at-large match', async () => {
    mockGeo.mockResolvedValue(geo({ stateCode: 'AK', congressionalDistrict: '0' }));
    const r = await verifyConstituent(addr, official({ chamber: 'house', state: 'AK', district: '0' }));
    expect(r).toEqual({ ok: true, officeCode: 'HAK00' });
  });
});

describe('verifyConstituent — Senate', () => {
  it('passes when the address state matches the senator', async () => {
    mockGeo.mockResolvedValue(geo({ stateCode: 'NY' }));
    const r = await verifyConstituent(addr, official({ chamber: 'senate', title: 'Senator', senateClass: 1 }));
    expect(r).toEqual({ ok: true, officeCode: 'SNY01' });
  });

  it('blocks when the address is in a different state', async () => {
    mockGeo.mockResolvedValue(geo({ stateCode: 'NJ' }));
    const r = await verifyConstituent(addr, official({ chamber: 'senate', senateClass: 1 }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('STATE_MISMATCH');
  });
});

describe('verifyConstituent — refusals', () => {
  it('refuses non-federal officials without geocoding', async () => {
    const r = await verifyConstituent(addr, official({ level: 'state', chamber: 'upper' }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('NOT_FEDERAL');
    expect(mockGeo).not.toHaveBeenCalled();
  });

  it('blocks when the address cannot be geocoded', async () => {
    mockGeo.mockResolvedValue({ error: 'No match', code: 'NO_MATCH' });
    const r = await verifyConstituent(addr, official({ chamber: 'house', district: '12' }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('GEOCODE_FAILED');
  });
});

describe('verifyConstituentForOffice (delivery-shaped, mandatory in production)', () => {
  const delivery = (o: Record<string, unknown> = {}) => ({
    chamber: 'senate',
    officeCode: 'SNY01',
    campaignId: 'c',
    constituent: {
      prefix: 'Ms.', firstName: 'Jane', lastName: 'Doe',
      address1: '350 5th Ave', city: 'New York', state: 'NY', zip: '10118',
      email: 'jane@example.com',
    },
    message: { subject: 'S', topics: ['Health'], constituentMessage: 'Body.' },
    ...o,
  }) as import('../types').CwcDelivery;

  it('senate: passes when the address state matches the seat state', async () => {
    mockGeo.mockResolvedValue(geo({ stateCode: 'NY' }));
    const { verifyConstituentForOffice } = await import('../verify');
    const r = await verifyConstituentForOffice(delivery());
    expect(r).toEqual({ ok: true, officeCode: 'SNY01', verifiedBy: 'geocode' });
  });

  it('senate: refuses when the address geocodes to another state', async () => {
    mockGeo.mockResolvedValue(geo({ stateCode: 'NJ' }));
    const { verifyConstituentForOffice } = await import('../verify');
    const r = await verifyConstituentForOffice(delivery());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('STATE_MISMATCH');
  });

  it('house: refuses a district mismatch between address and target seat', async () => {
    mockGeo.mockResolvedValue(geo({ stateCode: 'NY', congressionalDistrict: '10' }));
    const { verifyConstituentForOffice } = await import('../verify');
    const r = await verifyConstituentForOffice(delivery({ chamber: 'house', officeCode: 'HNY12' }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('DISTRICT_MISMATCH');
  });

  it('house: passes when the geocoded district produces the exact seat', async () => {
    mockGeo.mockResolvedValue(geo({ stateCode: 'NY', congressionalDistrict: '12' }));
    const { verifyConstituentForOffice } = await import('../verify');
    const r = await verifyConstituentForOffice(delivery({ chamber: 'house', officeCode: 'HNY12' }));
    expect(r).toEqual({ ok: true, officeCode: 'HNY12' });
  });

  it('fails closed when geocoding errors on a House seat', async () => {
    mockGeo.mockResolvedValue({ error: 'No match', code: 'NO_MATCH' });
    const { verifyConstituentForOffice } = await import('../verify');
    const r = await verifyConstituentForOffice(delivery({ chamber: 'house', officeCode: 'HNY12' }));
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('GEOCODE_FAILED');
  });

  // A senator represents the whole state, so an unmatchable street (campus
  // roads, rural routes) must not block an in-state constituent.
  it('senate: an unmatchable street falls back to the declared state', async () => {
    mockGeo.mockResolvedValue({ error: 'Address not found', code: 'NO_MATCH' });
    const { verifyConstituentForOffice } = await import('../verify');
    const r = await verifyConstituentForOffice(
      delivery({
        officeCode: 'SVA01',
        constituent: { prefix: 'Mr.', firstName: 'A', lastName: 'B', address1: 'Liberty Mountain Drive', city: 'Lynchburg', state: 'VA', zip: '24502', email: 'a@b.edu' },
      }),
    );
    expect(r).toEqual({ ok: true, officeCode: 'SVA01', verifiedBy: 'declared_state' });
  });

  it('senate: the fallback still refuses a state that does not match the seat', async () => {
    mockGeo.mockResolvedValue({ error: 'Address not found', code: 'NO_MATCH' });
    const { verifyConstituentForOffice } = await import('../verify');
    const r = await verifyConstituentForOffice(
      delivery({
        officeCode: 'SVA01',
        constituent: { prefix: 'Mr.', firstName: 'A', lastName: 'B', address1: 'Nowhere Rd', city: 'Bethesda', state: 'MD', zip: '20814', email: 'a@b.edu' },
      }),
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('STATE_MISMATCH');
  });

  it('senate: a geocoder outage still retries rather than falling back', async () => {
    mockGeo.mockResolvedValue({ error: 'Census is down', code: 'API_ERROR' });
    const { verifyConstituentForOffice } = await import('../verify');
    const r = await verifyConstituentForOffice(delivery({ officeCode: 'SVA01' }));
    expect(r.ok).toBe(false);
    if (!r.ok) { expect(r.reason).toBe('GEOCODE_FAILED'); expect(r.transient).toBe(true); }
  });
});
