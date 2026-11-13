import { describe, it, expect } from 'vitest';
import {
  substitute, formatPhoneParens, chooseOption, parseDefinition,
  loadDefinition, definedMembers, isAutomatable, entryUrl, type FormValues,
} from '../contact-congress';

const values: FormValues = {
  namePrefix: 'Ms.', nameFirst: 'Jane', nameLast: 'Doe', email: 'jane@example.com',
  phone: '7755550100', addressStreet: '1 Main St', addressStreet2: 'Apt 4',
  addressCity: 'Reno', addressState: 'NV', addressStateFull: 'Nevada',
  addressZip5: '89506', subject: 'Child care', message: 'Please act.',
};

describe('filling a recipe with one constituent', () => {
  it('substitutes what a form asks for', () => {
    expect(substitute('$NAME_FIRST $NAME_LAST, $ADDRESS_CITY $ADDRESS_STATE', values)).toBe('Jane Doe, Reno NV');
  });

  // $ADDRESS_STREET is a prefix of $ADDRESS_STREET_2, so a naive pass leaves
  // a stray "_2" in a congressional office's address field.
  it('does not let a short variable eat a longer one', () => {
    expect(substitute('$ADDRESS_STREET_2', values)).toBe('Apt 4');
    expect(substitute('$ADDRESS_STREET', values)).toBe('1 Main St');
  });

  // A letter signed "$NAME_FIRST" is worse than one signed with a blank.
  it('resolves an unknown variable to nothing, never to its own name', () => {
    expect(substitute('x $NOT_A_FIELD y', values)).toBe('x  y');
  });

  it('formats a phone the way some forms insist on', () => {
    expect(formatPhoneParens('7755550100')).toBe('(775) 555-0100');
    expect(formatPhoneParens('775-555-0100')).toBe('(775) 555-0100');
    expect(formatPhoneParens('12345')).toBe('12345');
  });
});

/**
 * A dropdown accepts only what it lists, and every office writes its own
 * topic taxonomy. Passing our category straight through failed the whole form
 * on Cortez Masto's page, caught by the dry run before any real send.
 */
describe('choosing from a dropdown that only accepts its own list', () => {
  const topics = ['Agriculture', 'Budget', 'Children', 'Health', 'Housing', 'Other'];

  it('takes an exact match whatever the case', () => {
    expect(chooseOption('health', topics)).toBe('Health');
  });

  it('takes a containment match either way round', () => {
    expect(chooseOption('Child care', topics)).toBe('Children');
    expect(chooseOption('Housing and land use', topics)).toBe('Housing');
  });

  it('falls back to a catch-all before guessing', () => {
    expect(chooseOption('Foreign policy', topics)).toBe('Other');
  });

  it('falls back to the first option when there is no catch-all', () => {
    expect(chooseOption('Foreign policy', ['Agriculture', 'Budget'])).toBe('Agriculture');
  });

  it('returns null only when the form lists nothing', () => {
    expect(chooseOption('anything', [])).toBeNull();
    expect(chooseOption('anything', undefined)).toBeNull();
  });
});

describe('reading a definition', () => {
  it('rejects one with no steps rather than treating it as empty work', () => {
    expect(parseDefinition('bioguide: X000001', 'X000001')).toBeNull();
    expect(parseDefinition('not: valid: yaml: [', 'X000001')).toBeNull();
  });

  it('marks a definition that needs a person', () => {
    const def = parseDefinition(
      'contact_form:\n  steps:\n    - visit: "https://example.gov"\n    - recaptcha: true\n',
      'X000001',
    )!;
    expect(def.needsCaptcha).toBe(true);
    expect(isAutomatable(def)).toBe(false);
  });

  it('reads a select permitted values, not its wait', () => {
    const def = parseDefinition(
      'contact_form:\n  steps:\n    - select:\n      - selector: "#t"\n        value: $TOPIC\n        options: ["Health", "Other"]\n',
      'X000001',
    )!;
    expect(def.steps[0].fields[0].allowedOptions).toEqual(['Health', 'Other']);
  });
});

describe('the vendored snapshot', () => {
  const ids = definedMembers();

  it('covers every senator not on CWC', () => {
    expect(ids.length).toBe(47);
  });

  it('parses every one, with a success matcher on each', () => {
    for (const id of ids) {
      const def = loadDefinition(id);
      expect(def, id).not.toBeNull();
      expect(def!.steps.length, id).toBeGreaterThan(0);
      // Without this a run reports success whenever nothing threw, which is
      // exactly how a stale recipe looks.
      expect(def!.success.contains || def!.success.status, id).toBeTruthy();
      expect(entryUrl(def!), id).toMatch(/^https?:\/\//);
    }
  });

  it('holds the office this started from', () => {
    const cortezMasto = loadDefinition('C001113')!;
    expect(isAutomatable(cortezMasto)).toBe(true);
    expect(entryUrl(cortezMasto)).toContain('cortezmasto.senate.gov');
  });
});
