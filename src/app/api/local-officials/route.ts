import { NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/geocode';
import { findLocalOfficials } from '@/lib/local-officials';
import { lookupLimiter, getClientIp } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';
import { resolveUsageIdentity } from '@/lib/usage-quota';

/**
 * POST /api/local-officials
 * Takes address fields, returns local officials from Google Civic Information API.
 */
export async function POST(request: Request) {
  const ip = getClientIp(request);
  const { success, retryAfter } = lookupLimiter.check(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  }

  let body: Record<string, string>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { street, city, state, zip, turnstileToken } = body;

  if (!street || !city || !state || !zip) {
    return NextResponse.json(
      { error: 'Missing required fields: street, city, state, zip' },
      { status: 400 }
    );
  }

  const identity = await resolveUsageIdentity(ip);
  if (process.env.TURNSTILE_SECRET_KEY) {
    const valid = await verifyTurnstile(turnstileToken || '', { strict: !identity.userId });
    if (!valid) {
      return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 403 });
    }
  }

  try {
    const geo = await geocodeAddress(street, city, state, zip);
    if ('error' in geo) {
      return NextResponse.json({ error: geo.error }, { status: geo.code === 'NO_MATCH' || geo.code === 'INVALID_ADDRESS' ? 400 : 502 });
    }
    const officials = findLocalOfficials(geo.stateCode, geo);
    return NextResponse.json({ officials, coverage: officials.length > 0 ? 'roster' : 'none' });
  } catch (err) {
    console.error('Local officials lookup failed:', err);
    return NextResponse.json(
      { error: 'Unable to look up local officials right now. Please try again later.' },
      { status: 502 }
    );
  }
}
