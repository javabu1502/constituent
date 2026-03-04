import { describe, it, expect } from 'vitest';
import { stripTags, extractJSON, cleanText } from '../claude';

describe('stripTags', () => {
  it('removes self-closing tags', () => {
    expect(stripTags('hello <br/> world')).toBe('hello  world');
  });

  it('removes <thinking> blocks', () => {
    expect(stripTags('before <thinking>secret</thinking> after')).toBe('before  after');
  });

  it('removes <search> blocks', () => {
    expect(stripTags('a <search>query</search> b')).toBe('a  b');
  });

  it('removes <result> blocks', () => {
    expect(stripTags('a <result>data</result> b')).toBe('a  b');
  });

  it('removes <source> blocks', () => {
    expect(stripTags('a <source>ref</source> b')).toBe('a  b');
  });

  it('removes <sources> blocks', () => {
    expect(stripTags('a <sources>refs</sources> b')).toBe('a  b');
  });

  it('removes generic tags', () => {
    expect(stripTags('<foo>bar</foo>')).toBe('bar');
  });

  it('handles mixed content', () => {
    const input = '<thinking>hmm</thinking>Hello <br/> world<search>q</search>';
    expect(stripTags(input)).toBe('Hello  world');
  });

  it('returns clean text unchanged', () => {
    expect(stripTags('no tags here')).toBe('no tags here');
  });

  it('trims whitespace', () => {
    expect(stripTags('  hello  ')).toBe('hello');
  });
});

describe('extractJSON', () => {
  it('parses plain JSON object', () => {
    expect(extractJSON('{"a":1}')).toEqual({ a: 1 });
  });

  it('parses plain JSON array', () => {
    expect(extractJSON('[1,2,3]')).toEqual([1, 2, 3]);
  });

  it('parses markdown-wrapped JSON', () => {
    expect(extractJSON('```json\n{"a":1}\n```')).toEqual({ a: 1 });
  });

  it('parses JSON with leading text', () => {
    expect(extractJSON('Here is the result: {"b":2}')).toEqual({ b: 2 });
  });

  it('parses nested objects', () => {
    const input = '{"a":{"b":{"c":3}}}';
    expect(extractJSON(input)).toEqual({ a: { b: { c: 3 } } });
  });

  it('recovers incomplete JSON by matching braces', () => {
    // JSON followed by trailing text
    const input = '{"a":1} some extra text';
    expect(extractJSON(input)).toEqual({ a: 1 });
  });

  it('returns null for non-JSON', () => {
    expect(extractJSON('just some text')).toBeNull();
  });

  it('returns null for empty string', () => {
    expect(extractJSON('')).toBeNull();
  });

  it('handles JSON with string values containing braces', () => {
    const input = '{"msg":"use {name} here"}';
    expect(extractJSON(input)).toEqual({ msg: 'use {name} here' });
  });

  it('prefers array when it comes first', () => {
    const input = 'text [1,2] {"a":1}';
    expect(extractJSON(input)).toEqual([1, 2]);
  });
});

describe('cleanText', () => {
  it('normalizes escaped newlines', () => {
    expect(cleanText('hello\\nworld')).toBe('hello\nworld');
  });

  it('collapses excessive newlines', () => {
    expect(cleanText('a\n\n\n\nb')).toBe('a\n\nb');
  });

  it('trims whitespace', () => {
    expect(cleanText('  hello  ')).toBe('hello');
  });

  it('handles combined issues', () => {
    expect(cleanText('  a\\n\\n\\n\\nb  ')).toBe('a\n\nb');
  });
});
