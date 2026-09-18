import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { updateCampaignSchema, parseBody } from '@/lib/schemas';
import { profileLimiter, getClientIp } from '@/lib/rate-limit';
import { sendAdminNotification } from '@/lib/resend';

function publicCampaign(campaign: Record<string, unknown>) {
  return {
    id: campaign.id,
    slug: campaign.slug,
    headline: campaign.headline,
    description: campaign.description,
    issue_area: campaign.issue_area,
    issue_subtopic: campaign.issue_subtopic,
    target_level: campaign.target_level,
    status: campaign.status,
    campaign_type: campaign.campaign_type,
    visibility: campaign.visibility,
    message_template: campaign.message_template,
    bill_level: campaign.bill_level,
    bill_state: campaign.bill_state,
    bill_ref: campaign.bill_ref,
    bill_title: campaign.bill_title,
    bill_url: campaign.bill_url,
    story_prompt: campaign.story_prompt,
    usage_statement: campaign.usage_statement,
    usage_tags: campaign.usage_tags,
    attribution_options: campaign.attribution_options,
    edit_revoke_policy: campaign.edit_revoke_policy,
    action_count: campaign.action_count,
    story_count: campaign.story_count,
    created_at: campaign.created_at,
    // White-label branding (public-facing by design on unlisted campaigns)
    org_name: campaign.org_name,
    org_url: campaign.org_url,
    org_logo_url: campaign.org_logo_url,
    brand_color: campaign.brand_color,
    custom_domain: campaign.custom_domain,
    // Neutral framing
    case_for: campaign.case_for,
    case_against: campaign.case_against,
    source_for_label: campaign.source_for_label,
    source_for_url: campaign.source_for_url,
    source_against_label: campaign.source_against_label,
    source_against_url: campaign.source_against_url,
    is_bill_specific: campaign.is_bill_specific,
    bill_congress: campaign.bill_congress,
    bill_type: campaign.bill_type,
    bill_number: campaign.bill_number,
    is_official: campaign.is_official,
    // Reader-poll aggregates
    support_count: campaign.support_count,
    oppose_count: campaign.oppose_count,
    undecided_count: campaign.undecided_count,
  };
}

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

  return NextResponse.json(publicCampaign(campaign));
}

/**
 * PATCH /api/campaigns/[slug]
 * Edit a campaign. Only the creator can edit; stages are not editable here.
 *
 * Every edit re-enters review (approval_status/status back to 'pending'), so
 * an approved campaign can't silently become something else after approval —
 * the page goes offline until the changes are re-approved. The slug never
 * changes, so shared links survive the edit.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const ip = getClientIp(request);
  const { success, retryAfter } = profileLimiter.check(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  }

  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from('campaigns')
    .select('id, creator_id, campaign_type, parent_campaign_id, headline')
    .eq('slug', slug)
    .single();

  if (!campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }
  if (campaign.creator_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }
  if (campaign.parent_campaign_id) {
    return NextResponse.json({ error: 'Stages are not editable. Edit the parent campaign instead.' }, { status: 400 });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = parseBody(updateCampaignSchema, raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const updates: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(parsed.data)) {
    if (value !== undefined) updates[key] = value;
  }

  // Fields that belong to the other campaign type are dropped, not errors —
  // the shared form always sends its full field set.
  const isStory = campaign.campaign_type === 'storytelling';
  const advocacyOnly = ['target_level', 'direction', 'message_template', 'distribution_plan', 'bill_level', 'bill_state', 'bill_ref', 'bill_title', 'bill_url'];
  const storyOnly = ['story_prompt', 'usage_tags'];
  for (const key of isStory ? advocacyOnly : storyOnly) {
    delete updates[key];
  }

  // The logo must live in OUR storage bucket (same rule as creation).
  if (typeof updates.org_logo_url === 'string' && updates.org_logo_url) {
    const logoPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/campaign-logos/`;
    if (!updates.org_logo_url.startsWith(logoPrefix)) {
      updates.org_logo_url = null;
    }
  }
  if (typeof updates.custom_domain === 'string') {
    updates.custom_domain = updates.custom_domain.toLowerCase();
  }
  // A state bill needs its state; a federal one must not carry a stale state.
  if (updates.bill_level !== 'state' && 'bill_level' in updates) {
    updates.bill_state = null;
  }

  const { data: updated, error } = await admin
    .from('campaigns')
    .update({
      ...updates,
      // Back through review: the old review verdict described the old content.
      approval_status: 'pending',
      status: 'pending',
      approved_at: null,
      review_note: null,
    })
    .eq('id', campaign.id)
    .select()
    .single();

  if (error) {
    if (error.code === '23505' && error.message?.includes('custom_domain')) {
      return NextResponse.json({ error: 'That custom domain is already in use by another campaign' }, { status: 409 });
    }
    console.error('[campaigns] Update error:', error);
    return NextResponse.json({ error: 'Failed to update campaign' }, { status: 500 });
  }

  void sendAdminNotification(
    `Edited campaign awaiting re-approval: ${updated.headline}`,
    `<h2>Campaign edited</h2>
     <p><strong>${String(updated.headline).replace(/</g, '&lt;')}</strong> (was: ${String(campaign.headline).replace(/</g, '&lt;')})</p>
     <p>Slug: ${slug}</p>
     <p>The creator edited this campaign. It's back to <strong>pending</strong> and its page is offline until re-approved.</p>`
  );

  return NextResponse.json(updated);
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
