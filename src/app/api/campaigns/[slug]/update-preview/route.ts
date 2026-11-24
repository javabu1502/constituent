import { NextRequest, NextResponse } from 'next/server';
import { canActForCampaign } from '@/lib/org-context';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { renderStageAdvanceEmail, stageAdvanceSubject } from '@/lib/campaign-updates';
import { UPDATES_LIST } from '@/lib/campaign-updates';

/**
 * What the supporter-update email will say, and who it will reach.
 *
 * An organisation ticking "email everyone who already acted" was mailing its
 * whole supporter list without being able to read the message first. This
 * renders the same template the sender uses, with the same counts the send
 * will produce, so the decision is made with the thing in front of them.
 *
 * Owner-gated: the audience size of somebody else's campaign is not public.
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const headline = request.nextUrl.searchParams.get('headline')?.trim() || 'Your next action';

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Not signed in' }, { status: 401 });

  const admin = createAdminClient();
  const { data: parent } = await admin
    .from('campaigns')
    .select('id, slug, headline, org_name, bill_ref, creator_id, org_user_id')
    .eq('slug', slug)
    .maybeSingle();
  if (!parent) return NextResponse.json({ error: 'Campaign not found' }, { status: 404 });
  if (!(await canActForCampaign(user.id, parent))) {
    return NextResponse.json({ error: 'Not your campaign' }, { status: 403 });
  }

  // The same audience the send builds: the whole initiative, deduplicated.
  const { data: children } = await admin.from('campaigns').select('id').eq('parent_campaign_id', parent.id);
  const ids = [parent.id, ...(children ?? []).map((c) => c.id as string)];
  const { data: actions } = await admin
    .from('campaign_actions')
    .select('participant_email')
    .in('campaign_id', ids)
    .not('participant_email', 'is', null)
    .limit(10000);

  const emails = new Set(
    (actions ?? []).map((a) => String(a.participant_email).trim().toLowerCase()).filter(Boolean)
  );
  const { data: suppressions } = emails.size
    ? await admin.from('email_suppressions').select('email').eq('list', UPDATES_LIST).in('email', [...emails])
    : { data: [] };

  const suppressed = new Set((suppressions ?? []).map((s) => String(s.email)));
  // Test addresses and the demo org are counted but never mailed, so the
  // preview must not promise them either.
  const testData = [...emails].filter((e) => e.endsWith('@example.com') || slug.startsWith('demo-')).length;
  const willSend = [...emails].filter(
    (e) => !suppressed.has(e) && !(e.endsWith('@example.com') || slug.startsWith('demo-'))
  ).length;

  return NextResponse.json({
    subject: stageAdvanceSubject(parent.bill_ref ?? null, headline),
    html: renderStageAdvanceEmail({
      orgName: parent.org_name ?? null,
      billRef: parent.bill_ref ?? null,
      parentHeadline: parent.headline ?? '',
      stageHeadline: headline,
      stageUrl: `https://www.mydemocracy.app/campaign/${slug}`,
      firstName: null,
      unsubscribeUrl: '#',
    }),
    audience: { eligible: emails.size, suppressed: suppressed.size, testData, willSend },
  });
}
