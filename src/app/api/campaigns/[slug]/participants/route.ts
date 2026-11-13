import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { createClient } from '@/lib/supabase/server';
import { toCSV } from '@/lib/csv';
import { initiativeCampaignIds } from '@/lib/campaign-counts';

export const runtime = 'nodejs';

/**
 * GET /api/campaigns/[slug]/participants — the people who acted, for the
 * organization that owns the campaign.
 *
 * An organization that mobilised somebody once needs to be able to tell them
 * what happened next. Until now the only way to reach a participant was the
 * supporters page on screen, which cannot be loaded into a mail tool.
 *
 * Consent is already in hand, and specifically so. Somebody acting on an
 * organization's campaign is told, next to the box they type it in, that the
 * organization will email them when the bill moves and that they can
 * unsubscribe. That promise is what this export delivers on.
 *
 * It is not the promise made on the platform's own campaigns, where the note
 * reads "Never shared or sold". Those never store an email at all: 89 of them
 * hold zero. The guard below is belt and braces on top of that.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug } = await params;
  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from('campaigns')
    .select('id, creator_id, headline, is_official')
    .eq('slug', slug)
    .maybeSingle();

  if (!campaign) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  if (campaign.creator_id !== user.id) return NextResponse.json({ error: 'Not yours' }, { status: 403 });
  if (campaign.is_official) {
    // People on a platform campaign were told their address is never shared.
    return NextResponse.json(
      { error: 'Participants on an official campaign were promised their email is never shared.' },
      { status: 403 },
    );
  }

  const campaignIds = await initiativeCampaignIds(admin, campaign.id as string);
  const { data: rows } = await admin
    .from('campaign_actions')
    .select('participant_name, participant_email, participant_city, participant_state, messages_sent, created_at')
    .in('campaign_id', campaignIds)
    .order('created_at', { ascending: true });

  // One row per person, not per visit. campaign_actions holds a row per visit
  // that acted, so a returning supporter would otherwise be mailed twice.
  const byEmail = new Map<string, { name: string; email: string; city: string; state: string; messages: number; first: string }>();
  let withoutEmail = 0;
  for (const r of (rows ?? []) as Array<Record<string, unknown>>) {
    const email = String(r.participant_email ?? '').trim().toLowerCase();
    if (!email) { withoutEmail += 1; continue; }
    const existing = byEmail.get(email);
    if (existing) {
      existing.messages += Number(r.messages_sent ?? 0);
      continue;
    }
    byEmail.set(email, {
      name: String(r.participant_name ?? ''),
      email,
      city: String(r.participant_city ?? ''),
      state: String(r.participant_state ?? ''),
      messages: Number(r.messages_sent ?? 0),
      first: String(r.created_at ?? '').slice(0, 10),
    });
  }
  const people = [...byEmail.values()];

  if (new URL(request.url).searchParams.get('format') === 'csv') {
    const csv = toCSV(
      ['Name', 'Email', 'City', 'State', 'Messages sent', 'First acted'],
      people.map((p) => [p.name, p.email, p.city, p.state, p.messages, p.first]),
    );
    return new NextResponse(csv, {
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': `attachment; filename="${slug}-participants.csv"`,
      },
    });
  }

  return NextResponse.json({
    campaign: { slug, headline: campaign.headline },
    people: people.length,
    // Acted without leaving an address, so there is nobody to write to.
    withoutEmail,
  });
}
