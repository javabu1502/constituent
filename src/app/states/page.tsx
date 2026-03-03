import type { Metadata } from 'next';
import Link from 'next/link';
import { US_STATES } from '@/lib/constants';
import { StatePicker } from '@/components/ui/StatePicker';

export const metadata: Metadata = {
  title: 'All 50 States & DC | Voting Info, Representatives & Elections | My Democracy',
  description:
    'Find voting rules, election dates, and elected officials for every U.S. state and Washington DC. Your starting point for civic engagement.',
  keywords: [
    'US states government info',
    'state representatives',
    'state voting info',
    'election dates by state',
    'state senators',
    'find my representative',
  ],
  openGraph: {
    title: 'All 50 States & DC | Voting Info, Representatives & Elections | My Democracy',
    description:
      'Find voting rules, election dates, and elected officials for every U.S. state and Washington DC.',
    url: 'https://www.mydemocracy.app/states',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.mydemocracy.app/states',
  },
};

export default function StatesIndexPage() {
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.mydemocracy.app',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'States',
        item: 'https://www.mydemocracy.app/states',
      },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Breadcrumbs */}
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/" className="hover:text-purple-600 dark:hover:text-purple-400">Home</Link>
        {' / '}
        <span className="text-gray-900 dark:text-white font-medium">States</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          All 50 States &amp; DC
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Voting rules, election dates, and representatives for every state.
        </p>
      </div>

      {/* State search */}
      <div className="mb-8">
        <StatePicker />
      </div>

      {/* State grid (expandable for browsing / SEO) */}
      <details>
        <summary className="cursor-pointer text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 mb-4">
          View all states
        </summary>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {US_STATES.map((s) => (
            <Link
              key={s.code}
              href={`/states/${s.name.toLowerCase().replace(/\s+/g, '-')}`}
              className="px-3 py-2 bg-white dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 hover:border-purple-400 dark:hover:border-purple-500 hover:text-purple-600 dark:hover:text-purple-400 transition-colors text-center"
            >
              {s.name}
            </Link>
          ))}
        </div>
      </details>
    </div>
  );
}
