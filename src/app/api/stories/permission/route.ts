import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyStoryPermissionToken, type PermissionAnswer } from '@/lib/story-permission';
import { STORY_USAGE_OPTIONS } from '@/lib/story-usage';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * A storyteller answers a permission request from the email link. The token
 * is bound to the request id and the answer. GET shows the request; POST
 * records the answer. The first answer stands; a second click just shows it.
 */

function parse(req: NextRequest) {
  const id = req.nextUrl.searchParams.get('id') ?? '';
  const answer = req.nextUrl.searchParams.get('answer') as PermissionAnswer | null;
  const token = req.nextUrl.searchParams.get('token') ?? '';
  if (!id || (answer !== 'approve' && answer !== 'decline') || !verifyStoryPermissionToken(id, answer, token)) return null;
  return { id, answer };
}

async function load(id: string) {
  const admin = createAdminClient();
  const { data } = await admin
    .from('story_uses')
    .select('id, use_type, note, status, created_at, responded_at, campaigns(headline, org_name)')
    .eq('id', id)
    .single();
  if (!data) return null;
  const campaign = (Array.isArray(data.campaigns) ? data.campaigns[0] : data.campaigns) as { headline: string; org_name: string | null } | null;
  return {
    admin,
    view: {
      id: data.id as string,
      use_label: STORY_USAGE_OPTIONS.find((o) => o.value === data.use_type)?.label ?? (data.use_type as string),
      note: data.note as string,
      status: data.status as string,
      org_name: campaign?.org_name ?? null,
      campaign_headline: campaign?.headline ?? null,
    },
  };
}

export async function GET(req: NextRequest) {
  const p = parse(req);
  if (!p) return NextResponse.json({ error: 'This link is not valid.' }, { status: 400 });
  const loaded = await load(p.id);
  if (!loaded) return NextResponse.json({ error: 'This request no longer exists.' }, { status: 404 });
  return NextResponse.json({ request: loaded.view, answer: p.answer });
}

export async function POST(req: NextRequest) {
  const p = parse(req);
  if (!p) return NextResponse.json({ error: 'This link is not valid.' }, { status: 400 });
  const loaded = await load(p.id);
  if (!loaded) return NextResponse.json({ error: 'This request no longer exists.' }, { status: 404 });
  if (loaded.view.status !== 'requested') {
    return NextResponse.json({ request: loaded.view, already: true });
  }
  const status = p.answer === 'approve' ? 'approved' : 'declined';
  const { data } = await loaded.admin
    .from('story_uses')
    .update({ status, responded_at: new Date().toISOString() })
    .eq('id', p.id)
    .eq('status', 'requested')
    .select('status')
    .single();
  return NextResponse.json({ request: { ...loaded.view, status: data?.status ?? loaded.view.status }, already: !data });
}
