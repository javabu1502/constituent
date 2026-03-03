import type { Metadata } from 'next';
import Link from 'next/link';
import { BreadcrumbJsonLd } from '@/lib/seo';
import { CivicNews } from '@/components/news/CivicNews';

export const metadata: Metadata = {
  title: 'Civic News | My Democracy',
  description:
    'Stay informed with the latest civic and political news from multiple sources. Find actionable stories and contact your representatives.',
  openGraph: {
    title: 'Civic News | My Democracy',
    description:
      'Stay informed with the latest civic and political news from multiple sources.',
    url: 'https://www.mydemocracy.app/news',
    type: 'website',
  },
  alternates: {
    canonical: 'https://www.mydemocracy.app/news',
  },
};

export default function NewsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <BreadcrumbJsonLd
        items={[
          { name: 'Home', href: '/' },
          { name: 'News', href: '/news' },
        ]}
      />

      {/* Breadcrumbs */}
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/" className="hover:text-purple-600 dark:hover:text-purple-400">Home</Link>
        {' / '}
        <span className="text-gray-900 dark:text-white font-medium">News</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Civic News
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          The latest political and civic news from multiple sources, with actionable links to contact your representatives.
        </p>
      </div>

      <CivicNews showLegend showFilters />
    </div>
  );
}
