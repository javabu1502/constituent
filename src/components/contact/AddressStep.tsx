'use client';

import { useState, useCallback } from 'react';
import type { ContactState, ContactAction } from './ContactFlow';
import { Button } from '@/components/ui/Button';
import { AddressAutocomplete, type ParsedAddress } from '@/components/ui/AddressAutocomplete';

interface AddressStepProps {
  state: ContactState;
  dispatch: React.Dispatch<ContactAction>;
}

export function AddressStep({ state, dispatch }: AddressStepProps) {
  const [address, setAddress] = useState<ParsedAddress>({
    street: state.address?.street || '',
    city: state.address?.city || '',
    state: state.address?.state || '',
    zip: state.address?.zip || '',
  });

  const onAddressChange = useCallback((a: ParsedAddress) => {
    setAddress(a);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!address.street.trim() || address.street.trim().length < 3) {
      dispatch({ type: 'SET_ERROR', payload: 'Please enter a valid street address' });
      return;
    }
    if (!address.city.trim()) {
      dispatch({ type: 'SET_ERROR', payload: 'Please enter a city' });
      return;
    }
    if (!address.state) {
      dispatch({ type: 'SET_ERROR', payload: 'Please select a state' });
      return;
    }

    dispatch({ type: 'SET_ADDRESS', payload: address });
    dispatch({ type: 'SET_LOADING', payload: true });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const response = await fetch('/api/representatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(address),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to find representatives');
      }

      if (!data.officials || data.officials.length === 0) {
        throw new Error('No representatives found for this address');
      }

      dispatch({ type: 'SET_OFFICIALS', payload: data.officials });

      // Save address + officials to profile for logged-in users (fire-and-forget)
      fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...address,
          representatives: data.officials,
        }),
      }).catch(() => {}); // Silently ignore for anonymous users (401)

      dispatch({ type: 'GO_TO_STEP', payload: 'representative' });
    } catch (err) {
      dispatch({
        type: 'SET_ERROR',
        payload: err instanceof Error ? err.message : 'Something went wrong. Please try again.',
      });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-purple-600 dark:text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Enter Your Home Address
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm max-w-sm mx-auto">
          We&apos;ll use this to find your U.S. Senators and Representative in Congress.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <AddressAutocomplete
          initialAddress={state.address || undefined}
          onAddressChange={onAddressChange}
          label="Address"
        />

        {state.error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
            <div className="flex items-start gap-3">
              <svg
                className="w-5 h-5 text-red-500 dark:text-red-400 flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-sm text-red-700 dark:text-red-300">{state.error}</p>
            </div>
          </div>
        )}

        <Button
          type="submit"
          className="w-full"
          size="lg"
          isLoading={state.isLoading}
        >
          {state.isLoading ? 'Finding Representatives...' : 'Find My Representatives'}
        </Button>
      </form>

      <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-6">
        Used only to find your representatives. Never stored or shared.
      </p>
    </div>
  );
}
