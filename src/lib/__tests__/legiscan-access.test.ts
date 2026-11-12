import { describe, it, expect, vi, beforeEach } from 'vitest';

const getUser = vi.fn();
const single = vi.fn();

vi.mock('../supabase/server', () => ({
  createClient: async () => ({ auth: { getUser } }),
}));
vi.mock('../supabase', () => ({
  createAdminClient: () => ({
    from: () => ({ select: () => ({ eq: () => ({ single }) }) }),
  }),
}));

import { callerIsOrganization } from '../legiscan-access';

beforeEach(() => {
  getUser.mockReset();
  single.mockReset();
});

describe('who may spend the LegiScan allowance', () => {
  it('lets an organization account through', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    single.mockResolvedValue({ data: { account_type: 'organization' } });
    expect(await callerIsOrganization()).toBe(true);
  });

  // The crawl that emptied the allowance was signed in as nobody. This is
  // the case the gate exists for.
  it('refuses an anonymous caller', async () => {
    getUser.mockResolvedValue({ data: { user: null } });
    expect(await callerIsOrganization()).toBe(false);
    expect(single).not.toHaveBeenCalled();
  });

  it('refuses a signed-in constituent', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u2' } } });
    single.mockResolvedValue({ data: { account_type: 'constituent' } });
    expect(await callerIsOrganization()).toBe(false);
  });

  it('refuses an account with no type on record', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u3' } } });
    single.mockResolvedValue({ data: null });
    expect(await callerIsOrganization()).toBe(false);
  });

  // Fails closed, unlike the monthly budget guard. The fallback is Open
  // States, which works, so an auth outage costs completeness and not
  // function.
  it('refuses when auth throws', async () => {
    getUser.mockRejectedValue(new Error('no request context'));
    expect(await callerIsOrganization()).toBe(false);
  });

  it('refuses when the profile lookup throws', async () => {
    getUser.mockResolvedValue({ data: { user: { id: 'u4' } } });
    single.mockRejectedValue(new Error('supabase unreachable'));
    expect(await callerIsOrganization()).toBe(false);
  });
});
