import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { STORY_USAGE_OPTIONS } from '@/lib/story-usage';
import { permissionRequestEmail } from '@/lib/story-permission';
import { isEmailConfigured, sendDigestEmail } from '@/lib/resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * The organization's use log for one story (campaign owner only).
 *
 * POST records a use. If the storyteller granted that use at consent the row
 * is 'logged'. If not, and the storyteller left a contact email, the row is
 * 'requested' and they receive an email with approve/decline links. A
 * storyteller who left no email cannot be asked, so the request is refused.
 */

const useSchema = z.object({
  use_type: z.enum(STORY_USAGE_OPTIONS.map((o) => o.value) as [string, ...string[]]),
  note: z.string().trim().min(10, 'Say what, where, and when').max(500),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = useSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid request' }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: story } = await admin
    .from('stories')
    .select('id, campaign_id, status, storyteller_email, body, consent_usage_snapshot, campaigns(creator_id, headline, org_name, slug)')
    .eq('id', id)
    .single();
  if (!story) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const campaign = (Array.isArray(story.campaigns) ? story.campaigns[0] : story.campaigns) as
    | { creator_id: string; headline: string; org_name: string | null; slug: string }
    | null;
  if (!campaign || campaign.creator_id !== user.id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });
  if (story.status !== 'active') {
    return NextResponse.json({ error: 'This story was withdrawn. It may not be used.' }, { status: 409 });
  }

  const granted = ((story.consent_usage_snapshot as { granted_uses?: string[] } | null)?.granted_uses ?? []) as string[];
  const useType = parsed.data.use_type;
  const option = STORY_USAGE_OPTIONS.find((o) => o.value === useType)!;

  if (granted.includes(useType)) {
    const { data, error } = await admin
      .from('story_uses')
      .insert({ story_id: id, campaign_id: story.campaign_id, requested_by: user.id, use_type: useType, note: parsed.data.note, status: 'logged' })
      .select('id, use_type, note, status, created_at, responded_at')
      .single();
    if (error || !data) return NextResponse.json({ error: 'Could not record the use' }, { status: 500 });
    return NextResponse.json({ use: data });
  }

  // Not granted: this becomes a request, which needs a way to reach the teller.
  const email = (story.storyteller_email as string | null)?.trim();
  if (!email) {
    return NextResponse.json(
      { error: 'The storyteller did not allow this use and left no contact email, so it cannot be requested.' },
      { status: 409 }
    );
  }
  if (!isEmailConfigured()) {
    return NextResponse.json({ error: 'Permission requests are not available right now.' }, { status: 503 });
  }
  const { data: open } = await admin
    .from('story_uses')
    .select('id, status, created_at')
    .eq('story_id', id)
    .eq('use_type', useType)
    .in('status', ['requested', 'declined'])
    .order('created_at', { ascending: false })
    .limit(1);
  const last = open?.[0];
  if (last?.status === 'requested') {
    return NextResponse.json({ error: 'A request for this use is already waiting for the storyteller.' }, { status: 409 });
  }
  if (last?.status === 'declined' && Date.now() - new Date(last.created_at as string).getTime() < 30 * 24 * 3600 * 1000) {
    return NextResponse.json({ error: 'The storyteller declined this use within the last 30 days. Please wait before asking again.' }, { status: 409 });
  }

  const { data: row, error } = await admin
    .from('story_uses')
    .insert({ story_id: id, campaign_id: story.campaign_id, requested_by: user.id, use_type: useType, note: parsed.data.note, status: 'requested' })
    .select('id, use_type, note, status, created_at, responded_at')
    .single();
  if (error || !row) return NextResponse.json({ error: 'Could not create the request' }, { status: 500 });

  const excerpt = String(story.body || '').replace(/\s+/g, ' ').slice(0, 140) + (String(story.body || '').length > 140 ? '...' : '');
  const mail = permissionRequestEmail({
    orgName: campaign.org_name || 'The organization running this campaign',
    campaignName: campaign.headline,
    useLabel: option.label,
    note: parsed.data.note,
    storyExcerpt: excerpt,
    useId: row.id as string,
  });
  try {
    await sendDigestEmail(email, mail.subject, mail.html);
  } catch (err) {
    console.error('[story-uses] permission email failed:', err);
    await admin.from('story_uses').delete().eq('id', row.id);
    return NextResponse.json({ error: 'The request email could not be sent. Please try again.' }, { status: 502 });
  }
  return NextResponse.json({ use: row });
}
