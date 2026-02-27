import { NextRequest, NextResponse } from 'next/server';
import { getFederalLegislatorBio, getCommitteesForMember } from '@/lib/legislators';
import { getStateLegislators } from '@/lib/state-legislators';
import { createAdminClient } from '@/lib/supabase';
import { callClaude } from '@/lib/claude';

const CACHE_TTL_MS = 30 * 24 * 60 * 60 * 1000; // 30 days
const PUBLIC_USER_ID = '00000000-0000-0000-0000-000000000000'; // nil UUID for shared/public cache

/**
 * Fetch committee memberships for a state legislator from Open States GraphQL
 */
async function fetchStateCommittees(personId: string): Promise<string[]> {
  const apiKey = process.env.OPENSTATES_API_KEY;
  if (!apiKey) {
    console.warn('[bio] No OPENSTATES_API_KEY — skipping state committee fetch');
    return [];
  }

  const query = `
    query($id: String!) {
      person(id: $id) {
        currentMemberships {
          organization {
            name
            classification
          }
        }
      }
    }
  `;

  try {
    const res = await fetch('https://openstates.org/graphql', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-API-KEY': apiKey },
      body: JSON.stringify({ query, variables: { id: personId } }),
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) {
      console.warn(`[bio] Open States API returned ${res.status} for ${personId}`);
      return [];
    }
    const data = await res.json();
    if (data.errors) {
      console.warn(`[bio] Open States GraphQL errors for ${personId}:`, JSON.stringify(data.errors));
      return [];
    }

    const person = data.data?.person;
    if (!person) {
      console.warn(`[bio] Open States returned no person for ${personId}. Response keys:`, Object.keys(data.data ?? {}));
      return [];
    }

    const memberships = person.currentMemberships ?? [];
    console.log(`[bio] Open States memberships for ${personId}: ${memberships.length} total, classifications: ${[...new Set(memberships.map((m: { organization?: { classification?: string } }) => m.organization?.classification))].join(', ')}`);

    const committees: string[] = [];
    for (const m of memberships) {
      if (m.organization?.classification === 'committee' && m.organization?.name) {
        committees.push(m.organization.name);
      }
    }
    console.log(`[bio] Fetched ${committees.length} state committees for ${personId}${committees.length > 0 ? ': ' + committees.slice(0, 3).join(', ') : ''}`);
    return committees;
  } catch (err) {
    console.error(`[bio] Error fetching state committees for ${personId}:`, err);
    return [];
  }
}

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

  // Check cache — skip if committees are missing (likely a previous fetch failure)
  const { data: cached } = await admin
    .from('feed_cache')
    .select('data, fetched_at')
    .eq('user_id', PUBLIC_USER_ID)
    .eq('feed_type', cacheKey)
    .single();

  if (cached?.data && Date.now() - new Date(cached.fetched_at).getTime() < CACHE_TTL_MS) {
    const cachedBio = cached.data as Record<string, unknown>;
    const cachedCommittees = cachedBio.committees as string[] | undefined;
    const hasBioNarrative = !!cachedBio.bioNarrative;
    if (cachedCommittees && cachedCommittees.length > 0 && hasBioNarrative) {
      return NextResponse.json(cached.data);
    }
    // Stale cache without committees or bio narrative — re-fetch below
  }

  if (level === 'federal') {
    const bio = getFederalLegislatorBio(repId);
    if (!bio) {
      return NextResponse.json({ error: 'Federal legislator not found' }, { status: 404 });
    }

    const currentTerm = bio.terms[bio.terms.length - 1];
    const firstTerm = bio.terms[0];

    // Get committees from local YAML data (unitedstates/congress-legislators repo)
    const committees = getCommitteesForMember(repId);
    console.log(`[bio] Committees for ${repId}: ${committees.length > 0 ? committees.join(', ') : 'none found'}`);

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

    // Generate narrative bio with Claude AI
    const fullName = bio.name.official_full || `${bio.name.first} ${bio.name.last}${bio.name.suffix ? ` ${bio.name.suffix}` : ''}`;
    let bioNarrative = '';
    try {
      const chamberType = currentTerm?.type === 'sen' ? 'Senate' : 'House of Representatives';
      const details = [
        `Name: ${fullName}`,
        `Party: ${currentTerm?.party ?? 'Unknown'}`,
        `State: ${currentTerm?.state ?? 'Unknown'}`,
        currentTerm?.district !== undefined ? `District: ${currentTerm.district}` : null,
        `Chamber: ${chamberType}`,
        bio.bio?.birthday ? `Born: ${bio.bio.birthday}` : null,
        committees.length > 0 ? `Committees: ${committees.join(', ')}` : null,
        yearsInOffice ? `Years in office: ${yearsInOffice}` : null,
        firstElectedYear ? `First elected: ${firstElectedYear}` : null,
        `Total terms: ${bio.terms.length}`,
        previousChambers.length > 0 ? `Previously served in the ${previousChambers.join(' and ')}` : null,
      ].filter(Boolean).join('\n');

      bioNarrative = await callClaude(
        'Generate a 2-3 sentence nonpartisan biographical summary of a US legislator. Be factual and concise. Include when they took office, their committee assignments, and any prior notable roles (e.g. previous offices held, military service, career background). Do not include opinions or policy positions.',
        details,
        300,
      );
    } catch {
      // Narrative is optional — proceed without it
    }

    const result = {
      type: 'federal' as const,
      name: fullName,
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
      committees,
      bioNarrative: bioNarrative || undefined,
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
        { user_id: PUBLIC_USER_ID, feed_type: cacheKey, data: result, fetched_at: new Date().toISOString() },
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

  // Fetch state committees from Open States GraphQL
  const committees = await fetchStateCommittees(repId);

  // Generate narrative bio with Claude AI
  let bioNarrative = '';
  try {
    const chamberName = leg.chamber === 'upper' ? 'Senate' : 'House';
    const stateName = state.toUpperCase();
    const details = [
      `Name: ${leg.name}`,
      `Party: ${leg.party}`,
      `Chamber: ${stateName} State ${chamberName}`,
      `District: ${leg.district}`,
      committees.length > 0 ? `Committees: ${committees.join(', ')}` : null,
    ].filter(Boolean).join('\n');

    bioNarrative = await callClaude(
      'Generate a 2-3 sentence nonpartisan biographical summary of a US state legislator. Be factual and concise. Include career background and notable roles if inferable. Do not include opinions or policy positions.',
      details,
      200,
    );
  } catch {
    // Narrative is optional — proceed without it
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
    committees,
    bioNarrative: bioNarrative || undefined,
  };

  // Cache
  await admin
    .from('feed_cache')
    .upsert(
      { user_id: PUBLIC_USER_ID, feed_type: cacheKey, data: result, fetched_at: new Date().toISOString() },
      { onConflict: 'user_id,feed_type' }
    );

  return NextResponse.json(result);
}
