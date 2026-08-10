import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { getKillSwitch, getReplyConfig } from '@/lib/social/config';
import { isTripped } from '@/lib/social/circuit-breaker';
import { canReplyNow } from '@/lib/social/cadence';
import { loadBrandBrain } from '@/lib/social/brand-brain';
import { createSession, getBlueskyCreds } from '@/lib/social/bluesky';
import { runEngager, runInboundEngager } from '@/lib/social/engager';
import { runFollower } from '@/lib/social/follower';
import { publishReply } from '@/lib/social/publisher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/social-engager
 * Listen -> draft replies -> route. Elected-official replies are queued for
 * approval; citizen replies auto-post only when reply mode is autonomous.
 * Disabled unless reply_config.enabled is true.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const kill = await getKillSwitch();
  if (kill.is_paused) return NextResponse.json({ ok: true, skipped: 'paused' });

  const reply = await getReplyConfig();
  if (!reply.enabled) return NextResponse.json({ ok: true, skipped: 'replies disabled' });

  if (await isTripped()) return NextResponse.json({ ok: true, skipped: 'circuit breaker tripped' });

  const creds = getBlueskyCreds();
  if (!creds) return NextResponse.json({ ok: false, error: 'BLUESKY creds not set' }, { status: 500 });

  const brandBrain = await loadBrandBrain();
  const session = await createSession(creds.handle, creds.appPassword);
  // Outbound: find strangers' posts worth joining. Inbound: reply to people
  // engaging with US (replies/mentions/quotes) — otherwise we ignore everyone
  // who talks to us. Both feed the same social_replies queue + publish path.
  const searchDrafted = await runEngager(brandBrain, session);
  const inboundDrafted = await runInboundEngager(brandBrain, session);
  // Network growth: follow back followers + the people we've actually replied
  // to, so the account stops broadcasting into the void. Non-fatal.
  const followed = await runFollower(session, { maxPerRun: 20 }).catch(() => null);
  const drafted = {
    scanned: searchDrafted.scanned + inboundDrafted.scanned,
    drafted: searchDrafted.drafted + inboundDrafted.drafted,
    gated: searchDrafted.gated + inboundDrafted.gated,
    skipped: searchDrafted.skipped + inboundDrafted.skipped,
    inbound: inboundDrafted,
  };

  // Autonomous reply mode: post a few ready citizen replies, cadence-gated.
  const published: Array<{ replyId: string; ok: boolean; reason?: string }> = [];
  if (reply.mode === 'autonomous') {
    const admin = createAdminClient();
    // Replies go stale fast: a draft that never cleared cadence within 24h
    // would land on a days-old thread, so expire it instead of posting late.
    const cutoff = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
    const { data: stale } = await admin
      .from('social_replies')
      .select('id, guardrail_report')
      .eq('status', 'pending_post')
      .lt('created_at', cutoff);
    for (const row of stale ?? []) {
      await admin
        .from('social_replies')
        .update({
          status: 'skipped',
          guardrail_report: {
            ...((row.guardrail_report as Record<string, unknown>) ?? {}),
            skipReason: 'expired: cadence never allowed replying within 24h',
          },
        })
        .eq('id', row.id);
    }

    const { data: ready } = await admin
      .from('social_replies')
      .select('id')
      .eq('status', 'pending_post')
      .eq('requires_human', false)
      .gte('created_at', cutoff)
      .order('created_at', { ascending: true })
      .limit(3);
    for (const r of ready ?? []) {
      const cadence = await canReplyNow();
      if (!cadence.allowed) break;
      const res = await publishReply(r.id as string);
      published.push({ replyId: r.id as string, ok: res.ok, reason: res.reason });
      if (!res.ok) break;
    }
  }

  return NextResponse.json({ ok: true, mode: reply.mode, ...drafted, published, followed });
}
