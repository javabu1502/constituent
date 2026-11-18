import { timingSafeEqual } from 'crypto';

/**
 * Who counts as an operator, and whether a cron request is really ours.
 *
 * Both checks were copied into every route that needed them: the admin
 * allowlist into five, the cron bearer comparison into nine. All of them
 * were correct, which is the point. Nothing warns you when the sixth copy
 * is written from memory and drops the email branch, or inverts the test,
 * and the routes behind these are the queue, the compliance screen and the
 * CWC test sender.
 */

/**
 * An operator is named in the environment, never in the database, so a
 * compromised profile row cannot grant it. Both lists empty means nobody
 * qualifies, which is the behaviour we want if the env goes missing.
 *
 * The email is safe to trust: sign-in is an emailed code and nothing else,
 * so an address on a session was proved by receiving mail at it.
 */
export function isAdmin(user: { id: string; email?: string }): boolean {
  const ids = process.env.ADMIN_USER_IDS?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  if (ids.includes(user.id)) return true;
  const emails = process.env.ADMIN_EMAILS?.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean) ?? [];
  return !!user.email && emails.includes(user.email.toLowerCase());
}

/**
 * Constant-time compare for a shared secret. The `!==` this replaces leaks
 * how many leading bytes matched. Over the public internet that is close to
 * unexploitable, but the repo already compares unsubscribe tokens this way
 * and there is no reason for the cron secret to be the weaker one.
 */
function secretsMatch(given: string, expected: string): boolean {
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  // timingSafeEqual throws on a length mismatch, and the length is not secret.
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * True when the Authorization header carries our cron secret.
 *
 * Fails closed when CRON_SECRET is unset: an unset secret must never mean
 * an open endpoint.
 */
export function isCronRequest(authHeader: string | null | undefined): boolean {
  const secret = process.env.CRON_SECRET;
  if (!secret) return false;
  if (!authHeader) return false;
  return secretsMatch(authHeader, `Bearer ${secret}`);
}
