import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';

/**
 * Who is allowed to spend the LegiScan allowance.
 *
 * LegiScan cut the key off at its 10,000 monthly limit in November 2026. It
 * was not users: the sitemap advertises about 7,000 state legislator pages,
 * every one renders the activity panel, and the panel reaches LegiScan. The
 * votes cache is keyed per legislator, so a crawler walking the sitemap is
 * the worst possible access pattern for it. It maximizes distinct cache keys
 * and benefits from none of them.
 *
 * Caching made each page cheaper. It did not change who gets to spend the
 * allowance. This does: organization accounts only. A crawler is never
 * signed in, so the drain stops at the door rather than being rationed.
 *
 * What a non-org loses is completeness, not function. Every caller already
 * falls back to Open States sponsored-bill votes when LegiScan returns
 * nothing, which is the path the whole site ran on while the key was capped.
 */

/**
 * Whether the signed-in caller is an organization account.
 *
 * Fails CLOSED, which is the opposite of the monthly budget guard in
 * legiscan-api.ts, and deliberately. That guard protects real traffic when
 * its own cache is unreachable, so an outage must not take the site down.
 * This one decides whether to spend a metered external allowance, and the
 * fallback is a working data source. Treating "I could not tell who you are"
 * as "go ahead and spend" is how the allowance emptied the first time.
 */
export async function callerIsOrganization(): Promise<boolean> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data } = await createAdminClient()
      .from('profiles')
      .select('account_type')
      .eq('user_id', user.id)
      .single();

    return data?.account_type === 'organization';
  } catch {
    // No request context (a script, a cron), or auth is unreachable. Either
    // way we cannot name an organization, so we do not spend on one.
    return false;
  }
}
