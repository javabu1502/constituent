'use client';

import { useState, useEffect } from 'react';

interface FederalBio {
  type: 'federal';
  name: string;
  firstName: string;
  lastName: string;
  photoUrl: string;
  birthday?: string;
  age?: number;
  gender?: string;
  firstElected?: number;
  yearsInOffice?: number;
  totalTerms: number;
  senateTerms: number;
  houseTerms: number;
  previousChambers: string[];
  committees?: string[];
  bioNarrative?: string;
  currentTerm: {
    type: string;
    start: string;
    end: string;
    state: string;
    district?: number;
    class?: number;
    party: string;
    state_rank?: string;
    phone?: string;
    office?: string;
    website?: string;
    contactForm?: string;
  } | null;
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
}

interface StateBio {
  type: 'state';
  name: string;
  firstName?: string;
  lastName?: string;
  photoUrl?: string;
  party: string;
  chamber: string;
  district: string;
  email?: string;
  phone?: string;
  website?: string;
  office?: string;
  committees?: string[];
  bioNarrative?: string;
}

export type BioData = FederalBio | StateBio;

function CommitteeBadges({ committees }: { committees: string[] }) {
  if (committees.length === 0) return null;
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
      <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Committee Assignments</h4>
      <div className="flex gap-1.5 flex-wrap">
        {committees.map((c) => (
          <span
            key={c}
            className="inline-block px-2 py-0.5 text-[11px] font-medium rounded-full bg-indigo-50 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-300 border border-indigo-200 dark:border-indigo-800"
          >
            {c}
          </span>
        ))}
      </div>
    </div>
  );
}

