'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { FeedBill } from '@/lib/types';

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 animate-pulse">
      <div className="flex items-center gap-2 mb-2">
        <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-20" />
        <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded-full w-14" />
      </div>
      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
      <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded w-36" />
    </div>
  );
}

export function RepActivitySection() {
  const [bills, setBills] = useState<FeedBill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/feed/representatives')
      .then((res) => res.json())
      .then((data) => setBills(data.bills ?? []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  if (bills.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No bills found</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Add your address to see recent bills from your representatives.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {bills.map((bill, i) => (
        <div
          key={i}
          className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4"
        >
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-purple-600 dark:text-purple-400 text-sm">
              {bill.bill_number}
            </span>
            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
              bill.level === 'federal'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300'
            }`}>
              {bill.level === 'federal' ? 'Federal' : 'State'}
            </span>
          </div>
          <p className="text-sm text-gray-900 dark:text-white line-clamp-2 mb-2">
            {bill.title}
          </p>
          <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mb-3">
            <span>{bill.sponsor_name}</span>
            {bill.date && (
              <>
                <span>·</span>
                <span>{formatDate(bill.date)}</span>
              </>
            )}
            {bill.status && (
              <>
                <span>·</span>
                <span className="truncate">{bill.status}</span>
              </>
            )}
          </div>
          <Link
            href={`/contact?repId=${bill.rep_id}`}
            className="inline-block px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Write About This
          </Link>
        </div>
      ))}
    </div>
  );
}
