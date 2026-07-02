import { describe, it, expect } from 'vitest';
import { toCSV } from '../csv';

// Strip the Excel BOM for easier assertions.
const strip = (s: string) => s.replace(/^﻿/, '');

describe('toCSV()', () => {
  it('joins headers and rows with CRLF', () => {
    const csv = strip(toCSV(['A', 'B'], [['1', '2'], ['3', '4']]));
    expect(csv).toBe('A,B\r\n1,2\r\n3,4');
  });

  it('quotes fields containing commas, quotes, or newlines and doubles quotes', () => {
    const csv = strip(toCSV(['Name', 'Story'], [['Doe, Jane', 'She said "hi"\nthen left']]));
    expect(csv).toBe('Name,Story\r\n"Doe, Jane","She said ""hi""\nthen left"');
  });

  it('renders null/undefined as empty cells', () => {
    const csv = strip(toCSV(['A', 'B', 'C'], [[null, undefined, 'x']]));
    expect(csv).toBe('A,B,C\r\n,,x');
  });

  it('prefixes a UTF-8 BOM', () => {
    expect(toCSV(['A'], [])).toMatch(/^﻿/);
  });
});
