import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { cwcAdoptionSignatureSchema, parseBody } from '@/lib/schemas';
import { writeLimiter, getClientIp } from '@/lib/rate-limit';
import { resolveUsageIdentity } from '@/lib/usage-quota';
import { verifyTurnstile } from '@/lib/turnstile';

/**
 * POST /api/cwc/adoption-signature — a constituent asks a NON-participating
 * Senate office to accept messages through Communicating With Congress.
 * Opt-in checkbox on the send card; one signature per person per senator.
 */
export async function POST(request: NextRequest) {
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
  const parsed = parseBody(cwcAdoptionSignatureSchema, raw);
  if (!parsed.success) return NextResponse.json({ error: parsed.error }, { status: 400 });
  const body = parsed.data;

  const identity = await resolveUsageIdentity(ip);
  if (process.env.TURNSTILE_SECRET_KEY) {
    const valid = await verifyTurnstile(body.turnstileToken || '', { strict: !identity.userId });
    if (!valid) return NextResponse.json({ error: 'CAPTCHA verification failed' }, { status: 403 });
  }

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('cwc_adoption_signatures').upsert(
      {
        senator_id: body.senator_id,
        senator_name: body.senator_name,
        state: body.state.toUpperCase(),
        office_code: body.office_code ?? null,
        signer_name: body.name.trim(),
        signer_email: body.email.trim().toLowerCase(),
        signer_city: body.city?.trim() || null,
        signer_zip: body.zip ?? null,
        source: body.source,
        campaign_id: body.campaign_id ?? null,
        ip_hash: identity.ipHash ?? null,
      },
      { onConflict: 'senator_id,signer_email', ignoreDuplicates: true },
    );
    if (error) {
      console.error('[cwc/adoption-signature] insert failed:', error);
      return NextResponse.json({ error: 'Failed to record signature' }, { status: 500 });
    }
    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[cwc/adoption-signature] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
