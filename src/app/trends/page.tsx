import type { Metadata } from 'next';
import { Suspense } from 'react';
import { TrendsContent } from '@/components/trends/TrendsContent';

export const metadata: Metadata = {
  title: 'Advocacy Trends — My Democracy',
  description: 'See what issues people across the country are writing to Congress about.',
};

export default function TrendsPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <Suspense fallback={<TrendsSkeleton />}>
        <TrendsContent />
      </Suspense>
    </div>
  );
}

function TrendsSkeleton() {
  return (
    <div className="animate-pulse space-y-8">
      <div>
        <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-64 mb-2" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-96" />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 h-24" />
        ))}
      </div>
      <div className="space-y-3">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 bg-gray-200 dark:bg-gray-700 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
