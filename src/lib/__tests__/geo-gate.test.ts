import { describe, it, expect } from 'vitest';
import { isUsRequest, isGatedPath, requestCountry } from '../geo-gate';

const req = (country?: string) =>
  new Request('https://www.mydemocracy.app/api/track-send', {
    headers: country ? { 'x-vercel-ip-country': country } : {},
  });

describe('geo gate', () => {
  it('allows the United States', () => {
    expect(isUsRequest(req('US'))).toBe(true);
  });

  it('blocks the hosting region the traffic came from', () => {
    expect(isUsRequest(req('SG'))).toBe(false);
    expect(isUsRequest(req('CN'))).toBe(false);
    expect(isUsRequest(req('BR'))).toBe(false);
  });

  // People in the territories are constituents with a delegate in the House.
  // A gate that reads "US only" and locks out Puerto Rico is a bug.
  it('allows the US territories', () => {
    for (const code of ['PR', 'VI', 'GU', 'AS', 'MP']) {
      expect(isUsRequest(req(code)), code).toBe(true);
    }
  });

  // The header is set by Vercel's edge. Its absence means local dev or a
  // test, not a foreign visitor, and the contact flow must still work there.
  it('fails open when there is no country header', () => {
    expect(isUsRequest(req())).toBe(true);
    expect(requestCountry(req())).toBeNull();
  });

  it('reads the header regardless of case or padding', () => {
    expect(isUsRequest(req(' us '))).toBe(true);
    expect(requestCountry(req('sg'))).toBe('SG');
  });

  it('gates the paths that spend money or send', () => {
    expect(isGatedPath('/api/track-send')).toBe(true);
    expect(isGatedPath('/api/representatives')).toBe(true);
    expect(isGatedPath('/api/generate-message')).toBe(true);
    expect(isGatedPath('/api/chat/stream')).toBe(true);
  });

  // Reading stays open from anywhere, including the pages a crawler walks.
  it('leaves reading alone', () => {
    expect(isGatedPath('/')).toBe(false);
    expect(isGatedPath('/contact')).toBe(false);
    expect(isGatedPath('/legislators/georgia')).toBe(false);
    expect(isGatedPath('/api/legislators/activity')).toBe(false);
    expect(isGatedPath('/api/cwc/offices')).toBe(false);
  });

  // A prefix match must not catch a route that merely starts with the same
  // letters.
  it('does not gate a route that only shares a prefix', () => {
    expect(isGatedPath('/api/representatives-guide')).toBe(false);
    expect(isGatedPath('/api/chatter')).toBe(false);
  });
});
