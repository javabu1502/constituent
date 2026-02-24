import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';

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

  let body: {
    headline: string;
    description: string;
    issue_area: string;
    issue_subtopic?: string;
    target_level: string;
    message_template?: string;
  };

  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const { headline, description, issue_area, issue_subtopic, target_level, message_template } = body;

  // Validation
  if (!headline || headline.length < 3 || headline.length > 100) {
    return NextResponse.json({ error: 'Headline must be 3-100 characters' }, { status: 400 });
  }
  if (!description || description.length < 10 || description.length > 500) {
    return NextResponse.json({ error: 'Description must be 10-500 characters' }, { status: 400 });
  }
  if (!issue_area) {
    return NextResponse.json({ error: 'Issue area is required' }, { status: 400 });
  }
  if (!target_level || !['federal', 'state', 'both'].includes(target_level)) {
    return NextResponse.json({ error: 'Target level must be federal, state, or both' }, { status: 400 });
  }

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
    })
    .select()
    .single();

  if (error) {
    console.error('[campaigns] Insert error:', error);
    return NextResponse.json({ error: 'Failed to create campaign' }, { status: 500 });
  }

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
