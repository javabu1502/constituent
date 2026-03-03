import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { US_STATES, PARTY_COLORS, DEFAULT_PARTY_COLOR } from '@/lib/constants';
import {
  getAllFederalLegislators,
  getFederalLegislatorBio,
  getCommitteesForMember,
} from '@/lib/legislators';
import ProfileClient from './ProfileClient';
import RepPublicData from './RepPublicData';

// Build a state code → slug map
const STATE_SLUG_MAP: Record<string, string> = {};
const STATE_NAME_MAP: Record<string, string> = {};
for (const s of US_STATES) {
  const slug = s.name.toLowerCase().replace(/\s+/g, '-');
  STATE_SLUG_MAP[s.code] = slug;
  STATE_NAME_MAP[s.code] = s.name;
}

export function generateStaticParams() {
  return getAllFederalLegislators().map((leg) => ({
    bioguideId: leg.id,
  }));
}

interface RepPageProps {
  params: Promise<{ bioguideId: string }>;
}

export async function generateMetadata({ params }: RepPageProps): Promise<Metadata> {
  const { bioguideId } = await params;
  const bio = getFederalLegislatorBio(bioguideId);
  if (!bio) return { title: 'Legislator | My Democracy' };

  const currentTerm = bio.terms[bio.terms.length - 1];
  const fullName =
    bio.name.official_full ||
    `${bio.name.first} ${bio.name.last}${bio.name.suffix ? ` ${bio.name.suffix}` : ''}`;

  const chamber = currentTerm?.type === 'sen' ? 'Sen.' : 'Rep.';
  const party = currentTerm?.party?.charAt(0) ?? '';
  const state = currentTerm?.state ?? '';

  const title = `${chamber} ${fullName} (${party}-${state}) | Profile, Voting Record & Contact | My Democracy`;
  const description = `${fullName} is a member of the U.S. ${currentTerm?.type === 'sen' ? 'Senate' : 'House of Representatives'} representing ${STATE_NAME_MAP[state] ?? state}. View their profile, committees, voting record, and contact information.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: `https://www.mydemocracy.app/rep/${bioguideId}`,
      type: 'profile',
      images: [
        {
          url: bio.photoUrl,
          width: 225,
          height: 275,
          alt: fullName,
        },
      ],
    },
    alternates: {
      canonical: `https://www.mydemocracy.app/rep/${bioguideId}`,
    },
  };
}

function QuickFact({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="text-center">
      <div className="text-lg font-bold text-purple-600 dark:text-purple-400">{value}</div>
      <div className="text-xs text-gray-500 dark:text-gray-400">{label}</div>
    </div>
  );
}

