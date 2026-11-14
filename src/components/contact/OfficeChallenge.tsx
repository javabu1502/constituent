'use client';

import { useEffect, useRef, useState } from 'react';
import type { ChallengeOffice } from '@/lib/webform/challenge-offices';

declare global {
  interface Window {
    grecaptcha?: {
      render: (el: HTMLElement, opts: { sitekey: string; callback: (token: string) => void; 'expired-callback'?: () => void }) => number;
      reset: (id?: number) => void;
    };
  }
}

/**
 * The office's own challenge, drawn here for the sender to answer.
 *
 * Four Senate offices put a reCAPTCHA checkbox in front of their contact
 * form. Nothing automated can answer one, and nothing here tries. This is the
 * office's widget, loaded with the office's own public sitekey, and the
 * person sending the message clicks it themselves. The token Google gives
 * back travels with their message and the office's server checks it the way
 * it checks any other.
 *
 * What the challenge exists to stop is bulk automated submission. One person
 * answering one challenge for their own letter is what it is asking for. The
 * only thing that moves is which page the checkbox is drawn on, which is what
 * EFF's Phantom of the Capitol did by screenshotting an image challenge back
 * to the sender.
 */
export function OfficeChallenge({
  office,
  onToken,
}: {
  office: ChallengeOffice;
  onToken: (token: string | null) => void;
}) {
  const holder = useRef<HTMLDivElement | null>(null);
  const widgetId = useRef<number | null>(null);
  const [state, setState] = useState<'loading' | 'ready' | 'solved' | 'failed'>('loading');

  useEffect(() => {
    let cancelled = false;

    const render = () => {
      if (cancelled || !holder.current || widgetId.current !== null || !window.grecaptcha) return;
      try {
        widgetId.current = window.grecaptcha.render(holder.current, {
          sitekey: office.sitekey,
          callback: (token: string) => { setState('solved'); onToken(token); },
          // A token lasts about two minutes. When it lapses the message must
          // not go out carrying a dead one.
          'expired-callback': () => { setState('ready'); onToken(null); },
        });
        setState('ready');
      } catch {
        setState('failed');
      }
    };

    if (window.grecaptcha?.render) { render(); return () => { cancelled = true; }; }

    const existing = document.querySelector<HTMLScriptElement>('script[data-office-challenge]');
    const script = existing ?? document.createElement('script');
    if (!existing) {
      script.src = 'https://www.google.com/recaptcha/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.dataset.officeChallenge = 'true';
      document.head.appendChild(script);
    }
    const poll = window.setInterval(() => {
      if (window.grecaptcha?.render) { window.clearInterval(poll); render(); }
    }, 200);
    const giveUp = window.setTimeout(() => { window.clearInterval(poll); if (!cancelled) setState((s) => (s === 'loading' ? 'failed' : s)); }, 12_000);

    return () => { cancelled = true; window.clearInterval(poll); window.clearTimeout(giveUp); };
  }, [office.sitekey, onToken]);

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <p className="text-sm text-gray-700 dark:text-gray-300">
        {office.name}&apos;s office asks senders to confirm they are a person. This is their check. Answer
        it and your message goes to them directly.
      </p>
      <div ref={holder} className="mt-3" />
      {state === 'failed' && (
        <p className="mt-2 text-sm text-amber-700 dark:text-amber-400">
          Their check could not load. You can still send this message from your own email app.
        </p>
      )}
      {state === 'solved' && (
        <p className="mt-2 text-sm text-green-700 dark:text-green-400">Thank you. Your message is ready to send.</p>
      )}
    </div>
  );
}
