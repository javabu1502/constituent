import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { publishDraft } from '@/lib/social/publisher';

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
  const { data } = await admin
    .from('social_posts')
    .select('id, platform, lane, body, link_url, status, created_at')
    .eq('status', 'pending_approval')
    .order('created_at', { ascending: false })
    .limit(25);
  return NextResponse.json({ ok: true, pending: data ?? [] });
}

/**
 * POST /api/social/publish { postId, dryRun? } — approve and publish a draft.
 * The manual approval path for the gated phase and the first live post.
 */
export async function POST(request: NextRequest) {
  if (!authorized(request)) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  let body: { postId?: string; dryRun?: boolean };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (!body.postId) return NextResponse.json({ error: 'postId required' }, { status: 400 });

  const result = await publishDraft(body.postId, { dryRun: body.dryRun });
  return NextResponse.json(result, { status: result.ok ? 200 : 409 });
}
