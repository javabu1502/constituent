import Link from 'next/link';
import { BRAND } from '@/lib/constants';

const FOOTER_COLUMNS = [
  {
    heading: 'Explore',
    links: [
      { href: '/contact', label: 'Contact' },
      { href: '/legislators', label: 'Legislators' },
      { href: '/news', label: 'News' },
      { href: '/trends', label: 'Trends' },
      { href: '/vote', label: 'Vote' },
      { href: '/regulations', label: 'Regulations' },
    ],
  },
  {
    heading: 'Learn',
    links: [
      { href: '/guides', label: 'Guides' },
      { href: '/campaigns', label: 'Campaigns' },
      { href: '/about', label: 'About' },
      { href: 'https://buymeacoffee.com/mydemocracy', label: 'Support', external: true },
    ],
  },
  {
    heading: 'Legal',
    links: [
      { href: '/privacy', label: 'Privacy' },
      { href: '/terms', label: 'Terms' },
    ],
  },
] as const;

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 sm:gap-8 mb-8">
          {FOOTER_COLUMNS.map((col) => (
            <div key={col.heading}>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 mb-3">
                {col.heading}
              </h3>
              <ul className="space-y-1 text-sm">
                {col.links.map((link) => (
                  <li key={link.href}>
                    {'external' in link && link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block py-1 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="inline-block py-1 text-gray-500 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-6 pb-2 flex flex-col sm:flex-row items-center justify-center gap-3 text-center">
          <span className="text-sm text-gray-600 dark:text-gray-300">
            Keep {BRAND.name} free and independent.
          </span>
          <a
            href="https://buymeacoffee.com/mydemocracy"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
              <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
            </svg>
            Donate
          </a>
        </div>
        <div className="border-t border-gray-200 dark:border-gray-700 pt-4 text-center">
          <span className="text-sm text-gray-600 dark:text-gray-400">
            {BRAND.name} &copy; {currentYear}
          </span>
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            {BRAND.description}
          </p>
        </div>
      </div>
    </footer>
  );
}
