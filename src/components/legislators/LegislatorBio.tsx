'use client';

import { useEffect, useState } from 'react';

interface Bio {
  extract: string | null;
  articleUrl?: string;
  articleTitle?: string;
}

/**
 * The opening paragraph of a legislator's Wikipedia article.
 *
 * Written by people and attributed, rather than generated. Wikipedia prose is
 * CC BY-SA, which is why the article link is not optional decoration: it is
 * the attribution, and it goes next to the text whether or not it looks tidy.
 *
 * Renders nothing at all when there is no article or the fetch fails. A
 * legislator without one gets a shorter page, which is better than a page
 * carrying a sentence nobody can source.
 */
export function LegislatorBio({ wikipediaUrl, name }: { wikipediaUrl: string; name: string }) {
  const [bio, setBio] = useState<Bio | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/legislators/wiki-bio?url=${encodeURIComponent(wikipediaUrl)}`);
        if (!res.ok) return;
        const body = (await res.json()) as Bio;
        if (!cancelled && body.extract) setBio(body);
      } catch {
        // No biography is a fine outcome; a wrong one is not.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [wikipediaUrl]);

  if (!bio?.extract) return null;

  return (
    <section className="mb-12">
      <h2 className="label mb-4 border-t border-gray-900 dark:border-gray-600 pt-6">About {name}</h2>
      <p className="text-[17px] leading-relaxed text-gray-800 dark:text-gray-200 max-w-[66ch]">{bio.extract}</p>
      <p className="mt-3 text-xs text-gray-600 dark:text-gray-400">
        From{' '}
        <a
          href={bio.articleUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:no-underline"
        >
          Wikipedia
        </a>
        , available under CC BY-SA 4.0.
      </p>
    </section>
  );
}
