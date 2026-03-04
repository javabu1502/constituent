import { describe, it, expect } from 'vitest';
import { formatPhone, isValidEmail, isValidZip, truncate, titleCase } from '../utils';

describe('formatPhone', () => {
  it('formats a 10-digit number', () => {
    expect(formatPhone('2025551234')).toBe('(202) 555-1234');
  });

  it('formats an 11-digit number with leading 1', () => {
    expect(formatPhone('12025551234')).toBe('(202) 555-1234');
  });

  it('formats a number with non-digit characters', () => {
    expect(formatPhone('(202) 555-1234')).toBe('(202) 555-1234');
  });

  it('returns the original string for invalid length', () => {
    expect(formatPhone('12345')).toBe('12345');
  });

  it('returns the original string for empty input', () => {
    expect(formatPhone('')).toBe('');
  });
});

describe('isValidEmail', () => {
  it('accepts a valid email', () => {
    expect(isValidEmail('user@example.com')).toBe(true);
  });

  it('accepts email with subdomain', () => {
    expect(isValidEmail('user@mail.example.com')).toBe(true);
  });

  it('rejects missing @', () => {
    expect(isValidEmail('userexample.com')).toBe(false);
  });

  it('rejects missing domain', () => {
    expect(isValidEmail('user@')).toBe(false);
  });

  it('rejects empty string', () => {
    expect(isValidEmail('')).toBe(false);
  });
});

describe('isValidZip', () => {
  it('accepts 5-digit zip', () => {
    expect(isValidZip('90210')).toBe(true);
  });

  it('accepts 5+4 format', () => {
    expect(isValidZip('90210-1234')).toBe(true);
  });

  it('rejects too few digits', () => {
    expect(isValidZip('9021')).toBe(false);
  });

  it('rejects letters', () => {
    expect(isValidZip('ABCDE')).toBe(false);
  });

  it('rejects partial +4', () => {
    expect(isValidZip('90210-12')).toBe(false);
  });
});

describe('truncate', () => {
  it('returns short text unchanged', () => {
    expect(truncate('hi', 10)).toBe('hi');
  });

  it('returns text at exact length unchanged', () => {
    expect(truncate('hello', 5)).toBe('hello');
  });

  it('truncates long text with ellipsis', () => {
    expect(truncate('hello world', 8)).toBe('hello...');
  });
});

describe('titleCase', () => {
  it('capitalizes multi-word string', () => {
    expect(titleCase('hello world')).toBe('Hello World');
  });

  it('handles single word', () => {
    expect(titleCase('hello')).toBe('Hello');
  });

  it('lowercases ALL CAPS input first', () => {
    expect(titleCase('HELLO WORLD')).toBe('Hello World');
  });
});
