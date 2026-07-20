/**
 * Publisher — stage 6. Turns a stored draft into a real Bluesky post. This is
 * the ONLY code path that publishes. Every publish re-checks the kill switch,
 * the circuit breaker, and the structural guardrails before sending, and
 * feeds success/failure back to the breaker.
 */
import { createAdminClient } from '@/lib/supabase';
import { getKillSwitch } from './config';
import { isTripped, recordSuccess, recordFailure } from './circuit-breaker';
import { runGuardrails } from './guardrails';
import { post as blueskyPost, graphemeLength, BLUESKY_MAX_GRAPHEMES } from './bluesky';

export interface PublishResult {
  ok: boolean;
  postId: string;
  status: string;
  dryRun?: boolean;
  uri?: string;
  reason?: string;
}

const PUBLISHABLE = new Set(['pending_approval', 'approved']);

export async function publishDraft(
  postId: string,
  opts: { dryRun?: boolean } = {},
): Promise<PublishResult> {
  const admin = createAdminClient();
  const dryRun = opts.dryRun ?? process.env.SOCIAL_DRY_RUN === 'true';

  const { data: row, error } = await admin
    .from('social_posts')
    .select('id, platform, body, status')
    .eq('id', postId)
    .maybeSingle();
  if (error || !row) return { ok: false, postId, status: 'not_found', reason: 'post not found' };
  if (!PUBLISHABLE.has(row.status as string)) {
    return { ok: false, postId, status: row.status as string, reason: `not publishable from status ${row.status}` };
  }

  // Master kill switch and circuit breaker — checked at the moment of sending,
  // not just when the draft was made.
  const kill = await getKillSwitch();
  if (kill.is_paused) return { ok: false, postId, status: row.status as string, reason: `kill switch paused: ${kill.reason ?? ''}` };
  if (await isTripped()) return { ok: false, postId, status: row.status as string, reason: 'circuit breaker tripped' };

  // Structural guardrail backstop (nonpartisan, em dash, length).
  const gate = runGuardrails({ text: row.body as string, maxLength: BLUESKY_MAX_GRAPHEMES, graphemeLength });
  if (!gate.passed) {
    const reason = gate.checks.filter((c) => !c.passed && c.severity === 'block').map((c) => c.reason).join('; ');
    await admin.from('social_posts').update({ status: 'skipped', guardrail_report: gate }).eq('id', postId);
    return { ok: false, postId, status: 'skipped', reason: `guardrail block: ${reason}` };
  }

  if (dryRun) {
    await admin.from('social_posts').update({ status: 'approved', dry_run: true }).eq('id', postId);
    return { ok: true, postId, status: 'approved', dryRun: true, reason: 'dry run — not sent' };
  }

  try {
    const result = await blueskyPost(row.body as string, { dryRun: false });
    await admin
      .from('social_posts')
      .update({
        status: 'posted',
        dry_run: false,
        posted_at: new Date().toISOString(),
        external_post_id: result.uri,
        external_post_cid: result.cid,
      })
      .eq('id', postId);
    await recordSuccess();
    return { ok: true, postId, status: 'posted', uri: result.uri };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const breaker = await recordFailure(msg);
    await admin
      .from('social_posts')
      .update({ status: 'failed', guardrail_report: { publish_error: msg } })
      .eq('id', postId);
    return {
      ok: false,
      postId,
      status: 'failed',
      reason: breaker.tripped ? `${msg} (circuit breaker tripped)` : msg,
    };
  }
}
