import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { buildWeeklyDigest, renderDigestHtml, generateUnsubscribeToken } from '@/lib/digest';
import { sendDigestEmail } from '@/lib/resend';

const BATCH_SIZE = 10;
const BATCH_DELAY_MS = 1000; // Stay within Resend rate limits

export async function POST(request: NextRequest) {
  // Verify cron secret (Vercel Cron pattern)
  const authHeader = request.headers.get('authorization');
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  if (!process.env.RESEND_API_KEY) {
    return NextResponse.json({ error: 'Email sending not configured' }, { status: 503 });
  }

  const admin = createAdminClient();

  // Get all users with weekly_digest enabled
  const { data: subscribers, error } = await admin
    .from('notification_preferences')
    .select('user_id, email')
    .eq('weekly_digest', true);

  if (error) {
    console.error('[weekly-digest] Failed to fetch subscribers:', error);
    return NextResponse.json({ error: 'Failed to fetch subscribers' }, { status: 500 });
  }

  if (!subscribers || subscribers.length === 0) {
    return NextResponse.json({ message: 'No subscribers', sent: 0 });
  }

  let sent = 0;
  let skipped = 0;
  let failed = 0;

  // Process in batches
  for (let i = 0; i < subscribers.length; i += BATCH_SIZE) {
    const batch = subscribers.slice(i, i + BATCH_SIZE);

    await Promise.all(
      batch.map(async (sub) => {
        try {
          const digest = await buildWeeklyDigest(sub.user_id);
          if (!digest) {
            skipped++;
            return;
          }

          const unsubToken = generateUnsubscribeToken(sub.user_id);
          const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://mydemocracy.app';
          const unsubscribeUrl = `${baseUrl}/api/notifications/unsubscribe?uid=${sub.user_id}&token=${unsubToken}`;

          const html = renderDigestHtml(digest, unsubscribeUrl);
          await sendDigestEmail(
            sub.email,
            'Your Weekly Rep Activity Digest',
            html
          );

          // Update last sent timestamp
          await admin
            .from('notification_preferences')
            .update({ last_digest_sent_at: new Date().toISOString() })
            .eq('user_id', sub.user_id);

          sent++;
        } catch (err) {
          console.error(`[weekly-digest] Failed for user ${sub.user_id}:`, err);
          failed++;
        }
      })
    );

    // Delay between batches for rate limiting
    if (i + BATCH_SIZE < subscribers.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  return NextResponse.json({
    message: 'Digest complete',
    sent,
    skipped,
    failed,
    total: subscribers.length,
  });
}
