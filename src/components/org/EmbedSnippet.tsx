'use client';

import { useState } from 'react';

/**
 * The iframe snippet an organization pastes into their own site, plus the
 * listener that lets the frame resize itself (EmbedAutoHeight posts to it).
 *
 * Used for both embeds: the join form and the supporter map. The map's path
 * carries a signed token, because unlike the form it is not public by slug.
 */
export function EmbedSnippet({
  slug,
  path,
  title,
  minHeight = 620,
}: {
  slug: string;
  /** Path under the origin, e.g. `/embed/org/acme` or `/embed/org/acme/map?t=…`. */
  path?: string;
  title?: string;
  minHeight?: number;
}) {
  const [copied, setCopied] = useState(false);
  const origin = typeof window !== 'undefined' ? window.location.origin : 'https://www.mydemocracy.app';
  const src = path ?? `/embed/org/${slug}`;
  const frameTitle = title ?? 'Join the campaign';
  // The listener matches on the path without its query string, so a rotated
  // token does not stop the frame resizing.
  const matchOn = src.split('?')[0];
  const snippet = `<iframe
  src="${origin}${src}"
  title="${frameTitle}"
  style="width:100%;border:0;min-height:${minHeight}px"
  loading="lazy"></iframe>
<script>
  window.addEventListener('message', function (e) {
    if (e.data && e.data.type === 'mydemocracy:height') {
      var f = document.querySelector('iframe[src*="${matchOn}"]');
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
        <a href={src} target="_blank" rel="noreferrer" className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
          Preview what visitors see
        </a>
      </div>
    </div>
  );
}
