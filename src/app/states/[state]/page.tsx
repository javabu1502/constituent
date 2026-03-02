import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { US_STATES, PARTY_COLORS, DEFAULT_PARTY_COLOR } from '@/lib/constants';
import { findSenators, findAllRepresentatives } from '@/lib/legislators';
import { getStateLegislators, toOfficial } from '@/lib/state-legislators';
import type { Official } from '@/lib/types';
import voterInfoData from '@/data/voter-info.json';
import { StateTrends } from './StateTrends';

// Voter info type derived from the JSON structure
interface VoterInfo {
  name: string;
  abbreviation: string;
  electionOfficeDirectory: string;
  registerOnline: string | null;
  registerVoteGov: string;
  checkRegistration: string;
  primary2026: string;
  primaryRunoff2026: string | null;
  registrationDeadline: string;
  earlyVoting: boolean;
  sameDayRegistration: boolean;
  noExcuseAbsentee: boolean;
  voterIdRequired: string;
  onlineRegistration: boolean;
  senateRace2026: boolean;
  houseSeats: number;
  notes: string | null;
}

const voterInfo = voterInfoData as Record<string, VoterInfo>;

// Slug → state code mapping
const STATES_BY_SLUG: Record<string, { code: string; name: string }> = {};
for (const s of US_STATES) {
  const slug = s.name.toLowerCase().replace(/\s+/g, '-');
  STATES_BY_SLUG[slug] = { code: s.code, name: s.name };
}

export function generateStaticParams() {
  return US_STATES.map((s) => ({
    state: s.name.toLowerCase().replace(/\s+/g, '-'),
  }));
}

interface StatePageProps {
  params: Promise<{ state: string }>;
}

export async function generateMetadata({ params }: StatePageProps): Promise<Metadata> {
  const { state: slug } = await params;
  const stateInfo = STATES_BY_SLUG[slug];
  if (!stateInfo) return { title: 'State Info — My Democracy' };

  const title = `${stateInfo.name} Voting Info, Representatives & Elections 2026 — My Democracy`;
  const description = `Everything you need to know about ${stateInfo.name} government: voting rules, registration, election dates, U.S. senators, representatives, and state legislators.`;

  return {
    title,
    description,
    keywords: [
      `${stateInfo.name} voting info`,
      `${stateInfo.name} representatives`,
      `${stateInfo.name} government`,
      `${stateInfo.name} elections 2026`,
      `${stateInfo.name} voter registration`,
      `${stateInfo.name} senators`,
      `${stateInfo.name} state legislators`,
    ],
    openGraph: {
      title,
      description,
      url: `https://www.mydemocracy.app/states/${slug}`,
      type: 'website',
    },
    alternates: {
      canonical: `https://www.mydemocracy.app/states/${slug}`,
    },
  };
}

function VotingBadge({ value }: { value: boolean }) {
  return value ? (
    <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
      Yes
    </span>
  ) : (
    <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">
      No
    </span>
  );
}

