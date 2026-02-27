import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';

/**
 * POST /api/auth/ensure-profile
 * Creates a profile row for the authenticated user if one doesn't exist.
 * Called after OAuth sign-in from the client-side callback.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const admin = createAdminClient();
    const meta = user.user_metadata || {};
    await admin
      .from('profiles')
      .upsert(
        {
          user_id: user.id,
          name: meta.full_name || meta.name || null,
          street: meta.street || null,
          city: meta.city || null,
          state: meta.state || null,
          zip: meta.zip || null,
        },
        { onConflict: 'user_id', ignoreDuplicates: true }
      );
  } catch (e) {
    console.error('Failed to ensure profile:', e);
    return NextResponse.json({ error: 'Profile creation failed' }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
