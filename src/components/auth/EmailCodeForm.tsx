'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { AddressAutocomplete, type ParsedAddress } from '@/components/ui/AddressAutocomplete';
import { useTurnstile } from '@/components/ui/Turnstile';

/**
 * Sign in, or create an account, with a code sent to your email.
 *
 * There is no password anywhere in this flow. A password on a civic tool is
 * a thing to forget and a thing to reset, and it bought nothing: the email
 * was already the identity, and an account that was never confirmed could
 * not be used. Eleven of the forty-five accounts on the platform are
 * unconfirmed sign-ups that never verified; under this flow they could not
 * exist, because an account is only created once a code is entered.
 *
 * Sign-in and sign-up are the same two steps. The only difference is that
 * sign-up asks for a name and address first, which ride along as user
 * metadata and are applied when the account is created.
 *
 * Requires Supabase Auth's email template to include {{ .Token }}. Without
 * it the mail carries a magic link and no code, and the second step has
 * nothing to type.
 */
const RESEND_SECONDS = 60;

export function EmailCodeForm({
  mode,
  redirectTo = '/dashboard',
}: {
  mode: 'signin' | 'signup';
  redirectTo?: string;
}) {
  const { getToken, TurnstileWidget } = useTurnstile();
  const router = useRouter();

  const [stage, setStage] = useState<'email' | 'code'>('email');
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [address, setAddress] = useState<ParsedAddress>({ street: '', city: '', state: '', zip: '' });
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const codeRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  // Moving to the code step should land the cursor in the code box; people
  // arrive here from their mail app with six digits in their head.
  useEffect(() => {
    if (stage === 'code') codeRef.current?.focus();
  }, [stage]);

  const sendCode = async (resend = false) => {
    setError('');
    setNote('');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }
    if (mode === 'signup' && !resend && name.trim().length < 2) {
      setError('Please enter your name.');
      return;
    }
    setBusy(true);
    try {
      const captchaToken = await getToken();
      // Our own route rather than signInWithOtp, because that sends through
      // Supabase's mailer, which allows a couple of messages an hour across
      // the whole project. With no password every sign-in needs an email, so
      // that cap is the number of people who can get in. This sends the same
      // code through Resend instead. Verifying it below is unchanged.
      //
      // One flow for both: an address with no account gets one, instead of a
      // dead end telling someone to go to another page and type it again.
      const hasAddress = !!(address.street && address.city && address.state && address.zip);
      const res = await fetch('/api/auth/send-code', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim(),
          ...(mode === 'signup'
            ? { name: name.trim(), ...(hasAddress ? { address } : {}) }
            : {}),
          ...(captchaToken ? { captchaToken } : {}),
        }),
      });
      if (!res.ok) {
        const b = await res.json().catch(() => ({}));
        setError(b.error || 'Could not send a code. Try again.');
        return;
      }
      setStage('code');
      setCooldown(RESEND_SECONDS);
      if (resend) setNote('We sent another code.');
    } finally {
      setBusy(false);
    }
  };

  const verify = async () => {
    setError('');
    setNote('');
    const token = code.replace(/\D/g, '');
    if (token.length !== 6) {
      setError('Enter the 6-digit code from your email.');
      return;
    }
    setBusy(true);
    try {
      const { error: authError } = await createClient().auth.verifyOtp({
        email: email.trim(),
        token,
        type: 'email',
      });
      if (authError) {
        setError(
          /expired/i.test(authError.message)
            ? 'That code has expired. Send a new one below.'
            : 'That code did not match. Check the digits and try again.',
        );
        return;
      }
      router.push(redirectTo);
      router.refresh();
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      className="space-y-4"
      onSubmit={(e) => {
        e.preventDefault();
        void (stage === 'email' ? sendCode() : verify());
      }}
    >
      {error && (
        <div role="alert" className="p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}
      {note && (
        <div role="status" className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
          <p className="text-sm text-green-800 dark:text-green-300">{note}</p>
        </div>
      )}

      {stage === 'email' ? (
        <>
          {mode === 'signup' && (
            <Input
              label="Full name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Your full name"
              autoComplete="name"
              required
            />
          )}

          <Input
            label="Email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
            required
          />

          {mode === 'signup' && (
            <div>
              <AddressAutocomplete onAddressChange={setAddress} label="Home address" optional />
              <p className="mt-1 text-xs text-gray-600 dark:text-gray-400">
                Optional. It lets us show who represents you as soon as you sign in.
              </p>
            </div>
          )}

          <TurnstileWidget />

          <Button type="submit" className="w-full" isLoading={busy}>
            Email me a code
          </Button>

          <p className="text-center text-xs text-gray-600 dark:text-gray-400">
            No password needed. We send a 6-digit code that expires shortly.
          </p>
        </>
      ) : (
        <>
          <p className="text-sm text-gray-700 dark:text-gray-300">
            We sent a 6-digit code to <strong className="font-semibold">{email}</strong>.
          </p>

          <Input
            ref={codeRef}
            label="6-digit code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
            placeholder="123456"
            className="font-mono text-2xl tracking-[0.4em]"
            required
          />

          <Button type="submit" className="w-full" isLoading={busy}>
            Verify and continue
          </Button>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                setStage('email');
                setCode('');
                setError('');
                setNote('');
              }}
              className="text-xs underline underline-offset-2 text-gray-700 dark:text-gray-300 hover:no-underline"
            >
              Use a different email
            </button>
            <button
              type="button"
              disabled={cooldown > 0 || busy}
              onClick={() => void sendCode(true)}
              className="text-xs underline underline-offset-2 text-purple-700 dark:text-purple-300 hover:no-underline disabled:no-underline disabled:text-gray-500 disabled:cursor-not-allowed"
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : 'Resend code'}
            </button>
          </div>
        </>
      )}
    </form>
  );
}
