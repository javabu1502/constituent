'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { US_STATES } from '@/lib/constants';

export interface ParsedAddress {
  street: string;
  city: string;
  state: string;
  zip: string;
}

interface AddressAutocompleteProps {
  initialAddress?: Partial<ParsedAddress>;
  onAddressChange: (address: ParsedAddress) => void;
  /** Label for the autocomplete input */
  label?: string;
  /** Show the optional hint text */
  optional?: boolean;
}

function loadGoogleMapsScript(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined') {
      reject(new Error('No window'));
      return;
    }

    // Already loaded
    if (window.google?.maps?.places) {
      resolve();
      return;
    }

    // Already loading (script tag exists)
    const existing = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Google Maps script failed')));
      return;
    }

    const apiKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      reject(new Error('Missing NEXT_PUBLIC_GOOGLE_MAPS_API_KEY'));
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Google Maps script failed'));
    document.head.appendChild(script);
  });
}

function parsePlace(place: google.maps.places.PlaceResult): ParsedAddress {
  const components = place.address_components || [];
  let streetNumber = '';
  let route = '';
  let city = '';
  let state = '';
  let zip = '';

  for (const component of components) {
    const types = component.types;
    if (types.includes('street_number')) {
      streetNumber = component.long_name;
    } else if (types.includes('route')) {
      route = component.long_name;
    } else if (types.includes('locality')) {
      city = component.long_name;
    } else if (types.includes('sublocality_level_1') && !city) {
      city = component.long_name;
    } else if (types.includes('administrative_area_level_1')) {
      state = component.short_name;
    } else if (types.includes('postal_code')) {
      zip = component.long_name;
    }
  }

  const street = streetNumber && route ? `${streetNumber} ${route}` : route || streetNumber;

  return { street, city, state, zip };
}

export function AddressAutocomplete({
  initialAddress,
  onAddressChange,
  label = 'Address',
  optional = false,
}: AddressAutocompleteProps) {
  const [mapsLoaded, setMapsLoaded] = useState(false);
  const [mapsFailed, setMapsFailed] = useState(false);
  const [autocompleteText, setAutocompleteText] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);

  // Manual entry fallback state
  const [street, setStreet] = useState(initialAddress?.street || '');
  const [city, setCity] = useState(initialAddress?.city || '');
  const [addrState, setAddrState] = useState(initialAddress?.state || '');
  const [zip, setZip] = useState(initialAddress?.zip || '');
  const [showManual, setShowManual] = useState(false);

  // Build display text from initial address
  useEffect(() => {
    if (initialAddress?.street) {
      const parts = [initialAddress.street, initialAddress.city, initialAddress.state, initialAddress.zip].filter(Boolean);
      setAutocompleteText(parts.join(', '));
    }
  }, [initialAddress?.street, initialAddress?.city, initialAddress?.state, initialAddress?.zip]);

  // Propagate manual field changes
  const propagateManual = useCallback(() => {
    onAddressChange({ street, city, state: addrState, zip });
  }, [street, city, addrState, zip, onAddressChange]);

  useEffect(() => {
    if (showManual || mapsFailed) {
      propagateManual();
    }
  }, [showManual, mapsFailed, propagateManual]);

  // Load Google Maps API
  useEffect(() => {
    // Suppress the "This page can't load Google Maps correctly" overlay —
    // we only use Places Autocomplete, not map rendering.
    (window as unknown as Record<string, unknown>).gm_authFailure = () => {
      setTimeout(() => {
        document.querySelectorAll('.dismissButton').forEach((btn) => (btn as HTMLElement).click());
        document.querySelectorAll('.gm-err-container, .gm-style-pbc').forEach((el) => el.remove());
      }, 0);
    };

    loadGoogleMapsScript()
      .then(() => {
        setMapsLoaded(true);
        // Remove any error overlays Google injected
        document.querySelectorAll('.gm-err-container, .gm-style-pbc').forEach((el) => el.remove());
      })
      .catch((err) => {
        console.error('Google Maps failed to load:', err.message);
        setMapsFailed(true);
        setShowManual(true);
      });
  }, []);

  // Initialize autocomplete once Maps is loaded
  useEffect(() => {
    if (!mapsLoaded || !inputRef.current || autocompleteRef.current) return;

    const autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
      types: ['address'],
      componentRestrictions: { country: 'us' },
      fields: ['address_components', 'formatted_address'],
    });

    autocomplete.addListener('place_changed', () => {
      const place = autocomplete.getPlace();
      if (!place.address_components) return;

      const parsed = parsePlace(place);
      setStreet(parsed.street);
      setCity(parsed.city);
      setAddrState(parsed.state);
      setZip(parsed.zip);
      setAutocompleteText(place.formatted_address || '');
      onAddressChange(parsed);
    });

    autocompleteRef.current = autocomplete;
  }, [mapsLoaded, onAddressChange]);

  // Manual fallback mode
  if (showManual || mapsFailed) {
    return (
      <div className="space-y-3">
        {optional && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            Optional — add your address to find your representatives
          </p>
        )}
        <Input
          label="Street Address"
          type="text"
          value={street}
          onChange={(e) => { setStreet(e.target.value); onAddressChange({ street: e.target.value, city, state: addrState, zip }); }}
          placeholder="123 Main St"
          autoComplete="street-address"
        />
        <Input
          label="City"
          type="text"
          value={city}
          onChange={(e) => { setCity(e.target.value); onAddressChange({ street, city: e.target.value, state: addrState, zip }); }}
          placeholder="Springfield"
          autoComplete="address-level2"
        />
        <div className="grid grid-cols-2 gap-3">
          <Select
            label="State"
            value={addrState}
            onChange={(e) => { setAddrState(e.target.value); onAddressChange({ street, city, state: e.target.value, zip }); }}
            options={US_STATES.map((s) => ({ value: s.code, label: s.name }))}
            placeholder="Select state"
          />
          <Input
            label="ZIP Code"
            type="text"
            value={zip}
            onChange={(e) => { setZip(e.target.value); onAddressChange({ street, city, state: addrState, zip: e.target.value }); }}
            placeholder="62704"
            autoComplete="postal-code"
          />
        </div>
        {!mapsFailed && (
          <button
            type="button"
            onClick={() => setShowManual(false)}
            className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
          >
            Use address search instead
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {optional && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Optional — add your address to find your representatives
        </p>
      )}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
        <input
          ref={inputRef}
          type="text"
          value={autocompleteText}
          onChange={(e) => setAutocompleteText(e.target.value)}
          placeholder="Start typing your address..."
          className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg transition-colors bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent"
          autoComplete="off"
        />
      </div>
      <button
        type="button"
        onClick={() => setShowManual(true)}
        className="text-xs text-purple-600 dark:text-purple-400 hover:underline"
      >
        Enter address manually
      </button>
    </div>
  );
}
