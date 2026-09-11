'use client';

import { useState } from 'react';

// Dashboard action: hands the org a copy-paste snippet that renders the
// campaign's take-action flow on their own website.
export function EmbedCodeButton({ slug }: { slug: string }) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState<'script' | 'iframe' | null>(null);

  const handleCopy = async (which: 'script' | 'iframe', code: string) => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(which);
      setTimeout(() => setCopied(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  // Origin resolved at click time (client-only) so preview deploys hand out
  // snippets pointing at themselves.
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.mydemocracy.app';
  const scriptSnippet = `<div data-mydemocracy-campaign="${slug}"></div>\n<script async src="${origin}/embed.js"></script>`;
  const iframeSnippet = `<iframe src="${origin}/embed/${slug}" title="My Democracy campaign" style="width:100%;border:0;height:900px"></iframe>`;

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium rounded-lg transition-colors"
      >
        Embed
      </button>

      {open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="w-full max-w-lg bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-xl p-6"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-label="Embed this campaign"
          >
            <div className="flex items-start justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Embed this campaign</h3>
              <button
                onClick={() => setOpen(false)}
                aria-label="Close"
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xl leading-none"
              >
                &times;
              </button>
            </div>

            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
              Paste this where you want the campaign to appear on your site. It sizes itself to fit.
            </p>
            <pre className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre-wrap break-all">
              {scriptSnippet}
            </pre>
            <button
              onClick={() => handleCopy('script', scriptSnippet)}
              className="mt-2 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
            >
              {copied === 'script' ? 'Copied!' : 'Copy code'}
            </button>

            <p className="text-sm text-gray-600 dark:text-gray-400 mt-5 mb-2">
              If your site builder strips script tags, use the plain iframe instead:
            </p>
            <pre className="p-3 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 text-xs text-gray-800 dark:text-gray-200 overflow-x-auto whitespace-pre-wrap break-all">
              {iframeSnippet}
            </pre>
            <button
              onClick={() => handleCopy('iframe', iframeSnippet)}
              className="mt-2 px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium rounded-lg transition-colors"
            >
              {copied === 'iframe' ? 'Copied!' : 'Copy iframe'}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
