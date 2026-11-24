import { createAdminClient } from '@/lib/supabase';

/**
 * Which organization a person is acting for, and whether they may act on a
 * given campaign.
 *
 * This exists for the same reason src/lib/admin-auth.ts does. The ownership
 * test was `campaign.creator_id !== user.id`, written out in roughly
 * twenty-five routes. All of them were correct for a world where an
 * organization was one person. None of them can be made right for a team by
 * editing twenty-five copies and hoping the twenty-sixth, written later from
 * memory, remembers.
 *
 * The organization's identity is its owning profile's user_id. That is what
 * profiles.org_slug, org_supporters.org_user_id and org_target_lists.user_id
 * already key to, so nothing had to move for teams to exist.
 */

export type OrgRole = 'owner' | 'admin' | 'member';

export interface OrgContext {
  /** The organization this person acts for. Their own id when they are not on a team. */
  orgUserId: string;
  role: OrgRole;
  /** True when a membership row exists, as opposed to standing alone. */
  onTeam: boolean;
}

/**
 * Resolve the organization a user acts for.
 *
 * Every organization is seeded as the sole 'owner' member of itself, so the
 * common path is one indexed read. A person with no row is their own
 * organization, which is exactly how every account behaved before teams and
 * is what keeps constituent accounts working unchanged.
 */
export async function resolveOrgContext(userId: string): Promise<OrgContext> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('org_members')
    .select('org_user_id, role')
    .eq('member_user_id', userId)
    .maybeSingle();

  if (!data) return { orgUserId: userId, role: 'owner', onTeam: false };
  return {
    orgUserId: data.org_user_id as string,
    role: (data.role as OrgRole) ?? 'member',
    onTeam: true,
  };
}

/**
 * May this person act on this campaign?
 *
 * The author always may, which answers without a query in the ordinary case
 * and keeps a campaign reachable by whoever made it.
 *
 * Otherwise the campaign's organization has to match theirs. A caller that
 * has not selected org_user_id falls back to creator_id, which is the old
 * behaviour: a teammate is refused rather than wrongly admitted. Partial
 * adoption is therefore safe, never permissive.
 */
export async function canActForCampaign(
  userId: string,
  campaign: { creator_id?: string | null; org_user_id?: string | null } | null | undefined
): Promise<boolean> {
  if (!campaign) return false;
  if (campaign.creator_id && campaign.creator_id === userId) return true;

  const owner = campaign.org_user_id ?? campaign.creator_id ?? null;
  if (!owner) return false;

  const ctx = await resolveOrgContext(userId);
  return ctx.orgUserId === owner;
}

export interface OrgMember {
  memberUserId: string;
  role: OrgRole;
  email: string | null;
  createdAt: string;
}

/** Everyone who may act for an organization, owner first. */
export async function listOrgMembers(orgUserId: string): Promise<OrgMember[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('org_members')
    .select('member_user_id, role, created_at')
    .eq('org_user_id', orgUserId)
    .order('created_at', { ascending: true });

  const rows = data ?? [];
  const members = await Promise.all(
    rows.map(async (r) => {
      const { data: u } = await admin.auth.admin.getUserById(r.member_user_id as string);
      return {
        memberUserId: r.member_user_id as string,
        role: (r.role as OrgRole) ?? 'member',
        email: u?.user?.email ?? null,
        createdAt: r.created_at as string,
      };
    })
  );
  const rank = { owner: 0, admin: 1, member: 2 } as const;
  return members.sort((a, b) => rank[a.role] - rank[b.role]);
}

/**
 * Add someone to an organization.
 *
 * The person must already have an account, because membership is keyed to a
 * real auth user and because sign-in is a code emailed to the address: a row
 * created ahead of the account would look correct in the table while the
 * person on the other end still could not get in. scripts/check-org-access.ts
 * was written after exactly that confusion.
 */
export async function addOrgMember(
  orgUserId: string,
  memberUserId: string,
  role: OrgRole = 'member',
  invitedBy?: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();

  const existing = await resolveOrgContext(memberUserId);
  if (existing.onTeam && existing.orgUserId !== orgUserId) {
    return { ok: false, error: 'That person already belongs to another organization.' };
  }

  const { error } = await admin
    .from('org_members')
    .upsert(
      { org_user_id: orgUserId, member_user_id: memberUserId, role, invited_by: invitedBy ?? null },
      { onConflict: 'org_user_id,member_user_id' }
    );
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/**
 * Hand the organization to someone else.
 *
 * Identifying an organization by its owner's user_id means ownership is woven
 * through profiles, campaigns, org_supporters, org_target_lists and
 * org_members, so this is a five-table rewrite rather than a one-row update.
 * It runs as a single database function for that reason: half a transfer
 * would strand an organization between two owners, its campaigns under one
 * and its supporters under another.
 *
 * The new owner must already be a member. The outgoing owner stays on as an
 * admin rather than losing access the moment they hand over the keys.
 */
export async function transferOrgOwnership(
  currentOwnerId: string,
  newOwnerId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  const admin = createAdminClient();
  const { error } = await admin.rpc('transfer_org_ownership', {
    old_owner: currentOwnerId,
    new_owner: newOwnerId,
  });
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}

/** Remove someone. The owner stays: an organization without one has no identity. */
export async function removeOrgMember(
  orgUserId: string,
  memberUserId: string
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (orgUserId === memberUserId) {
    return { ok: false, error: 'The owner cannot be removed from their own organization.' };
  }
  const admin = createAdminClient();
  const { error } = await admin
    .from('org_members')
    .delete()
    .eq('org_user_id', orgUserId)
    .eq('member_user_id', memberUserId);
  if (error) return { ok: false, error: error.message };
  return { ok: true };
}