export default async function RepProfilePage({ params }: RepPageProps) {
  const { bioguideId } = await params;
  const bio = getFederalLegislatorBio(bioguideId);
  if (!bio) notFound();

  const committees = getCommitteesForMember(bioguideId);
  const currentTerm = bio.terms[bio.terms.length - 1];
  const firstTerm = bio.terms[0];

  const fullName =
    bio.name.official_full ||
    `${bio.name.first} ${bio.name.last}${bio.name.suffix ? ` ${bio.name.suffix}` : ''}`;

  // Title construction
  const state = currentTerm?.state ?? '';
  const stateName = STATE_NAME_MAP[state] ?? state;
  const stateSlug = STATE_SLUG_MAP[state] ?? state.toLowerCase();

  let titleText = '';
  if (currentTerm?.type === 'sen') {
    const rank = currentTerm.state_rank
      ? currentTerm.state_rank.charAt(0).toUpperCase() + currentTerm.state_rank.slice(1)
      : '';
    titleText = `U.S. Senator${rank ? `, ${rank}` : ''}${currentTerm.class ? `, Class ${currentTerm.class}` : ''}`;
  } else if (currentTerm?.type === 'rep') {
    const district = currentTerm.district;
    titleText =
      district === 0
        ? `U.S. Representative, At-Large`
        : `U.S. Representative, District ${district}`;
  }

  // Quick facts
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

  const firstElectedYear = firstTerm ? parseInt(firstTerm.start.split('-')[0], 10) : undefined;
  const yearsInOffice = firstElectedYear ? new Date().getFullYear() - firstElectedYear : undefined;

  const partyColor = PARTY_COLORS[currentTerm?.party ?? ''] ?? DEFAULT_PARTY_COLOR;

  // JSON-LD
  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mydemocracy.app' },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Legislators',
        item: 'https://www.mydemocracy.app/legislators',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: fullName,
        item: `https://www.mydemocracy.app/rep/${bioguideId}`,
      },
    ],
  };

  const personJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    name: fullName,
    jobTitle: titleText,
    image: bio.photoUrl,
    memberOf: {
      '@type': 'Organization',
      name: 'United States Congress',
    },
    workLocation: {
      '@type': 'Place',
      name: stateName,
    },
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(personJsonLd) }}
      />

      {/* Breadcrumbs */}
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/" className="hover:text-purple-600 dark:hover:text-purple-400">
          Home
        </Link>
        {' / '}
        <Link href="/legislators" className="hover:text-purple-600 dark:hover:text-purple-400">
          Legislators
        </Link>
        {' / '}
        <span className="text-gray-900 dark:text-white font-medium">{fullName}</span>
      </nav>

      {/* Profile Header */}
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 mb-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Photo */}
          <div className="shrink-0 self-center sm:self-start">
            <img
              src={bio.photoUrl}
              alt={fullName}
              width={225}
              height={275}
              className="w-[150px] h-[183px] sm:w-[225px] sm:h-[275px] object-cover rounded-lg border border-gray-200 dark:border-gray-600"
              onError={(e) => {
                const target = e.currentTarget;
                target.style.display = 'none';
                const fallback = target.nextElementSibling;
                if (fallback) (fallback as HTMLElement).style.display = 'flex';
              }}
            />
            <div
              className="w-[150px] h-[183px] sm:w-[225px] sm:h-[275px] rounded-lg bg-gray-200 dark:bg-gray-600 items-center justify-center hidden"
            >
              <span className="text-gray-500 dark:text-gray-400 text-5xl font-medium">
                {fullName.charAt(0)}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white mb-1">
              {fullName}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-3">{titleText}</p>

            <div className="flex items-center gap-2 flex-wrap mb-4">
              <span
                className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${partyColor.bg} ${partyColor.text}`}
              >
                {currentTerm?.party}
              </span>
              <Link
                href={`/states/${stateSlug}`}
                className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
              >
                {stateName}
              </Link>
            </div>

            {/* Quick facts */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-4">
              {age !== undefined && <QuickFact label="Age" value={age} />}
              {yearsInOffice !== undefined && <QuickFact label="Years in Office" value={yearsInOffice} />}
              <QuickFact label="Total Terms" value={bio.terms.length} />
              {firstElectedYear !== undefined && (
                <QuickFact label="First Elected" value={firstElectedYear} />
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Committee Assignments */}
      {committees.length > 0 && (
        <section className="mb-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
            Committee Assignments
          </h2>
          <div className="flex flex-wrap gap-2">
            {committees.map((c) => (
              <span
                key={c}
                className="px-3 py-1 bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-sm rounded-full border border-indigo-200 dark:border-indigo-700"
              >
                {c}
              </span>
            ))}
          </div>
        </section>
      )}

      {/* Contact Information */}
      <section className="mb-6">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">
          Contact Information
        </h2>
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {currentTerm?.phone && (
              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Phone
                </div>
                <a
                  href={`tel:${currentTerm.phone}`}
                  className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
                >
                  {currentTerm.phone}
                </a>
              </div>
            )}
            {currentTerm?.address && (
              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Office
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300">{currentTerm.address}</p>
              </div>
            )}
            {currentTerm?.url && (
              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Website
                </div>
                <a
                  href={currentTerm.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-600 dark:text-purple-400 hover:underline break-all"
                >
                  {currentTerm.url.replace(/^https?:\/\//, '')}
                </a>
              </div>
            )}
            {currentTerm?.contact_form && (
              <div>
                <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Contact Form
                </div>
                <a
                  href={currentTerm.contact_form}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-purple-600 dark:text-purple-400 hover:underline break-all"
                >
                  Official Contact Form
                </a>
              </div>
            )}
          </div>

          {/* Social Media */}
          {bio.socialMedia && (bio.socialMedia.twitter || bio.socialMedia.facebook || bio.socialMedia.instagram) && (
            <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <div className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">
                Social Media
              </div>
              <div className="flex gap-3">
                {bio.socialMedia.twitter && (
                  <a
                    href={`https://x.com/${bio.socialMedia.twitter}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                  >
                    @{bio.socialMedia.twitter}
                  </a>
                )}
                {bio.socialMedia.facebook && (
                  <a
                    href={`https://facebook.com/${bio.socialMedia.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                  >
                    Facebook
                  </a>
                )}
                {bio.socialMedia.instagram && (
                  <a
                    href={`https://instagram.com/${bio.socialMedia.instagram}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-gray-600 dark:text-gray-400 hover:text-purple-600 dark:hover:text-purple-400"
                  >
                    Instagram
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Client component for dynamic data */}
      <ProfileClient bioguideId={bioguideId} name={fullName} />

      {/* Public voting, finance, lobbying data */}
      <RepPublicData bioguideId={bioguideId} name={fullName} />

      {/* Bottom CTA */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-4 py-8 border-t border-gray-200 dark:border-gray-700 mt-8">
        <Link
          href={`/contact?repId=${bioguideId}`}
          className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
        >
          Contact {bio.name.last}
        </Link>
        <Link
          href={`/states/${stateSlug}`}
          className="text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium"
        >
          View {stateName} Info
        </Link>
      </div>
    </div>
  );
}
