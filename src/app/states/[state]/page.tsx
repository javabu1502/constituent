import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { US_STATES, PARTY_COLORS, DEFAULT_PARTY_COLOR } from '@/lib/constants';
import { findSenators, findAllRepresentatives } from '@/lib/legislators';
import { getStateLegislators, toOfficial } from '@/lib/state-legislators';
import type { Official } from '@/lib/types';
import voterInfoData from '@/data/voter-info.json';
import stateMetaData from '@/data/state-meta.json';
import { StateTrends } from './StateTrends';
import { BillSearch } from '@/components/bills/BillSearch';
import { FederalSpending } from '@/components/spending/FederalSpending';

// ── Types ────────────────────────────────────────────────────────────────────

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

interface GovernorInfo {
  name: string;
  party: string;
  since: number;
}

interface StateMeta {
  governor: GovernorInfo;
  legislatureType: 'full-time' | 'hybrid' | 'part-time';
  sessionDates: string;
  inSession: boolean;
  upperChamberName: string | null;
  lowerChamberName: string | null;
  publicCommentUrl: string | null;
  publicCommentMethod: string | null;
}

const voterInfo = voterInfoData as Record<string, VoterInfo>;
const stateMeta = stateMetaData as Record<string, StateMeta>;

// ── State lookup ─────────────────────────────────────────────────────────────

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
  if (!stateInfo) return { title: 'State Info | My Democracy' };

  const title = `${stateInfo.name} Government, Voting & Representatives | My Democracy`;
  const description = `Everything about ${stateInfo.name}: governor, state legislature, voting rules, election dates, federal delegation, state legislators, and how to get involved.`;

  return {
    title,
    description,
    keywords: [
      `${stateInfo.name} government`,
      `${stateInfo.name} governor`,
      `${stateInfo.name} legislature`,
      `${stateInfo.name} voting`,
      `${stateInfo.name} representatives`,
      `${stateInfo.name} elections 2026`,
      `${stateInfo.name} voter registration`,
      `${stateInfo.name} state legislators`,
      `${stateInfo.name} bills`,
      `${stateInfo.name} legislation`,
    ],
    openGraph: { title, description, url: `https://www.mydemocracy.app/states/${slug}`, type: 'website' },
    alternates: { canonical: `https://www.mydemocracy.app/states/${slug}` },
  };
}

// ── Small components ─────────────────────────────────────────────────────────

function VotingBadge({ value }: { value: boolean }) {
  return value ? (
    <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">Yes</span>
  ) : (
    <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">No</span>
  );
}

