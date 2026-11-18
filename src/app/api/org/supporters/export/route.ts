import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';
import { toCSV } from '@/lib/csv';
import { collectSupporters } from '@/lib/org-supporters';
import { UPDATES_LIST } from '@/lib/campaign-updates';

export const runtime = 'nodejs';

/**
 * GET /api/org/supporters/export — every supporter of one organization, as a
 * CSV.
 *
 * The supporters page already lists these people by name with their address
 * as a mailto link, so this is the same data the owner can already read, in a
 * shape a mail tool will take. It also lifts the 500-row cap the on-screen
 * list applies, which is the reason an organisation asks for it.
 *
 * Two columns carry the part that matters. "How we got them" separates
 * somebody who filled in the organisation's own join form from somebody who
 * acted on a campaign, where the notice beside the box promises updates when
 * the bill moves and nothing wider. "Can email" is the live suppression
 * state, so a list loaded into Mailchimp does not reach somebody who already
 * unsubscribed here.
 */
const SOURCE_LABEL: Record<string, string> = {
  joined: 'Joined your list',
  acted: 'Took action',
  shared: 'Shared a story',
};

export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const admin = createAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('account_type, org_name, org_slug')
    .eq('user_id', user.id)
    .single();
  if (profile?.account_type !== 'organization') {
    return NextResponse.json({ error: 'Organization accounts only' }, { status: 403 });
  }

  const { supporters } = await collectSupporters(admin, user.id);

  // One query for the whole list rather than per person. Chunked because a
  // long .in() becomes a URL PostgREST will not accept.
  const emails = supporters.map((s) => s.email);
  const suppressed = new Set<string>();
  for (let i = 0; i < emails.length; i += 500) {
    const { data } = await admin
      .from('email_suppressions')
      .select('email')
      .eq('list', UPDATES_LIST)
      .in('email', emails.slice(i, i + 500));
    for (const r of data ?? []) suppressed.add(String(r.email).trim().toLowerCase());
  }

  const sorted = [...supporters].sort((a, b) => (a.name ?? a.email).localeCompare(b.name ?? b.email));
  const csv = toCSV(
    ['Name', 'Email', 'City', 'State', 'Senate district', 'House district', 'How we got them', 'Can email'],
    sorted.map((s) => [
      s.name ?? '',
      s.email,
      s.city ?? '',
      s.state ?? '',
      s.upperDistrict ?? '',
      s.lowerDistrict ?? '',
      [...s.sources].map((src) => SOURCE_LABEL[src] ?? src).join('; '),
      suppressed.has(s.email) ? 'No, unsubscribed' : 'Yes',
    ]),
  );

  const stamp = new Date().toISOString().slice(0, 10);
  const name = (profile?.org_slug as string | null) || 'supporters';
  return new NextResponse(csv, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="${name}-supporters-${stamp}.csv"`,
    },
  });
}
