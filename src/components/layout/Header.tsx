import Link from 'next/link';
import { cache } from 'react';
import { BRAND } from '@/lib/constants';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { MainNav } from './MainNav';
import { MobileNav } from './MobileNav';
import { SearchButton } from '@/components/search/SearchButton';

/**
 * Is this account an organization? Cached per request, so the several server
 * components that need it share one query instead of each adding a
 * round trip to every page load.
 */
const isOrgAccount = cache(async (userId: string): Promise<boolean> => {
  try {
    const { data: profile } = await createAdminClient()
      .from('profiles')
      .select('account_type')
      .eq('user_id', userId)
      .single();
    return profile?.account_type === 'organization';
  } catch {
    // A missing or errored profile reads as a constituent, which shows the
    // ordinary navigation rather than nothing.
    return false;
  }
});

export async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Whether the campaign tools show is decided per page, not per account:
  // see MainNav. An organization is still a person on the public site.
  const isOrg = user ? await isOrgAccount(user.id) : false;

  return (
    <header className="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
      <div className="max-w-5xl mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Link href="/" className="font-semibold text-xl text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              {BRAND.name}
            </Link>
            <SearchButton />
          </div>

          <MainNav user={user} isOrg={isOrg} />
          <MobileNav user={user} isOrg={isOrg} />
        </div>
      </div>
    </header>
  );
}
