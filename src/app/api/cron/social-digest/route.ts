import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { sendAdminNotification } from '@/lib/resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/social-digest — daily email to Jared: what posted, what's
 * queued for approval, what got skipped or failed in the last 24h.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const since = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const { data } = await admin
    .from('social_posts')
    .select('status, platform, lane, body, link_url, guardrail_report, created_at, posted_at')
    .gte('created_at', since)
    .order('created_at', { ascending: false });

  const rows = data ?? [];
  const by = (s: string) => rows.filter((r) => r.status === s);
  const posted = by('posted');
  const pending = by('pending_approval');
  const skipped = by('skipped');
  const failed = by('failed');

  const esc = (s: string) => (s || '').replace(/[<>&]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;' }[c]!));
  const list = (items: typeof rows, showReason = false) =>
    items.length
      ? `<ul>${items
          .map((r) => {
            const reason = showReason
              ? ` <em>(${esc((r.guardrail_report as { skipReason?: string; publish_error?: string } | null)?.skipReason
                  || (r.guardrail_report as { publish_error?: string } | null)?.publish_error || '')})</em>`
              : '';
            return `<li>${esc(r.body as string)}${reason}</li>`;
          })
          .join('')}</ul>`
      : '<p style="color:#888">none</p>';

  const html = `
    <h2>My Democracy — Social Desk daily digest</h2>
    <p>Last 24h. Kill switch and mode live in Supabase <code>social_config</code>.</p>
    <h3>Posted (${posted.length})</h3>${list(posted)}
    <h3>Awaiting your approval (${pending.length})</h3>${list(pending)}
    <h3>Skipped by guardrails (${skipped.length})</h3>${list(skipped, true)}
    <h3>Failed (${failed.length})</h3>${list(failed, true)}
  `;

  await sendAdminNotification(
    `Social Desk digest: ${posted.length} posted, ${pending.length} awaiting approval`,
    html,
  );

  return NextResponse.json({
    ok: true,
    counts: { posted: posted.length, pending: pending.length, skipped: skipped.length, failed: failed.length },
  });
}
