import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { orgJoinSchema, parseBody } from '@/lib/schemas';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';
import { geocodeAddress } from '@/lib/geocode';

export const runtime = 'nodejs';

/**
 * POST /api/org/[slug]/join — add someone to an organization's supporter list.
 *
 * Public and anonymous: this form is meant to sit on the organization's own
 * website, so there is no session to lean on. That makes it a bot target,
 * which is why the CAPTCHA is strict here rather than lenient.
 *
 * The address is geocoded now, not later. The point of the list is district
 * counts an organization can take into a meeting, and a district derived at
 * read time from a stored ZIP would be a guess.
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const ip = getClientIp(request);
  const { success, retryAfter } = writeLimiter.check(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }

  const parsed = parseBody(orgJoinSchema, raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;

  if (process.env.TURNSTILE_SECRET_KEY) {
    const valid = await verifyTurnstile(body.turnstileToken || '', { strict: true });
    if (!valid) return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 403 });
  }

  const { slug } = await params;
  const admin = createAdminClient();
  const { data: org } = await admin
    .from('profiles')
    .select('user_id, org_name')
    .eq('org_slug', slug)
    .eq('account_type', 'organization')
    .maybeSingle();
  if (!org) return NextResponse.json({ error: 'Organization not found' }, { status: 404 });

  // A street the geocoder cannot place still joins the list. Dropping them
  // would lose a real supporter over a rural route or new construction; the
  // map simply does not place them, and the page says how many that is.
  let upper: string | null = null;
  let lower: string | null = null;
  let congressional: string | null = null;
  let county: string | null = null;
  let resolved = false;
  try {
    const geo = await geocodeAddress(body.street, body.city, body.state, body.zip);
    if (!('error' in geo)) {
      upper = geo.stateUpperDistrict ?? null;
      lower = geo.stateLowerDistrict ?? null;
      congressional = geo.congressionalDistrict ?? null;
      county = geo.countyName ?? null;
      resolved = !!(upper || lower);
    }
  } catch (e) {
    console.error('[org/join] geocode failed:', (e as Error).message);
  }

  // Signing up twice updates the row. Two rows for one person would inflate
  // exactly the district count the organization is going to quote.
  const { error } = await admin
    .from('org_supporters')
    .upsert(
      {
        org_user_id: org.user_id,
        name: body.name,
        email: body.email.toLowerCase(),
        street: body.street,
        city: body.city,
        state: body.state.toUpperCase(),
        zip: body.zip,
        state_upper_district: upper,
        state_lower_district: lower,
        congressional_district: congressional,
        county_name: county,
        district_resolved: resolved,
        source: request.headers.get('sec-fetch-dest') === 'iframe' ? 'embed' : 'org_page',
        // Only written when this submission carried consent wording. Spread
        // rather than set to null, because an upsert that overwrites the
        // column would erase the record of what an earlier signup agreed to,
        // and a consent record is the one thing here that must not be lost.
        ...(body.consentText ? { consent_text: body.consentText, consented_at: new Date().toISOString() } : {}),
        unsubscribed_at: null,
      },
      { onConflict: 'org_user_id,email' },
    );

  if (error) {
    console.error('[org/join] insert failed:', error);
    return NextResponse.json({ error: 'We could not add you just now. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    orgName: org.org_name ?? null,
    districtResolved: resolved,
    ...(resolved ? { senateDistrict: upper, assemblyDistrict: lower } : {}),
  });
}
