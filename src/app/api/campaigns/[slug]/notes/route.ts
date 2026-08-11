import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Meeting/stakeholder notes for a campaign (owner-only).
 * POST — add a note, optionally attached to a legislator.
 * DELETE ?id= — remove one.
 */

const noteSchema = z.object({
  body: z.string().min(1).max(5000),
  legislator_id: z.string().max(120).nullish(),
  legislator_name: z.string().max(200).nullish(),
});

async function loadOwned(slug: string) {
  const admin = createAdminClient();
  const { data: campaign } = await admin.from('campaigns').select('id, creator_id').eq('slug', slug).single();
  if (!campaign) return { error: 'not_found' as const };
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'unauthorized' as const };
  if (user.id !== campaign.creator_id) return { error: 'forbidden' as const };
  return { campaign, admin, userId: user.id };
}

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await loadOwned(slug);
  if ('error' in res) {
    const status = res.error === 'not_found' ? 404 : res.error === 'unauthorized' ? 401 : 403;
    return NextResponse.json({ error: res.error }, { status });
  }

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = noteSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid note' }, { status: 400 });

  const { data, error } = await res.admin
    .from('campaign_notes')
    .insert({
      creator_id: res.userId,
      campaign_id: res.campaign.id,
      legislator_id: parsed.data.legislator_id ?? null,
      legislator_name: parsed.data.legislator_name ?? null,
      body: parsed.data.body.trim(),
    })
    .select('id, legislator_id, legislator_name, body, created_at')
    .single();
  if (error) {
    console.error('[notes] insert failed:', error);
    return NextResponse.json({ error: 'Failed to save note' }, { status: 500 });
  }
  return NextResponse.json({ note: data });
}

export async function DELETE(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const res = await loadOwned(slug);
  if ('error' in res) {
    const status = res.error === 'not_found' ? 404 : res.error === 'unauthorized' ? 401 : 403;
    return NextResponse.json({ error: res.error }, { status });
  }

  const id = req.nextUrl.searchParams.get('id');
  if (!id) return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  const { error } = await res.admin.from('campaign_notes').delete().eq('id', id).eq('campaign_id', res.campaign.id);
  if (error) return NextResponse.json({ error: 'Failed to delete note' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
