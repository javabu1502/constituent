import { describe, it, expect } from 'vitest';
import * as fs from 'fs';
import * as path from 'path';
import { LOCAL_ROSTER_STATES, hasLocalRosters } from '../local-coverage';

/**
 * The list is a literal rather than derived, because the create form imports
 * it and the roster files are 183KB that would otherwise be shipped to a
 * browser to learn one two-letter code. This is the guard that keeps the
 * literal honest.
 */
describe('states with local rosters', () => {
  it('matches the roster files actually in src/data/local', () => {
    const dir = path.join(process.cwd(), 'src', 'data', 'local');
    const onDisk = fs
      .readdirSync(dir)
      .filter((f) => f.endsWith('.json'))
      .map((f) => {
        const parsed = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf-8')) as { state?: string };
        return parsed.state;
      })
      .filter((s): s is string => !!s)
      .sort();

    expect([...LOCAL_ROSTER_STATES].sort()).toEqual(onDisk);
  });

  it('says yes for a state we hold', () => {
    expect(hasLocalRosters('NV')).toBe(true);
    expect(hasLocalRosters('nv')).toBe(true);
    expect(hasLocalRosters(' nv ')).toBe(true);
  });

  // An organization in Georgia picking "local" would reach a flow with
  // nobody to write to.
  it('says no for a state we do not', () => {
    expect(hasLocalRosters('GA')).toBe(false);
    expect(hasLocalRosters('')).toBe(false);
    expect(hasLocalRosters(null)).toBe(false);
    expect(hasLocalRosters(undefined)).toBe(false);
  });
});
