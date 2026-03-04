import { createClient } from '@supabase/supabase-js';
import { env } from './env';

// Admin client using the secret key — bypasses RLS, use in API routes only
export function createAdminClient() {
  const { NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY } = env();
  return createClient(NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SECRET_KEY);
}
