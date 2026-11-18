import { describe, it, expect, afterEach, vi } from 'vitest';
import { isAdmin, isCronRequest } from '../admin-auth';

afterEach(() => vi.unstubAllEnvs());

describe('isAdmin', () => {
  it('refuses everyone when the environment names nobody', () => {
    expect(isAdmin({ id: 'u1', email: 'a@b.com' })).toBe(false);
  });

  it('matches on user id', () => {
    vi.stubEnv('ADMIN_USER_IDS', 'u1, u2');
    expect(isAdmin({ id: 'u2' })).toBe(true);
    expect(isAdmin({ id: 'u3' })).toBe(false);
  });

  it('matches on email, ignoring case and spacing', () => {
    vi.stubEnv('ADMIN_EMAILS', ' Jared@MyDemocracy.app ');
    expect(isAdmin({ id: 'x', email: 'jared@mydemocracy.app' })).toBe(true);
    expect(isAdmin({ id: 'x', email: 'someone@else.com' })).toBe(false);
  });

  it('does not treat a missing email as a match', () => {
    vi.stubEnv('ADMIN_EMAILS', 'jared@mydemocracy.app');
    expect(isAdmin({ id: 'x' })).toBe(false);
  });
});

describe('isCronRequest', () => {
  it('fails closed when CRON_SECRET is unset', () => {
    expect(isCronRequest('Bearer anything')).toBe(false);
  });

  it('accepts the right bearer and refuses everything else', () => {
    vi.stubEnv('CRON_SECRET', 's3cret');
    expect(isCronRequest('Bearer s3cret')).toBe(true);
    expect(isCronRequest('Bearer wrong')).toBe(false);
    expect(isCronRequest('s3cret')).toBe(false);
    expect(isCronRequest(null)).toBe(false);
    expect(isCronRequest('')).toBe(false);
  });

  it('refuses a prefix of the secret rather than throwing on the length', () => {
    vi.stubEnv('CRON_SECRET', 's3cret');
    expect(isCronRequest('Bearer s3cr')).toBe(false);
  });
});
