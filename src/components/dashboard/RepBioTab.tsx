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
}

type BioData = FederalBio | StateBio;

function InfoRow({ label, value }: { label: string; value: string | number | undefined | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between py-1.5 border-b border-gray-100 dark:border-gray-700 last:border-0">
      <span className="text-xs text-gray-500 dark:text-gray-400">{label}</span>
      <span className="text-xs font-medium text-gray-900 dark:text-white text-right">{value}</span>
    </div>
  );
}

function FederalBioContent({ bio }: { bio: FederalBio }) {
  const term = bio.currentTerm;

  const termEndYear = term?.end ? new Date(term.end).getFullYear() : null;
  const senateInfo = term?.type === 'Senate' && term.state_rank
    ? `${term.state_rank.charAt(0).toUpperCase() + term.state_rank.slice(1)} Senator${term.class ? ` (Class ${term.class})` : ''}`
    : null;

  return (
    <div className="space-y-4">
      {/* Header */}
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
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{bio.name}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400">
            {term?.party} · {term?.state}{term?.type === 'House' && term?.district !== undefined ? `-${term.district}` : ''}
          </p>
          {senateInfo && (
            <p className="text-xs text-gray-500 dark:text-gray-400">{senateInfo}</p>
          )}
        </div>
      </div>

      {/* Details */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <h4 className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">Details</h4>
        <InfoRow label="Age" value={bio.age} />
        <InfoRow label="First Elected" value={bio.firstElected} />
        <InfoRow label="Years in Office" value={bio.yearsInOffice} />
        <InfoRow label="Terms Served" value={bio.totalTerms} />
        {bio.senateTerms > 0 && bio.houseTerms > 0 && (
          <InfoRow label="Terms Breakdown" value={`${bio.senateTerms} Senate, ${bio.houseTerms} House`} />
        )}
        <InfoRow label="Term Ends" value={termEndYear} />
        {bio.gender && <InfoRow label="Gender" value={bio.gender === 'M' ? 'Male' : bio.gender === 'F' ? 'Female' : bio.gender} />}
      </div>

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

      {!bio.email && !bio.phone && !bio.office && !bio.website && (
        <p className="text-xs text-gray-500 dark:text-gray-400">No additional contact information available for this legislator.</p>
      )}
    </div>
  );
}

export function RepBioTab({ repId, repLevel, repState }: { repId: string; repLevel: 'federal' | 'state'; repState?: string }) {
  const [bio, setBio] = useState<BioData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);

    const params = new URLSearchParams({ repId, level: repLevel });
    if (repState) params.set('state', repState);

    fetch(`/api/legislators/bio?${params.toString()}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load bio');
        return res.json();
      })
      .then((data: BioData) => setBio(data))
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [repId, repLevel, repState]);

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
