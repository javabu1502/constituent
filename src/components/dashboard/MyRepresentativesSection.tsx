'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Official } from '@/lib/types';
import { AddressAutocomplete, type ParsedAddress } from '@/components/ui/AddressAutocomplete';

function getPartyColor(party: string) {
  const p = party.toLowerCase();
  if (p.includes('democrat')) return { bg: 'bg-blue-600', text: 'text-white', ring: 'ring-blue-200' };
  if (p.includes('republican')) return { bg: 'bg-red-600', text: 'text-white', ring: 'ring-red-200' };
  return { bg: 'bg-gray-500', text: 'text-white', ring: 'ring-gray-200' };
}

function getPartyBadgeClass(party: string) {
  const p = party.toLowerCase();
  if (p.includes('democrat')) return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
  if (p.includes('republican')) return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
}

function RepCard({ official }: { official: Official }) {
  const partyColor = getPartyColor(official.party);
  const initials = official.name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 flex flex-col">
      <div className="flex items-start gap-3 mb-3">
        {official.photoUrl ? (
          <img
            src={official.photoUrl}
            alt={official.name}
            className="w-12 h-12 rounded-full object-cover flex-shrink-0"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div
          className={`w-12 h-12 rounded-full flex-shrink-0 flex items-center justify-center ${partyColor.bg} ${partyColor.text} font-semibold text-sm ${official.photoUrl ? 'hidden' : ''}`}
        >
          {initials}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="font-semibold text-gray-900 dark:text-white text-sm truncate">
            {official.name}
          </h4>
          <span className={`inline-block px-2 py-0.5 text-xs font-medium rounded-full mt-1 ${getPartyBadgeClass(official.party)}`}>
            {official.party}
          </span>
        </div>
      </div>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 line-clamp-2">
        {official.title}
      </p>
      <div className="mt-auto">
        <Link
          href={`/contact?repId=${official.id}`}
          className="block w-full text-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          Send Message
        </Link>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 animate-pulse">
      <div className="flex items-start gap-3 mb-3">
        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-700 flex-shrink-0" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-16" />
        </div>
      </div>
      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-3" />
      <div className="h-9 bg-gray-200 dark:bg-gray-700 rounded" />
    </div>
  );
}

interface EditAddressFormProps {
  initialAddress: { street: string; city: string; state: string; zip: string } | null;
  onSaved: (reps: Official[]) => void;
  onCancel: () => void;
}

function EditAddressForm({ initialAddress, onSaved, onCancel }: EditAddressFormProps) {
  const [address, setAddress] = useState<ParsedAddress>({
    street: initialAddress?.street || '',
    city: initialAddress?.city || '',
    state: initialAddress?.state || '',
    zip: initialAddress?.zip || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!address.street.trim() || !address.city.trim() || !address.state || !address.zip.trim()) {
      setError('Please fill in all address fields.');
      return;
    }
    setSaving(true);
    setError('');

    try {
      // Save address to profile
      const patchRes = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(address),
      });
      if (!patchRes.ok) throw new Error('Failed to save address');

      // Trigger representative lookup
      const repRes = await fetch('/api/profile/representatives', { method: 'POST' });
      const repData = await repRes.json();

      if (repData.officials?.length) {
        onSaved(repData.officials);
        // Notify LocalOfficialsSection to refresh
        window.dispatchEvent(new Event('local-officials-updated'));
      } else {
        setError('No representatives found for this address. Please check and try again.');
        setSaving(false);
      }
    } catch {
      setError('Something went wrong. Please try again.');
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-6">
      <h3 className="text-base font-semibold text-gray-900 dark:text-white mb-4">
        {initialAddress?.street ? 'Update Your Address' : 'Add Your Address'}
      </h3>

      <AddressAutocomplete
        initialAddress={initialAddress || undefined}
        onAddressChange={setAddress}
      />

      {error && (
        <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 rounded-lg">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      <div className="flex gap-3 mt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={saving}
          className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white rounded-lg text-sm font-medium transition-colors"
        >
          {saving ? 'Saving...' : 'Save Address'}
        </button>
      </div>
    </form>
  );
}

interface Props {
  cachedReps: Official[] | null;
  hasAddress: boolean;
  savedAddress?: { street: string; city: string; state: string; zip: string } | null;
}

export function MyRepresentativesSection({ cachedReps, hasAddress: initialHasAddress, savedAddress }: Props) {
  const [reps, setReps] = useState<Official[] | null>(cachedReps);
  const [loading, setLoading] = useState(false);
  const [editing, setEditing] = useState(false);
  const [hasAddress, setHasAddress] = useState(initialHasAddress);

  useEffect(() => {
    // Auto-fetch if user has address but no cached reps
    if (hasAddress && !cachedReps) {
      setLoading(true);
      fetch('/api/profile/representatives', { method: 'POST' })
        .then((res) => res.json())
        .then((data) => {
          if (data.officials) setReps(data.officials);
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [hasAddress, cachedReps]);

  // Editing mode
  if (editing) {
    return (
      <EditAddressForm
        initialAddress={savedAddress || null}
        onSaved={(newReps) => {
          setReps(newReps);
          setHasAddress(true);
          setEditing(false);
        }}
        onCancel={() => setEditing(false)}
      />
    );
  }

  // No address — prompt user
  if (!hasAddress) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 text-center">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Add Your Address</h3>
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Enter your address to see your elected representatives and contact them directly.
        </p>
        <button
          onClick={() => setEditing(true)}
          className="inline-block px-6 py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
        >
          Add Address
        </button>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  // Reps loaded
  if (reps && reps.length > 0) {
    return (
      <div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {reps.map((rep) => (
            <RepCard key={rep.id} official={rep} />
          ))}
        </div>
        <div className="mt-3 text-right">
          <button
            onClick={() => setEditing(true)}
            className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
          >
            Edit Address
          </button>
        </div>
      </div>
    );
  }

  return null;
}
