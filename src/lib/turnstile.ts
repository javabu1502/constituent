/**
 * Server-side Cloudflare Turnstile token verification.
 * If TURNSTILE_SECRET_KEY is not set, verification is bypassed (dev mode).
 *
 * `strict` controls what happens when no token is supplied. For anonymous
 * requests we set strict=true so a missing token is rejected — otherwise a
 * bot could bypass the check entirely by simply omitting the token. For
 * signed-in users we stay lenient (strict=false) so a flaky widget never
 * locks out a known, already rate-limited account.
 */
export async function verifyTurnstile(
  token: string,
  opts: { strict?: boolean } = {},
): Promise<boolean> {
  // Always bypass CAPTCHA in development
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error('[turnstile] TURNSTILE_SECRET_KEY not set in production');
    return false;
  }

  // No token (widget failed to load, ad blocker, or a bot skipping it):
  // reject for strict (anonymous) callers, allow for lenient (signed-in) ones.
  if (!token) {
    if (opts.strict) {
      console.warn('[turnstile] No token on a strict request — rejecting');
      return false;
    }
    console.warn('[turnstile] No token provided, allowing request');
    return true;
  }

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    });

    const data = await res.json();
    return data.success === true;
  } catch {
    console.error('[turnstile] Verification request failed');
    return false;
  }
}
