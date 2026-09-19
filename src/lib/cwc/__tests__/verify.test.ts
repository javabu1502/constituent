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
    if (!r.ok) expect(r.reason).toBe('DISTRICT_MISMATCH');
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
    expect(r).toEqual({ ok: true, officeCode: 'SNY01' });
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

  it('fails closed when geocoding errors', async () => {
    mockGeo.mockResolvedValue({ error: 'No match', code: 'NO_MATCH' });
    const { verifyConstituentForOffice } = await import('../verify');
    const r = await verifyConstituentForOffice(delivery());
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe('GEOCODE_FAILED');
  });
});