const LEG_TYPE_LABELS: Record<string, { label: string; color: string; description: string }> = {
  'full-time': { label: 'Full-Time', color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', description: 'Legislators serve full-time and receive a salary comparable to full-time work' },
  'hybrid': { label: 'Hybrid', color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', description: 'Legislators spend about two-thirds of full-time on legislative work' },
  'part-time': { label: 'Part-Time', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', description: 'Legislature meets for limited sessions; legislators maintain other careers' },
};

function OfficialRow({ official, badge }: { official: Official; badge?: string }) {
  const partyColor = PARTY_COLORS[official.party] ?? DEFAULT_PARTY_COLOR;

  return (
    <div className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
      {official.photoUrl ? (
        <Image src={official.photoUrl} alt={official.name} width={48} height={48} className="w-12 h-12 rounded-full object-cover shrink-0 border border-gray-200 dark:border-gray-600" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center shrink-0">
          <span className="text-gray-500 dark:text-gray-400 text-lg font-medium">{official.name.charAt(0)}</span>
        </div>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 flex-wrap">
          {official.level === 'federal' ? (
            <Link href={`/rep/${official.id}`} className="font-semibold text-gray-900 dark:text-white text-sm hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
              {official.name}
            </Link>
          ) : (
            <span className="font-semibold text-gray-900 dark:text-white text-sm">{official.name}</span>
          )}
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${partyColor.bg} ${partyColor.text}`}>{official.party}</span>
          {badge && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">{badge}</span>
          )}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{official.title}</p>
      </div>
    </div>
  );
}

function ChamberBar({ label, dem, rep, other }: { label: string; dem: number; rep: number; other: number }) {
  const total = dem + rep + other;
  if (total === 0) return null;
  const demPct = (dem / total) * 100;
  const repPct = (rep / total) * 100;

  return (
    <div>
      <div className="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
        <span>{label}</span>
        <span>{total} seats</span>
      </div>
      <div className="flex h-3 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
        {dem > 0 && <div className="bg-blue-500" style={{ width: `${demPct}%` }} title={`Democrat: ${dem}`} />}
        {other > 0 && <div className="bg-gray-400" style={{ width: `${(other / total) * 100}%` }} title={`Other: ${other}`} />}
        {rep > 0 && <div className="bg-red-500" style={{ width: `${repPct}%` }} title={`Republican: ${rep}`} />}
      </div>
      <div className="flex items-center justify-between text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">
        <span className="text-blue-600 dark:text-blue-400">D: {dem}</span>
        {other > 0 && <span>Other: {other}</span>}
        <span className="text-red-600 dark:text-red-400">R: {rep}</span>
      </div>
    </div>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default async function StateHubPage({ params }: StatePageProps) {
  const { state: slug } = await params;
  const stateInfo = STATES_BY_SLUG[slug];
  if (!stateInfo) notFound();

  const info = voterInfo[stateInfo.code];
  if (!info) notFound();

  const meta = stateMeta[stateInfo.code] as StateMeta | undefined;
  const isDC = stateInfo.code === 'DC';

  // Federal delegation
  const senators = findSenators(stateInfo.code);
  const representatives = findAllRepresentatives(stateInfo.code);

  // Find senator up for re-election in 2026 (Class 2 seats)
  const senatorUp2026 = senators.find(s => s.senateClass === 2) ?? null;

  // State legislature
  const stateLegislators = getStateLegislators(stateInfo.code);
  const stateOfficials = stateLegislators.map((l) => toOfficial(l, stateInfo.code));
  const stateSenators = stateOfficials.filter((o) => o.chamber === 'upper');
  const stateReps = stateOfficials.filter((o) => o.chamber === 'lower');

  // Compute partisan composition
  function countParties(officials: Official[]) {
    let dem = 0, rep = 0, other = 0;
    for (const o of officials) {
      if (o.party === 'Democratic' || o.party === 'Democrat') dem++;
      else if (o.party === 'Republican') rep++;
      else other++;
    }
    return { dem, rep, other };
  }

  const senateComp = countParties(stateSenators);
  const houseComp = countParties(stateReps);
  const totalOfficials = senators.length + representatives.length + stateOfficials.length;

  const registerUrl = info.registerOnline ?? info.registerVoteGov;
  const governor = meta?.governor;
  const govPartyColor = governor ? (PARTY_COLORS[governor.party] ?? DEFAULT_PARTY_COLOR) : DEFAULT_PARTY_COLOR;

  // FAQPage structured data for SEO
  const faqJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What are the voter ID requirements in ${stateInfo.name}?`,
        acceptedAnswer: { '@type': 'Answer', text: info.voterIdRequired },
      },
      {
        '@type': 'Question',
        name: `When is the 2026 primary election in ${stateInfo.name}?`,
        acceptedAnswer: { '@type': 'Answer', text: new Date(info.primary2026 + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) },
      },
      {
        '@type': 'Question',
        name: `Does ${stateInfo.name} have early voting?`,
        acceptedAnswer: { '@type': 'Answer', text: info.earlyVoting ? `Yes, ${stateInfo.name} offers early in-person voting.` : `No, ${stateInfo.name} does not offer early in-person voting.` },
      },
      {
        '@type': 'Question',
        name: `What is the voter registration deadline in ${stateInfo.name}?`,
        acceptedAnswer: { '@type': 'Answer', text: info.registrationDeadline },
      },
      ...(governor ? [{
        '@type': 'Question' as const,
        name: `Who is the governor of ${stateInfo.name}?`,
        acceptedAnswer: { '@type': 'Answer' as const, text: `The governor of ${stateInfo.name} is ${governor.name} (${governor.party}), serving since ${governor.since}.` },
      }] : []),
    ],
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: 'https://www.mydemocracy.app' },
      { '@type': 'ListItem', position: 2, name: 'States', item: 'https://www.mydemocracy.app/states' },
      { '@type': 'ListItem', position: 3, name: stateInfo.name, item: `https://www.mydemocracy.app/states/${slug}` },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }} />

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
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{stateInfo.name}</h1>
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          Your complete guide to {stateInfo.name} government, representatives, voting, and how to get involved.
        </p>

        {/* Stat cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">{info.houseSeats}</div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">U.S. House {info.houseSeats === 1 ? 'Seat' : 'Seats'}</div>
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
              {senatorUp2026
                ? <span className="text-green-600 dark:text-green-400">{senatorUp2026.lastName}</span>
                : info.senateRace2026
                  ? <span className="text-green-600 dark:text-green-400">Yes</span>
                  : <span className="text-gray-400 dark:text-gray-500">No</span>}
            </div>
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">Senate Race 2026</div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Governor & State Government */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {meta && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">State Government</h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            {/* Governor card */}
            {governor && (
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
                <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  {isDC ? 'Mayor' : 'Governor'}
                </h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center shrink-0">
                    <span className="text-purple-600 dark:text-purple-400 text-lg font-bold">{governor.name.charAt(0)}</span>
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-semibold text-gray-900 dark:text-white">{governor.name}</span>
                      <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${govPartyColor.bg} ${govPartyColor.text}`}>{governor.party}</span>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Since {governor.since}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Legislature info card */}
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
              <h3 className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">Legislature</h3>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Type</span>
                  {LEG_TYPE_LABELS[meta.legislatureType] && (
                    <span className={`px-2.5 py-0.5 text-xs font-medium rounded-full ${LEG_TYPE_LABELS[meta.legislatureType].color}`}
                      title={LEG_TYPE_LABELS[meta.legislatureType].description}>
                      {LEG_TYPE_LABELS[meta.legislatureType].label}
                    </span>
                  )}
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600 dark:text-gray-400">Status</span>
                  {meta.inSession
                    ? <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">In Session</span>
                    : <span className="px-2.5 py-0.5 text-xs font-medium rounded-full bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400">Out of Session</span>}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{meta.sessionDates}</p>
              </div>
            </div>
          </div>

          {/* Chamber composition bars */}
          {!isDC && (stateSenators.length > 0 || stateReps.length > 0) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 mb-4">
              <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-4">Partisan Composition</h3>
              <div className="space-y-4">
                {stateSenators.length > 0 && (
                  <ChamberBar label={meta.upperChamberName ?? 'Senate'} dem={senateComp.dem} rep={senateComp.rep} other={senateComp.other} />
                )}
                {stateReps.length > 0 && meta.lowerChamberName && (
                  <ChamberBar label={meta.lowerChamberName} dem={houseComp.dem} rep={houseComp.rep} other={houseComp.other} />
                )}
              </div>
            </div>
          )}

          {/* Public comment portal */}
          {meta.publicCommentUrl && (
            <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
              <div className="flex items-start gap-3">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
                </svg>
                <div>
                  <p className="text-sm font-medium text-purple-800 dark:text-purple-300 mb-1">Public Comment Available</p>
                  <p className="text-xs text-purple-700 dark:text-purple-400 mb-2">{meta.publicCommentMethod}</p>
                  <a
                    href={meta.publicCommentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300"
                  >
                    Submit Public Comment
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </a>
                </div>
              </div>
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Voting & Elections */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Voting &amp; Elections</h2>

        <div className="flex flex-wrap gap-3 mb-6">
          <a href={registerUrl} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors">
            Register to Vote
          </a>
          <a href={info.checkRegistration} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:border-purple-400 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors">
            Check Registration
          </a>
          <a href={info.electionOfficeDirectory} target="_blank" rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:border-purple-400 text-gray-700 dark:text-gray-300 text-sm font-medium rounded-lg transition-colors">
            Election Office
          </a>
        </div>

        {/* Voting rules grid */}
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 mb-4">
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
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 mb-4">
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

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* 2026 Senate Race */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {senatorUp2026 && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">2026 Senate Race</h2>
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
            <div className="flex items-center gap-4">
              {senatorUp2026.photoUrl ? (
                <Image src={senatorUp2026.photoUrl} alt={senatorUp2026.name} width={64} height={64} className="w-16 h-16 rounded-full object-cover shrink-0 border border-gray-200 dark:border-gray-600" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-gray-200 dark:bg-gray-600 flex items-center justify-center shrink-0">
                  <span className="text-gray-500 dark:text-gray-400 text-xl font-medium">{senatorUp2026.name.charAt(0)}</span>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <Link href={`/rep/${senatorUp2026.id}`} className="font-semibold text-gray-900 dark:text-white hover:text-purple-600 dark:hover:text-purple-400 transition-colors">
                    {senatorUp2026.name}
                  </Link>
                  <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${(PARTY_COLORS[senatorUp2026.party] ?? DEFAULT_PARTY_COLOR).bg} ${(PARTY_COLORS[senatorUp2026.party] ?? DEFAULT_PARTY_COLOR).text}`}>{senatorUp2026.party}</span>
                  <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300">Up for Re-election</span>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{senatorUp2026.title}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Class 2 seat · Primary: {new Date(info.primary2026 + 'T00:00:00').toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                </p>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Federal Delegation */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Federal Delegation</h2>

        {senators.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              U.S. Senators <span className="font-normal text-gray-500 dark:text-gray-400">({senators.length})</span>
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
              {senators.map((s) => <OfficialRow key={s.id} official={s} badge={s.senateClass === 2 ? 'Up in 2026' : undefined} />)}
            </div>
          </div>
        )}

        {representatives.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
              U.S. Representatives <span className="font-normal text-gray-500 dark:text-gray-400">({representatives.length})</span>
            </h3>
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
              {representatives.map((r) => <OfficialRow key={r.id} official={r} />)}
            </div>
          </div>
        )}

        {senators.length === 0 && representatives.length === 0 && (
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-6 text-center">
            <p className="text-gray-500 dark:text-gray-400 text-sm">No federal delegation data available.</p>
          </div>
        )}
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Trending Issues */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <StateTrends stateCode={stateInfo.code} stateName={stateInfo.name} />

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Federal Spending */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Federal Spending in {stateInfo.name}</h2>
        <FederalSpending stateCode={stateInfo.code} stateName={stateInfo.name} />
      </section>

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* State Legislature */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {!isDC && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">State Legislature</h2>

          {stateOfficials.length > 0 ? (
            <>
              {stateSenators.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {meta?.upperChamberName ?? 'State Senate'} <span className="font-normal text-gray-500 dark:text-gray-400">({stateSenators.length} total)</span>
                  </h3>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
                    {stateSenators.slice(0, 5).map((s) => <OfficialRow key={s.id} official={s} />)}
                  </div>
                </div>
              )}

              {stateReps.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                    {meta?.lowerChamberName ?? 'State House'} <span className="font-normal text-gray-500 dark:text-gray-400">({stateReps.length} total)</span>
                  </h3>
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm divide-y divide-gray-100 dark:divide-gray-700">
                    {stateReps.slice(0, 5).map((r) => <OfficialRow key={r.id} official={r} />)}
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
              <p className="text-gray-500 dark:text-gray-400 text-sm">No state legislator data available for {stateInfo.name} yet.</p>
            </div>
          )}
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Search Legislation */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      {!isDC && (
        <section className="mb-10">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Search {stateInfo.name} Legislation</h2>
          <BillSearch stateCode={stateInfo.code} stateName={stateInfo.name} />
        </section>
      )}

      {/* ═══════════════════════════════════════════════════════════════════ */}
      {/* Quick Links */}
      {/* ═══════════════════════════════════════════════════════════════════ */}
      <section className="mb-10">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">Resources</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <a href={info.electionOfficeDirectory} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
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
          <a href={registerUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
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
          <a href={info.checkRegistration} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
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
          <a href="https://vote.gov" target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors">
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
          Make your voice heard. Contact your {stateInfo.name} representatives today.
        </p>
        <Link href="/contact" className="inline-block px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors">
          Contact Your Representatives
        </Link>
      </div>
    </div>
  );
}
