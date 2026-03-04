'use client';

import { useState } from 'react';
import Link from 'next/link';
import { GUIDES, CATEGORY_LABELS, type GuideCategory } from '@/lib/guides';
import type { ReactNode } from 'react';

const CATEGORIES = Object.keys(CATEGORY_LABELS) as GuideCategory[];

interface GuidesGridProps {
  icons: Record<string, ReactNode>;
}

export default function GuidesGrid({ icons }: GuidesGridProps) {
  const [active, setActive] = useState<GuideCategory | null>(null);

  const filtered = active ? GUIDES.filter((g) => g.category === active) : GUIDES;

  return (
    <>
      {/* Category Tabs */}
      <div className="flex flex-wrap gap-2 mb-8">
        <button
          onClick={() => setActive(null)}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            active === null
              ? 'bg-purple-600 text-white'
              : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
          }`}
        >
          All
        </button>
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              active === cat
                ? 'bg-purple-600 text-white'
                : 'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700'
            }`}
          >
            {CATEGORY_LABELS[cat]}
          </button>
        ))}
      </div>

      {/* Guide Cards Grid */}
      <div className="grid gap-6 sm:grid-cols-2">
        {filtered.map((guide) => (
          <Link
            key={guide.href}
            href={guide.href}
            className="group block bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-lg transition-all"
          >
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900 rounded-xl flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400 group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
              {icons[guide.href]}
            </div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
              {guide.title}
            </h2>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              {guide.description}
            </p>
          </Link>
        ))}
      </div>
    </>
  );
}
