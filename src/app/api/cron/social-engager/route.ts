import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { getKillSwitch, getReplyConfig } from '@/lib/social/config';
import { isTripped } from '@/lib/social/circuit-breaker';
import { canReplyNow } from '@/lib/social/cadence';
import { loadBrandBrain } from '@/lib/social/brand-brain';
import { createSession, getBlueskyCreds } from '@/lib/social/bluesky';
import { runEngager } from '@/lib/social/engager';
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
  const drafted = await runEngager(brandBrain, session);

  // Autonomous reply mode: post a few ready citizen replies, cadence-gated.
  const published: Array<{ replyId: string; ok: boolean; reason?: string }> = [];
  if (reply.mode === 'autonomous') {
    const admin = createAdminClient();
    const { data: ready } = await admin
      .from('social_replies')
      .select('id')
      .eq('status', 'pending_post')
      .eq('requires_human', false)
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

  return NextResponse.json({ ok: true, mode: reply.mode, ...drafted, published });
}
