'use client';

import { useReducer, useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import type { Official, Address } from '@/lib/types';
import { AddressStep } from './AddressStep';
import { RepStep } from './RepStep';
import { MethodStep } from './MethodStep';
import { TopicStep } from './TopicStep';
import { MessageStep } from './MessageStep';
import { SendStep } from './SendStep';

// Per-official message
export interface OfficialMessage {
  subject: string;
  body: string;
}

// State shape
export interface ContactState {
  step: 'address' | 'representative' | 'method' | 'topic' | 'message' | 'send' | 'success';
  address: Address | null;
  officials: Official[];
  selectedReps: Official[];
  contactMethod: 'email' | 'phone';
  // Topic form fields
  userName: string;
  userEmail: string;
  issue: string;
  issueCategory: string;
  ask: string;
  personalWhy: string;
  // Per-official messages keyed by official name (like PoliAct)
  messages: Record<string, OfficialMessage>;
  // Per-official loading states
  loadingIds: Set<string>;
  isLoading: boolean;
  error: string | null;
}

// Action types
type ContactAction =
  | { type: 'SET_ADDRESS'; payload: Address }
  | { type: 'SET_OFFICIALS'; payload: Official[] }
  | { type: 'SELECT_REPS'; payload: Official[] }
  | { type: 'TOGGLE_REP'; payload: Official }
  | { type: 'SELECT_ALL_REPS' }
  | { type: 'SET_CONTACT_METHOD'; payload: 'email' | 'phone' }
  | { type: 'SET_USER_NAME'; payload: string }
  | { type: 'SET_USER_EMAIL'; payload: string }
  | { type: 'SET_ISSUE'; payload: { issue: string; category: string } }
  | { type: 'SET_ASK'; payload: string }
  | { type: 'SET_PERSONAL_WHY'; payload: string }
  | { type: 'SET_MESSAGE'; payload: { officialName: string; message: OfficialMessage } }
  | { type: 'SET_MESSAGES'; payload: Record<string, OfficialMessage> }
  | { type: 'UPDATE_MESSAGE'; payload: { officialName: string; field: 'subject' | 'body'; value: string } }
  | { type: 'SET_LOADING_ID'; payload: { officialId: string; loading: boolean } }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'GO_TO_STEP'; payload: ContactState['step'] }
  | { type: 'RESET' };

const initialState: ContactState = {
  step: 'address',
  address: null,
  officials: [],
  selectedReps: [],
  contactMethod: 'email',
  userName: '',
  userEmail: '',
  issue: '',
  issueCategory: '',
  ask: '',
  personalWhy: '',
  messages: {},
  loadingIds: new Set(),
  isLoading: false,
  error: null,
};

function contactReducer(state: ContactState, action: ContactAction): ContactState {
  switch (action.type) {
    case 'SET_ADDRESS':
      return { ...state, address: action.payload, error: null };
    case 'SET_OFFICIALS':
      return { ...state, officials: action.payload };
    case 'SELECT_REPS':
      return { ...state, selectedReps: action.payload };
    case 'TOGGLE_REP': {
      const rep = action.payload;
      const isSelected = state.selectedReps.some(r => r.id === rep.id);
      const selectedReps = isSelected
        ? state.selectedReps.filter(r => r.id !== rep.id)
        : [...state.selectedReps, rep];
      return { ...state, selectedReps };
    }
    case 'SELECT_ALL_REPS':
      return { ...state, selectedReps: [...state.officials] };
    case 'SET_CONTACT_METHOD':
      return { ...state, contactMethod: action.payload };
    case 'SET_USER_NAME':
      return { ...state, userName: action.payload };
    case 'SET_USER_EMAIL':
      return { ...state, userEmail: action.payload };
    case 'SET_ISSUE':
      return { ...state, issue: action.payload.issue, issueCategory: action.payload.category };
    case 'SET_ASK':
      return { ...state, ask: action.payload };
    case 'SET_PERSONAL_WHY':
      return { ...state, personalWhy: action.payload };
    case 'SET_MESSAGE':
      return {
        ...state,
        messages: {
          ...state.messages,
          [action.payload.officialName]: action.payload.message,
        },
      };
    case 'SET_MESSAGES':
      return { ...state, messages: action.payload };
    case 'UPDATE_MESSAGE': {
      const { officialName, field, value } = action.payload;
      const existing = state.messages[officialName] || { subject: '', body: '' };
      return {
        ...state,
        messages: {
          ...state.messages,
          [officialName]: { ...existing, [field]: value },
        },
      };
    }
    case 'SET_LOADING_ID': {
      const newLoadingIds = new Set(state.loadingIds);
      if (action.payload.loading) {
        newLoadingIds.add(action.payload.officialId);
      } else {
        newLoadingIds.delete(action.payload.officialId);
      }
      return { ...state, loadingIds: newLoadingIds };
    }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    case 'SET_ERROR':
      return { ...state, error: action.payload };
    case 'GO_TO_STEP':
      return { ...state, step: action.payload, error: null };
    case 'RESET':
      return initialState;
    default:
      return state;
  }
}

