import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * The organization gate. This decides who may read an organization's
 * participants, export its messages and stories, and close its campaigns, so
 * it is worth testing the refusals harder than the approvals.
 */

let memberRow: { org_user_id: string; role: string } | null = null;
const upsertCalls: Record<string, unknown>[] = [];
const deleteFilters: Array<[string, string]> = [];
const rpcCalls: Array<[string, Record<string, unknown>]> = [];
let rpcError: { message: string } | null = null;

vi.mock('@/lib/supabase', () => ({
  createAdminClient: () => ({
    from: () => ({
      select: () => ({
        eq: () => ({
          maybeSingle: async () => ({ data: memberRow }),
          // listOrgMembers orders; the shape only has to be awaitable.
          order: async () => ({ data: memberRow ? [{ ...memberRow, member_user_id: 'm1', created_at: 'now' }] : [] }),
        }),
      }),
      upsert: async (row: Record<string, unknown>) => {
        upsertCalls.push(row);
        return { error: null };
      },
      delete: () => ({
        eq: (_c1: string, v1: string) => ({
          eq: async (_c2: string, v2: string) => {
            deleteFilters.push([v1, v2]);
            return { error: null };
          },
        }),
      }),
    }),
    rpc: async (fn: string, args: Record<string, unknown>) => {
      rpcCalls.push([fn, args]);
      return { error: rpcError };
    },
    auth: { admin: { getUserById: async () => ({ data: { user: { email: 'a@b.org' } } }) } },
  }),
}));

const { resolveOrgContext, canActForCampaign, addOrgMember, removeOrgMember, transferOrgOwnership } =
  await import('@/lib/org-context');

beforeEach(() => {
  memberRow = null;
  upsertCalls.length = 0;
  deleteFilters.length = 0;
  rpcCalls.length = 0;
  rpcError = null;
});

describe('resolveOrgContext', () => {
  it('treats someone with no membership row as their own organization', async () => {
    const ctx = await resolveOrgContext('u1');
    expect(ctx).toEqual({ orgUserId: 'u1', role: 'owner', onTeam: false });
  });

  it('returns the organization a member belongs to', async () => {
    memberRow = { org_user_id: 'weca-owner', role: 'member' };
    const ctx = await resolveOrgContext('paula');
    expect(ctx).toEqual({ orgUserId: 'weca-owner', role: 'member', onTeam: true });
  });
});

describe('canActForCampaign', () => {
  it('always admits the author, without needing a membership lookup', async () => {
    memberRow = { org_user_id: 'someone-else', role: 'member' };
    expect(await canActForCampaign('kelly', { creator_id: 'kelly', org_user_id: 'weca' })).toBe(true);
  });

  it('admits a teammate who did not write it', async () => {
    memberRow = { org_user_id: 'weca', role: 'member' };
    expect(await canActForCampaign('paula', { creator_id: 'kelly', org_user_id: 'weca' })).toBe(true);
  });

  it('refuses someone from another organization', async () => {
    memberRow = { org_user_id: 'geears', role: 'member' };
    expect(await canActForCampaign('stranger', { creator_id: 'kelly', org_user_id: 'weca' })).toBe(false);
  });

  it('refuses someone on no team at all', async () => {
    expect(await canActForCampaign('nobody', { creator_id: 'kelly', org_user_id: 'weca' })).toBe(false);
  });

  it('refuses rather than admits when the caller forgot to select org_user_id', async () => {
    // Partial adoption has to fail closed: a route still selecting only
    // creator_id keeps the old behaviour instead of opening up.
    memberRow = { org_user_id: 'weca', role: 'member' };
    expect(await canActForCampaign('paula', { creator_id: 'kelly' })).toBe(false);
  });

  it('refuses a missing campaign', async () => {
    expect(await canActForCampaign('paula', null)).toBe(false);
    expect(await canActForCampaign('paula', {})).toBe(false);
  });
});

describe('membership changes', () => {
  it('refuses to add someone who already belongs to another organization', async () => {
    memberRow = { org_user_id: 'geears', role: 'member' };
    const res = await addOrgMember('weca', 'paula');
    expect(res).toEqual({ ok: false, error: 'That person already belongs to another organization.' });
    expect(upsertCalls).toHaveLength(0);
  });

  it('adds someone who belongs to no organization yet', async () => {
    const res = await addOrgMember('weca', 'paula', 'member', 'kelly');
    expect(res).toEqual({ ok: true });
    expect(upsertCalls[0]).toMatchObject({ org_user_id: 'weca', member_user_id: 'paula', role: 'member', invited_by: 'kelly' });
  });

  it('refuses to remove the owner from their own organization', async () => {
    const res = await removeOrgMember('weca', 'weca');
    expect(res).toEqual({ ok: false, error: 'The owner cannot be removed from their own organization.' });
    expect(deleteFilters).toHaveLength(0);
  });

  it('removes a member', async () => {
    const res = await removeOrgMember('weca', 'paula');
    expect(res).toEqual({ ok: true });
    expect(deleteFilters).toEqual([['weca', 'paula']]);
  });
});

describe('transferOrgOwnership', () => {
  it('hands the organization over in one database call', async () => {
    const res = await transferOrgOwnership('kelly', 'paula');
    expect(res).toEqual({ ok: true });
    // One transaction, not five table writes from here: a half-finished
    // transfer would strand the org between two owners.
    expect(rpcCalls).toEqual([['transfer_org_ownership', { old_owner: 'kelly', new_owner: 'paula' }]]);
  });

  it('surfaces the database refusal rather than reporting success', async () => {
    rpcError = { message: 'transfer_org_ownership: paula is not a member of that organization' };
    const res = await transferOrgOwnership('kelly', 'paula');
    expect(res).toEqual({
      ok: false,
      error: 'transfer_org_ownership: paula is not a member of that organization',
    });
  });
});
