import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { createCampaignSchema, parseBody } from '@/lib/schemas';
import { profileLimiter, getClientIp } from '@/lib/rate-limit';
import { sendAdminNotification } from '@/lib/resend';
import { getCommitteeMembers } from '@/lib/committees';
import { sendStageAdvanceEmails } from '@/lib/campaign-updates';
import { getStateCommitteeMembers } from '@/lib/state-committees';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}

function randomSuffix(): string {
  return Math.random().toString(36).substring(2, 8);
}

export const maxDuration = 60; // stage creation may fan out supporter emails

/**
 * POST /api/campaigns
 * Create a new campaign (auth required)
 */
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const ip = getClientIp(request);
  const { success, retryAfter } = profileLimiter.check(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  }

  // Campaigns are run by advocacy organizations; constituent accounts use the
  // contact/story flows instead.
  const { data: creatorProfile } = await createAdminClient()
    .from('profiles')
    .select('account_type')
    .eq('user_id', user.id)
    .single();
  if (creatorProfile?.account_type !== 'organization') {
    return NextResponse.json(
      { error: 'Campaign creation is available to advocacy organization accounts' },
      { status: 403 }
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = parseBody(createCampaignSchema, raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const {
    campaign_type, headline, description, issue_area, issue_subtopic,
    target_level, direction, message_template, distribution_plan,
    bill_level, bill_state, bill_ref, bill_title, bill_url,
    story_prompt, usage_statement, usage_tags, attribution_options, edit_revoke_policy, recipient_email,
    org_name, org_url, org_logo_url, brand_color, custom_domain,
    parent_campaign_id, stage_goal, target_committee, target_committee_state, notify_supporters,
  } = parsed.data;

  const isStory = campaign_type === 'storytelling';
  const slug = slugify(headline).slice(0, 50) + '-' + randomSuffix();

  // Stage campaigns: verify the parent before anything is written. Only the
  // parent's creator can add stages, and nesting is one level deep — a stage
  // cannot grow stages of its own.
  let parent: { bill_level: string | null; bill_state: string | null; bill_ref: string | null; bill_title: string | null; bill_url: string | null; issue_area: string | null; issue_subtopic: string | null; direction: string | null; message_template: string | null; slug: string; headline: string; org_name: string | null } | null = null;
  if (parent_campaign_id) {
    const { data: parentRow } = await createAdminClient()
      .from('campaigns')
      .select('creator_id, parent_campaign_id, campaign_type, bill_level, bill_state, bill_ref, bill_title, bill_url, issue_area, issue_subtopic, direction, message_template, slug, headline, org_name')
      .eq('id', parent_campaign_id)
      .single();
    if (!parentRow) {
      return NextResponse.json({ error: 'Parent campaign not found' }, { status: 404 });
    }
    if (parentRow.creator_id !== user.id) {
      return NextResponse.json({ error: 'Only the campaign owner can add stages' }, { status: 403 });
    }
    if (parentRow.parent_campaign_id) {
      return NextResponse.json({ error: 'Stages cannot have stages of their own' }, { status: 400 });
    }
    if (isStory) {
      return NextResponse.json({ error: 'Stages must be advocacy campaigns' }, { status: 400 });
    }
    if (target_committee) {
      const roster = target_committee_state
        ? getStateCommitteeMembers(target_committee_state, target_committee)
        : getCommitteeMembers(target_committee).map((m) => m.bioguide);
      if (roster.length === 0) {
        return NextResponse.json({ error: 'Unknown committee' }, { status: 400 });
      }
    }
    parent = parentRow;
  }

  // User-created campaigns are ALWAYS unlisted (link-only): never in the
  // public directory, never promoted. Official/public is a curated flag set
  // only by My Democracy, separate from approval. Branding is available to
  // every user campaign; the logo must live in OUR storage bucket.
  const logoPrefix = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/campaign-logos/`;
  const safeLogoUrl = org_logo_url && org_logo_url.startsWith(logoPrefix) ? org_logo_url : null;
  const branding = {
    org_name: org_name?.trim() || null,
    org_url: org_url || null,
    org_logo_url: safeLogoUrl,
    brand_color: brand_color || null,
    custom_domain: custom_domain?.toLowerCase() || null,
  };

  const admin = createAdminClient();
  const { data: campaign, error } = await admin
    .from('campaigns')
    .insert({
      creator_id: user.id,
      slug,
      campaign_type,
      // All user-created campaigns are unlisted; is_official stays false.
      visibility: 'unlisted',
      approval_status: 'pending',
      headline,
      description,
      issue_area,
      issue_subtopic: issue_subtopic || null,
      target_level: isStory ? 'federal' : target_level,
      // Stages inherit position and talking points from the parent unless
      // they bring their own (talking points usually DO change per stage).
      direction: isStory ? null : (direction || parent?.direction || null),
      message_template: isStory ? null : (message_template || parent?.message_template || null),
      distribution_plan: isStory ? null : distribution_plan,
      // Stages inherit the parent's bill unless they set their own.
      bill_level: isStory ? null : (bill_level || parent?.bill_level || null),
      bill_state: !isStory && (bill_level || parent?.bill_level) === 'state' ? (bill_state || parent?.bill_state || null) : null,
      bill_ref: isStory ? null : (bill_ref || parent?.bill_ref || null),
      bill_title: isStory ? null : (bill_title || parent?.bill_title || null),
      bill_url: isStory ? null : (bill_url || parent?.bill_url || null),
      parent_campaign_id: parent_campaign_id || null,
      stage_goal: parent_campaign_id ? (stage_goal || 'custom') : null,
      target_filter: target_committee
        ? { type: 'committee', committee_id: target_committee, ...(target_committee_state ? { state: target_committee_state.toUpperCase() } : {}) }
        : null,
      story_prompt: isStory ? (story_prompt || null) : null,
      usage_statement: isStory ? usage_statement : null,
      usage_tags: isStory ? (usage_tags || []) : null,
      attribution_options: isStory ? attribution_options : null,
      edit_revoke_policy: isStory ? edit_revoke_policy : null,
      recipient_email: isStory ? (recipient_email || user.email || null) : null,
      ...branding,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    if (error.code === '23505' && error.message?.includes('custom_domain')) {
      return NextResponse.json({ error: 'That custom domain is already in use by another campaign' }, { status: 409 });
    }
    console.error('[campaigns] Insert error:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }

  // Advance-the-campaign: a new stage re-engages everyone who already acted
  // on the initiative. Awaited so serverless doesn't kill the batch; failures
  // never break creation.
  let supporterNotify: { eligible: number; sent: number } | null = null;
  if (parent && parent_campaign_id && notify_supporters) {
    try {
      const r = await sendStageAdvanceEmails({
        parentId: parent_campaign_id,
        parentSlug: parent.slug,
        parentHeadline: parent.headline,
        orgName: parent.org_name,
        billRef: parent.bill_ref,
        stageSlug: campaign.slug as string,
        stageHeadline: headline,
      });
      supporterNotify = { eligible: r.eligible, sent: r.sent };
    } catch (err) {
      console.error('[campaigns] supporter notify failed:', err);
    }
  }

  // Ping the admin that a new campaign is awaiting approval (fire-and-forget)
  void sendAdminNotification(
    `New campaign awaiting approval: ${headline}`,
    `<h2>New campaign submitted</h2>
     <p><strong>${escapeHtml(headline)}</strong></p>
     <p>${escapeHtml(description)}</p>
     <ul>
       <li>Type: ${escapeHtml(campaign_type)}</li>
       <li>Issue: ${escapeHtml(issue_area)}${issue_subtopic ? ` / ${escapeHtml(issue_subtopic)}` : ''}</li>
       ${isStory
         ? `<li>Story prompt: ${escapeHtml(story_prompt || '—')}</li><li>Usage: ${escapeHtml(usage_statement || '')}</li>`
         : `<li>Target level: ${escapeHtml(target_level || '')}</li><li>Distribution plan: ${escapeHtml(distribution_plan || '')}</li>`}
       <li>Slug: ${escapeHtml(slug)}</li>
     </ul>
     <p>Status is <strong>pending</strong> — review and approve it in the admin dashboard.</p>`
  );

  return NextResponse.json({ ...campaign, supporter_notify: supporterNotify });
}

/**
 * GET /api/campaigns
 * Get current user's campaigns (auth required)
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: campaigns, error } = await admin
    .from('campaigns')
    .select('*')
    .eq('creator_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('[campaigns] Query error:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }

  return NextResponse.json(campaigns);
}
