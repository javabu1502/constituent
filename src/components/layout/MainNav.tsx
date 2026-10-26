'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { User } from '@supabase/supabase-js';
import { UserMenu } from './UserMenu';
import { NavDropdown } from './NavDropdown';
import { OrgNav } from './OrgNav';
import { isOrgWorkspacePath } from './org-workspace';

/**
 * The desktop navigation.
 *
 * An organization sees its campaign tools inside its own workspace, and the
 * ordinary site navigation everywhere else. Swapping the whole header on
 * account type meant the public pages, the home page included, carried a
 * toolbar for running campaigns and no way to write to an official.
 */
export function MainNav({ user, isOrg }: { user: User | null; isOrg: boolean }) {
  const pathname = usePathname();
  const inWorkspace = isOrg && isOrgWorkspacePath(pathname);

  return (
    <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6">
      {inWorkspace ? (
        <OrgNav />
      ) : (
        <>
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
              // Regulations (public comment) temporarily hidden, restore to bring it back.
              // { href: '/regulations', label: 'Regulations' },
            ]}
          />
        </>
      )}
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
      {/* Hidden only inside the workspace: asking an organization for a
          donation while it reviews its own campaign reports is the wrong
          moment, but on the public site it is the same ask as for anyone. */}
      {!inWorkspace && (
        <a
          href="https://buymeacoffee.com/mydemocracy"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-gray-900 text-sm font-semibold rounded-lg transition-colors"
        >
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
            <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
          </svg>
          Donate
        </a>
      )}
      <UserMenu user={user} />
    </nav>
  );
}
