import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { isAdmin } from '@/lib/admin';

/**
 * GET /api/admin/campaigns
 * List campaigns for review. Admin only. Enriches each with the creator's
 * email so the dashboard can offer a prefilled "notify the creator" mailto.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: campaigns, error } = await admin
    .from('campaigns')
    .select('id, slug, headline, description, issue_area, target_level, status, approval_status, campaign_type, visibility, story_prompt, usage_statement, distribution_plan, recipient_email, review_note, created_at, creator_id')
    .in('approval_status', ['pending', 'approved', 'rejected'])
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }

  // Look up creator emails (small admin list; one call each is fine).
  const enriched = await Promise.all(
    (campaigns ?? []).map(async (c) => {
      let creator_email: string | null = null;
      try {
        const { data: u } = await admin.auth.admin.getUserById(c.creator_id);
        creator_email = u?.user?.email ?? null;
      } catch {
        // best-effort — leave null
      }
      return { ...c, creator_email };
    })
  );

  return NextResponse.json(enriched);
}

/**
 * PATCH /api/admin/campaigns
 * Approve or reject a campaign. Admin only.
 * Body: { campaignId: string, action: 'approve' | 'reject', note?: string }
 *
 * Sets the moderation `approval_status` (separate from the live `status`),
 * stamps reviewer + timestamp, and records an optional review note. The share
 * link / directory only go live once approval_status = 'approved'.
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { campaignId?: string; action?: string; note?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { campaignId, action, note } = body;
  if (!campaignId || !action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'campaignId and action (approve|reject) required' }, { status: 400 });
  }

  const approved = action === 'approve';

  const admin = createAdminClient();
  const { data: campaign, error } = await admin
    .from('campaigns')
    .update({
      approval_status: approved ? 'approved' : 'rejected',
      status: approved ? 'active' : 'rejected',
      reviewed_by: user.id,
      approved_at: approved ? new Date().toISOString() : null,
      review_note: note?.trim() ? note.trim() : null,
    })
    .eq('id', campaignId)
    .select('id, slug, headline, status, approval_status, campaign_type, creator_id, review_note')
    .single();

  if (error || !campaign) {
    return NextResponse.json({ error: 'Campaign not found or update failed' }, { status: 404 });
  }

  // Resolve the creator's email so the admin can send a personalized note.
  let creator_email: string | null = null;
  try {
    const { data: u } = await admin.auth.admin.getUserById(campaign.creator_id);
    creator_email = u?.user?.email ?? null;
  } catch {
    // best-effort
  }

  return NextResponse.json({ ...campaign, creator_email });
}
