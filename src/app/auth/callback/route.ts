import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');
  const next = searchParams.get('next') ?? '/dashboard';

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      // Create profile row if it doesn't exist
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          const admin = createAdminClient();
          const meta = user.user_metadata || {};
          await admin
            .from('profiles')
            .upsert(
              {
                user_id: user.id,
                name: meta.full_name || null,
                street: meta.street || null,
                city: meta.city || null,
                state: meta.state || null,
                zip: meta.zip || null,
              },
              { onConflict: 'user_id', ignoreDuplicates: true }
            );
        }
      } catch (e) {
        // Non-blocking — profile creation is best-effort
        console.error('Failed to create profile:', e);
      }

      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  // Return the user to login with an error indication
  return NextResponse.redirect(`${origin}/login?error=auth`);
}
