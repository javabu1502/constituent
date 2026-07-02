/**
 * Environment awareness so testers never confuse staging with production.
 *
 * Staging (testing.mydemocracy.app) and production run the SAME code — the only
 * difference is env-var values. `isStaging` is derived from the public site URL
 * (or Vercel's VERCEL_ENV), so it's safe to read on both server and client.
 */

/** True on any non-production deployment (staging/preview). */
export function isStaging(): boolean {
  // Vercel exposes VERCEL_ENV = 'production' | 'preview' | 'development'.
  const vercelEnv = process.env.NEXT_PUBLIC_VERCEL_ENV || process.env.VERCEL_ENV;
  if (vercelEnv && vercelEnv !== 'production') return true;

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? '';
  return siteUrl.includes('testing.') || siteUrl.includes('staging.');
}
