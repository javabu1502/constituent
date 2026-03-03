import Link from 'next/link';
import type { Metadata } from 'next';
import { BreadcrumbJsonLd } from '@/lib/seo';
import { RegulationsBrowser } from '@/components/regulations/RegulationsBrowser';

export const metadata: Metadata = {
  title: 'Federal Regulations & Public Comment | My Democracy',
  description: 'Browse open federal regulations accepting public comments. Submit your opinion on proposed rules from the EPA, FCC, HHS, and more. Track executive orders and recent rules.',
  keywords: [
    'public comment', 'federal regulations', 'proposed rules', 'regulations.gov',
    'federal register', 'executive orders', 'EPA regulations', 'submit comment',
    'notice and comment', 'rulemaking', 'civic participation',
  ],
  alternates: {
    canonical: 'https://www.mydemocracy.app/regulations',
  },
  openGraph: {
    title: 'Federal Regulations & Public Comment | My Democracy',
    description: 'Browse open federal regulations and submit public comments. Your voice matters in the rulemaking process.',
    type: 'website',
  },
};

export default function RegulationsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <BreadcrumbJsonLd items={[{ name: 'Home', href: '/' }, { name: 'Regulations', href: '/regulations' }]} />

      {/* Breadcrumbs */}
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/" className="hover:text-purple-600 dark:hover:text-purple-400">Home</Link>
        {' / '}
        <span className="text-gray-900 dark:text-white font-medium">Regulations</span>
      </nav>

      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
          Federal Regulations &amp; Public Comment
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Federal agencies propose rules that affect everything from air quality to student loans. You have the legal right to comment on proposed rules before they become final.
        </p>

        {/* Explainer card */}
        <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div className="text-sm text-purple-800 dark:text-purple-300">
              <p className="font-medium mb-1">How public comment works</p>
              <p>
                When a federal agency proposes a new rule, they must publish it and accept public comments, typically for 30-60 days. Agencies are legally required to read and respond to substantive comments. Your comment becomes part of the official record and can influence the final rule. This is one of the most direct ways to shape federal policy.
              </p>
            </div>
          </div>
        </div>
      </div>

      <RegulationsBrowser />

      {/* Related guides */}
      <div className="mt-10 pt-8 border-t border-gray-200 dark:border-gray-700">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">Related Guides</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            href="/guides/how-to-track-legislation"
            className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
          >
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">How to Track Legislation</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Follow bills and know when to act</p>
          </Link>
          <Link
            href="/guides/write-effective-letter-to-congress"
            className="p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
          >
            <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">Write an Effective Letter</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Tips for comments that agencies notice</p>
          </Link>
        </div>
      </div>
    </div>
  );
}
