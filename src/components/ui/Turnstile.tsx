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
        }
      ) => string;
      reset: (widgetId: string) => void;
      getResponse: (widgetId: string) => string | undefined;
      execute: (container: HTMLElement | string, options?: Record<string, unknown>) => void;
    };
  }
}

export interface TurnstileRef {
  getToken: () => Promise<string>;
}

interface TurnstileProps {
  onToken?: (token: string) => void;
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
  const containerRef = useRef<HTMLDivElement>(null);
  const resolveRef = useRef<((token: string) => void) | null>(null);
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) return;

    // Load the Turnstile script if not already loaded
    if (!document.querySelector('script[src*="turnstile"]')) {
      const script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      document.head.appendChild(script);
    }

    const initWidget = () => {
      if (!window.turnstile || !containerRef.current || widgetIdRef.current) return;

      widgetIdRef.current = window.turnstile.render(containerRef.current, {
        sitekey: siteKey,
        callback: (t: string) => {
          setToken(t);
          resolveRef.current?.(t);
          resolveRef.current = null;
        },
        'expired-callback': () => setToken(null),
        'error-callback': () => setToken(null),
        size: 'invisible',
      });
    };

    // Wait for script to load
    const interval = setInterval(() => {
      if (window.turnstile) {
        initWidget();
        clearInterval(interval);
      }
    }, 100);

    return () => clearInterval(interval);
  }, [siteKey]);

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

    // Wait for token
    return new Promise((resolve) => {
      resolveRef.current = resolve;
      if (widgetIdRef.current && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
      }
    });
  }, [siteKey, token]);

  const TurnstileWidget = useCallback(() => {
    if (!siteKey) return null;
    return <div ref={containerRef} />;
  }, [siteKey]);

  return { getToken, TurnstileWidget };
}
