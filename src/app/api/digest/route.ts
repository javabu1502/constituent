import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

/**
 * POST /api/digest
 * Called by Vercel Cron daily at 2 PM UTC.
 * Sends email digests to users who have opted in.
 */
export async function POST(request: NextRequest) {
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (!cronSecret || authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const resendKey = process.env.RESEND_API_KEY;
  if (!resendKey) {
    return NextResponse.json({ error: 'RESEND_API_KEY not configured' }, { status: 500 });
  }

  const admin = createAdminClient();
  const now = new Date();
  const dayOfWeek = now.getUTCDay(); // 0=Sun

  // Fetch profiles that want a digest
  const { data: profiles, error: profileError } = await admin
    .from('profiles')
    .select('user_id, name, email_digest')
    .neq('email_digest', 'none');

  if (profileError || !profiles || profiles.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No subscribers' });
  }

  // Filter: daily users always get it, weekly users only on Monday (day 1)
  const eligible = profiles.filter((p) => {
    if (p.email_digest === 'daily') return true;
    if (p.email_digest === 'weekly' && dayOfWeek === 1) return true;
    return false;
  });

  if (eligible.length === 0) {
    return NextResponse.json({ sent: 0, message: 'No eligible users today' });
  }

  // Look up emails from auth.users via Supabase admin
  let sent = 0;
  const errors: string[] = [];

  for (const profile of eligible) {
    try {
      // Get user email
      const { data: userData } = await admin.auth.admin.getUserById(profile.user_id);
      const email = userData?.user?.email;
      if (!email) continue;

      // Fetch recent feed items for this user (last 24h for daily, 7d for weekly)
      const sinceHours = profile.email_digest === 'daily' ? 24 : 168;
      const since = new Date(now.getTime() - sinceHours * 3600000).toISOString();

      const { data: messages } = await admin
        .from('messages')
        .select('legislator_name, issue_area, delivery_status, created_at')
        .eq('user_id', profile.user_id)
        .gte('created_at', since)
        .order('created_at', { ascending: false })
        .limit(10);

      const userName = profile.name || 'there';
      const periodLabel = profile.email_digest === 'daily' ? 'today' : 'this week';
      const messageCount = messages?.length ?? 0;

      const html = `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #1f2937;">
  <h1 style="font-size: 20px; color: #7c3aed;">My Democracy Digest</h1>
  <p>Hi ${userName},</p>
  <p>Here's your ${profile.email_digest} civic engagement summary.</p>
  ${messageCount > 0 ? `
  <h2 style="font-size: 16px; margin-top: 24px;">Messages Sent ${periodLabel}</h2>
  <ul style="padding-left: 20px;">
    ${messages!.map(m => `<li style="margin-bottom: 8px;"><strong>${m.legislator_name}</strong> about ${m.issue_area}</li>`).join('')}
  </ul>
  ` : `<p>No new messages sent ${periodLabel}.</p>`}
  <p style="margin-top: 24px;">
    <a href="https://www.mydemocracy.app/dashboard" style="display: inline-block; padding: 10px 20px; background: #7c3aed; color: white; text-decoration: none; border-radius: 8px;">Go to Dashboard</a>
  </p>
  <p style="font-size: 12px; color: #9ca3af; margin-top: 32px;">
    You're receiving this because you opted into ${profile.email_digest} digests.
    <a href="https://www.mydemocracy.app/dashboard" style="color: #7c3aed;">Manage preferences</a>
  </p>
</body>
</html>`.trim();

      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${resendKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'My Democracy <digest@mydemocracy.app>',
          to: email,
          subject: `Your ${profile.email_digest} civic digest — My Democracy`,
          html,
        }),
      });

      if (res.ok) {
        sent++;
      } else {
        const err = await res.text();
        errors.push(`${email}: ${err}`);
      }
    } catch (err) {
      errors.push(`${profile.user_id}: ${err}`);
    }
  }

  return NextResponse.json({ sent, total: eligible.length, errors: errors.length > 0 ? errors : undefined });
}
