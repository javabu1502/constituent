'use client';

import type { ContactState, ContactAction } from './ContactFlow';
import type { Official } from '@/lib/types';
import { Button } from '@/components/ui/Button';

interface RepStepProps {
  state: ContactState;
  dispatch: React.Dispatch<ContactAction>;
  onBack: () => void;
}

function getPartyColors(party: string): { bg: string; text: string; border: string } {
  const p = party.toLowerCase();
  if (p.includes('democrat')) {
    return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
  }
  if (p.includes('republican')) {
    return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
  }
  return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

function RepCard({
  rep,
  isSelected,
  onToggle,
}: {
  rep: Official;
  isSelected: boolean;
  onToggle: () => void;
}) {
  const partyColors = getPartyColors(rep.party);

  return (
    <button
      onClick={onToggle}
      className={`w-full p-4 rounded-xl border-2 transition-all text-left ${
        isSelected
          ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30'
          : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 hover:bg-gray-50 dark:hover:bg-gray-700'
      }`}
    >
      <div className="flex items-center gap-4">
        {/* Checkbox */}
        <div
          className={`w-6 h-6 rounded border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
            isSelected
              ? 'border-purple-600 bg-purple-600'
              : 'border-gray-300 dark:border-gray-500 bg-white dark:bg-gray-700'
          }`}
        >
          {isSelected && (
            <svg
              className="w-4 h-4 text-white"
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </div>

        {/* Photo or initials */}
        <div className="flex-shrink-0">
          {rep.photoUrl ? (
            <img
              src={rep.photoUrl}
              alt={rep.name}
              className="w-14 h-14 rounded-full object-cover border-2 border-gray-200 dark:border-gray-600"
            />
          ) : (
            <div
              className={`w-14 h-14 rounded-full flex items-center justify-center text-base font-bold ${partyColors.bg} ${partyColors.text}`}
            >
              {getInitials(rep.name)}
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-semibold text-gray-900 dark:text-white truncate">{rep.name}</h4>
            <span
              className={`px-2 py-0.5 text-xs font-medium rounded-full ${partyColors.bg} ${partyColors.text}`}
            >
              {rep.party.charAt(0)}
            </span>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
            {rep.title}
          </p>
        </div>
      </div>
    </button>
  );
}

export function RepStep({ state, dispatch, onBack }: RepStepProps) {
  const { officials, selectedReps } = state;

  // Group by level first, then by chamber
  const federalOfficials = officials.filter((r) => r.level === 'federal');
  const stateOfficials = officials.filter((r) => r.level === 'state');

  // Federal breakdown
  const senators = federalOfficials.filter((r) => r.chamber === 'senate');
  const houseReps = federalOfficials.filter((r) => r.chamber === 'house');

  // State breakdown
  const stateSenators = stateOfficials.filter((r) => r.chamber === 'upper');
  const stateReps = stateOfficials.filter((r) => r.chamber === 'lower');

  const isSelected = (rep: Official) => selectedReps.some(r => r.id === rep.id);
  const allSelected = officials.length > 0 && selectedReps.length === officials.length;

  const handleToggle = (rep: Official) => {
    dispatch({ type: 'TOGGLE_REP', payload: rep });
  };

  const handleSelectAll = () => {
    if (allSelected) {
      dispatch({ type: 'SELECT_REPS', payload: [] });
    } else {
      dispatch({ type: 'SELECT_ALL_REPS' });
    }
  };

  const handleContinue = () => {
    if (selectedReps.length === 0) {
      dispatch({ type: 'SET_ERROR', payload: 'Please select at least one representative' });
      return;
    }
    dispatch({ type: 'GO_TO_STEP', payload: 'method' });
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          Select Representatives
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm">
          Choose who you&apos;d like to contact. You can select multiple.
        </p>
      </div>

      {/* Select All / Deselect All */}
      <div className="flex justify-end mb-4">
        <button
          onClick={handleSelectAll}
          className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 transition-colors"
        >
          {allSelected ? 'Deselect All' : 'Select All'}
        </button>
      </div>

      <div className="space-y-6">
        {/* Federal Representatives Section */}
        {federalOfficials.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                <svg className="w-4 h-4 text-blue-700 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" />
                </svg>
              </div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                Federal Representatives ({federalOfficials.length})
              </h4>
            </div>

            <div className="space-y-4 pl-2 border-l-2 border-blue-200 dark:border-blue-700">
              {/* U.S. Senators */}
              {senators.length > 0 && (
                <div className="pl-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    U.S. Senators
                  </p>
                  <div className="space-y-2">
                    {senators.map((rep) => (
                      <RepCard
                        key={rep.id}
                        rep={rep}
                        isSelected={isSelected(rep)}
                        onToggle={() => handleToggle(rep)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* U.S. House Representative */}
              {houseReps.length > 0 && (
                <div className="pl-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    U.S. Representative
                  </p>
                  <div className="space-y-2">
                    {houseReps.map((rep) => (
                      <RepCard
                        key={rep.id}
                        rep={rep}
                        isSelected={isSelected(rep)}
                        onToggle={() => handleToggle(rep)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* State Legislators Section */}
        {stateOfficials.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center">
                <svg className="w-4 h-4 text-purple-700 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h4 className="text-base font-semibold text-gray-900 dark:text-white">
                State Legislators ({stateOfficials.length})
              </h4>
            </div>

            <div className="space-y-4 pl-2 border-l-2 border-purple-200 dark:border-purple-700">
              {/* State Senator */}
              {stateSenators.length > 0 && (
                <div className="pl-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    State Senator
                  </p>
                  <div className="space-y-2">
                    {stateSenators.map((rep) => (
                      <RepCard
                        key={rep.id}
                        rep={rep}
                        isSelected={isSelected(rep)}
                        onToggle={() => handleToggle(rep)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* State Representative */}
              {stateReps.length > 0 && (
                <div className="pl-4">
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-2">
                    State Representative
                  </p>
                  <div className="space-y-2">
                    {stateReps.map((rep) => (
                      <RepCard
                        key={rep.id}
                        rep={rep}
                        isSelected={isSelected(rep)}
                        onToggle={() => handleToggle(rep)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {state.error && (
        <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-700 dark:text-red-300">{state.error}</p>
        </div>
      )}

      <div className="flex gap-3 mt-8">
        <Button variant="secondary" onClick={onBack} className="flex-1">
          Back
        </Button>
        <Button
          onClick={handleContinue}
          disabled={selectedReps.length === 0}
          className="flex-1"
        >
          {selectedReps.length === 0
            ? 'Select Representatives'
            : `Continue with ${selectedReps.length} representative${selectedReps.length > 1 ? 's' : ''}`}
        </Button>
      </div>
    </div>
  );
}
