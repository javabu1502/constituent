'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { US_STATES } from '@/lib/constants';
import { createClient } from '@/lib/supabase/client';
import voterInfoData from '@/data/voter-info.json';

type StateData = (typeof voterInfoData)[keyof typeof voterInfoData];

interface VoterInfoLocation {
  name: string;
  address: string;
  hours: string;
  startDate: string;
  endDate: string;
  notes: string;
}

interface VoterInfoContest {
  type: string;
  office: string;
  district: string;
  candidates: { name: string; party: string }[];
}

interface CivicVoterInfo {
  available: boolean;
  election?: { name: string; electionDay: string };
  pollingLocations?: VoterInfoLocation[];
  earlyVoteSites?: VoterInfoLocation[];
  dropOffLocations?: VoterInfoLocation[];
  contests?: VoterInfoContest[];
}

const GENERAL_ELECTION_DATE = '2026-11-03';

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function Badge({ children, variant }: { children: React.ReactNode; variant: 'green' | 'red' | 'yellow' | 'blue' | 'purple' | 'gray' }) {
  const colors = {
    green: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    red: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
    yellow: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    blue: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300',
    purple: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300',
    gray: 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300',
  };
  return (
    <span className={`px-2.5 py-1 text-xs font-medium rounded-full ${colors[variant]}`}>
      {children}
    </span>
  );
}

