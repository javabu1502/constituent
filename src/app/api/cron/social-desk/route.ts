import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { getKillSwitch, getMode } from '@/lib/social/config';
import { scoutCampaigns, scoutNews, nextSignal, markSignalUsed } from '@/lib/social/scout';
import { loadBrandBrain } from '@/lib/social/brand-brain';
import { writePost } from '@/lib/social/writer';
import { runGuardrails, isNearDuplicate } from '@/lib/social/guardrails';
import { graphemeLength, BLUESKY_MAX_GRAPHEMES } from '@/lib/social/bluesky';
import { publishDraft } from '@/lib/social/publisher';
import { isTripped } from '@/lib/social/circuit-breaker';
import { canPostNow } from '@/lib/social/cadence';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// djb2 — cheap normalized-content fingerprint for near-duplicate lookups.
function contentHash(s: string): string {
  const norm = s.toLowerCase().replace(/https?:\/\/\S+/g, '').replace(/[^a-z0-9]+/g, ' ').trim();
  let h = 5381;
  for (let i = 0; i < norm.length; i++) h = ((h << 5) + h + norm.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}

/**
 * GET /api/cron/social-desk
 * One run of the pipeline: Scout -> Writer -> Guardrail. Produces a
 * pending_approval draft in social_posts. It NEVER publishes — going live is a
 * separate, deliberate step. Kill switch halts it entirely.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const kill = await getKillSwitch();
  if (kill.is_paused) {
    return NextResponse.json({ ok: true, skipped: 'paused', reason: kill.reason });
  }

  const admin = createAdminClient();
  const scouted = (await scoutCampaigns()) + (await scoutNews());

  const signal = await nextSignal();
  if (!signal) {
    return NextResponse.json({ ok: true, scouted, skipped: 'no signal' });
  }

  const brandBrain = await loadBrandBrain();
  const draft = await writePost(brandBrain, signal);

  // Guardrails + near-duplicate check against recent drafts/posts.
  const isNews = signal.source === 'news';
  const gate = runGuardrails({
    text: draft.text,
    sourceText: `${signal.title ?? ''}\n${signal.summary ?? ''}`,
    maxLength: BLUESKY_MAX_GRAPHEMES,
    graphemeLength,
    strictAccuracy: isNews, // news claims must trace to the source or they're blocked
  });
  const { data: recentRows } = await admin
    .from('social_posts')
    .select('body')
    .in('status', ['pending_approval', 'approved', 'queued', 'posted'])
    .order('created_at', { ascending: false })
    .limit(50);
  const duplicate = isNearDuplicate(draft.text, (recentRows ?? []).map((r) => r.body as string));

  // Only a clean, non-duplicate draft becomes pending_approval; everything
  // else is recorded as skipped with the reason, for the daily digest.
  const status = gate.passed && !duplicate ? 'pending_approval' : 'skipped';
  const skipReason = !gate.passed
    ? gate.checks.filter((c) => !c.passed && c.severity === 'block').map((c) => c.reason).join('; ')
    : duplicate
      ? 'near-duplicate of a recent post'
      : null;

  const { data: inserted, error: insErr } = await admin
    .from('social_posts')
    .insert({
      platform: 'bluesky',
      lane: draft.lane,
      body: draft.text,
      link_url: signal.url,
      issue_area: signal.issue_area,
      content_hash: contentHash(draft.text),
      signal_id: signal.id,
      campaign_slug: signal.campaign_slug,
      status,
      dry_run: process.env.SOCIAL_DRY_RUN === 'true',
      guardrail_report: { ...gate, duplicate, skipReason },
    })
    .select('id')
    .single();

  if (insErr) {
    return NextResponse.json({ ok: false, error: 'insert failed', detail: insErr.message }, { status: 500 });
  }

  await markSignalUsed(signal.id);

  // Autonomous mode: publish a clean draft right away, still gated by cadence
  // and the circuit breaker. Gated mode leaves it pending_approval for review.
  let published: { attempted: boolean; ok?: boolean; status?: string; reason?: string; uri?: string } = {
    attempted: false,
  };
  // The news lane is always gated for review, even in autonomous mode — an
  // unsupervised paraphrase of breaking news is the one thing we don't ship.
  if (status === 'pending_approval' && inserted?.id && !isNews) {
    const mode = await getMode();
    if (mode === 'autonomous') {
      if (await isTripped()) {
        published = { attempted: false, reason: 'circuit breaker tripped' };
      } else {
        const cadence = await canPostNow('bluesky');
        if (!cadence.allowed) {
          published = { attempted: false, reason: cadence.reason };
        } else {
          const result = await publishDraft(inserted.id);
          published = { attempted: true, ok: result.ok, status: result.status, reason: result.reason, uri: result.uri };
        }
      }
    }
  }

  return NextResponse.json({
    ok: true,
    scouted,
    post_id: inserted?.id,
    status,
    lane: draft.lane,
    graphemes: graphemeLength(draft.text),
    guardrail_passed: gate.passed,
    duplicate,
    skipReason,
    published,
    draft: draft.text,
  });
}
