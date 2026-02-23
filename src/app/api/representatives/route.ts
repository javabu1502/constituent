import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/geocode';
import {
  findSenators,
  findRepresentative,
  isDataAvailable,
} from '@/lib/legislators';
import { findStateLegislators } from '@/lib/state-legislators';
import type { Official, LookupResult, ApiError } from '@/lib/types';

/**
 * POST /api/representatives
 * Look up federal representatives by address using Census geocoder + local data
 *
 * Request body: { street, city, state, zip? }
 * Response: { officials, address, warning? }
 */
export async function POST(request: NextRequest): Promise<NextResponse<LookupResult | ApiError>> {
  // Parse request body
  let body: { street: string; city: string; state: string; zip?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body', code: 'INVALID_JSON' },
      { status: 400 }
    );
  }

  const { street, city, state, zip } = body;

  // Validate address components
  if (!street || !city || !state) {
    return NextResponse.json(
      { error: 'Address required (street, city, state)', code: 'INVALID_ADDRESS' },
      { status: 400 }
    );
  }

  if (street.trim().length < 3) {
    return NextResponse.json(
      { error: 'Please enter a valid street address', code: 'INVALID_ADDRESS' },
      { status: 400 }
    );
  }

  try {
    // Step 1: Geocode address to get districts
    const geocodeResult = await geocodeAddress(street, city, state, zip || undefined);

    if ('error' in geocodeResult) {
      // If geocoding fails, try to provide federal legislators by state only
      console.warn('Geocoding failed:', geocodeResult.error);

      // Check if we have local data
      if (!isDataAvailable()) {
        return NextResponse.json(
          {
            error: 'Legislator data not available',
            code: 'DATA_UNAVAILABLE'
          },
          { status: 503 }
        );
      }

      // Return just senators as fallback
      const stateCode = state.toUpperCase();
      const senators = findSenators(stateCode);

      if (senators.length === 0) {
        return NextResponse.json(
          { error: geocodeResult.error, code: geocodeResult.code },
          { status: 400 }
        );
      }

      return NextResponse.json({
        officials: senators,
        address: {
          street,
          city,
          state,
          stateCode,
          zip: zip || '',
          congressionalDistrict: 'unknown',
        },
        warning: 'Could not determine district. Only showing senators.',
      });
    }

    // Step 2: Look up federal officials
    const officials: Official[] = [];

    // Federal senators (2)
    const senators = findSenators(geocodeResult.stateCode);
    officials.push(...senators);

    // Federal representative (1)
    if (geocodeResult.congressionalDistrict && geocodeResult.congressionalDistrict !== '0') {
      const rep = findRepresentative(geocodeResult.stateCode, geocodeResult.congressionalDistrict);
      if (rep) {
        officials.push(rep);
      }
    } else {
      // At-large districts - try district 0 or 1
      let rep = findRepresentative(geocodeResult.stateCode, 0);
      if (!rep) {
        rep = findRepresentative(geocodeResult.stateCode, 1);
      }
      if (rep) {
        officials.push(rep);
      }
    }

    // Step 3: Look up state legislators
    const stateLegislators = findStateLegislators(
      geocodeResult.stateCode,
      geocodeResult.stateUpperDistrict || null,
      geocodeResult.stateLowerDistrict || null
    );
    officials.push(...stateLegislators);

    const result: LookupResult = {
      officials,
      address: {
        street: geocodeResult.street,
        city: geocodeResult.city,
        state: geocodeResult.state,
        stateCode: geocodeResult.stateCode,
        zip: geocodeResult.zip,
        congressionalDistrict: geocodeResult.congressionalDistrict,
        stateUpperDistrict: geocodeResult.stateUpperDistrict,
        stateLowerDistrict: geocodeResult.stateLowerDistrict,
      },
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error looking up representatives:', error);
    return NextResponse.json(
      { error: 'Failed to look up representatives', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
