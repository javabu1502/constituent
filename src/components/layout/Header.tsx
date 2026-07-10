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
              label="Take Action"
              emphasis
              menuWidthClass="w-60"
              items={[
                { href: '/issues', label: 'Weigh In' },
                { href: '/campaigns', label: 'Run a Campaign' },
                { href: '/vote', label: 'Vote' },
                // Regulations (public comment) temporarily hidden — restore to bring it back.
                // { href: '/regulations', label: 'Regulations' },
              ]}
            />
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
              label="Learn"
              items={[
                { href: '/guides', label: 'Guides' },
                { href: '/about', label: 'About' },
              ]}
            />
            <a
              href="https://buymeacoffee.com/mydemocracy"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors"
            >
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
                <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
              </svg>
              Donate
            </a>
            <UserMenu user={user} />
          </nav>

          {/* Mobile hamburger */}
          <MobileNav user={user} />
        </div>
      </div>
    </header>
  );
}
