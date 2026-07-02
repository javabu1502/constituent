import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';

/**
 * DELETE /api/stories/[id]
 * Storyteller-initiated removal of their own story (soft revoke). The story is
 * marked 'revoked' and disappears from the campaign organizer's dashboard and
 * exports. Only the signed-in owner can revoke; anonymous stories have no owner
 * and are removed via the emailed data-deletion request instead.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: 'Sign in to manage your stories.' }, { status: 401 });
  }

  const admin = createAdminClient();
  const { data, error } = await admin
    .from('stories')
    .update({ status: 'revoked', revoked_at: new Date().toISOString() })
    .eq('id', id)
    .eq('user_id', user.id)
    .eq('status', 'active')
    .select('id')
    .single();

  if (error || !data) {
    return NextResponse.json({ error: 'Story not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true, id: data.id });
}
