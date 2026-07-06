import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { toCSV } from '@/lib/csv';
import { usageLabels } from '@/lib/story-usage';
import { findSenators } from '@/lib/legislators';
import { US_STATES } from '@/lib/constants';

/** Normalize "NV" / "Nevada" (any case) to a two-letter code. */
function stateCodeOf(raw: string | null): string | null {
  if (!raw) return null;
  const t = raw.trim();
  if (/^[A-Za-z]{2}$/.test(t)) return t.toUpperCase();
  const match = US_STATES.find((s) => s.name.toLowerCase() === t.toLowerCase());
  return match?.code ?? null;
}

/**
 * GET /api/campaigns/[slug]/stories/export
 * Download active stories for a storytelling campaign as CSV. Campaign owner
 * only. Anonymous stories are stored without identity, so their Name / City /
 * State / Contact cells come out blank automatically.
 *
 * Optional query params mirror the analytics story browser's filters, so
 * "Download CSV (filtered)" exports exactly what's on screen:
 *   q           free-text match on name/title/body/city/state/email/officials
 *   state       two-letter state code
 *   city        exact city (case-insensitive)
 *   attribution named | first_name_only | anonymous
 *   use         raw granted-use value (e.g. shared_with_media)
 *   official    official name (from shared reps, or senators inferred by state)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> },
) {
  const { slug } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data: campaign, error: campaignError } = await admin
    .from('campaigns')
    .select('id, slug, creator_id, campaign_type')
    .eq('slug', slug)
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  }
  if (campaign.creator_id !== user.id) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const { data: stories, error: storiesError } = await admin
    .from('stories')
    .select('created_at, attribution_level, storyteller_name, city, state, storyteller_email, title, body, consent_usage_snapshot, shared_reps')
    .eq('campaign_id', campaign.id)
    .eq('status', 'active')
    .order('created_at', { ascending: false });

  if (storiesError) {
    console.error('[stories/export] query error:', storiesError);
    return NextResponse.json({ error: 'Failed to load stories' }, { status: 500 });
  }

  const sp = request.nextUrl.searchParams;
  const q = (sp.get('q') || '').trim().toLowerCase();
  const stateFilter = (sp.get('state') || '').trim().toUpperCase();
  const cityFilter = (sp.get('city') || '').trim().toLowerCase();
  const attributionFilter = (sp.get('attribution') || '').trim();
  const useFilter = (sp.get('use') || '').trim();
  const officialFilter = (sp.get('official') || '').trim();

  // Same officials logic as the analytics page: exact shared reps when the
  // storyteller consented at submit time, else senators inferred from state.
  const senatorCache = new Map<string, string[]>();
  const senatorsFor = (code: string): string[] => {
    let cached = senatorCache.get(code);
    if (!cached) {
      try {
        cached = findSenators(code).map((o) => o.name);
      } catch {
        cached = [];
      }
      senatorCache.set(code, cached);
    }
    return cached;
  };

  const filtered = (stories ?? []).filter((s) => {
    const isAnon = s.attribution_level === 'anonymous';
    const snapshot = (s.consent_usage_snapshot ?? {}) as { granted_uses?: string[] };
    const grantedValues = snapshot.granted_uses ?? [];
    const shared = s.shared_reps as Array<{ name?: string }> | null;
    const officials =
      Array.isArray(shared) && shared.length > 0
        ? shared.map((r) => r?.name).filter((n): n is string => typeof n === 'string' && !!n)
        : (() => {
            const code = stateCodeOf(isAnon ? null : s.state ?? null);
            return code ? senatorsFor(code) : [];
          })();

    if (stateFilter && stateCodeOf(isAnon ? null : s.state ?? null) !== stateFilter) return false;
    if (cityFilter && (isAnon ? '' : (s.city ?? '').trim().toLowerCase()) !== cityFilter) return false;
    if (attributionFilter && s.attribution_level !== attributionFilter) return false;
    if (useFilter && !grantedValues.includes(useFilter)) return false;
    if (officialFilter && !officials.includes(officialFilter)) return false;
    if (q) {
      const haystack = [
        isAnon ? '' : s.storyteller_name ?? '',
        s.title ?? '',
        s.body ?? '',
        isAnon ? '' : s.city ?? '',
        isAnon ? '' : s.state ?? '',
        isAnon ? '' : s.storyteller_email ?? '',
        ...officials,
      ]
        .join(' ')
        .toLowerCase();
      if (!haystack.includes(q)) return false;
    }
    return true;
  });

  const headers = ['Date', 'Attribution', 'Name', 'City', 'State', 'Contact Email', 'Represented By', 'Title', 'Story', 'Granted Uses'];
  const rows = filtered.map((s) => {
    const isAnon = s.attribution_level === 'anonymous';
    const snapshot = (s.consent_usage_snapshot ?? {}) as { granted_uses?: string[] };
    const uses = usageLabels(snapshot.granted_uses ?? []).join('; ');
    const shared = s.shared_reps as Array<{ name?: string; title?: string | null }> | null;
    const reps =
      !isAnon && Array.isArray(shared)
        ? shared
            .filter((r) => typeof r?.name === 'string' && r.name)
            .map((r) => (r.title ? `${r.name} (${r.title})` : r.name))
            .join('; ')
        : '';
    return [
      s.created_at ? new Date(s.created_at).toISOString().slice(0, 10) : '',
      s.attribution_level,
      // Safety net: never emit identity for anonymous rows even if columns held data.
      isAnon ? '' : s.storyteller_name ?? '',
      isAnon ? '' : s.city ?? '',
      isAnon ? '' : s.state ?? '',
      isAnon ? '' : s.storyteller_email ?? '',
      reps,
      s.title ?? '',
      s.body ?? '',
      uses,
    ];
  });

  const csv = toCSV(headers, rows);

  return new NextResponse(csv, {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}-stories.csv"`,
    },
  });
}
