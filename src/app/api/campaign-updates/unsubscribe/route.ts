import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyUpdatesUnsubscribeToken, UPDATES_LIST } from '@/lib/campaign-updates';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * One-click unsubscribe from campaign-update emails. Token is an HMAC of the
 * email, so account-less advocates can opt out from the email link alone.
 */
export async function GET(request: NextRequest) {
  const email = (request.nextUrl.searchParams.get('e') || '').trim().toLowerCase();
  const token = request.nextUrl.searchParams.get('t') || '';
  if (!email || !token || !verifyUpdatesUnsubscribeToken(email, token)) {
    return new NextResponse('Invalid unsubscribe link.', { status: 400 });
  }

  const admin = createAdminClient();
  await admin.from('email_suppressions').upsert({ email, list: UPDATES_LIST }, { onConflict: 'email,list' });

  return new NextResponse(
    `<!doctype html><html><body style="font-family:system-ui,sans-serif;max-width:480px;margin:80px auto;text-align:center;color:#111">
      <h2>You're unsubscribed</h2>
      <p style="color:#555">You won't receive further campaign updates at ${email.replace(/</g, '&lt;')}.</p>
      <p><a href="https://www.mydemocracy.app" style="color:#7C3AED">Back to My Democracy</a></p>
    </body></html>`,
    { status: 200, headers: { 'Content-Type': 'text/html' } }
  );
}
