'use client';

import { useEffect, useRef, useCallback, useState } from 'react';

declare global {
  interface Window {
    turnstile?: {
      render: (
        container: HTMLElement,
        options: {
          sitekey: string;
          callback: (token: string) => void;
          'expired-callback'?: () => void;
          'error-callback'?: () => void;
          size?: 'invisible' | 'normal' | 'compact';
          execution?: 'render' | 'execute';
        }
      ) => string;
      reset: (widgetId: string) => void;
      remove?: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
      execute: (container: HTMLElement | string, options?: Record<string, unknown>) => void;
    };
  }
}

export interface TurnstileRef {
  getToken: () => Promise<string>;
}

/**
 * Invisible Cloudflare Turnstile widget.
 * Renders nothing if NEXT_PUBLIC_TURNSTILE_SITE_KEY is not set (dev mode).
 *
 * Usage:
 *   const turnstileRef = useRef<TurnstileRef>(null);
 *   <Turnstile ref={turnstileRef} />
 *   const token = await turnstileRef.current.getToken();
 */
export function useTurnstile() {
  const [token, setToken] = useState<string | null>(null);
  const widgetIdRef = useRef<string | null>(null);
  const resolveRef = useRef<((token: string) => void) | null>(null);
  // The container is STATE, not a ref: the widget must (re)render whenever a
  // <TurnstileWidget /> actually enters the DOM. The old code tried exactly
  // once at hook mount — if the widget JSX wasn't rendered on that step yet
  // (e.g. the hook mounts on a stance step and the widget appears on the
  // form step), the one-shot init no-oped and every token came back empty,
  // 403ing all anonymous requests.
  const [container, setContainer] = useState<HTMLDivElement | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  // Load the Turnstile script once
  useEffect(() => {
    if (!siteKey) return;
    if (!document.querySelector('script[src*="turnstile"]')) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      document.head.appendChild(script);
    }
  }, [siteKey]);

  // Render the widget into whichever container is currently mounted.
  useEffect(() => {
    if (!siteKey || !container) return;

    let cancelled = false;
    const initWidget = () => {
      if (cancelled || !window.turnstile || widgetIdRef.current) return;
      widgetIdRef.current = window.turnstile.render(container, {
        sitekey: siteKey,
        callback: (t: string) => {
          setToken(t);
          resolveRef.current?.(t);
          resolveRef.current = null;
        },
        'expired-callback': () => setToken(null),
        'error-callback': () => setToken(null),
        size: 'invisible',
        execution: 'execute',
      });
    };

    if (window.turnstile) {
      initWidget();
      return () => {
        cancelled = true;
        if (widgetIdRef.current) {
          try {
            window.turnstile?.remove?.(widgetIdRef.current);
          } catch {
            // widget already gone with its DOM node
          }
          widgetIdRef.current = null;
        }
      };
    }

    // Script still loading — poll until it's ready
    const interval = setInterval(() => {
      if (window.turnstile) {
        clearInterval(interval);
        initWidget();
      }
    }, 100);

    return () => {
      cancelled = true;
      clearInterval(interval);
      if (widgetIdRef.current) {
        try {
          window.turnstile?.remove?.(widgetIdRef.current);
        } catch {
          // widget already gone with its DOM node
        }
        widgetIdRef.current = null;
      }
    };
  }, [siteKey, container]);

  const getToken = useCallback(async (): Promise<string> => {
    if (!siteKey) return '';

    // Return existing token if available
    if (token) {
      const current = token;
      // Reset for next use
      setToken(null);
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
      return current;
    }

    // Wait for token with a timeout so we don't hang forever
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        window.turnstile.execute(widgetIdRef.current);
      }
      // If Turnstile doesn't respond in 5 seconds, proceed without token
      setTimeout(() => {
        if (resolveRef.current === resolve) {
          resolveRef.current = null;
          resolve('');
        }
      }, 5000);
    });
  }, [siteKey, token]);

  const TurnstileWidget = useCallback(() => {
    if (!siteKey) return null;
    return <div ref={setContainer} />;
  }, [siteKey]);

  return { getToken, TurnstileWidget };
}
