import { describe, it, expect } from 'vitest';
import { CENSUS_VINTAGE_BY_CONGRESS } from '../geocode';
import { CURRENT_CONGRESS } from '../bills';

/**
 * The district map and the member roster must come from the same Congress.
 *
 * Census moved its "Current" vintage on to the 120th Congress map during
 * 2026, while the 119th was still seated. Because the code took whichever
 * CDnnn field happened to be present, it began naming the representative of
 * a district the sender will not live in until 2027. In the states that
 * redrew mid-decade that is a different person, sometimes of a different
 * party: a Dallas address resolved to the 33rd district rather than the 30th,
 * Austin to the 10th rather than the 37th.
 *
 * These tests are the tripwire. When CURRENT_CONGRESS moves, the vintage map
 * has to gain the matching entry or this fails.
 */
describe('census vintage is pinned to the seated Congress', () => {
  it('has a vintage for the Congress we seat', () => {
    expect(CENSUS_VINTAGE_BY_CONGRESS[CURRENT_CONGRESS]).toBeTruthy();
  });

  it('does not use the moving "Current" vintage for the 119th', () => {
    // Current_Current pointed at the 120th map while the 119th sat.
    expect(CENSUS_VINTAGE_BY_CONGRESS[119]).toBe('ACS2024_Current');
    expect(CENSUS_VINTAGE_BY_CONGRESS[119]).not.toBe('Current_Current');
  });

  it('knows the next Congress too, so the bump is a one-line change', () => {
    expect(CENSUS_VINTAGE_BY_CONGRESS[CURRENT_CONGRESS + 1]).toBeTruthy();
  });
});
