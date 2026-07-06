import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { US_STATES } from '@/lib/constants';

/**
 * GET /api/me/news-context
 * Lightweight, signed-in-only context for personalizing the news feed:
 * the user's state (for the "My State" tab) and their representatives'
 * names (to flag articles that mention their own officials). Reads the
 * cached representatives JSONB — no geocoding.
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ state: null, stateName: null, repNames: [] });
  }

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('state, representatives')
    .eq('user_id', user.id)
    .single();

  const rawState = (profile?.state || '').trim();
  const stateEntry =
    US_STATES.find((s) => s.code === rawState.toUpperCase()) ||
    US_STATES.find((s) => s.name.toLowerCase() === rawState.toLowerCase());

  const reps = Array.isArray(profile?.representatives) ? profile.representatives : [];
  const repNames = reps
    .map((r: { name?: string }) => (typeof r?.name === 'string' ? r.name.trim() : ''))
    .filter((n: string) => n.length > 0)
    .slice(0, 30);

  return NextResponse.json(
    {
      state: stateEntry?.code ?? null,
      stateName: stateEntry?.name ?? null,
      repNames,
    },
    { headers: { 'Cache-Control': 'private, max-age=300' } }
  );
}
