import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';

function isAdmin(userId: string): boolean {
  const adminIds = process.env.ADMIN_USER_IDS?.split(',').map(id => id.trim()) ?? [];
  return adminIds.includes(userId);
}

/**
 * GET /api/admin/campaigns
 * List campaigns pending approval. Admin only.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const admin = createAdminClient();
  const { data: campaigns, error } = await admin
    .from('campaigns')
    .select('id, slug, headline, description, issue_area, target_level, status, created_at, creator_id')
    .in('status', ['pending', 'active', 'rejected', 'paused'])
    .order('created_at', { ascending: false })
    .limit(100);

  if (error) {
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }

  return NextResponse.json(campaigns);
}

/**
 * PATCH /api/admin/campaigns
 * Approve or reject a campaign. Admin only.
 * Body: { campaignId: string, action: 'approve' | 'reject' }
 */
export async function PATCH(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user || !isAdmin(user.id)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  let body: { campaignId?: string; action?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { campaignId, action } = body;
  if (!campaignId || !action || !['approve', 'reject'].includes(action)) {
    return NextResponse.json({ error: 'campaignId and action (approve|reject) required' }, { status: 400 });
  }

  const newStatus = action === 'approve' ? 'active' : 'rejected';

  const admin = createAdminClient();
  const { data: campaign, error } = await admin
    .from('campaigns')
    .update({ status: newStatus })
    .eq('id', campaignId)
    .select('id, slug, headline, status')
    .single();

  if (error || !campaign) {
    return NextResponse.json({ error: 'Campaign not found or update failed' }, { status: 404 });
  }

  return NextResponse.json(campaign);
}
