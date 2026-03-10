import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { renderFollowUpHtml } from '@/lib/follow-up-email';
import { generateUnsubscribeToken } from '@/lib/digest';
import { sendDigestEmail } from '@/lib/resend';

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1000;

export async function POST(request: NextRequest) {
  // Verify cron secret (same pattern as weekly-digest)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email sending not configured' }, { status: 503 });
  }

  const admin = createAdminClient();

  // Get users with follow_up_reminders enabled
  const { data: subscribers, error } = await admin
    .from('notification_preferences')
    .select('user_id, email')
    .eq('follow_up_reminders', true);

  if (error) {
    console.error('[follow-up-reminders] Failed to fetch subscribers:', error);
    return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
  }

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ message: 'No subscribers', sent: 0 });
  }

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mydemocracy.app';
  const fourteenDaysAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
  let sent = 0;
  let skipped = 0;
  let failed = 0;

  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (sub) => {
        try {
          // Find eligible messages (14+ days old, no reminder sent yet)
          const { data: messages } = await admin
            .from('messages')
            .select('id, legislator_name, issue_area, created_at')
            .eq('user_id', sub.user_id)
            .lt('created_at', fourteenDaysAgo)
            .eq('follow_up_reminder_count', 0)
            .order('created_at', { ascending: false })
            .limit(10);

          if (!messages || messages.length === 0) {
            skipped++;
            return;
          }

          // Get user's name from profile
          const { data: profile } = await admin
            .from('profiles')
            .select('name')
            .eq('user_id', sub.user_id)
            .single();

          const unsubToken = generateUnsubscribeToken(sub.user_id);
          const unsubscribeUrl = `${baseUrl}/api/notifications/unsubscribe?uid=${sub.user_id}&token=${unsubToken}`;

          const html = renderFollowUpHtml(
            {
              userName: profile?.name || 'there',
              messages,
              dashboardUrl: `${baseUrl}/dashboard`,
            },
            unsubscribeUrl
          );

          await sendDigestEmail(
            sub.email,
            `Follow up on ${messages.length} message${messages.length > 1 ? 's' : ''} to your officials`,
            html
          );

          // Update messages to mark reminder sent
          const messageIds = messages.map((m: { id: string }) => m.id);
          await admin
            .from('messages')
            .update({
              follow_up_sent_at: new Date().toISOString(),
              follow_up_reminder_count: 1,
            })
            .in('id', messageIds);

          sent++;
        } catch (err) {
          console.error(`[follow-up-reminders] Failed for user ${sub.user_id}:`, err);
          failed++;
        }
      })
    );

    if (i + BATCH_SIZE < subscribers.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  return NextResponse.json({
    message: 'Follow-up reminders complete',
    sent,
    skipped,
    failed,
    total: subscribers.length,
  });
}
