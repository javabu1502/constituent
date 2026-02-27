import { NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { createAdminClient } from '@/lib/supabase';

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/login', origin));
  }

  const cookieStore = await cookies();
  const responseCookies: Array<{ name: string; value: string; options: Record<string, unknown> }> = [];

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            try { cookieStore.set(name, value, options); } catch {}
            responseCookies.push({ name, value, options });
          });
        },
      },
    }
  );

  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('Auth callback error:', error.message);
    return NextResponse.redirect(new URL('/login', origin));
  }

  // Ensure profile exists
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const admin = createAdminClient();
      const meta = user.user_metadata || {};
      await admin.from('profiles').upsert(
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
    }
  } catch (e) {
    console.error('Failed to ensure profile:', e);
  }

  const response = NextResponse.redirect(new URL('/dashboard', origin));

  // Write all session cookies onto the redirect response
  responseCookies.forEach(({ name, value, options }) => {
    response.cookies.set(name, value, options);
  });

  return response;
}