function LocationCard({ location, type }: { location: VoterInfoLocation; type: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0 mt-0.5">
          <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">{location.name || type}</h4>
          </div>
          {location.address && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{location.address}</p>
          )}
          {location.hours && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Hours: {location.hours}</p>
          )}
          {location.startDate && location.endDate && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {formatDateShort(location.startDate)} — {formatDateShort(location.endDate)}
            </p>
          )}
          {location.notes && (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{location.notes}</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function VotePage() {
  const [selectedState, setSelectedState] = useState('');
  const [civicData, setCivicData] = useState<CivicVoterInfo | null>(null);
  const [civicLoading, setCivicLoading] = useState(false);
  const [hasAddress, setHasAddress] = useState(false);

  // Auto-detect state from logged-in user profile
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      fetch('/api/profile')
        .then((res) => (res.ok ? res.json() : null))
        .then((profile) => {
          if (profile?.state) {
            setSelectedState(profile.state);
          }
          if (profile?.street && profile?.city && profile?.state && profile?.zip) {
            setHasAddress(true);
          }
        })
        .catch(() => {});
    });
  }, []);

  // Fetch Civic API voter info when user has address
  useEffect(() => {
    if (!hasAddress) return;
    setCivicLoading(true);
    fetch('/api/voter-info')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) setCivicData(data);
      })
      .catch(() => {})
      .finally(() => setCivicLoading(false));
  }, [hasAddress]);

  const stateData = useMemo<StateData | null>(() => {
    if (!selectedState) return null;
    return (voterInfoData as Record<string, StateData>)[selectedState] || null;
  }, [selectedState]);

  // Compute next election countdown
  const nextElection = useMemo(() => {
    if (!stateData) return null;
    const primaryDays = daysUntil(stateData.primary2026);
    const generalDays = daysUntil(GENERAL_ELECTION_DATE);

    if (primaryDays > 0) {
      return {
        label: `${stateData.name} Primary Election`,
        date: stateData.primary2026,
        days: primaryDays,
        isGeneral: false,
      };
    }
    return {
      label: 'General Election',
      date: GENERAL_ELECTION_DATE,
      days: generalDays,
      isGeneral: true,
    };
  }, [stateData]);

  const isElectionSoon = nextElection && nextElection.days <= 60 && nextElection.days > 0;

  // No-online-registration states
  const noOnlineRegStates = ['AR', 'ME', 'MS', 'NH', 'TX', 'WY'];

  return (
    <>
      <Head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              '@context': 'https://schema.org',
              '@type': 'FAQPage',
              mainEntity: [
                {
                  '@type': 'Question',
                  name: 'How do I register to vote?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Most states offer online voter registration. Visit vote.gov or your state election office website to register. Some states also offer same-day registration at the polls.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'How can I check if I am registered to vote?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Each state has an online registration lookup tool. Select your state on our voting guide page to find the direct link to check your registration status.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'When is the 2026 general election?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'The 2026 general election is on Tuesday, November 3, 2026. Primary election dates vary by state.',
                  },
                },
                {
                  '@type': 'Question',
                  name: 'Do I need an ID to vote?',
                  acceptedAnswer: {
                    '@type': 'Answer',
                    text: 'Voter ID requirements vary by state. Some states require photo ID, others accept non-photo ID, and some states have no ID requirement. Check your state voting rules for specific requirements.',
                  },
                },
              ],
            }),
          }}
        />
      </Head>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Your Voting Guide</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Everything you need to vote — registration, deadlines, polling places, and what&apos;s on your ballot.
          </p>
        </div>

        {/* State selector */}
        <div className="mb-6">
          <label htmlFor="vote-state-select" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Select Your State
          </label>
          <select
            id="vote-state-select"
            value={selectedState}
            onChange={(e) => setSelectedState(e.target.value)}
            className="w-full sm:w-64 border border-gray-300 dark:border-gray-600 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="">Choose a state...</option>
            {US_STATES.map((s) => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>
        </div>

        {/* Election countdown banner */}
        {nextElection && nextElection.days > 0 && (
          <div className={`mb-6 rounded-xl p-4 border ${
            isElectionSoon
              ? 'bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800'
              : 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700'
          }`}>
            <div className="flex items-center gap-3">
              <div className={`text-3xl font-bold ${isElectionSoon ? 'text-red-600 dark:text-red-400' : 'text-purple-600 dark:text-purple-400'}`}>
                {nextElection.days}
              </div>
              <div>
                <p className={`text-sm font-semibold ${isElectionSoon ? 'text-red-800 dark:text-red-200' : 'text-purple-800 dark:text-purple-200'}`}>
                  days until {nextElection.label}
                </p>
                <p className={`text-xs ${isElectionSoon ? 'text-red-600 dark:text-red-300' : 'text-purple-600 dark:text-purple-300'}`}>
                  {formatDate(nextElection.date)}
                </p>
              </div>
            </div>
          </div>
        )}

        {stateData ? (
          <>
            {/* Quick Action Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
              <a
                href={stateData.registerOnline || stateData.registerVoteGov}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Register to Vote
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {stateData.abbreviation === 'ND' ? 'No registration needed in ND' : stateData.onlineRegistration ? 'Register online' : 'Register by mail'}
                </p>
              </a>

              <a
                href={stateData.checkRegistration}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Check Your Registration
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Verify your voter registration status</p>
              </a>

              <a
                href={stateData.electionOfficeDirectory}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md transition-all group"
              >
                <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white text-sm group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors">
                  Find Your Election Office
                </h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{stateData.name} election office</p>
              </a>
            </div>

            {/* Voting Rules */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
                {stateData.name}&apos;s Voting Rules
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-1">Registration Deadline</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{stateData.registrationDeadline}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-1">Same-Day Registration</p>
                  <Badge variant={stateData.sameDayRegistration ? 'green' : 'gray'}>
                    {stateData.sameDayRegistration ? 'Available' : 'Not Available'}
                  </Badge>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-1">Early Voting</p>
                  <Badge variant={stateData.earlyVoting ? 'green' : 'gray'}>
                    {stateData.earlyVoting ? 'Available' : 'Not Available'}
                  </Badge>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-1">No-Excuse Absentee</p>
                  <Badge variant={stateData.noExcuseAbsentee ? 'green' : 'yellow'}>
                    {stateData.noExcuseAbsentee ? 'Yes' : 'No'}
                  </Badge>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-1">Voter ID</p>
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{stateData.voterIdRequired}</p>
                </div>
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wide font-medium mb-1">Online Registration</p>
                  <Badge variant={stateData.onlineRegistration ? 'green' : 'yellow'}>
                    {stateData.onlineRegistration ? 'Available' : 'Not Available'}
                  </Badge>
                </div>
              </div>
              {stateData.notes && (
                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-xl">
                  <p className="text-sm text-blue-800 dark:text-blue-200">{stateData.notes}</p>
                </div>
              )}
              {noOnlineRegStates.includes(stateData.abbreviation) && (
                <div className="mt-4 p-4 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-xl">
                  <p className="text-sm text-yellow-800 dark:text-yellow-200">
                    {stateData.name} does not offer online voter registration. You can register by mail using the{' '}
                    <a
                      href="https://www.eac.gov/voters/national-mail-voter-registration-form"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="underline font-medium"
                    >
                      National Mail Voter Registration Form
                    </a>{' '}
                    or at your local election office.
                  </p>
                </div>
              )}
            </section>

            {/* 2026 Elections */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">2026 Elections</h2>
              <div className="space-y-3">
                {/* Primary */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">Primary Election</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(stateData.primary2026)}</p>
                    </div>
                    {daysUntil(stateData.primary2026) > 0 ? (
                      <Badge variant={daysUntil(stateData.primary2026) <= 60 ? 'red' : 'purple'}>
                        {daysUntil(stateData.primary2026)} days away
                      </Badge>
                    ) : (
                      <Badge variant="gray">Completed</Badge>
                    )}
                  </div>
                </div>

                {/* Primary Runoff */}
                {stateData.primaryRunoff2026 && (
                  <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
                    <div className="flex items-center justify-between flex-wrap gap-2">
                      <div>
                        <p className="font-semibold text-gray-900 dark:text-white text-sm">Primary Runoff</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(stateData.primaryRunoff2026)}</p>
                      </div>
                      {daysUntil(stateData.primaryRunoff2026) > 0 ? (
                        <Badge variant={daysUntil(stateData.primaryRunoff2026) <= 60 ? 'red' : 'purple'}>
                          {daysUntil(stateData.primaryRunoff2026)} days away
                        </Badge>
                      ) : (
                        <Badge variant="gray">Completed</Badge>
                      )}
                    </div>
                  </div>
                )}

                {/* General Election */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div>
                      <p className="font-semibold text-gray-900 dark:text-white text-sm">General Election</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{formatDate(GENERAL_ELECTION_DATE)}</p>
                    </div>
                    <Badge variant={daysUntil(GENERAL_ELECTION_DATE) <= 60 ? 'red' : 'purple'}>
                      {daysUntil(GENERAL_ELECTION_DATE)} days away
                    </Badge>
                  </div>
                </div>

                {/* Senate race */}
                <div className={`rounded-xl border shadow-sm p-4 ${
                  stateData.senateRace2026
                    ? 'bg-purple-50 dark:bg-purple-900/30 border-purple-200 dark:border-purple-700'
                    : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                }`}>
                  <div className="flex items-center gap-2">
                    {stateData.senateRace2026 ? (
                      <>
                        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                        <p className="font-semibold text-purple-800 dark:text-purple-200 text-sm">
                          Your state has a U.S. Senate race in 2026!
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-gray-600 dark:text-gray-400">No U.S. Senate race in {stateData.name} in 2026</p>
                    )}
                  </div>
                </div>

                {/* House seats */}
                <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    <span className="font-semibold text-gray-900 dark:text-white">{stateData.houseSeats}</span>{' '}
                    U.S. House seat{stateData.houseSeats !== 1 ? 's' : ''} up for election
                  </p>
                </div>
              </div>
            </section>

            {/* Civic API: Address-specific voter info */}
            {civicLoading && (
              <section className="mb-8">
                <div className="space-y-3">
                  {[1, 2].map((i) => (
                    <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 animate-pulse">
                      <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-48 mb-2" />
                      <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-64" />
                    </div>
                  ))}
                </div>
              </section>
            )}

            {civicData?.available && (
              <>
                {/* Polling Locations */}
                {civicData.pollingLocations && civicData.pollingLocations.length > 0 && (
                  <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Your Polling Place</h2>
                    <div className="space-y-3">
                      {civicData.pollingLocations.map((loc, i) => (
                        <LocationCard key={i} location={loc} type="Polling Location" />
                      ))}
                    </div>
                  </section>
                )}

                {/* Early Voting */}
                {civicData.earlyVoteSites && civicData.earlyVoteSites.length > 0 && (
                  <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Early Voting Locations</h2>
                    <div className="space-y-3">
                      {civicData.earlyVoteSites.map((loc, i) => (
                        <LocationCard key={i} location={loc} type="Early Voting Site" />
                      ))}
                    </div>
                  </section>
                )}

                {/* Drop-off Locations */}
                {civicData.dropOffLocations && civicData.dropOffLocations.length > 0 && (
                  <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Ballot Drop-off Locations</h2>
                    <div className="space-y-3">
                      {civicData.dropOffLocations.map((loc, i) => (
                        <LocationCard key={i} location={loc} type="Drop-off Location" />
                      ))}
                    </div>
                  </section>
                )}

                {/* Contests */}
                {civicData.contests && civicData.contests.length > 0 && (
                  <section className="mb-8">
                    <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">What&apos;s On Your Ballot</h2>
                    <div className="space-y-3">
                      {civicData.contests.map((contest, i) => (
                        <div key={i} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <h4 className="font-semibold text-gray-900 dark:text-white text-sm">
                              {contest.office || contest.type}
                            </h4>
                            {contest.district && (
                              <Badge variant="blue">{contest.district}</Badge>
                            )}
                          </div>
                          {contest.candidates.length > 0 && (
                            <div className="space-y-1">
                              {contest.candidates.map((c, j) => (
                                <div key={j} className="flex items-center gap-2 text-sm">
                                  <span className="text-gray-900 dark:text-white">{c.name}</span>
                                  {c.party && (
                                    <span className="text-xs text-gray-500 dark:text-gray-400">({c.party})</span>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </section>
                )}
              </>
            )}

            {/* Resources */}
            <section className="mb-8">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Resources</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <a
                  href="https://vote.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                >
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Vote.gov</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Official U.S. government voting resource</p>
                  </div>
                </a>
                <a
                  href={stateData.electionOfficeDirectory}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                >
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">{stateData.name} Election Office</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Your state&apos;s official election website</p>
                  </div>
                </a>
                <a
                  href="https://www.eac.gov/voters/national-mail-voter-registration-form"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                >
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">National Mail Voter Registration Form</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Register to vote by mail (EAC)</p>
                  </div>
                </a>
                <a
                  href="https://www.fvap.gov"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-3 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-4 hover:border-purple-300 dark:hover:border-purple-600 transition-colors"
                >
                  <svg className="w-5 h-5 text-purple-600 dark:text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white text-sm">Military &amp; Overseas Voters</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Federal Voting Assistance Program</p>
                  </div>
                </a>
              </div>
            </section>
          </>
        ) : (
          /* No state selected */
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-8 text-center">
            <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">Select Your State</h3>
            <p className="text-gray-600 dark:text-gray-400">Choose a state above to see voter registration info, election dates, voting rules, and resources.</p>
          </div>
        )}

        {/* Disclaimer */}
        <div className="mt-8 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Voting rules and deadlines can change. Always verify with your{' '}
              <a href={stateData?.electionOfficeDirectory || 'https://vote.gov'} target="_blank" rel="noopener noreferrer" className="underline hover:text-gray-700 dark:hover:text-gray-300">
                state or local election office
              </a>.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
