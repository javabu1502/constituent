import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

/**
 * POST /api/campaigns/[slug]/participate
 * Record a participation action (public, no auth required)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  let body: {
    participant_name: string;
    participant_city: string;
    participant_state: string;
    messages_sent: number;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { participant_name, participant_city, participant_state, messages_sent } = body;

  if (!participant_name || !participant_city || !participant_state) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const admin = createAdminClient();

  // Look up campaign by slug
  const { data: campaign, error: campaignError } = await admin
    .from('campaigns')
    .select('id')
    .eq('slug', slug)
    .eq('status', 'active')
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }

  // Insert campaign action
  const { error: actionError } = await admin
    .from('campaign_actions')
    .insert({
      campaign_id: campaign.id,
      participant_name,
      participant_city,
      participant_state,
      messages_sent: messages_sent || 0,
    });

  if (actionError) {
    console.error('[participate] Insert error:', actionError);
    return NextResponse.json({ error: 'Failed to record participation' }, { status: 500 });
  }

  // Increment action count
  const { error: rpcError } = await admin.rpc('increment_campaign_action_count', {
    campaign_slug: slug,
  });

  if (rpcError) {
    console.error('[participate] RPC error:', rpcError);
  }

  return NextResponse.json({ success: true, campaign_id: campaign.id });
}
