import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fetchDistrictDemographics, STATE_FIPS } from '../census-api';

describe('STATE_FIPS', () => {
  it('has all 50 states plus DC', () => {
    expect(Object.keys(STATE_FIPS).length).toBe(51);
    expect(STATE_FIPS['CA']).toBe('06');
    expect(STATE_FIPS['NY']).toBe('36');
    expect(STATE_FIPS['TX']).toBe('48');
    expect(STATE_FIPS['DC']).toBe('11');
  });
});

describe('fetchDistrictDemographics()', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  const MOCK_HEADERS = [
    'B01003_001E', 'B19013_001E', 'B01002_001E',
    'B15003_022E', 'B15003_023E', 'B15003_024E', 'B15003_025E', 'B15003_001E',
    'B17001_001E', 'B17001_002E',
    'state', 'congressional district',
  ];

  const MOCK_VALUES = [
    '750000', '65000', '38.5',
    '100000', '50000', '20000', '10000', '500000',
    '700000', '84000',
    '06', '12',
  ];

  it('fetches and computes demographics correctly', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([MOCK_HEADERS, MOCK_VALUES]),
    }));

    const result = await fetchDistrictDemographics('CA', '12');

    expect(result).not.toBeNull();
    expect(result!.totalPopulation).toBe(750000);
    expect(result!.medianIncome).toBe(65000);
    expect(result!.medianAge).toBe(38.5);
    // (100000+50000+20000+10000)/500000 = 36%
    expect(result!.bachelorsPlusPercent).toBe(36);
    // 84000/700000 = 12%
    expect(result!.povertyRate).toBe(12);
    expect(result!.state).toBe('CA');
    expect(result!.district).toBe('12');
    expect(result!.source).toContain('Census Bureau');
  });

  it('returns null for invalid state', async () => {
    const result = await fetchDistrictDemographics('XX', '01');
    expect(result).toBeNull();
  });

  it('returns null when API returns non-ok response', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 404,
    }));

    const result = await fetchDistrictDemographics('CA', '12');
    expect(result).toBeNull();
  });

  it('returns null when fetch throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('Network error')));

    const result = await fetchDistrictDemographics('CA', '12');
    expect(result).toBeNull();
  });

  it('pads single-digit districts', async () => {
    const mockFetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([MOCK_HEADERS, MOCK_VALUES]),
    });
    vi.stubGlobal('fetch', mockFetch);

    await fetchDistrictDemographics('CA', '5');

    expect(mockFetch).toHaveBeenCalledWith(
      expect.stringContaining('congressional+district:05')
    );
  });
});
