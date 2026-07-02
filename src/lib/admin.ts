/**
 * Admin authorization. An account is an admin if its id is in ADMIN_USER_IDS
 * or its (verified) email is in ADMIN_EMAILS. Fails closed: when neither env
 * var is set, no one is an admin.
 */
export function isAdmin(user: { id: string; email?: string }): boolean {
  const adminIds = process.env.ADMIN_USER_IDS?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  if (adminIds.includes(user.id)) return true;

  const adminEmails =
    process.env.ADMIN_EMAILS?.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean) ?? [];
  if (user.email && adminEmails.includes(user.email.toLowerCase())) return true;

  return false;
}
