'use client';

import { useState } from 'react';

/**
 * The iframe snippet an organization pastes into their own site, plus the
 * listener that lets the frame resize itself (EmbedAutoHeight posts to it).
 */
export function EmbedSnippet({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.mydemocracy.app';
  const snippet = `<iframe
  src="${origin}/embed/org/${slug}"
  title="Join the campaign"
  style="width:100%;border:0;min-height:620px"
  loading="lazy"></iframe>
<script>
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'mydemocracy:height') {
      var f = document.querySelector('iframe[src*="/embed/org/${slug}"]');
      if (f) f.style.height = e.data.height + 'px';
    }
  });
</script>`;

  return (
    <div>
      <pre className="p-4 rounded-xl bg-gray-900 text-gray-100 text-xs overflow-x-auto">
        <code>{snippet}</code>
      </pre>
      <div className="mt-2 flex items-center gap-3">
        <button
          type="button"
          onClick={async () => {
            try {
              await navigator.clipboard.writeText(snippet);
              setCopied(true);
              setTimeout(() => setCopied(false), 2000);
            } catch {
              setCopied(false);
            }
          }}
          className="px-3 py-1.5 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
        >
          {copied ? 'Copied' : 'Copy snippet'}
        </button>
        <a href={`/org/${slug}`} className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
          Or share your join page
        </a>
      </div>
    </div>
  );
}
