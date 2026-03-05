import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyUnsubscribeToken } from '@/lib/digest';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const token = searchParams.get('token');
  const userId = searchParams.get('uid');

  if (!token || !userId) {
    return new NextResponse(renderHtml('Invalid unsubscribe link.', false), {
      status: 400,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  if (!verifyUnsubscribeToken(userId, token)) {
    return new NextResponse(renderHtml('Invalid or expired unsubscribe link.', false), {
      status: 403,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  const admin = createAdminClient();
  const { error } = await admin
    .from('notification_preferences')
    .update({ weekly_digest: false, updated_at: new Date().toISOString() })
    .eq('user_id', userId);

  if (error) {
    console.error('[unsubscribe] Error:', error);
    return new NextResponse(renderHtml('Something went wrong. Please try again.', false), {
      status: 500,
      headers: { 'Content-Type': 'text/html' },
    });
  }

  return new NextResponse(renderHtml('You have been unsubscribed from weekly digests.', true), {
    status: 200,
    headers: { 'Content-Type': 'text/html' },
  });
}

function renderHtml(message: string, success: boolean): string {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${success ? 'Unsubscribed' : 'Error'} | My Democracy</title>
</head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:400px;margin:60px auto;padding:20px;text-align:center;color:#374151;">
  <h1 style="color:#7c3aed;font-size:22px;">My Democracy</h1>
  <div style="margin:24px 0;padding:20px;border:1px solid ${success ? '#d1d5db' : '#fca5a5'};border-radius:8px;background:${success ? '#f9fafb' : '#fef2f2'};">
    <p style="font-size:15px;margin:0;">${message}</p>
  </div>
  <a href="https://mydemocracy.app/dashboard" style="color:#7c3aed;font-size:14px;">Go to Dashboard</a>
</body>
</html>`;
}
