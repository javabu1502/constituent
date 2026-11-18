import { createHmac, timingSafeEqual } from 'crypto';

/**
 * The keys we sign tokens with, and the keys we still accept.
 *
 * Three token systems fell back to a secret that exists for something else:
 * embed tokens to SUPABASE_SECRET_KEY, unsubscribe tokens to CRON_SECRET.
 * Neither is exploitable, since an HMAC does not leak its key. The cost is
 * that the two can never be rotated independently: changing the database
 * key to deal with a leak would silently void every embed token an
 * organisation has pasted into their own site, and rotating the cron secret
 * would void every unsubscribe link in every email already delivered.
 *
 * So this cannot be a swap. A token already in the world has to keep
 * working, and those live in places we do not control: an org's CMS, a
 * supporter's archived mail. New tokens get the dedicated secret from the
 * moment it is set; old ones keep verifying against the legacy key until
 * somebody decides the remaining links are stale enough to break.
 *
 * Dropping a legacy key is therefore a decision with a date on it, not a
 * cleanup. Remove the name from LEGACY and the old links stop that minute.
 */

export type SigningPurpose = 'embed' | 'unsubscribe' | 'campaign-updates';

/** The dedicated secret for each purpose, newest first. */
const PRIMARY: Record<SigningPurpose, string[]> = {
  embed: ['EMBED_SIGNING_SECRET'],
  unsubscribe: ['UNSUBSCRIBE_SECRET'],
  'campaign-updates': ['CAMPAIGN_UPDATES_SECRET'],
};

/**
 * Still accepted on verify, never used to sign. Each entry is a secret that
 * belongs to something else and was borrowed before the dedicated one
 * existed.
 */
const LEGACY: Record<SigningPurpose, string[]> = {
  embed: ['SUPABASE_SECRET_KEY'],
  unsubscribe: ['CRON_SECRET'],
  'campaign-updates': ['CRON_SECRET'],
};

function firstSet(names: string[]): string | null {
  for (const n of names) {
    const v = process.env[n];
    if (v && v.trim()) return v;
  }
  return null;
}

/**
 * The key to sign with: the dedicated one when it is set, otherwise the
 * legacy one, so nothing breaks before the new secret is deployed.
 */
export function signingSecret(purpose: SigningPurpose): string {
  const secret = firstSet(PRIMARY[purpose]) ?? firstSet(LEGACY[purpose]);
  if (!secret) {
    throw new Error(
      `No signing secret for ${purpose}. Set ${PRIMARY[purpose][0]}, or ${LEGACY[purpose][0]} while migrating.`,
    );
  }
  return secret;
}

/** Every key a token from this purpose may legitimately have been signed with. */
export function acceptedSecrets(purpose: SigningPurpose): string[] {
  const out: string[] = [];
  for (const n of [...PRIMARY[purpose], ...LEGACY[purpose]]) {
    const v = process.env[n];
    if (v && v.trim() && !out.includes(v)) out.push(v);
  }
  return out;
}

export function constantTimeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  if (x.length !== y.length) return false;
  return timingSafeEqual(x, y);
}

/**
 * Verify a token against every accepted key.
 *
 * Every candidate is compared even after one matches, so the time taken
 * does not reveal which key signed it, and the whole comparison stays
 * constant-time.
 */
export function verifyAgainstAny(
  purpose: SigningPurpose,
  payload: string,
  token: string,
  digest: (secret: string, payload: string) => string,
): boolean {
  let ok = false;
  for (const secret of acceptedSecrets(purpose)) {
    if (constantTimeEqual(digest(secret, payload), token)) ok = true;
  }
  return ok;
}

/** The common case: hex HMAC-SHA256, optionally truncated. */
export function hmacHex(secret: string, payload: string, length?: number): string {
  const full = createHmac('sha256', secret).update(payload).digest('hex');
  return length ? full.slice(0, length) : full;
}
