import { describe, it, expect } from 'vitest';
import { chooseLocalOfficials, localBodyKind } from '../local-routing';
import type { Official } from '@/lib/types';

const mk = (name: string, office: string, title: string, level: Official['level'] = 'local'): Official =>
  ({ id: name, name, office, title, level, party: 'Nonpartisan', state: 'NV' }) as Official;

const commissioner = mk('Alexis Hill', 'Washoe County Board of County Commissioners, District 3', 'County Commissioner');
const council = mk('Devon Reese', 'Reno City Council, At-Large', 'Council Member');
const trustee = mk('Beth Smith', 'Washoe County School District Board of Trustees, District A', 'School Board Trustee');
const rep = mk('Mark Amodei', '', 'Representative', 'federal');
const all = [commissioner, council, trustee, rep];

describe('local routing', () => {
  it('classifies bodies from the office label', () => {
    expect(localBodyKind(commissioner)).toBe('county');
    expect(localBodyKind(council)).toBe('city');
    expect(localBodyKind(trustee)).toBe('school_district');
  });
  it('school issues go to the school board only', () => {
    expect(chooseLocalOfficials(all, 'my kids school bus route was cut').map((o) => o.name)).toEqual(['Beth Smith', 'Mark Amodei']);
  });
  it('municipal issues go to the city council when the address is in a city', () => {
    expect(chooseLocalOfficials(all, 'potholes on Golden Valley Rd').map((o) => o.name)).toEqual(['Devon Reese', 'Mark Amodei']);
  });
  it('county matters go to the commission even inside a city', () => {
    expect(chooseLocalOfficials(all, 'the county jail is overcrowded').map((o) => o.name)).toEqual(['Alexis Hill', 'Mark Amodei']);
  });
  it('unincorporated addresses fall back to the commission', () => {
    expect(chooseLocalOfficials([commissioner, trustee, rep], 'trash pickup was missed').map((o) => o.name)).toEqual(['Alexis Hill', 'Mark Amodei']);
  });
});
