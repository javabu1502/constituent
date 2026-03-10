import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';

/**
 * GET /api/campaigns/[slug]
 * Get campaign by slug. Public for active campaigns.
 * If requester is creator, includes analytics.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  const admin = createAdminClient();

  // Fetch campaign
  const { data: campaign, error } = await admin
    .from('campaigns')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  // Check if requester is the creator
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  const isCreator = user && user.id === campaign.creator_id;

  // Non-creators can only see active campaigns
  if (!isCreator && campaign.status !== 'active') {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  // If creator, include analytics
  if (isCreator) {
    const [messagesResult, actionsResult, statesResult, recentActionsResult, dailyCountsResult, deliveryBreakdownResult] = await Promise.all([
      admin
        .from('messages')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id),
      admin
        .from('campaign_actions')
        .select('id', { count: 'exact', head: true })
        .eq('campaign_id', campaign.id),
      admin
        .from('campaign_actions')
        .select('participant_state')
        .eq('campaign_id', campaign.id),
      admin
        .from('campaign_actions')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: false })
        .limit(50),
      // Daily counts (last 30 days)
      admin
        .from('campaign_actions')
        .select('created_at')
        .eq('campaign_id', campaign.id)
        .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()),
      // Delivery breakdown
      admin
        .from('messages')
        .select('delivery_method')
        .eq('campaign_id', campaign.id),
    ]);

    // Daily counts
    const dailyCounts: Record<string, number> = {};
    for (const action of dailyCountsResult.data || []) {
      const date = new Date(action.created_at).toISOString().split('T')[0];
      dailyCounts[date] = (dailyCounts[date] || 0) + 1;
    }

    // Delivery breakdown
    const deliveryBreakdown: Record<string, number> = {};
    for (const msg of deliveryBreakdownResult.data || []) {
      const method = msg.delivery_method || 'unknown';
      deliveryBreakdown[method] = (deliveryBreakdown[method] || 0) + 1;
    }

    // Top states
    const stateCounts: Record<string, number> = {};
    for (const action of statesResult.data || []) {
      const state = action.participant_state;
      stateCounts[state] = (stateCounts[state] || 0) + 1;
    }
    const topStates = Object.entries(stateCounts)
      .map(([state, count]) => ({ state, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10);

    const statesSet = new Set(
      (statesResult.data || []).map((a: { participant_state: string }) => a.participant_state)
    );

    const totalMessages = messagesResult.count || 0;
    const totalActions = actionsResult.count || 0;

    return NextResponse.json({
      ...campaign,
      analytics: {
        total_actions: totalActions,
        total_messages: totalMessages,
        states_represented: Array.from(statesSet),
        recent_actions: recentActionsResult.data || [],
        daily_counts: dailyCounts,
        delivery_breakdown: deliveryBreakdown,
        top_states: topStates,
        avg_messages_per_action: totalActions > 0 ? Math.round((totalMessages / totalActions) * 10) / 10 : 0,
      },
    });
  }

  return NextResponse.json(campaign);
}

/**
 * DELETE /api/campaigns/[slug]
 * Delete campaign. Only the creator can delete.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  // Verify ownership
  const { data: campaign } = await admin
    .from('campaigns')
    .select('id, creator_id')
    .eq('slug', slug)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  if (campaign.creator_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { error } = await admin
    .from('campaigns')
    .delete()
    .eq('id', campaign.id);

  if (error) {
    return NextResponse.json({ error: 'Failed to delete campaign' }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
