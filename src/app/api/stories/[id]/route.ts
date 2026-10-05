import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { applyAttribution } from '@/lib/story-attribution';
import { deDash } from '@/lib/claude';
import { renderStoryEnglish } from '@/lib/language';
import { verifyStoryRevokeToken } from '@/lib/story-revoke';

/** A revoke or edit changes what the organization may quote: drop the cached AI insights. */
async function invalidateInsights(admin: ReturnType<typeof createAdminClient>, campaignId: string): Promise<void> {
  const { error } = await admin.from('campaign_insights').delete().eq('campaign_id', campaignId);
  if (error) console.error('[stories] insights invalidation failed:', error.message);
}

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
    .select('id, attribution_level, storyteller_name, campaign_id')
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .single();
  if (loadErr || !existing) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }

  const level = existing.attribution_level as 'named' | 'first_name_only' | 'anonymous';
  const applied = await applyAttribution(parsed.data.body, level, existing.storyteller_name as string | null);
  const finalBody = deDash(applied.final_body);
  const rendered = await renderStoryEnglish(finalBody);

  const { data, error } = await admin
    .from('stories')
    .update({
      body: finalBody,
      language: rendered.language,
      body_en: rendered.body_en,
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
  await invalidateInsights(admin, existing.campaign_id as string);

  return NextResponse.json({ success: true, id: data.id, flagged: applied.flagged });
}

/**
 * DELETE /api/stories/[id]
 * Storyteller-initiated removal of their own story (soft revoke). The story is
 * marked 'revoked'; the collector sees it flagged (content hidden) and it's
 * excluded from exports. The signed-in owner can revoke, and so can a guest
 * who presents the revoke token issued at submission.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const admin = createAdminClient();

  // Two ways to prove ownership: the signed-in owner, or the revoke token the
  // storyteller received when they submitted (guests have no account).
  const token = request.nextUrl.searchParams.get('token') ?? '';
  let query = admin.from('stories').update({ status: 'revoked', revoked_at: new Date().toISOString() }).eq('id', id).eq('status', 'active');
  if (token && verifyStoryRevokeToken(id, token)) {
    // token proves ownership
  } else {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: 'Sign in, or use the withdraw link from your submission, to remove this story.' }, { status: 401 });
    }
    query = query.eq('user_id', user.id);
  }
  const { data, error } = await query.select('id, campaign_id').single();

  if (error || !data) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }
  await invalidateInsights(admin, data.campaign_id as string);
  const { error: decErr } = await admin.rpc('decrement_campaign_story_count', { campaign_uuid: data.campaign_id });
  if (decErr) console.error('[stories] story-count decrement failed:', decErr.message);

  return NextResponse.json({ success: true, id: data.id });
}
