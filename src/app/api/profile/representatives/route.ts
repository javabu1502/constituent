import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase';
import { geocodeAddress } from '@/lib/geocode';
import { findSenators, findRepresentative } from '@/lib/legislators';
import { findStateLegislators } from '@/lib/state-legislators';
import { fetchLocalOfficials } from '@/lib/civic-api';
import type { Official, LocalOfficial } from '@/lib/types';

/**
 * POST /api/profile/representatives
 * Reads address from user's profile, geocodes it, finds all officials,
 * and writes them to the profile's representatives JSONB column.
 */
export async function POST() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const admin = createAdminClient();

  // Get the user's profile
  const { data: profile, error: profileError } = await admin
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();

  if (profileError || !profile) {
    return NextResponse.json({ error: 'Profile not found' }, { status: 404 });
  }

  if (!profile.street || !profile.city || !profile.state || !profile.zip) {
    return NextResponse.json({ error: 'Address incomplete' }, { status: 400 });
  }

  // Geocode the address
  const geocodeResult = await geocodeAddress(
    profile.street,
    profile.city,
    profile.state,
    profile.zip
  );

  if ('error' in geocodeResult) {
    return NextResponse.json(
      { error: geocodeResult.error },
      { status: 400 }
    );
  }

  // Find all officials
  const officials: Official[] = [];

  // Federal senators
  officials.push(...findSenators(geocodeResult.stateCode));

  // Federal representative
  if (geocodeResult.congressionalDistrict && geocodeResult.congressionalDistrict !== '0') {
    const rep = findRepresentative(geocodeResult.stateCode, geocodeResult.congressionalDistrict);
    if (rep) officials.push(rep);
  } else {
    let rep = findRepresentative(geocodeResult.stateCode, 0);
    if (!rep) rep = findRepresentative(geocodeResult.stateCode, 1);
    if (rep) officials.push(rep);
  }

  // State legislators
  const stateLegislators = findStateLegislators(
    geocodeResult.stateCode,
    geocodeResult.stateUpperDistrict || null,
    geocodeResult.stateLowerDistrict || null
  );
  officials.push(...stateLegislators);

  // Local officials (non-blocking — don't fail the whole request)
  let localOfficials: LocalOfficial[] = [];
  try {
    const address = `${profile.street}, ${profile.city}, ${profile.state} ${profile.zip}`;
    localOfficials = await fetchLocalOfficials(address);
  } catch (err) {
    console.error('Local officials lookup failed (non-blocking):', err);
  }

  // Save to profile
  const { error: updateError } = await admin
    .from('profiles')
    .update({
      representatives: officials,
      local_officials: localOfficials.length > 0 ? localOfficials : null,
    })
    .eq('user_id', user.id);

  if (updateError) {
    return NextResponse.json({ error: 'Failed to save representatives' }, { status: 500 });
  }

  return NextResponse.json({ officials, localOfficials });
}
