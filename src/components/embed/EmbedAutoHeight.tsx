'use client';

import { useEffect, useRef } from 'react';

// Measures the wrapper (not document.body — the layout's min-h-screen makes
// body height track the iframe viewport, which would ratchet the frame up and
// never let it shrink) and reports it to the host page. embed.js on the host
// listens for this message and sizes the iframe to fit.
export function EmbedAutoHeight({ children }: { children: React.ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || window.parent === window) return;

    const post = () => {
      window.parent.postMessage(
        { type: 'mydemocracy:height', height: Math.ceil(el.getBoundingClientRect().height) },
        '*'
      );
    };
    post();
    const observer = new ResizeObserver(post);
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return <div ref={ref}>{children}</div>;
}
