import Link from 'next/link';
import { BRAND } from '@/lib/constants';
import { createClient } from '@/lib/supabase/server';
import { UserMenu } from './UserMenu';
import { MobileNav } from './MobileNav';
import { NavDropdown } from './NavDropdown';
import { SearchButton } from '@/components/search/SearchButton';

export async function Header() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

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

          {/* Desktop nav */}
          <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6">
            <Link
              href="/contact"
              className="px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
            >
              Write to Your Officials
            </Link>
            <NavDropdown
              label="Explore"
              items={[
                { href: '/states', label: 'States' },
                { href: '/legislators', label: 'Legislators' },
                { href: '/news', label: 'News' },
                { href: '/trends', label: 'Trends' },
              ]}
            />
            <NavDropdown
              label="Take Action"
              items={[
                { href: '/vote', label: 'Vote' },
                { href: '/regulations', label: 'Regulations' },
                { href: '/campaigns', label: 'Campaigns' },
              ]}
            />
            <NavDropdown
              label="Learn"
              items={[
                { href: '/guides', label: 'Guides' },
                { href: '/about', label: 'About' },
              ]}
            />
            <UserMenu user={user} />
          </nav>

          {/* Mobile hamburger */}
          <MobileNav user={user} />
        </div>
      </div>
    </header>
  );
}
