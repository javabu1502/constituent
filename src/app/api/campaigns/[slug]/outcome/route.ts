import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Set/clear how a campaign's legislation ended (owner-only). */

const outcomeSchema = z.object({
  outcome: z.enum(['passed', 'failed', 'died_committee', 'vetoed', 'withdrawn']).nullable(),
  note: z.string().max(1000).nullish(),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data: campaign } = await admin.from('campaigns').select('id, creator_id').eq('slug', slug).single();
  if (!campaign) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (user.id !== campaign.creator_id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = outcomeSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid outcome' }, { status: 400 });

  const { error } = await admin
    .from('campaigns')
    .update({ outcome: parsed.data.outcome, outcome_note: parsed.data.note?.trim() || null })
    .eq('id', campaign.id);
  if (error) return NextResponse.json({ error: 'Failed to save' }, { status: 500 });
  return NextResponse.json({ ok: true });
}
