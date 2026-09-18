import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { sendAdminNotification } from '@/lib/resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/**
 * GET /api/cron/org-requests-digest — weekly email to Jared listing every
 * pilot application still pending, with its age. The per-submission
 * notification already exists; this exists because a single email can be
 * missed and a request then sits unseen (it happened: 08-19 to 09-18).
 * A request stays in this digest every week until it is approved or
 * declined, so nothing falls through again.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('org_requests')
    .select('org_name, contact_name, email, role, working_on, status, created_at')
    .eq('status', 'pending')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('[org-requests-digest] query failed:', error);
    return NextResponse.json({ error: 'Query failed' }, { status: 500 });
  }

  const pending = data ?? [];
  if (pending.length === 0) {
    return NextResponse.json({ ok: true, pending: 0, emailed: false });
  }

  const rows = pending
    .map((r) => {
      const ageDays = Math.floor((Date.now() - new Date(r.created_at).getTime()) / 86_400_000);
      return `<li style="margin-bottom:10px">
        <strong>${escapeHtml(r.org_name)}</strong> (${ageDays} day${ageDays === 1 ? '' : 's'} old)<br/>
        ${escapeHtml(r.contact_name || '')}${r.role ? `, ${escapeHtml(r.role)}` : ''} &middot; ${escapeHtml(r.email)}<br/>
        <span style="color:#555">${escapeHtml((r.working_on || '').slice(0, 200))}</span>
      </li>`;
    })
    .join('');

  await sendAdminNotification(
    `${pending.length} org pilot request${pending.length === 1 ? '' : 's'} awaiting review`,
    `<h2>Pending advocacy pilot applications</h2>
     <ul style="padding-left:18px">${rows}</ul>
     <p>These stay in this weekly digest until approved or declined.</p>`
  );

  return NextResponse.json({ ok: true, pending: pending.length, emailed: true });
}
