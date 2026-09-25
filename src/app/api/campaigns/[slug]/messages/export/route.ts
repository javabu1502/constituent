import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { toCSV } from '@/lib/csv';

/**
 * GET /api/campaigns/[slug]/messages/export
 * Download the constituent messages sent through an advocacy/weigh-in campaign
 * as CSV. Campaign owner only.
 *
 * Optional query params mirror the analytics message browser so
 * "Download CSV (filtered)" exports exactly what's on screen:
 *   q        free-text match on name / city / official / message body
 *   state    two-letter state code
 *   official official (legislator) name
 *   status   delivery_status
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: campaign } = await admin.from('campaigns').select('id, slug, creator_id').eq('slug', slug).single();
  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  if (campaign.creator_id !== user.id) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const { data: messages } = await admin
    .from('messages')
    .select('created_at, advocate_name, advocate_city, advocate_state, legislator_name, legislator_party, legislator_level, legislator_chamber, delivery_method, delivery_status, message_body')
    .eq('campaign_id', campaign.id)
    .order('created_at', { ascending: false })
    .limit(10000);

  const sp = request.nextUrl.searchParams;
  const q = (sp.get('q') || '').trim().toLowerCase();
  const state = (sp.get('state') || '').trim().toUpperCase();
  const official = (sp.get('official') || '').trim().toLowerCase();
  const status = (sp.get('status') || '').trim().toLowerCase();

  const filtered = (messages ?? []).filter((m) => {
    if (state && (m.advocate_state || '').toUpperCase() !== state) return false;
    if (official && (m.legislator_name || '').toLowerCase() !== official) return false;
    if (status && (m.delivery_status || '').toLowerCase() !== status) return false;
    if (q) {
      const hay = `${m.advocate_name ?? ''} ${m.advocate_city ?? ''} ${m.advocate_state ?? ''} ${m.legislator_name ?? ''} ${m.message_body ?? ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  const headers = ['Date', 'Name', 'City', 'State', 'Official', 'Party', 'Level', 'Chamber', 'Delivery Method', 'Status', 'Message'];
  const rows = filtered.map((m) => [
    m.created_at ? new Date(m.created_at).toISOString().slice(0, 10) : '',
    m.advocate_name ?? '',
    m.advocate_city ?? '',
    m.advocate_state ?? '',
    m.legislator_name ?? '',
    m.legislator_party ?? '',
    m.legislator_level ?? '',
    m.legislator_chamber ?? '',
    m.delivery_method ?? '',
    m.delivery_status ?? '',
    m.message_body ?? '',
  ]);

  return new NextResponse(toCSV(headers, rows), {
    status: 200,
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${slug}-messages.csv"`,
    },
  });
}
