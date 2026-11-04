'use client';

import { useState } from 'react';
import { AddressAutocomplete, type ParsedAddress } from '@/components/ui/AddressAutocomplete';
import { useTurnstile } from '@/components/ui/Turnstile';
import { streetLooksUndeliverable } from '@/lib/cwc-client';

const CONSENT_TEXT =
  'I would like to hear from this organization about this issue, and I understand I can unsubscribe at any time.';

/**
 * "Join the campaign" for an organization: a supporter sign-up that does not
 * require writing a letter first.
 *
 * The street address is required, with the same autocomplete the rest of the
 * site uses. It is what turns a list into district counts, and the form says
 * so plainly rather than asking for an address and leaving people to wonder.
 */
export function JoinForm({ slug, orgName, compact = false }: { slug: string; orgName: string; compact?: boolean }) {
  const { getToken, TurnstileWidget } = useTurnstile();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState<ParsedAddress>({ street: '', city: '', state: '', zip: '' });
  const [consent, setConsent] = useState(false);
  const [streetWarning, setStreetWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<{ senate?: string | null; assembly?: string | null; placed: boolean } | null>(null);

  const submit = async (ackedStreet: boolean) => {
    setError(null);
    if (name.trim().length < 2) return setError('Please enter your name.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) return setError('Please enter a valid email address.');
    if (address.street.trim().length < 3) return setError('Please enter your street address.');
    if (address.city.trim().length < 2) return setError('Please enter your city.');
    if (!address.state) return setError('Please select your state.');
    if (!/^\d{5}(-\d{4})?$/.test(address.zip.trim())) return setError('Please enter your 5-digit ZIP code. ZIP+4 is welcome.');
    if (!consent) return setError('Please tick the box so we know you want to hear from us.');
    if (!ackedStreet && streetLooksUndeliverable(address.street)) {
      setStreetWarning(true);
      return;
    }
    setStreetWarning(false);
    setBusy(true);
    try {
      const token = await getToken();
      const res = await fetch(`/api/org/${encodeURIComponent(slug)}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          street: address.street.trim(),
          city: address.city.trim(),
          state: address.state,
          zip: address.zip.trim(),
          consentText: CONSENT_TEXT,
          ...(token ? { turnstileToken: token } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'We could not add you just now.');
      setDone({ senate: data.senateDistrict, assembly: data.assemblyDistrict, placed: !!data.districtResolved });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setBusy(false);
    }
  };

  if (done) {
    return (
      <div className="p-6 rounded-2xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 text-center">
        <h3 className="text-lg font-semibold text-green-900 dark:text-green-200">You&apos;re in. Thank you.</h3>
        <p className="mt-2 text-sm text-green-800 dark:text-green-300">
          {orgName} will be in touch when there is something concrete to do.
        </p>
        {done.placed && (done.senate || done.assembly) && (
          <p className="mt-3 text-sm text-green-800 dark:text-green-300">
            You are counted in
            {done.senate ? ` Senate District ${done.senate}` : ''}
            {done.senate && done.assembly ? ' and' : ''}
            {done.assembly ? ` Assembly District ${done.assembly}` : ''}.
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      className={compact ? '' : 'p-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm'}
      onSubmit={(e) => {
        e.preventDefault();
        void submit(false);
      }}
    >
      <div className="space-y-4">
        <div>
          <label htmlFor="join-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Your name
          </label>
          <input
            id="join-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            placeholder="Your full name"
          />
        </div>

        <div>
          <label htmlFor="join-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email
          </label>
          <input
            id="join-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            className="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            placeholder="you@example.com"
          />
        </div>

        <div>
          <AddressAutocomplete onAddressChange={setAddress} label="Home address" />
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
            Your address decides which legislators represent you. It is never shown publicly.
          </p>
        </div>

        {streetWarning && (
          <div role="alert" className="p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl space-y-3">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              This street looks like a dorm, campus building, PO Box, or has no house number. Districts are drawn around
              residential streets, so a mailing address may not place you in the right one.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  setStreetWarning(false);
                  document.getElementById('address-autocomplete')?.focus();
                }}
                className="flex-1 py-2 px-3 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg"
              >
                Edit my address
              </button>
              <button
                type="button"
                onClick={() => void submit(true)}
                className="flex-1 py-2 px-3 text-sm font-medium border border-amber-300 dark:border-amber-600 text-amber-800 dark:text-amber-200 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40"
              >
                Use this address anyway
              </button>
            </div>
          </div>
        )}

        <label className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5 h-4 w-4 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
          />
          <span>{CONSENT_TEXT}</span>
        </label>

        <TurnstileWidget />

        {error && (
          <div role="alert" className="p-3 rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={busy}
          className="w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
        >
          {busy ? 'Adding you' : 'Join the campaign'}
        </button>
      </div>
    </form>
  );
}
