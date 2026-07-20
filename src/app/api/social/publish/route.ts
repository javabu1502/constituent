import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { publishDraft, publishReply } from '@/lib/social/publisher';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function authorized(request: NextRequest): boolean {
  const auth = request.headers.get('authorization');
  return !!process.env.CRON_SECRET && auth === `Bearer ${process.env.CRON_SECRET}`;
}

/**
 * GET /api/social/publish — list pending_approval drafts for review.
 */
export async function GET(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const admin = createAdminClient();
  const [posts, replies] = await Promise.all([
    admin
      .from('social_posts')
      .select('id, platform, lane, body, link_url, status, created_at')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false })
      .limit(25),
    admin
      .from('social_replies')
      .select('id, lane, target_author, target_text, draft_body, requires_human, created_at')
      .eq('status', 'pending_approval')
      .order('created_at', { ascending: false })
      .limit(25),
  ]);
  return NextResponse.json({ ok: true, pending: posts.data ?? [], pendingReplies: replies.data ?? [] });
}

/**
 * POST /api/social/publish { postId | replyId, dryRun? } — approve and publish
 * a draft post or reply. The manual approval path for the gated phase, the
 * first live post, and every elected-official reply.
 */
export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body: { postId?: string; replyId?: string; dryRun?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (body.replyId) {
    const admin = createAdminClient();
    // Approve, then publish.
    await admin.from('social_replies').update({ status: 'approved' }).eq('id', body.replyId);
    const result = await publishReply(body.replyId, { dryRun: body.dryRun });
    return NextResponse.json(result, { status: result.ok ? 200 : 409 });
  }
  if (body.postId) {
    const result = await publishDraft(body.postId, { dryRun: body.dryRun });
    return NextResponse.json(result, { status: result.ok ? 200 : 409 });
  }
  return NextResponse.json({ error: 'postId or replyId required' }, { status: 400 });
}
