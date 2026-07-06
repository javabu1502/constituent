'use client';

import { useState } from 'react';

/**
 * Official portrait with a lettered fallback. Client component because the
 * onError fallback needs an event handler, which server components can't pass.
 */
export function RepPhoto({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="w-[150px] h-[183px] sm:w-[225px] sm:h-[275px] rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center">
        <span className="text-gray-500 dark:text-gray-400 text-5xl font-medium">
          {alt.charAt(0)}
        </span>
      </div>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      width={225}
      height={275}
      className="w-[150px] h-[183px] sm:w-[225px] sm:h-[275px] object-cover rounded-lg border border-gray-200 dark:border-gray-600"
      onError={() => setFailed(true)}
    />
  );
}
