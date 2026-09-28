import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

function isAdmin(user: { id: string; email?: string }): boolean {
  const ids = process.env.ADMIN_USER_IDS?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  if (ids.includes(user.id)) return true;
  const emails = process.env.ADMIN_EMAILS?.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean) ?? [];
  return !!user.email && emails.includes(user.email.toLowerCase());
}

/**
 * GET /api/admin/cwc-adoption — signatures asking non-participating Senate
 * offices to join CWC. Default: counts per senator. `?senator=<bioguide>`
 * lists that senator's signers; add `&format=csv` for a download.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user)) return NextResponse.json({ error: 'Forbidden' }, { status: 403 });

  const admin = createAdminClient();
  const senator = request.nextUrl.searchParams.get('senator');
  const format = request.nextUrl.searchParams.get('format');

  if (senator) {
    const { data, error } = await admin
      .from('cwc_adoption_signatures')
      .select('senator_name, state, office_code, signer_name, signer_email, signer_city, signer_zip, source, created_at')
      .eq('senator_id', senator)
      .order('created_at', { ascending: false })
      .limit(5000);
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    if (format === 'csv') {
      const esc = (v: unknown) => `"${String(v ?? '').replace(/"/g, '""')}"`;
      const header = 'senator,state,office_code,name,email,city,zip,source,signed_at';
      const rows = (data ?? []).map((r) => [r.senator_name, r.state, r.office_code, r.signer_name, r.signer_email, r.signer_city, r.signer_zip, r.source, r.created_at].map(esc).join(','));
      return new NextResponse([header, ...rows].join('\n'), {
        headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': `attachment; filename="cwc-adoption-${senator}.csv"` },
      });
    }
    return NextResponse.json(data ?? []);
  }

  const { data, error } = await admin
    .from('cwc_adoption_signatures')
    .select('senator_id, senator_name, state, office_code, created_at')
    .order('created_at', { ascending: false })
    .limit(20000);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  const counts = new Map<string, { senator_id: string; senator_name: string; state: string; office_code: string | null; count: number; latest: string }>();
  for (const r of data ?? []) {
    const cur = counts.get(r.senator_id);
    if (cur) cur.count++;
    else counts.set(r.senator_id, { senator_id: r.senator_id, senator_name: r.senator_name, state: r.state, office_code: r.office_code, count: 1, latest: r.created_at });
  }
  return NextResponse.json([...counts.values()].sort((a, b) => b.count - a.count));
}
