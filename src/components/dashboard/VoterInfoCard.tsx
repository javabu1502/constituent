'use client';

import Link from 'next/link';
import voterInfoData from '@/data/voter-info.json';

type StateData = (typeof voterInfoData)[keyof typeof voterInfoData];

const GENERAL_ELECTION_DATE = '2026-11-03';

function daysUntil(dateStr: string): number {
  const target = new Date(dateStr + 'T00:00:00');
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr + 'T00:00:00').toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

interface Props {
  userState: string | null;
}

export function VoterInfoCard({ userState }: Props) {
  const stateData: StateData | null = userState
    ? (voterInfoData as Record<string, StateData>)[userState] || null
    : null;

  if (!stateData) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm p-5">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
            <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Voter Info</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">Add your address to see voting info</p>
          </div>
        </div>
        <Link
          href="/vote"
          className="block w-full text-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
        >
          View Voting Guide
        </Link>
      </div>
    );
  }

  // Compute next election
  const primaryDays = daysUntil(stateData.primary2026);
  const generalDays = daysUntil(GENERAL_ELECTION_DATE);

  const nextElection = primaryDays > 0
    ? { label: `${stateData.name} Primary`, date: stateData.primary2026, days: primaryDays }
    : { label: 'General Election', date: GENERAL_ELECTION_DATE, days: generalDays };

  const isElectionSoon = nextElection.days <= 60 && nextElection.days > 0;

  return (
    <div className={`rounded-xl border shadow-sm p-5 ${
      isElectionSoon
        ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
        : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
    }`}>
      <div className="flex items-center gap-3 mb-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
          isElectionSoon
            ? 'bg-red-100 dark:bg-red-900'
            : 'bg-purple-100 dark:bg-purple-900'
        }`}>
          <svg className={`w-5 h-5 ${isElectionSoon ? 'text-red-600 dark:text-red-400' : 'text-purple-600 dark:text-purple-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
          </svg>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900 dark:text-white text-sm">Voter Info — {stateData.name}</h3>
          {nextElection.days > 0 && (
            <p className={`text-xs font-medium ${isElectionSoon ? 'text-red-600 dark:text-red-400' : 'text-purple-600 dark:text-purple-400'}`}>
              {nextElection.days} days until {nextElection.label} ({formatDateShort(nextElection.date)})
            </p>
          )}
        </div>
      </div>

      {isElectionSoon && (
        <div className="mb-3 p-2 bg-red-100 dark:bg-red-900/40 rounded-lg">
          <p className="text-xs font-semibold text-red-800 dark:text-red-200 text-center">
            Election coming up! Make sure you&apos;re registered.
          </p>
        </div>
      )}

      <div className="flex gap-2 mb-3">
        <a
          href={stateData.checkRegistration}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center px-3 py-2 border border-purple-600 dark:border-purple-400 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-xs font-medium rounded-lg transition-colors"
        >
          Check Registration
        </a>
        <a
          href={stateData.electionOfficeDirectory}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 text-center px-3 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-xs font-medium rounded-lg transition-colors"
        >
          Election Office
        </a>
      </div>

      <Link
        href="/vote"
        className="block w-full text-center px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
      >
        View Full Voting Guide
      </Link>
    </div>
  );
}
