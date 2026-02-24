import { NextRequest, NextResponse } from 'next/server';
import { getFederalLegislatorBio } from '@/lib/legislators';
import { getStateLegislators } from '@/lib/state-legislators';
import { createAdminClient } from '@/lib/supabase';

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const repId = searchParams.get('repId');
  const level = searchParams.get('level') as 'federal' | 'state' | null;
  const state = searchParams.get('state');

  if (!repId || !level) {
    return NextResponse.json({ error: 'repId and level are required' }, { status: 400 });
  }

  const cacheKey = `rep-bio-${repId}`;
  const admin = createAdminClient();

  // Check cache
  const { data: cached } = await admin
    .from('feed_cache')
    .select('data, fetched_at')
    .eq('user_id', 'public')
    .eq('feed_type', cacheKey)
    .single();

  if (cached?.data && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
    return NextResponse.json(cached.data);
  }

  if (level === 'federal') {
    const bio = getFederalLegislatorBio(repId);
    if (!bio) {
      return NextResponse.json({ error: 'Federal legislator not found' }, { status: 404 });
    }

    const currentTerm = bio.terms[bio.terms.length - 1];
    const firstTerm = bio.terms[0];

    // Compute age
    let age: number | undefined;
    if (bio.bio?.birthday) {
      const bday = new Date(bio.bio.birthday);
      const now = new Date();
      age = now.getFullYear() - bday.getFullYear();
      const monthDiff = now.getMonth() - bday.getMonth();
      if (monthDiff < 0 || (monthDiff === 0 && now.getDate() < bday.getDate())) {
        age--;
      }
    }

    // Compute years in office from first term start
    const firstElectedYear = firstTerm ? parseInt(firstTerm.start.split('-')[0], 10) : undefined;
    const yearsInOffice = firstElectedYear ? new Date().getFullYear() - firstElectedYear : undefined;

    // Count terms by chamber
    const senateTerms = bio.terms.filter(t => t.type === 'sen').length;
    const houseTerms = bio.terms.filter(t => t.type === 'rep').length;

    // Previous chambers
    const previousChambers: string[] = [];
    if (currentTerm?.type === 'sen' && houseTerms > 0) previousChambers.push('House');
    if (currentTerm?.type === 'rep' && senateTerms > 0) previousChambers.push('Senate');

    const result = {
      type: 'federal' as const,
      name: bio.name.official_full || `${bio.name.first} ${bio.name.last}${bio.name.suffix ? ` ${bio.name.suffix}` : ''}`,
      firstName: bio.name.first,
      lastName: bio.name.last,
      photoUrl: bio.photoUrl,
      birthday: bio.bio?.birthday,
      age,
      gender: bio.bio?.gender,
      firstElected: firstElectedYear,
      yearsInOffice,
      totalTerms: bio.terms.length,
      senateTerms,
      houseTerms,
      previousChambers,
      currentTerm: currentTerm ? {
        type: currentTerm.type === 'sen' ? 'Senate' : 'House',
        start: currentTerm.start,
        end: currentTerm.end,
        state: currentTerm.state,
        district: currentTerm.district,
        class: currentTerm.class,
        party: currentTerm.party,
        state_rank: currentTerm.state_rank,
        phone: currentTerm.phone,
        office: currentTerm.office || currentTerm.address,
        website: currentTerm.url,
        contactForm: currentTerm.contact_form,
      } : null,
      socialMedia: bio.socialMedia,
    };

    // Cache
    await admin
      .from('feed_cache')
      .upsert(
        { user_id: 'public', feed_type: cacheKey, data: result, fetched_at: new Date().toISOString() },
        { onConflict: 'user_id,feed_type' }
      );

    return NextResponse.json(result);
  }

  // State level
  if (!state) {
    return NextResponse.json({ error: 'state is required for state legislators' }, { status: 400 });
  }

  const legislators = getStateLegislators(state);
  const leg = legislators.find(l => l.id === repId);

  if (!leg) {
    return NextResponse.json({ error: 'State legislator not found' }, { status: 404 });
  }

  const result = {
    type: 'state' as const,
    name: leg.name,
    firstName: leg.firstName,
    lastName: leg.lastName,
    photoUrl: leg.photoUrl,
    party: leg.party,
    chamber: leg.chamber === 'upper' ? 'Senate' : 'House',
    district: leg.district,
    email: leg.email,
    phone: leg.phone,
    website: leg.website,
    office: leg.office,
  };

  // Cache
  await admin
    .from('feed_cache')
    .upsert(
      { user_id: 'public', feed_type: cacheKey, data: result, fetched_at: new Date().toISOString() },
      { onConflict: 'user_id,feed_type' }
    );

  return NextResponse.json(result);
}
