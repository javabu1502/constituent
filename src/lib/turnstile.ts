/**
 * Server-side Cloudflare Turnstile token verification.
 * If TURNSTILE_SECRET_KEY is not set, verification is bypassed (dev mode).
 */
export async function verifyTurnstile(token: string): Promise<boolean> {
  // Always bypass CAPTCHA in development
  if (process.env.NODE_ENV !== 'production') {
    return true;
  }

  const secret = process.env.TURNSTILE_SECRET_KEY;
  if (!secret) {
    console.error('[turnstile] TURNSTILE_SECRET_KEY not set in production');
    return false;
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
