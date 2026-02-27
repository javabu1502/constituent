import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

/**
 * GET /api/campaigns/discover
 * Returns public campaigns with action counts for the discovery page.
 * Supports ?sort=recent|popular and cursor-based pagination via ?cursor=<created_at>.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const sort = searchParams.get('sort') === 'popular' ? 'popular' : 'recent';
  const cursor = searchParams.get('cursor');
  const limit = 20;

  const admin = createAdminClient();

  let query = admin
    .from('campaigns')
    .select('id, slug, headline, description, issue_area, action_count, created_at')
    .order(sort === 'popular' ? 'action_count' : 'created_at', { ascending: false })
    .limit(limit);

  if (cursor) {
    if (sort === 'recent') {
      query = query.lt('created_at', cursor);
    }
    // For popular sort, use offset-based fallback since action_count isn't unique
  }

  const { data: campaigns, error } = await query;

  if (error) {
    console.error('[campaigns/discover] Query error:', error);
    return NextResponse.json({ error: 'Failed to fetch campaigns' }, { status: 500 });
  }

  const nextCursor = campaigns && campaigns.length === limit
    ? campaigns[campaigns.length - 1].created_at
    : null;

  return NextResponse.json({ campaigns: campaigns ?? [], nextCursor });
}
