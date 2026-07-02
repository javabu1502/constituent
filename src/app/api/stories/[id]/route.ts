import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { applyAttribution } from '@/lib/story-attribution';
import { deDash } from '@/lib/claude';

/**
 * PATCH /api/stories/[id]
 * Storyteller edits their own story. Re-applies their chosen attribution (so an
 * anonymous story is re-redacted on every edit) and stamps edited_at, which
 * flags the change for the campaign collector.
 */
const editSchema = z.object({
  title: z.string().max(120).nullish(),
  body: z.string().min(20).max(8000),
});

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in to manage your stories.' }, { status: 401 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = editSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: 'A story of at least 20 characters is required.' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Load the existing story (owner + still active) to get its attribution.
  const { data: existing, error: loadErr } = await admin
    .from('stories')
    .select('id, attribution_level, storyteller_name')
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();
  if (loadErr || !existing) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }

  const level = existing.attribution_level as 'named' | 'first_name_only' | 'anonymous';
  const applied = await applyAttribution(parsed.data.body, level, existing.storyteller_name as string | null);

  const { data, error } = await admin
    .from('stories')
    .update({
      body: deDash(applied.final_body),
      title: parsed.data.title ? deDash(parsed.data.title).slice(0, 120) : null,
      edited_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .select('id')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Could not update the story' }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id, flagged: applied.flagged });
}

/**
 * DELETE /api/stories/[id]
 * Storyteller-initiated removal of their own story (soft revoke). The story is
 * marked 'revoked'; the collector sees it flagged (content hidden) and it's
 * excluded from exports. Only the signed-in owner can revoke; anonymous stories
 * have no owner and are removed via the emailed data-deletion request instead.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in to manage your stories.' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('stories')
    .update({ status: 'revoked', revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .select('id')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, id: data.id });
}
