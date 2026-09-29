/** Null profiles.local_officials so every dashboard refetches local officials
 *  (run after a roster or boundary change). Run: CWC_ENV_FILE=... npx tsx scripts/clear-local-officials-cache.ts */
import dotenv from 'dotenv';
dotenv.config({ path: process.env.CWC_ENV_FILE ?? '.env.local' });
import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SECRET_KEY!);
(async () => {
  const { data, error } = await sb.from('profiles').update({ local_officials: null }).not('local_officials', 'is', null).select('user_id');
  if (error) throw error;
  console.log(`cleared local_officials on ${(data ?? []).length} profiles`);
})();
