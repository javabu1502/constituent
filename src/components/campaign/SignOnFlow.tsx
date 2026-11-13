'use client';

import { useState } from 'react';
import { useTurnstile } from '@/components/ui/Turnstile';
import { signonConsentText } from '@/lib/signon';
import type { Campaign } from '@/lib/types';

/**
 * Putting your name to a letter somebody else wrote.
 *
 * Different from the advocacy flow on purpose. Nothing is drafted here and
 * nothing is generated: the letter is fixed, and the only thing the signer
 * supplies is their name and their address.
 * There was a box for a line of their own. It made a ten-second action
 * look like a writing task, and anyone who wants to write has the other
 * option. A letter signed by 500 people
 * says one thing 500 times, which is what makes it readable to an office that
 * discounts 500 near-identical form letters.
 *
 * Two consents, and only one of them is a question. Name and address going to
 * the lawmaker and the organization is a condition of signing, so it is
 * stated above the button rather than hidden in a checkbox nobody reads.
 * Whether their name shows on this page is genuinely optional and defaults to
 * off.
 */
export function SignOnFlow({ campaign }: { campaign: Campaign & { letter_body?: string | null } }) {
  const { getToken, TurnstileWidget } = useTurnstile();
  const [done, setDone] = useState<{ districtResolved: boolean } | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '', email: '', street: '', city: '', state: '', zip: '', showNamePublicly: false,
  });

  const consent = signonConsentText(campaign.org_name);
  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.type === 'checkbox' ? (e.target as HTMLInputElement).checked : e.target.value }));

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const turnstileToken = await getToken();
      const res = await fetch(`/api/campaigns/${campaign.slug}/sign`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, consentText: consent, turnstileToken }),
      });
      const json = (await res.json()) as { error?: string; districtResolved?: boolean };
      if (!res.ok) throw new Error(json.error || 'We could not add your name just now.');
      setDone({ districtResolved: !!json.districtResolved });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'We could not add your name just now.');
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="rounded-2xl border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-6">
        <h3 className="font-semibold text-gray-900 dark:text-white">Your name is on the letter.</h3>
        <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
          {done.districtResolved
            ? `${campaign.org_name ?? 'The organization'} will send it to the legislators who represent you.`
            : `We could not match your address to a district. ${campaign.org_name ?? 'The organization'} will sort that out before the letter goes.`}
        </p>
      </div>
    );
  }

  const field = 'w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-surface dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white';

  return (
    <form onSubmit={submit} className="rounded-2xl border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="font-semibold text-gray-900 dark:text-white">Add your name</h3>

      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <input required className={field} placeholder="Full name" value={form.name} onChange={set('name')} autoComplete="name" />
        <input required type="email" className={field} placeholder="Email" value={form.email} onChange={set('email')} autoComplete="email" />
        <input required className={`${field} sm:col-span-2`} placeholder="Street address" value={form.street} onChange={set('street')} autoComplete="street-address" />
        <input required className={field} placeholder="City" value={form.city} onChange={set('city')} autoComplete="address-level2" />
        <div className="grid grid-cols-2 gap-3">
          <input required maxLength={2} className={field} placeholder="State" value={form.state} onChange={set('state')} autoComplete="address-level1" />
          <input required className={field} placeholder="ZIP" value={form.zip} onChange={set('zip')} autoComplete="postal-code" />
        </div>
      </div>

      <p className="mt-4 text-sm text-gray-600 dark:text-gray-300">{consent}</p>

      <label className="mt-3 flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
        <input type="checkbox" className="mt-0.5" checked={form.showNamePublicly} onChange={set('showNamePublicly')} />
        <span>Show my name on this page. Your address is never shown here.</span>
      </label>

      <TurnstileWidget />

      {error && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{error}</p>}

      <button
        type="submit"
        disabled={busy}
        className="mt-4 w-full rounded-xl bg-purple-600 px-6 py-3 font-semibold text-white hover:bg-purple-700 disabled:opacity-60 transition-colors"
      >
        {busy ? 'Adding your name...' : 'Sign the letter'}
      </button>
    </form>
  );
}
