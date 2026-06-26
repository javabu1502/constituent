'use client';

import { useState, useEffect } from 'react';

const DISMISS_KEY = 'md_support_nudge_dismissed';

/**
 * A small, one-time, dismissible "chip in" prompt shown after a meaningful
 * action (sending a message, submitting a story). Inline and non-blocking —
 * never a modal. Remembers dismissal in localStorage so it shows at most once.
 */
export function SupportNudge() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    try {
      if (!localStorage.getItem(DISMISS_KEY)) setShow(true);
    } catch {
      // localStorage unavailable — just don't show
    }
  }, []);

  if (!show) return null;

  const dismiss = () => {
    try {
      localStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // ignore
    }
    setShow(false);
  };

  return (
    <div className="mt-6 flex items-start gap-3 p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 text-left">
      <svg className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20" aria-hidden="true">
        <path d="M3.172 5.172a4 4 0 015.656 0L10 6.343l1.172-1.171a4 4 0 115.656 5.656L10 17.657l-6.828-6.829a4 4 0 010-5.656z" />
      </svg>
      <div className="flex-1">
        <p className="text-sm text-amber-900 dark:text-amber-200">
          My Democracy is user-funded — no ads, no data sales. If this was useful, want to chip in to keep it free?
        </p>
        <div className="mt-2 flex items-center gap-3">
          <a
            href="https://buymeacoffee.com/mydemocracy"
            target="_blank"
            rel="noopener noreferrer"
            onClick={dismiss}
            className="text-xs font-semibold px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-md transition-colors"
          >
            Donate
          </a>
          <button onClick={dismiss} className="text-xs text-amber-700 dark:text-amber-300 hover:underline">
            Maybe later
          </button>
        </div>
      </div>
      <button
        onClick={dismiss}
        aria-label="Dismiss"
        className="text-amber-500 hover:text-amber-700 dark:hover:text-amber-300 transition-colors"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}
