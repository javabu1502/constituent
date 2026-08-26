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
import { canPostNow } from './cadence';
import { post as blueskyPost, graphemeLength, BLUESKY_MAX_GRAPHEMES, createSession, getBlueskyCreds } from './bluesky';

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
    .select('id, platform, body, status, link_url')
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
    const result = await blueskyPost(row.body as string, {
      dryRun: false,
      // Cards lift click-through vs bare links; replies stay card-free (a big
      // banner in a conversation thread reads as spam).
      linkCardUrl: (row.link_url as string) || undefined,
    });
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

export interface SweepResult {
  published: number;
  expired: number;
  reason?: string;
}

/**
 * Drain the autonomous backlog. A draft that clears guardrails while the
 * cadence gate is closed lands in pending_approval and, without this sweep,
 * waits for manual approval forever. Publishes the oldest fresh draft if
 * cadence allows, and expires drafts older than 24h — a stale daily brief
 * should not post a day late.
 */
export async function sweepPendingDrafts(): Promise<SweepResult> {
  const admin = createAdminClient();
  const cutoff = new Date(Date.now() - 24 * 60 * 60_000).toISOString();

  const { data: stale } = await admin
    .from('social_posts')
    .select('id, guardrail_report')
    .eq('status', 'pending_approval')
    .lt('created_at', cutoff);
  for (const row of stale ?? []) {
    await admin
      .from('social_posts')
      .update({
        status: 'skipped',
        guardrail_report: {
          ...((row.guardrail_report as Record<string, unknown>) ?? {}),
          skipReason: 'expired: cadence never allowed posting within 24h',
        },
      })
      .eq('id', row.id);
  }
  const expired = (stale ?? []).length;

  const { data: next } = await admin
    .from('social_posts')
    .select('id')
    .eq('status', 'pending_approval')
    .gte('created_at', cutoff)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();
  if (!next) return { published: 0, expired };

  const cadence = await canPostNow('bluesky');
  if (!cadence.allowed) return { published: 0, expired, reason: cadence.reason };

  const result = await publishDraft(next.id as string);
  return { published: result.ok ? 1 : 0, expired, reason: result.ok ? undefined : result.reason };
}

export interface ReplyResult {
  ok: boolean;
  replyId: string;
  status: string;
  reason?: string;
  uri?: string;
}

/**
 * Publish an approved reply from social_replies. Same safety chain as posts.
 * Elected-official replies must already be approved (requires_human handling
 * happens upstream in the Engager); this refuses anything not approved.
 */
export async function publishReply(replyId: string, opts: { dryRun?: boolean } = {}): Promise<ReplyResult> {
  const admin = createAdminClient();
  const dryRun = opts.dryRun ?? process.env.SOCIAL_DRY_RUN === 'true';

  const { data: row, error } = await admin
    .from('social_replies')
    .select('id, draft_body, status, target_uri, requires_human')
    .eq('id', replyId)
    .maybeSingle();
  if (error || !row) return { ok: false, replyId, status: 'not_found', reason: 'reply not found' };
  if (!['approved', 'pending_post'].includes(row.status as string)) {
    return { ok: false, replyId, status: row.status as string, reason: `not publishable from ${row.status}` };
  }

  const kill = await getKillSwitch();
  if (kill.is_paused) return { ok: false, replyId, status: row.status as string, reason: 'kill switch paused' };
  if (await isTripped()) return { ok: false, replyId, status: row.status as string, reason: 'circuit breaker tripped' };

  const gate = runGuardrails({ text: row.draft_body as string, maxLength: BLUESKY_MAX_GRAPHEMES, graphemeLength });
  if (!gate.passed) {
    await admin.from('social_replies').update({ status: 'skipped', guardrail_report: gate }).eq('id', replyId);
    return { ok: false, replyId, status: 'skipped', reason: 'guardrail block' };
  }

  if (dryRun) {
    await admin.from('social_replies').update({ status: 'approved', dry_run: true }).eq('id', replyId);
    return { ok: true, replyId, status: 'approved', reason: 'dry run — not sent' };
  }

  try {
    // The stored target_uri/cid + root live on the reply row's metadata; the
    // Engager writes a fully-formed reply ref there.
    const { data: meta } = await admin.from('social_replies').select('guardrail_report').eq('id', replyId).maybeSingle();
    const ref = (meta?.guardrail_report as { replyRef?: { root: { uri: string; cid: string }; parent: { uri: string; cid: string } } } | null)?.replyRef;
    const creds = getBlueskyCreds();
    if (!creds) throw new Error('BLUESKY creds not set');
    const session = await createSession(creds.handle, creds.appPassword);
    const result = await blueskyPost(row.draft_body as string, { dryRun: false, reply: ref, session });
    await admin
      .from('social_replies')
      .update({ status: 'posted', dry_run: false, posted_at: new Date().toISOString(), external_post_id: result.uri })
      .eq('id', replyId);
    await recordSuccess();
    return { ok: true, replyId, status: 'posted', uri: result.uri };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await recordFailure(msg);
    await admin.from('social_replies').update({ status: 'failed' }).eq('id', replyId);
    return { ok: false, replyId, status: 'failed', reason: msg };
  }
}
