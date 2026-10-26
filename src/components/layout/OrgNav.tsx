'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

/**
 * Navigation for a signed-in organization.
 *
 * The main header is built for a constituent: write to your officials, weigh
 * in, vote, donate. None of that is what an organization came to do, and
 * until now the only way into their own work was a single dashboard link
 * buried in the account menu. Getting from a campaign to the settings page
 * meant knowing the URL.
 *
 * These are the four places an organization actually works, with the current
 * one marked.
 */
export const ORG_NAV = [
  { href: '/dashboard', label: 'Campaigns' },
  { href: '/dashboard/report', label: 'Reports' },
  { href: '/dashboard/settings', label: 'Settings' },
] as const;

export function OrgNav() {
  const pathname = usePathname();
  const isCurrent = (href: string) =>
    href === '/dashboard' ? pathname === '/dashboard' || pathname.startsWith('/campaign/') : pathname === href;

  return (
    <>
      {ORG_NAV.map((item) => (
        <Link
          key={item.href}
          href={item.href}
          aria-current={isCurrent(item.href) ? 'page' : undefined}
          className={`text-sm font-medium transition-colors ${
            isCurrent(item.href)
              ? 'text-purple-700 dark:text-purple-300 underline underline-offset-8 decoration-2'
              : 'text-gray-700 dark:text-gray-300 hover:text-purple-600 dark:hover:text-purple-400'
          }`}
        >
          {item.label}
        </Link>
      ))}
      <Link
        href="/campaign/create"
        className="px-3 py-1.5 bg-purple-600 text-white text-sm font-medium rounded-lg hover:bg-purple-700 transition-colors"
      >
        New campaign
      </Link>
    </>
  );
}