const STEPS = ['address', 'representative', 'method', 'topic', 'message', 'send'] as const;
const STEP_LABELS: Record<string, string> = {
  address: 'Address',
  representative: 'Representatives',
  method: 'Method',
  topic: 'Your Message',
  message: 'Review',
  send: 'Send',
  success: 'Done',
};

export function ContactFlow() {
  const [state, dispatch] = useReducer(contactReducer, initialState);
  const searchParams = useSearchParams();
  const profileLoaded = useRef(false);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

  // Auto-fill from user profile and handle repId deep-linking
  useEffect(() => {
    if (profileLoaded.current) return;
    profileLoaded.current = true;

    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      setIsAuthenticated(!!user);
      if (!user) return;

      if (user.email) {
        dispatch({ type: 'SET_USER_EMAIL', payload: user.email });
      }
      if (user.user_metadata?.full_name) {
        dispatch({ type: 'SET_USER_NAME', payload: user.user_metadata.full_name });
      }

      // Try to load profile for address skip
      fetch('/api/profile')
        .then((res) => (res.ok ? res.json() : null))
        .then((profile) => {
          if (!profile?.street || !profile?.city || !profile?.state || !profile?.zip) return;

          // Set address from profile
          const address: Address = {
            street: profile.street,
            city: profile.city,
            state: profile.state,
            zip: profile.zip,
          };
          dispatch({ type: 'SET_ADDRESS', payload: address });

          // Set cached reps if available
          const reps: Official[] | null = profile.representatives;
          if (reps && reps.length > 0) {
            dispatch({ type: 'SET_OFFICIALS', payload: reps });

            // Check for repId deep-link
            const repId = searchParams.get('repId');
            if (repId) {
              const matchedRep = reps.find((r) => r.id === repId);
              if (matchedRep) {
                dispatch({ type: 'SELECT_REPS', payload: [matchedRep] });
                dispatch({ type: 'GO_TO_STEP', payload: 'method' });
                return;
              }
            }

            // No repId — skip to rep selection step
            dispatch({ type: 'GO_TO_STEP', payload: 'representative' });
          } else {
            // Has address but no cached reps — fetch them and skip
            fetch('/api/profile/representatives', { method: 'POST' })
              .then((res) => (res.ok ? res.json() : null))
              .then((data) => {
                if (data?.officials?.length) {
                  dispatch({ type: 'SET_OFFICIALS', payload: data.officials });

                  const repId = searchParams.get('repId');
                  if (repId) {
                    const matchedRep = data.officials.find((r: Official) => r.id === repId);
                    if (matchedRep) {
                      dispatch({ type: 'SELECT_REPS', payload: [matchedRep] });
                      dispatch({ type: 'GO_TO_STEP', payload: 'method' });
                      return;
                    }
                  }

                  dispatch({ type: 'GO_TO_STEP', payload: 'representative' });
                }
              })
              .catch(() => {});
          }
        })
        .catch(() => {});
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const currentStepIndex = STEPS.indexOf(state.step as typeof STEPS[number]);

  const goToStep = useCallback((step: ContactState['step']) => {
    dispatch({ type: 'GO_TO_STEP', payload: step });
  }, []);

  const goBack = useCallback(() => {
    const prevIndex = currentStepIndex - 1;
    if (prevIndex >= 0) {
      goToStep(STEPS[prevIndex]);
    }
  }, [currentStepIndex, goToStep]);

  // Success screen
  if (state.step === 'success') {
    return (
      <div className="w-full max-w-2xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden p-8">
          <div className="text-center">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thank You!</h3>
            <p className="text-gray-600 dark:text-gray-300 mb-6">
              Your voice matters. Every message counts toward making a difference.
            </p>
            <div className="p-4 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-xl mb-6">
              <p className="text-sm text-purple-800 dark:text-purple-200">
                Contacted <strong>{state.selectedReps.length} representative{state.selectedReps.length > 1 ? 's' : ''}</strong> about <strong>{state.issue}</strong>
              </p>
            </div>
            <button
              onClick={() => dispatch({ type: 'RESET' })}
              className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
            >
              Start Over
            </button>
            {isAuthenticated && (
              <Link
                href={`/campaign/create?issue=${encodeURIComponent(state.issue)}&category=${encodeURIComponent(state.issueCategory)}&ask=${encodeURIComponent(state.ask)}`}
                className="block w-full mt-3 py-3 text-center border-2 border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg font-medium transition-colors"
              >
                Turn This Into a Campaign
              </Link>
            )}
            {isAuthenticated === false && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl">
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                  Want to track your messages and see your representatives?
                </p>
                <Link
                  href="/signup"
                  className="block w-full py-2.5 text-center border-2 border-purple-600 text-purple-600 dark:text-purple-400 dark:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg text-sm font-medium transition-colors"
                >
                  Create a Free Account
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="mb-8 px-4">
        {/* Step counter */}
        <div className="text-center mb-4">
          <span className="text-sm font-medium text-purple-600 dark:text-purple-400">
            Step {currentStepIndex + 1} of {STEPS.length}
          </span>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mt-1">
            {STEP_LABELS[state.step]}
          </h2>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-2">
          {STEPS.map((step, index) => (
            <div key={step} className="flex-1 flex items-center">
              <div
                className={`h-2 w-full rounded-full transition-colors ${
                  index < currentStepIndex
                    ? 'bg-purple-600'
                    : index === currentStepIndex
                    ? 'bg-purple-400'
                    : 'bg-gray-200 dark:bg-gray-700'
                }`}
              />
            </div>
          ))}
        </div>

        {/* Step dots */}
        <div className="flex justify-between mt-2 px-1">
          {STEPS.map((step, index) => (
            <div
              key={step}
              className={`flex flex-col items-center ${
                index <= currentStepIndex ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full border-2 ${
                  index < currentStepIndex
                    ? 'bg-purple-600 border-purple-600'
                    : index === currentStepIndex
                    ? 'bg-white dark:bg-gray-800 border-purple-600'
                    : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600'
                }`}
              />
              <span className="text-xs mt-1 hidden sm:block">
                {STEP_LABELS[step]}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Step content card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
        {state.step === 'address' && (
          <AddressStep state={state} dispatch={dispatch} />
        )}
        {state.step === 'representative' && (
          <RepStep state={state} dispatch={dispatch} onBack={goBack} />
        )}
        {state.step === 'method' && (
          <MethodStep state={state} dispatch={dispatch} onBack={goBack} />
        )}
        {state.step === 'topic' && (
          <TopicStep state={state} dispatch={dispatch} onBack={goBack} />
        )}
        {state.step === 'message' && (
          <MessageStep state={state} dispatch={dispatch} onBack={goBack} />
        )}
        {state.step === 'send' && (
          <SendStep state={state} dispatch={dispatch} onBack={goBack} />
        )}
      </div>

      {/* Privacy notice */}
      <div className="mt-6 px-4">
        <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
          <svg
            className="w-5 h-5 text-gray-400 dark:text-gray-500 flex-shrink-0 mt-0.5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
          <div>
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">Your Privacy Matters</h4>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Your address is used to find your representatives. Logged-in users can save their
              address for faster access. Messages are sent directly from your device.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

// Export types for use in step components
export type { ContactAction };
