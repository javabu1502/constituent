'use client';

import { useState } from 'react';

export function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
  );
}

export function CollapsibleSection({ title, badge, children, defaultOpen = true }: {
  title: string;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="mb-4">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="font-semibold text-gray-900 dark:text-white text-sm">{title}</span>
          {badge && <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300">{badge}</span>}
        </div>
        <ChevronIcon open={open} />
      </button>
      {open && <div className="mt-2 space-y-3">{children}</div>}
    </div>
  );
}
