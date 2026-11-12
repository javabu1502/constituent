import { describe, it, expect } from 'vitest';
import { isAnonymous } from '../cache-audience';

const req = (cookie?: string) =>
  new Request('https://www.mydemocracy.app/api/legislators/activity', {
    headers: cookie ? { cookie } : {},
  });

describe('who may share a cache entry', () => {
  // The crawl this cache exists to absorb carries no cookie.
  it('treats a request with no cookie as anonymous', () => {
    expect(isAnonymous(req())).toBe(true);
    expect(isAnonymous(req(''))).toBe(true);
  });

  it('treats unrelated cookies as anonymous', () => {
    expect(isAnonymous(req('theme=dark; _ga=GA1.2.3'))).toBe(true);
  });

  it('spots a session cookie wherever it sits', () => {
    expect(isAnonymous(req('sb-mydemocracy-auth-token=abc'))).toBe(false);
    expect(isAnonymous(req('theme=dark; sb-mydemocracy-auth-token=abc'))).toBe(false);
  });

  // @supabase/ssr splits a large session across .0, .1 and so on.
  it('spots a chunked session cookie', () => {
    expect(isAnonymous(req('sb-mydemocracy-auth-token.0=abc; sb-mydemocracy-auth-token.1=def'))).toBe(false);
  });

  // The ref is matched loosely, so a different Supabase URL still works.
  it('does not depend on the project ref', () => {
    expect(isAnonymous(req('sb-ldrpgurvxkwkxrbszwld-auth-token=abc'))).toBe(false);
  });

  it('is not fooled by a lookalike name', () => {
    expect(isAnonymous(req('notsb-x-auth-token=abc'))).toBe(true);
  });
});
