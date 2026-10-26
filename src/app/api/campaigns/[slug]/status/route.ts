import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { CLOSED_STATUS, OPEN_STATUS } from '@/lib/campaign-close';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Close or reopen a campaign (owner-only).
 *
 * A sibling of ../outcome rather than another field on it: the outcome is a
 * record of how the legislation ended, and closing changes whether the
 * campaign still accepts participation. An org marks a bill dead long before
 * it wants the page to stop collecting, and some campaigns close with no
 * outcome at all. Keeping them apart also means the outcome dropdown cannot
 * take a live campaign offline by accident.
 *
 * Closing a parent initiative closes its steps too, because a step collects
 * on the same dead bill. Reopening touches only the campaign asked for: a
 * step that was closed on its own (a committee vote that already happened)
 * must not come back to life with its parent.
 */

const statusSchema = z.object({
  status: z.enum([OPEN_STATUS, CLOSED_STATUS]),
});

export async function POST(req: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const admin = createAdminClient();
  const { data: campaign } = await admin
    .from('campaigns')
    .select('id, creator_id, parent_campaign_id')
    .eq('slug', slug)
    .single();
  if (!campaign) return NextResponse.json({ error: 'not_found' }, { status: 404 });
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  if (user.id !== campaign.creator_id) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  let raw: unknown;
  try {
    raw = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = statusSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
  const { status } = parsed.data;

  const { error } = await admin
    .from('campaigns')
    .update({ status })
    .eq('id', campaign.id);
  if (error) {
    return NextResponse.json(
      { error: status === CLOSED_STATUS ? 'Failed to close this campaign' : 'Failed to reopen this campaign' },
      { status: 500 }
    );
  }

  // Steps only follow their parent down, and only a parent has steps.
  let stepsClosed = 0;
  if (status === CLOSED_STATUS && !campaign.parent_campaign_id) {
    const { data: steps, error: stepError } = await admin
      .from('campaigns')
      .update({ status })
      .eq('parent_campaign_id', campaign.id)
      .select('id');
    if (stepError) {
      // The parent is closed and the steps are not. Say so instead of
      // reporting success; closing again is safe and finishes the job.
      return NextResponse.json(
        { error: 'This campaign is closed, but its steps are still open. Close it again to finish.', partial: true },
        { status: 500 }
      );
    }
    stepsClosed = steps?.length ?? 0;
  }

  return NextResponse.json({ ok: true, status, steps_closed: stepsClosed });
}