function OfficialRow({ official }: { official: Official }) {
  const partyColor = PARTY_COLORS[official.party] ?? DEFAULT_PARTY_COLOR;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      {official.photoUrl ? (
        <img
          src={official.photoUrl}
          alt={official.name}
          className="w-12 h-12 rounded-full object-cover shrink-0 border border-gray-200 dark:border-gray-600"
        />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center shrink-0">
          <span className="text-gray-500 dark:text-gray-400 text-lg font-medium">
            {official.name.charAt(0)}
          </span>
        </div>
      )}

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {official.level === 'federal' ? (
            <Link
              href={`/rep/${official.id}`}
              className="font-semibold text-gray-900 dark:text-white text-sm hover:text-purple-600 dark:hover:text-purple-400 transition-colors"
            >
              {official.name}
            </Link>
          ) : (
            <span className="font-semibold text-gray-900 dark:text-white text-sm">{official.name}</span>
          )}
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${partyColor.bg} ${partyColor.text}`}>
            {official.party}
          </span>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{official.title}</p>
      </div>

      <Link
        href={`/contact?repId=${official.id}`}
        className="shrink-0 px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-medium rounded-lg transition-colors"
      >
        Contact
      </Link>
    </div>
  );
}

export default async function StateHubPage({ params }: StatePageProps) {
  const { state: slug } = await params;
  const stateInfo = STATES_BY_SLUG[slug];
  if (!stateInfo) notFound();

  const info = voterInfo[stateInfo.code];
  if (!info) notFound();

  // Federal delegation
  const senators = findSenators(stateInfo.code);
  const representatives = findAllRepresentatives(stateInfo.code);

  // State legislature
  const stateLegislators = getStateLegislators(stateInfo.code);
  const stateOfficials = stateLegislators.map((l) => toOfficial(l, stateInfo.code));
  const stateSenators = stateOfficials.filter((o) => o.chamber === 'upper');
  const stateReps = stateOfficials.filter((o) => o.chamber === 'lower');

  const totalOfficials = senators.length + representatives.length + stateOfficials.length;
  const isDC = stateInfo.code === 'DC';

  const registerUrl = info.registerOnline ?? info.registerVoteGov;

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: 'https://www.mydemocracy.app',
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'States',
        item: 'https://www.mydemocracy.app/states',
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: stateInfo.name,
        item: `https://www.mydemocracy.app/states/${slug}`,
      },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      {/* Breadcrumbs */}
      <nav className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        <Link href="/" className="hover:text-purple-600 dark:hover:text-purple-400">Home</Link>
        {' / '}
        <Link href="/states" className="hover:text-purple-600 dark:hover:text-purple-400">States</Link>
        {' / '}
        <span className="text-gray-900 dark:text-white font-medium">{stateInfo.name}</span>
      </nav>

      {/* Header */}
      <div className="mb-10">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {stateInfo.name}
        </h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Your complete guide to {stateInfo.name} government, representatives, and voting.
        </p>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{info.houseSeats}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              U.S. House {info.houseSeats === 1 ? 'Seat' : 'Seats'}
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {new Date(info.primary2026 + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">2026 Primary</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalOfficials}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Elected Officials</div>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <div className="text-2xl font-bold">
              {info.senateRace2026 ? (
                <span className="text-green-600 dark:text-green-400">Yes</span>
              ) : (
                <span className="text-gray-400 dark:text-gray-500">No</span>
              )}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Senate Race 2026</div>
          </div>
        </div>
      </div>

      {/* Voting & Elections */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Voting &amp; Elections</h2>

        {/* Quick action buttons */}
        <div className="flex flex-wrap gap-3 mb-6">
          <a
            href={registerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Register to Vote
          </a>
          <a
            href={info.checkRegistration}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Check Registration
          </a>
          <Link
            href="/vote"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            Voting Guide
          </Link>
        </div>

        {/* Voting rules grid */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Voting Rules</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Registration Deadline</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">{info.registrationDeadline}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Early Voting</span>
              <VotingBadge value={info.earlyVoting} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Same-Day Registration</span>
              <VotingBadge value={info.sameDayRegistration} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">No-Excuse Absentee</span>
              <VotingBadge value={info.noExcuseAbsentee} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Online Registration</span>
              <VotingBadge value={info.onlineRegistration} />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Voter ID Requirement</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white text-right max-w-[55%]">{info.voterIdRequired}</span>
            </div>
          </div>
        </div>

        {/* Election dates */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 mb-6">
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">2026 Election Dates</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">Primary Election</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">
                {new Date(info.primary2026 + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </span>
            </div>
            {info.primaryRunoff2026 && (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600 dark:text-gray-400">Primary Runoff</span>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {new Date(info.primaryRunoff2026 + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </span>
              </div>
            )}
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">General Election</span>
              <span className="text-sm font-medium text-gray-900 dark:text-white">November 3, 2026</span>
            </div>
          </div>
        </div>

        {/* State-specific notes */}
        {info.notes && (
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
            <div className="flex gap-3">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-sm text-purple-800 dark:text-purple-300">{info.notes}</p>
            </div>
          </div>
        )}
      </section>

      {/* Federal Delegation */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Federal Delegation</h2>

        {senators.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              U.S. Senators <span className="font-normal text-gray-500 dark:text-gray-400">({senators.length})</span>
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
              {senators.map((s) => (
                <OfficialRow key={s.id} official={s} />
              ))}
            </div>
          </div>
        )}

        {representatives.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              U.S. Representatives <span className="font-normal text-gray-500 dark:text-gray-400">({representatives.length})</span>
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
              {representatives.map((r) => (
                <OfficialRow key={r.id} official={r} />
              ))}
            </div>
          </div>
        )}

        {senators.length === 0 && representatives.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">No federal delegation data available.</p>
          </div>
        )}
      </section>

      {/* Trending Issues */}
      <StateTrends stateCode={stateInfo.code} stateName={stateInfo.name} />

      {/* State Legislature */}
      {!isDC && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">State Legislature</h2>

          {stateOfficials.length > 0 ? (
            <>
              {stateSenators.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    State Senate <span className="font-normal text-gray-500 dark:text-gray-400">({stateSenators.length} total)</span>
                  </h3>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
                    {stateSenators.slice(0, 3).map((s) => (
                      <OfficialRow key={s.id} official={s} />
                    ))}
                  </div>
                </div>
              )}

              {stateReps.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    State House <span className="font-normal text-gray-500 dark:text-gray-400">({stateReps.length} total)</span>
                  </h3>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
                    {stateReps.slice(0, 3).map((r) => (
                      <OfficialRow key={r.id} official={r} />
                    ))}
                  </div>
                </div>
              )}

              <Link
                href={`/legislators/${slug}`}
                className="inline-flex items-center gap-1 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium transition-colors"
              >
                View all {stateOfficials.length} {stateInfo.name} state legislators
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </>
          ) : (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 text-center">
              <p className="text-gray-500 dark:text-gray-400 text-sm">
                No state legislator data available for {stateInfo.name} yet.
              </p>
              <Link
                href={`/legislators/${slug}`}
                className="inline-flex items-center gap-1 mt-2 text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 text-sm font-medium transition-colors"
              >
                Check {stateInfo.name} legislators page
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </Link>
            </div>
          )}
        </section>
      )}

      {/* Quick Links */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Quick Links</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a
            href={info.electionOfficeDirectory}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Election Office</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">{stateInfo.name} election authority</div>
            </div>
          </a>

          <a
            href={registerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Register to Vote</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Online voter registration</div>
            </div>
          </a>

          <a
            href={info.checkRegistration}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">Check Registration</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Verify your voter status</div>
            </div>
          </a>

          <a
            href="https://vote.gov"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
          >
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center shrink-0">
              <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-sm font-medium text-gray-900 dark:text-white">vote.gov</div>
              <div className="text-xs text-gray-500 dark:text-gray-400">Federal voting resources</div>
            </div>
          </a>
        </div>
      </section>

      {/* CTA */}
      <div className="text-center py-8 border-t border-gray-200 dark:border-gray-700">
        <p className="text-gray-600 dark:text-gray-400 mb-4">
          Make your voice heard — contact your {stateInfo.name} representatives today.
        </p>
        <Link
          href="/contact"
          className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors"
        >
          Contact Your Representatives
        </Link>
      </div>
    </div>
  );
}
