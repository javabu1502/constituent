import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { signonSchema, parseBody } from '@/lib/schemas';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { verifyTurnstile } from '@/lib/turnstile';
import { geocodeAddress } from '@/lib/geocode';
import { signonConsentText } from '@/lib/signon';

export const runtime = 'nodejs';

/**
 * POST /api/campaigns/[slug]/sign — put your name to a sign-on letter.
 *
 * Public and anonymous, like the organization join form, and a bot target for
 * the same reason, so the CAPTCHA is strict rather than lenient.
 *
 * The address is geocoded here rather than at read time. The letter is
 * delivered one office at a time, and a district derived later from a stored
 * ZIP would be a guess: ZIP codes cross district lines, which is the whole
 * reason the street is collected.
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

  const parsed = parseBody(signonSchema, raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;

  if (process.env.TURNSTILE_SECRET_KEY) {
    const valid = await verifyTurnstile(body.turnstileToken || '', { strict: true });
    if (!valid) return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 403 });
  }

  const { slug } = await params;
  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from('campaigns')
    .select('id, campaign_type, status, org_name')
    .eq('slug', slug)
    .maybeSingle();

  if (!campaign) return NextResponse.json({ error: 'Letter not found' }, { status: 404 });
  if (campaign.campaign_type !== 'signon') {
    return NextResponse.json({ error: 'This campaign is not a sign-on letter' }, { status: 400 });
  }
  if (campaign.status !== 'active') {
    return NextResponse.json({ error: 'This letter is closed to new signatures' }, { status: 409 });
  }

  // An address the geocoder cannot place still signs. Dropping them loses a
  // real person over a rural route or new construction, and guessing files
  // them with an office that does not represent them, which is what makes a
  // staffer stop trusting the list. They go in the export unplaced instead.
  let congressional: string | null = null;
  let upper: string | null = null;
  let lower: string | null = null;
  let resolved = false;
  try {
    const geo = await geocodeAddress(body.street, body.city, body.state, body.zip);
    if (!('error' in geo)) {
      congressional = geo.congressionalDistrict ?? null;
      upper = geo.stateUpperDistrict ?? null;
      lower = geo.stateLowerDistrict ?? null;
      resolved = !!(congressional || upper || lower);
    }
  } catch (e) {
    console.error('[campaigns/sign] geocode failed:', (e as Error).message);
  }

  const { error } = await admin
    .from('campaign_signatures')
    .upsert(
      {
        campaign_id: campaign.id,
        name: body.name,
        email: body.email.toLowerCase(),
        street: body.street,
        city: body.city,
        state: body.state.toUpperCase(),
        zip: body.zip,
        congressional_district: congressional,
        state_upper_district: upper,
        state_lower_district: lower,
        district_resolved: resolved,
        personal_note: body.personalNote || null,
        show_name_publicly: body.showNamePublicly,
        // Written with the words actually shown. Spread rather than set to
        // null, because an upsert that cleared this would erase the record of
        // what an earlier signature agreed to.
        ...(body.consentText
          ? { consent_text: body.consentText, consented_at: new Date().toISOString() }
          : { consent_text: signonConsentText(campaign.org_name), consented_at: new Date().toISOString() }),
        withdrawn_at: null,
      },
      { onConflict: 'campaign_id,email' },
    );

  if (error) {
    console.error('[campaigns/sign] insert failed:', error);
    return NextResponse.json({ error: 'We could not add your name just now. Please try again.' }, { status: 500 });
  }

  return NextResponse.json({ success: true, districtResolved: resolved, ...(congressional ? { congressionalDistrict: congressional } : {}) });
}