function FederalBioContent({ bio }: { bio: FederalBio }) {
  const term = bio.currentTerm;

  const termEndYear = term?.end ? new Date(term.end).getFullYear() : null;
  const senateInfo = term?.type === 'Senate' && term.state_rank
    ? `${term.state_rank.charAt(0).toUpperCase() + term.state_rank.slice(1)} Senator${term.class ? ` (Class ${term.class})` : ''}`
    : null;

  // Build compact overview facts
  const facts: string[] = [];
  if (bio.age) facts.push(`Age ${bio.age}`);
  if (bio.yearsInOffice) facts.push(`${bio.yearsInOffice} yrs in office`);
  if (bio.firstElected) facts.push(`First elected ${bio.firstElected}`);
  if (termEndYear) facts.push(`Term ends ${termEndYear}`);

  const termsLabel = bio.senateTerms > 0 && bio.houseTerms > 0
    ? `${bio.totalTerms} terms (${bio.senateTerms}S, ${bio.houseTerms}H)`
    : `${bio.totalTerms} term${bio.totalTerms !== 1 ? 's' : ''}`;

  return (
    <div className="space-y-4">
      {/* Header with photo and key info */}
      <div className="flex items-start gap-3">
        <img
          src={bio.photoUrl}
          alt={bio.name}
          className="w-16 h-20 rounded-lg object-cover shrink-0"
          onError={(e) => {
            const target = e.currentTarget;
            target.style.display = 'none';
          }}
        />
        <div className="min-w-0">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{bio.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {term?.party} · {term?.state}{term?.type === 'House' && term?.district !== undefined ? `-${term.district}` : ''}
          </p>
          {senateInfo && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{senateInfo}</p>
          )}
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {termsLabel}
            {bio.previousChambers.length > 0 && ` · Previously: ${bio.previousChambers.join(', ')}`}
          </p>
          {facts.length > 0 && (
            <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1">
              {facts.map((f) => (
                <span key={f} className="text-[11px] text-gray-500 dark:text-gray-400">{f}</span>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Narrative Bio */}
      {bio.bioNarrative && (
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {bio.bioNarrative}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 italic">
            Summary based on public records
          </p>
        </div>
      )}

      {/* Committee Assignments */}
      <CommitteeBadges committees={bio.committees ?? []} />

      {/* Social Media */}
      {bio.socialMedia && (bio.socialMedia.twitter || bio.socialMedia.facebook || bio.socialMedia.instagram) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Social Media</h4>
          <div className="flex flex-wrap gap-2">
            {bio.socialMedia.twitter && (
              <a
                href={`https://x.com/${bio.socialMedia.twitter}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-xs text-gray-700 dark:text-gray-300 transition-colors"
              >
                <span className="font-medium">X</span> @{bio.socialMedia.twitter}
              </a>
            )}
            {bio.socialMedia.facebook && (
              <a
                href={`https://facebook.com/${bio.socialMedia.facebook}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-xs text-gray-700 dark:text-gray-300 transition-colors"
              >
                <span className="font-medium">FB</span> {bio.socialMedia.facebook}
              </a>
            )}
            {bio.socialMedia.instagram && (
              <a
                href={`https://instagram.com/${bio.socialMedia.instagram}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 px-2.5 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-xs text-gray-700 dark:text-gray-300 transition-colors"
              >
                <span className="font-medium">IG</span> @{bio.socialMedia.instagram}
              </a>
            )}
          </div>
        </div>
      )}

      {/* Contact */}
      {(term?.phone || term?.office || term?.website || term?.contactForm) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Contact</h4>
          <div className="space-y-1.5">
            {term?.phone && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                <a href={`tel:${term.phone}`} className="text-purple-600 dark:text-purple-400 hover:underline">{term.phone}</a>
              </div>
            )}
            {term?.office && (
              <div className="text-xs">
                <span className="text-gray-500 dark:text-gray-400">Office:</span>{' '}
                <span className="text-gray-700 dark:text-gray-300">{term.office}</span>
              </div>
            )}
            {term?.website && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 dark:text-gray-400">Website:</span>
                <a href={term.website} target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline truncate">{term.website.replace(/^https?:\/\//, '')}</a>
              </div>
            )}
            {term?.contactForm && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 dark:text-gray-400">Contact Form:</span>
                <a href={term.contactForm} target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline">Online Form</a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function StateBioContent({ bio }: { bio: StateBio }) {
  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-start gap-3">
        {bio.photoUrl ? (
          <img
            src={bio.photoUrl}
            alt={bio.name}
            className="w-16 h-20 rounded-lg object-cover shrink-0"
            onError={(e) => {
              const target = e.currentTarget;
              target.style.display = 'none';
              target.nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-16 h-20 rounded-lg bg-gray-200 dark:bg-gray-600 flex items-center justify-center shrink-0 ${bio.photoUrl ? 'hidden' : ''}`}>
          <span className="text-gray-500 dark:text-gray-400 text-xl font-medium">{bio.name.charAt(0)}</span>
        </div>
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{bio.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {bio.party} · {bio.chamber} · District {bio.district}
          </p>
        </div>
      </div>

      {/* Narrative Bio */}
      {bio.bioNarrative && (
        <div>
          <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
            {bio.bioNarrative}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1 italic">
            Summary based on public records
          </p>
        </div>
      )}

      {/* Committee Assignments */}
      <CommitteeBadges committees={bio.committees ?? []} />

      {/* Contact */}
      {(bio.email || bio.phone || bio.office || bio.website) && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Contact</h4>
          <div className="space-y-1.5">
            {bio.email && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 dark:text-gray-400">Email:</span>
                <a href={`mailto:${bio.email}`} className="text-purple-600 dark:text-purple-400 hover:underline truncate">{bio.email}</a>
              </div>
            )}
            {bio.phone && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 dark:text-gray-400">Phone:</span>
                <a href={`tel:${bio.phone}`} className="text-purple-600 dark:text-purple-400 hover:underline">{bio.phone}</a>
              </div>
            )}
            {bio.office && (
              <div className="text-xs">
                <span className="text-gray-500 dark:text-gray-400">Office:</span>{' '}
                <span className="text-gray-700 dark:text-gray-300">{bio.office}</span>
              </div>
            )}
            {bio.website && (
              <div className="flex items-center gap-2 text-xs">
                <span className="text-gray-500 dark:text-gray-400">Website:</span>
                <a href={bio.website} target="_blank" rel="noopener noreferrer" className="text-purple-600 dark:text-purple-400 hover:underline truncate">{bio.website.replace(/^https?:\/\//, '')}</a>
              </div>
            )}
          </div>
        </div>
      )}

      {!bio.email && !bio.phone && !bio.office && !bio.website && (bio.committees ?? []).length === 0 && !bio.bioNarrative && (
        <p className="text-xs text-gray-500 dark:text-gray-400">No additional information available for this legislator.</p>
      )}
    </div>
  );
}

export function RepBioTab({ repId, repLevel, repState, bio: externalBio, bioLoading }: {
  repId: string;
  repLevel: 'federal' | 'state' | 'local';
  repState?: string;
  bio?: BioData | null;
  bioLoading?: boolean;
}) {
  const [internalBio, setInternalBio] = useState<BioData | null>(null);
  const [internalLoading, setInternalLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const hasExternal = externalBio !== undefined;

  useEffect(() => {
    if (hasExternal) return;
    setInternalLoading(true);
    setError(null);

    const params = new URLSearchParams({ repId, level: repLevel });
    if (repState) params.set('state', repState);

    fetch(`/api/legislators/bio?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load bio');
        return res.json();
      })
      .then((data: BioData) => setInternalBio(data))
      .catch(err => setError(err.message))
      .finally(() => setInternalLoading(false));
  }, [repId, repLevel, repState, hasExternal]);

  const bio = hasExternal ? externalBio : internalBio;
  const loading = hasExternal ? (bioLoading ?? false) : internalLoading;

  if (loading) {
    return (
      <div className="animate-pulse space-y-3">
        <div className="flex items-start gap-3">
          <div className="w-16 h-20 bg-gray-200 dark:bg-gray-700 rounded-lg" />
          <div className="flex-1">
            <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2" />
            <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-32" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex justify-between py-1.5">
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-20" />
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-16" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return <p className="text-sm text-red-500 px-1">{error}</p>;
  }

  if (!bio) return null;

  return bio.type === 'federal'
    ? <FederalBioContent bio={bio} />
    : <StateBioContent bio={bio} />;
}
