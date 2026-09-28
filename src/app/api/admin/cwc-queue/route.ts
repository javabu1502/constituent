import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { processCwcSendQueue } from '@/lib/cwc/queue';
import type { CwcDelivery } from '@/lib/cwc/types';

// Node runtime: sends egress through the undici static-IP proxy.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAdmin(user: { id: string; email?: string }): boolean {
  const ids = process.env.ADMIN_USER_IDS?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  if (ids.includes(user.id)) return true;
  const emails = process.env.ADMIN_EMAILS?.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean) ?? [];
  return !!user.email && emails.includes(user.email.toLowerCase());
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user)) return null;
  return user;
}

const QUEUE_COLUMNS =
  'id, message_key, office_code, environment, chamber, campaign_id, delivery, bill_level, status, attempts, max_attempts, run_after, last_error, leased_by, created_at, updated_at';

/** Operator view of one queue row: enough to recognise the message, never the
 *  full street address (it stays in the service-role table). */
function summarize(row: Record<string, unknown>) {
  const d = row.delivery as CwcDelivery;
  return {
    id: row.id,
    status: row.status,
    environment: row.environment,
    chamber: row.chamber,
    office_code: row.office_code,
    campaign_id: row.campaign_id,
    bill_level: row.bill_level,
    attempts: row.attempts,
    max_attempts: row.max_attempts,
    run_after: row.run_after,
    last_error: row.last_error,
    leased_by: row.leased_by,
    created_at: row.created_at,
    updated_at: row.updated_at,
    message_key: row.message_key,
    constituent: {
      name: `${d.constituent.prefix} ${d.constituent.firstName} ${d.constituent.lastName}`,
      city: d.constituent.city,
      state: d.constituent.state,
      zip: d.constituent.zip,
      email: d.constituent.email,
    },
    subject: d.message.subject,
    topics: d.message.topics,
    bills: d.message.bills ?? [],
    stance: d.message.stance ?? null,
    body: d.message.constituentMessage ?? d.message.organizationStatement ?? '',
  };
}

/**
 * GET /api/admin/cwc-queue?status=queued,held — the CWC send queue as an
 * operator sees it, newest first, with each row's latest delivery-log
 * outcome (http status / raw response) joined by message key + office.
 */
export async function GET(request: NextRequest) {
  if (!(await requireAdmin())) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  const statuses = (request.nextUrl.searchParams.get('status') ?? 'queued,held,leased,failed,refused,routed,sent')
    .split(',').map((s) => s.trim()).filter(Boolean);

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('cwc_send_queue')
    .select(QUEUE_COLUMNS)
    .in('status', statuses)
    .order('created_at', { ascending: false })
    .limit(100);
  if (error) {
    console.error('[admin/cwc-queue] fetch failed:', error);
    return NextResponse.json({ error: 'Failed to fetch the queue' }, { status: 500 });
  }
  const rows = (data ?? []) as Record<string, unknown>[];
  const keys = [...new Set(rows.map((r) => r.message_key as string))];
  const logByKey = new Map<string, Record<string, unknown>>();
  if (keys.length > 0) {
    const { data: log } = await admin
      .from('cwc_deliveries')
      .select('message_key, office_code, environment, delivery_id, status, http_status, errors, raw_response, updated_at')
      .in('message_key', keys);
    for (const l of (log ?? []) as Record<string, unknown>[]) {
      logByKey.set(`${l.message_key}|${l.office_code}|${l.environment}`, l);
    }
  }
  return NextResponse.json(
    rows.map((r) => ({
      ...summarize(r),
      delivery_log: logByKey.get(`${r.message_key}|${r.office_code}|${r.environment}`) ?? null,
    })),
  );
}

/**
 * POST /api/admin/cwc-queue — supervised operator actions on specific rows.
 * Body: { action: 'send' | 'hold' | 'requeue', ids: number[], confirm?: string }
 *  - send:    drain ONLY these queued rows through the gated production path
 *             (same gates as the cron: content screen attestation, constituent
 *             verification, active offices, maintenance windows, rate permit).
 *             Requires confirm === 'SEND'. Max 20 ids. Returns each row's
 *             new status + delivery-log outcome.
 *  - hold:    queued → held (invisible to every claim; the cron cannot send it).
 *  - requeue: held/failed/refused → queued, run_after = now (a retry reuses
 *             the logged DeliveryId, so it can never double-deliver).
 */
export async function POST(request: NextRequest) {
  const user = await requireAdmin();
  if (!user) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  let body: { action?: string; ids?: unknown; confirm?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const ids = Array.isArray(body.ids) ? body.ids.filter((n): n is number => Number.isInteger(n) && n > 0) : [];
  if (ids.length === 0 || ids.length > 20) return NextResponse.json({ error: 'ids: 1–20 queue row ids required' }, { status: 400 });

  const admin = createAdminClient();
  const nowIso = new Date().toISOString();

  if (body.action === 'hold') {
    const { data, error } = await admin
      .from('cwc_send_queue')
      .update({ status: 'held', updated_at: nowIso, last_error: `held by admin ${user.email ?? user.id}` })
      .in('id', ids)
      .eq('status', 'queued')
      .select('id');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: 'hold', updated: (data ?? []).map((r) => r.id) });
  }

  if (body.action === 'requeue') {
    const { data, error } = await admin
      .from('cwc_send_queue')
      .update({ status: 'queued', run_after: nowIso, updated_at: nowIso, leased_by: null, lease_expires_at: null })
      .in('id', ids)
      .in('status', ['held', 'failed', 'refused'])
      .select('id');
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ ok: true, action: 'requeue', updated: (data ?? []).map((r) => r.id) });
  }

  if (body.action === 'send') {
    if (body.confirm !== 'SEND') return NextResponse.json({ error: "confirm must be 'SEND'" }, { status: 400 });
    const workerId = `admin:${user.email ?? user.id}:${Date.now()}`;
    let summary;
    try {
      summary = await processCwcSendQueue({ workerId, environment: 'production', ids });
    } catch (e) {
      const err = e as Error;
      console.error('[admin/cwc-queue] supervised send failed:', err.message);
      return NextResponse.json({ ok: false, error: err.message }, { status: 500 });
    }
    console.log('[admin/cwc-queue] supervised send:', JSON.stringify({ workerId, ids, summary }));
    const { data: rows } = await admin.from('cwc_send_queue').select(QUEUE_COLUMNS).in('id', ids);
    const results = [];
    for (const r of (rows ?? []) as Record<string, unknown>[]) {
      const { data: log } = await admin
        .from('cwc_deliveries')
        .select('delivery_id, status, http_status, errors, raw_response, updated_at')
        .eq('message_key', r.message_key as string)
        .eq('office_code', r.office_code as string)
        .eq('environment', r.environment as string)
        .maybeSingle();
      results.push({ ...summarize(r), delivery_log: log ?? null });
    }
    return NextResponse.json({ ok: true, action: 'send', summary, results });
  }

  return NextResponse.json({ error: 'action must be send | hold | requeue' }, { status: 400 });
}
