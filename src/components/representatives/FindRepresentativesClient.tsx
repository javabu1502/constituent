'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { Official } from '@/lib/types';
import { AddressAutocomplete, type ParsedAddress } from '@/components/ui/AddressAutocomplete';
import { streetLooksUndeliverable } from '@/lib/cwc-client';
import { trackEvent } from '@/lib/analytics';
import { lowerChamberName } from '@/lib/chambers';

interface LookupAddress {
  city: string;
  stateCode: string;
  congressionalDistrict?: string;
  stateUpperDistrict?: string;
  stateLowerDistrict?: string;
}

function partyAvatarClass(party: string): string {
  const p = (party || '').toLowerCase();
  if (p.includes('democrat')) return 'bg-blue-600 text-white';
  if (p.includes('republican')) return 'bg-red-600 text-white';
  return 'bg-gray-500 text-white';
}

function partyBadgeClass(party: string): string {
  const p = (party || '').toLowerCase();
  if (p.includes('democrat')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  if (p.includes('republican')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
}

/** The Census geocoder returns city names in caps ("RENO"). */
function titleCaseCity(city: string): string {
  if (!city) return city;
  if (city !== city.toUpperCase()) return city;
  return city
    .toLowerCase()
    .replace(/\b[a-z]/g, (c) => c.toUpperCase());
}

function initialsOf(name: string): string {
  return name.split(/\s+/).map((n) => n[0]).join('').slice(0, 2).toUpperCase();
}

/**
 * Officials' photos come from whatever host each government runs: congress
 * uses raw.githubusercontent.com, but state and local rosters point at
 * leg.state.nv.us, reno.gov, washoecounty.gov and hundreds of others, some
 * over plain http. next/image refuses any host missing from next.config's
 * remotePatterns and throws, which took this whole page down on the first
 * Nevada lookup. That allowlist cannot cover every county in the country, so
 * these 48px avatars load as plain images and fall back to initials when the
 * host is unreachable, blocked as mixed content, or simply gone.
 */
function Avatar({ official }: { official: Official }) {
  const [failed, setFailed] = useState(false);
  const showPhoto = !!official.photoUrl && !failed;
  return showPhoto ? (
    <img
      src={official.photoUrl}
      alt=""
      width={48}
      height={48}
      loading="lazy"
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className="w-12 h-12 rounded-full object-cover flex-shrink-0 bg-gray-100 dark:bg-gray-700"
    />
  ) : (
    <div
      aria-hidden="true"
      className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center font-semibold text-sm ${partyAvatarClass(official.party)}`}
    >
      {initialsOf(official.name)}
    </div>
  );
}

function RepCard({ official }: { official: Official }) {
  // Federal members have a bioguide id and a record page; state and local
  // officials do not, so they get the office's own site instead of a link
  // that would 404.
  const recordHref = official.level === 'federal' ? `/rep/${official.id}` : null;

  return (
    <li className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 flex flex-col">
      <div className="flex items-start gap-3 mb-3">
        <Avatar official={official} />
        <div className="min-w-0 flex-1">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">{official.name}</h3>
          {official.party && (
            <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${partyBadgeClass(official.party)}`}>
              {official.party}
            </span>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">{official.title}</p>

      <dl className="text-xs text-gray-500 dark:text-gray-400 space-y-1 mb-3">
        {official.phone && (
          <div className="flex gap-1">
            <dt className="sr-only">Phone</dt>
            <dd>
              <a className="hover:underline" href={`tel:${official.phone.replace(/[^\d+]/g, '')}`}>
                {official.phone}
              </a>
            </dd>
          </div>
        )}
        {official.office && (
          <div>
            <dt className="sr-only">Office</dt>
            <dd className="line-clamp-2">{official.office}</dd>
          </div>
        )}
      </dl>

      <div className="mt-auto flex flex-col gap-2">
        <Link
          href="/contact"
          className="block w-full text-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Write to {official.lastName || official.name.split(/\s+/).slice(-1)[0]}
        </Link>
        <div className="flex gap-2 text-xs">
          {recordHref && (
            <Link href={recordHref} className="flex-1 text-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Their record
            </Link>
          )}
          {official.website && (
            <a
              href={official.website}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Official site
            </a>
          )}
        </div>
      </div>
    </li>
  );
}

function Group({ title, note, officials }: { title: string; note?: string; officials: Official[] }) {
  if (officials.length === 0) return null;
  return (
    <section className="mb-8">
      <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{title}</h2>
      {note && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5 mb-3">{note}</p>}
      <ul className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${note ? '' : 'mt-3'}`}>
        {officials.map((o) => (
          <RepCard key={`${o.level}-${o.id}`} official={o} />
        ))}
      </ul>
    </section>
  );
}

export function FindRepresentativesClient() {
  const [address, setAddress] = useState<ParsedAddress>({ street: '', city: '', state: '', zip: '' });
  const [officials, setOfficials] = useState<Official[] | null>(null);
  const [resolved, setResolved] = useState<LookupAddress | null>(null);
  const [houseWarning, setHouseWarning] = useState<string | null>(null);
  const [districtUnresolved, setDistrictUnresolved] = useState(false);
  const [streetWarning, setStreetWarning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const lookup = async (ackedStreet: boolean) => {
    setError(null);
    if (address.street.trim().length < 3) return setError('Please enter your street address.');
    if (address.city.trim().length < 2) return setError('Please enter your city.');
    if (!address.state) return setError('Please select your state.');
    if (!/^\d{5}(-\d{4})?$/.test(address.zip.trim())) return setError('Please enter your 5-digit ZIP code. ZIP+4 is welcome.');
    if (!ackedStreet && streetLooksUndeliverable(address.street)) {
      setStreetWarning(true);
      return;
    }
    setStreetWarning(false);
    setLoading(true);
    try {
      const res = await fetch('/api/representatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(address),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'We could not look up your officials.');
      const found: Official[] = data.officials || [];
      if (found.length === 0) throw new Error('We could not find any officials for that address.');

      setOfficials(found);
      setResolved(data.address ?? null);
      setHouseWarning(typeof data.houseWarning === 'string' ? data.houseWarning : null);
      // Senators-only fallback: the geocoder could not place the street, so
      // the House seat and every state and local district are unknown. Say
      // that plainly instead of presenting a short list as the full answer.
      setDistrictUnresolved(!data.address?.congressionalDistrict || data.address.congressionalDistrict === 'unknown');
      trackEvent('representatives_lookup', { state: address.state });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const federal = (officials ?? []).filter((o) => o.level === 'federal');
  const state = (officials ?? []).filter((o) => o.level === 'state');
  const local = (officials ?? []).filter((o) => o.level === 'local');

  const districtLine = resolved
    ? [
        resolved.congressionalDistrict && resolved.congressionalDistrict !== 'unknown'
          ? `${resolved.stateCode}-${resolved.congressionalDistrict}`
          : null,
        resolved.stateUpperDistrict ? `State Senate ${resolved.stateUpperDistrict}` : null,
        resolved.stateLowerDistrict ? `${lowerChamberName(resolved.stateCode)} ${resolved.stateLowerDistrict}` : null,
      ].filter(Boolean).join(' · ')
    : '';

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Find My Representatives</h1>
        <p className="text-gray-600 dark:text-gray-300">
          Enter your home address to see everyone who represents you, from Congress down to your county and school board.
        </p>
      </div>

      <form
        className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-8"
        onSubmit={(e) => {
          e.preventDefault();
          void lookup(false);
        }}
      >
        <AddressAutocomplete onAddressChange={setAddress} label="Home address" />

        {streetWarning && (
          <div role="alert" className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl space-y-3">
            <p className="text-sm text-amber-800 dark:text-amber-300">
              This street looks like a dorm, campus building, PO Box, or has no house number. Districts are drawn around
              residential streets, so a mailing address may not place you correctly.
            </p>
            <div className="flex flex-col sm:flex-row gap-2">
              <button
                type="button"
                onClick={() => {
                  setStreetWarning(false);
                  document.getElementById('address-autocomplete')?.focus();
                }}
                className="flex-1 py-2 px-3 text-sm font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors"
              >
                Edit my address
              </button>
              <button
                type="button"
                onClick={() => void lookup(true)}
                className="flex-1 py-2 px-3 text-sm font-medium border border-amber-300 dark:border-amber-600 text-amber-800 dark:text-amber-200 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors"
              >
                Look it up anyway
              </button>
            </div>
          </div>
        )}

        {error && (
          <div role="alert" className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-4 w-full py-3 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white font-medium rounded-lg transition-colors"
        >
          {loading ? 'Looking up your districts' : 'Find my representatives'}
        </button>
        <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 text-center">
          Your address is used to work out your districts and is not saved unless you have an account.
        </p>
      </form>

      {officials && (
        <div aria-live="polite">
          <div className="mb-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {officials.length} officials represent {titleCaseCity(resolved?.city || address.city)}, {resolved?.stateCode || address.state}
            </p>
            {districtLine && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{districtLine}</p>}
          </div>

          {districtUnresolved && (
            <div role="alert" className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
              <p className="text-sm text-amber-800 dark:text-amber-300">
                We could not match that street to a district, so this list shows only the officials who represent the whole
                state. Your House member, state legislators and local officials all depend on the exact street. Check the
                street number and spelling and try again.
              </p>
            </div>
          )}

          {houseWarning && !districtUnresolved && (
            <div role="status" className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
              <p className="text-sm text-amber-800 dark:text-amber-300">{houseWarning}</p>
            </div>
          )}

          <Group title="Congress" note="Two senators for your state, and one House member for your district." officials={federal} />
          <Group title="State legislature" note="They decide most of what affects schools, health, housing and public safety." officials={state} />
          <Group title="County, city and schools" note="The officials closest to where you live." officials={local} />
        </div>
      )}
    </div>
  );
}
