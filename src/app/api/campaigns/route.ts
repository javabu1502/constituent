import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { createCampaignSchema, parseBody } from '@/lib/schemas';
import { profileLimiter, getClientIp } from '@/lib/rate-limit';
import { sendAdminNotification } from '@/lib/resend';

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

  const { headline, description, issue_area, issue_subtopic, target_level, message_template, distribution_plan, bill_level, bill_state, bill_ref, bill_title, bill_url } = parsed.data;

  const slug = slugify(headline).slice(0, 50) + '-' + randomSuffix();

  const admin = createAdminClient();
  const { data: campaign, error } = await admin
    .from('campaigns')
    .insert({
      creator_id: user.id,
      slug,
      headline,
      description,
      issue_area,
      issue_subtopic: issue_subtopic || null,
      target_level,
      message_template: message_template || null,
      distribution_plan,
      bill_level: bill_level || null,
      bill_state: bill_level === 'state' ? (bill_state || null) : null,
      bill_ref: bill_ref || null,
      bill_title: bill_title || null,
      bill_url: bill_url || null,
      status: 'pending',
    })
    .select()
    .single();

  if (error) {
    console.error('[campaigns] Insert error:', error);
    // TEMP DEBUG: surface the underlying DB error to diagnose the insert failure
    return NextResponse.json(
      { error: 'Failed to create campaign', detail: error.message, code: error.code, hint: error.hint },
      { status: 500 }
    );
  }

  // Ping the admin that a new campaign is awaiting approval (fire-and-forget)
  void sendAdminNotification(
    `New campaign awaiting approval: ${headline}`,
    `<h2>New campaign submitted</h2>
     <p><strong>${escapeHtml(headline)}</strong></p>
     <p>${escapeHtml(description)}</p>
     <ul>
       <li>Issue: ${escapeHtml(issue_area)}${issue_subtopic ? ` / ${escapeHtml(issue_subtopic)}` : ''}</li>
       <li>Target level: ${escapeHtml(target_level)}</li>
       <li>Distribution plan: ${escapeHtml(distribution_plan)}</li>
       <li>Slug: ${escapeHtml(slug)}</li>
     </ul>
     <p>Status is <strong>pending</strong> — review and approve it in the admin dashboard.</p>`
  );

  return NextResponse.json(campaign);
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
