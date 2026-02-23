'use client';

import type { ContactState, ContactAction } from './ContactFlow';
import { Button } from '@/components/ui/Button';

interface MethodStepProps {
  state: ContactState;
  dispatch: React.Dispatch<ContactAction>;
  onBack: () => void;
}

export function MethodStep({ dispatch, onBack }: MethodStepProps) {
  const handleSelectEmail = () => {
    dispatch({ type: 'SET_CONTACT_METHOD', payload: 'email' });
    dispatch({ type: 'GO_TO_STEP', payload: 'topic' });
  };

  const handleSelectPhone = () => {
    dispatch({ type: 'SET_CONTACT_METHOD', payload: 'phone' });
    dispatch({ type: 'GO_TO_STEP', payload: 'topic' });
  };

  return (
    <div className="p-6 sm:p-8">
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-4">
          <svg
            className="w-8 h-8 text-purple-600 dark:text-purple-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          How Do You Want to Reach Out?
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-2 text-sm max-w-sm mx-auto">
          Choose your preferred contact method
        </p>
      </div>

      <div className="space-y-4 mb-8">
        {/* Email Option */}
        <button
          onClick={handleSelectEmail}
          className="w-full p-5 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 transition-colors text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
              <svg className="w-7 h-7 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-lg text-gray-900 dark:text-white">Send an Email</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">AI writes a formal letter for you</p>
            </div>
          </div>
        </button>

        {/* Phone Option */}
        <button
          onClick={handleSelectPhone}
          className="w-full p-5 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-purple-400 dark:hover:border-purple-500 transition-colors text-left group"
        >
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0 group-hover:bg-purple-200 dark:group-hover:bg-purple-800 transition-colors">
              <svg className="w-7 h-7 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-lg text-gray-900 dark:text-white">Make a Phone Call</p>
              <p className="text-sm text-gray-600 dark:text-gray-400">AI writes a phone script for you</p>
            </div>
          </div>
        </button>
      </div>

      <Button variant="secondary" onClick={onBack} className="w-full">
        Back
      </Button>
    </div>
  );
}
