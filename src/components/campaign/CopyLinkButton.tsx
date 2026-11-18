'use client';

import { useState } from 'react';

export function CopyLinkButton({ slug, menuItem = false }: { slug: string; menuItem?: boolean }) {
  // Rendered as a row inside the card's overflow menu rather than a
  // standalone button. Behaviour, including the modal, is unchanged.
  const triggerCls = menuItem
    ? "w-full text-left px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-md transition-colors"
    : "px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium rounded-lg transition-colors";
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/campaign/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className={triggerCls}
    >
      {copied ? 'Copied!' : 'Share'}
    </button>
  );
}
