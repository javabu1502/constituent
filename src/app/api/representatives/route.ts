import { NextRequest, NextResponse } from 'next/server';
import { geocodeAddress } from '@/lib/geocode';
import {
  findSenators,
  findRepresentative,
  isDataAvailable,
} from '@/lib/legislators';
import { findStateLegislators } from '@/lib/state-legislators';
import { findLocalOfficials, toOfficial } from '@/lib/local-officials';
import { lookupLimiter, getClientIp } from '@/lib/rate-limit';
import type { Official, LookupResult, ApiError } from '@/lib/types';

/**
 * POST /api/representatives
 * Look up federal representatives by address using Census geocoder + local data
 *
 * Request body: { street, city, state, zip? }
 * Response: { officials, address, warning? }
 */
export async function POST(request: NextRequest): Promise<NextResponse<LookupResult | ApiError>> {
  const ip = getClientIp(request);
  const { success, retryAfter } = lookupLimiter.check(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests', code: 'RATE_LIMITED' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  }

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
    //
    // '0' is the geocoder's unresolved sentinel as well as an at-large
    // district, so it is handled on its own. There used to be a fallback here
    // that tried district 1 when district 0 found nobody, which meant any
    // unresolved lookup in a multi-district state handed the message to that
    // state's first representative. An at-large state does not need it:
    // Census returns '00' for those, which resolves on the branch above.
    let houseWarning: string | null = null;
    if (geocodeResult.congressionalDistrict && geocodeResult.congressionalDistrict !== '0') {
      const rep = findRepresentative(geocodeResult.stateCode, geocodeResult.congressionalDistrict);
      if (rep) {
        officials.push(rep);
      } else {
        // The district resolved but we have nobody on file for it: a seat
        // filled since the roster was last refreshed, or a vacancy. Say so
        // rather than quietly returning senators only.
        houseWarning = `We could not find a current House member on file for ${geocodeResult.stateCode}-${geocodeResult.congressionalDistrict}. Your senators are listed below.`;
        console.error(`[representatives] no member on file for ${geocodeResult.stateCode}-${geocodeResult.congressionalDistrict}`);
      }
    } else {
      const rep = findRepresentative(geocodeResult.stateCode, 0);
      if (rep) officials.push(rep);
    }

    // Step 3: Look up state legislators
    const stateLegislators = findStateLegislators(
      geocodeResult.stateCode,
      geocodeResult.stateUpperDistrict || null,
      geocodeResult.stateLowerDistrict || null
    );
    officials.push(...stateLegislators);

    // Step 4: Local officials from the hand-verified roster (county / city /
    // school board by Census GEOID). Non-blocking.
    try {
      for (const local of await findLocalOfficials(geocodeResult.stateCode, geocodeResult)) {
        officials.push(toOfficial(local));
      }
    } catch (err) {
      console.warn('[representatives] Local officials lookup failed:', err);
    }

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
      ...(houseWarning ? { warning: houseWarning } : {}),
    };

    return NextResponse.json(result);

  } catch (error) {
    console.error('Error looking up representatives:', error);
    return NextResponse.json(
      { error: 'Failed to look up elected officials', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
