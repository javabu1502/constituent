'use client';

import { useEffect, useState } from 'react';
import type { ContactState, ContactAction, OfficialMessage } from './ContactFlow';
import { Button } from '@/components/ui/Button';
import { PHONE_TIPS } from '@/lib/phone-tips';

interface MessageStepProps {
  state: ContactState;
  dispatch: React.Dispatch<ContactAction>;
  onBack: () => void;
}

function getPartyColors(party: string): { bg: string; text: string } {
  const p = party.toLowerCase();
  if (p.includes('democrat')) {
    return { bg: 'bg-blue-100', text: 'text-blue-700' };
  }
  if (p.includes('republican')) {
    return { bg: 'bg-red-100', text: 'text-red-700' };
  }
  return { bg: 'bg-gray-100', text: 'text-gray-700' };
}

export function MessageStep({ state, dispatch, onBack }: MessageStepProps) {
  const { selectedReps, userName, issue, ask, personalWhy, messages, contactMethod, address } = state;
  const [reviewIndex, setReviewIndex] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  const currentRep = selectedReps[reviewIndex];
  const currentMessage = currentRep ? messages[currentRep.name] : null;

  // Generate messages on mount if not already present
  useEffect(() => {
    const repsNeedingMessages = selectedReps.filter(rep => !messages[rep.name]);
    if (repsNeedingMessages.length === 0) return;

    const generateMessages = async () => {
      setIsGenerating(true);
      dispatch({ type: 'SET_ERROR', payload: null });

      try {
        const response = await fetch('/api/generate-message', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            officials: selectedReps.map(o => ({
              name: o.name,
              lastName: o.lastName,
              stafferFirstName: o.stafferFirstName,
              title: o.title,
              party: o.party,
              state: o.state,
            })),
            issue: issue.trim(),
            ask: ask.trim(),
            personalWhy: personalWhy.trim() || undefined,
            senderName: userName,
            address: address ? {
              street: address.street,
              city: address.city,
              state: address.state,
              zip: address.zip,
            } : undefined,
            contactMethod,
          }),
        });

        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error || 'Failed to generate messages');
        }

        // Store per-official messages keyed by name
        const msgMap: Record<string, OfficialMessage> = {};
        for (const msg of data.messages) {
          msgMap[msg.officialName] = { subject: msg.subject, body: msg.body };
        }
        dispatch({ type: 'SET_MESSAGES', payload: msgMap });
      } catch (err) {
        console.error('Error generating messages:', err);
        dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to generate messages' });
      } finally {
        setIsGenerating(false);
      }
    };

    generateMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const updateMessage = (officialName: string, field: 'subject' | 'body', value: string) => {
    dispatch({
      type: 'UPDATE_MESSAGE',
      payload: { officialName, field, value },
    });
  };

  const handleContinue = () => {
    // Check all messages have content
    for (const rep of selectedReps) {
      const msg = messages[rep.name];
      if (!msg?.body?.trim()) {
        dispatch({
          type: 'SET_ERROR',
          payload: `${contactMethod === 'phone' ? 'Script' : 'Message'} for ${rep.name} is empty`,
        });
        setReviewIndex(selectedReps.indexOf(rep));
        return;
      }
    }
    dispatch({ type: 'SET_ERROR', payload: null });
    dispatch({ type: 'GO_TO_STEP', payload: 'send' });
  };

  // Show loading state
  if (isGenerating) {
    const loadedCount = Object.keys(messages).length;

    return (
      <div className="p-6 sm:p-8">
        <div className="flex flex-col items-center justify-center py-16">
          <div className="relative">
            <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-800 rounded-full animate-spin border-t-purple-600"></div>
            <div className="absolute inset-0 flex items-center justify-center">
              <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
          </div>
          <p className="text-gray-600 dark:text-gray-300 mt-4 font-medium">
            {contactMethod === 'phone'
              ? `Writing ${selectedReps.length} script${selectedReps.length > 1 ? 's' : ''}...`
              : `Writing ${selectedReps.length} message${selectedReps.length > 1 ? 's' : ''}...`}
          </p>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
            {loadedCount} of {selectedReps.length} complete
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {contactMethod === 'phone' ? 'Review Scripts' : 'Review Messages'}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          {selectedReps.length > 1
            ? `${contactMethod === 'phone' ? 'Script' : 'Message'} ${reviewIndex + 1} of ${selectedReps.length} — edit as needed`
            : 'Edit as needed, then continue'}
        </p>
      </div>

      {state.error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-700 dark:text-red-300">{state.error}</p>
        </div>
      )}

      {/* Official tabs */}
      {selectedReps.length > 1 && (
        <div className="flex gap-1 overflow-x-auto pb-3 mb-4 -mx-2 px-2">
          {selectedReps.map((rep, i) => {
            const partyColors = getPartyColors(rep.party);
            const isActive = i === reviewIndex;
            const hasMessage = !!messages[rep.name];

            return (
              <button
                key={rep.id}
                onClick={() => setReviewIndex(i)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
                  isActive
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <span className={`w-5 h-5 rounded-full text-xs flex items-center justify-center ${
                  isActive ? 'bg-white/20' : partyColors.bg
                } ${isActive ? 'text-white' : partyColors.text}`}>
                  {rep.party.charAt(0)}
                </span>
                <span className="truncate max-w-[100px]">
                  {rep.lastName || rep.name.split(' ').pop()}
                </span>
                {hasMessage && (
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Current rep info */}
      {currentRep && (
        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-xl">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                getPartyColors(currentRep.party).bg
              } ${getPartyColors(currentRep.party).text}`}>
                {currentRep.name.split(' ').map(n => n[0]).join('').slice(0, 2)}
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white">{currentRep.name}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400">{currentRep.title}</p>
              </div>
            </div>
            <span className={`px-2 py-1 text-xs font-medium rounded-full ${
              getPartyColors(currentRep.party).bg
            } ${getPartyColors(currentRep.party).text}`}>
              {currentRep.party}
            </span>
          </div>
          {/* Staffer explanation for email */}
          {contactMethod === 'email' && currentRep.stafferFirstName && (
            <p className="mt-2 text-xs text-purple-700 dark:text-purple-300">
              Your message will be sent to {currentRep.stafferFirstName}{currentRep.stafferLastName ? ` ${currentRep.stafferLastName}` : ''}, staff for {currentRep.chamber === 'senate' ? 'Sen.' : 'Rep.'} {currentRep.lastName || currentRep.name.split(' ').pop()}&apos;s office.
            </p>
          )}
        </div>
      )}

      {/* Subject (email only) and Body/Script */}
      {currentMessage && (
        <>
          {contactMethod === 'email' && (
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Subject Line
              </label>
              <input
                type="text"
                value={currentMessage.subject}
                onChange={(e) => currentRep && updateMessage(currentRep.name, 'subject', e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          )}

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                {contactMethod === 'phone' ? 'Phone Script' : 'Message Body'}
              </label>
              <span className="text-xs text-gray-400 dark:text-gray-500">
                {currentMessage.body.trim().split(/\s+/).filter(Boolean).length} words
              </span>
            </div>
            <textarea
              value={currentMessage.body}
              onChange={(e) => currentRep && updateMessage(currentRep.name, 'body', e.target.value)}
              rows={contactMethod === 'phone' ? 8 : 10}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none font-mono text-sm leading-relaxed bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>
        </>
      )}

      {/* Phone tips inline (phone only) */}
      {contactMethod === 'phone' && (
        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-xl">
          <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2">Phone Call Tips</p>
          <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
            {PHONE_TIPS.map((tip, i) => (
              <li key={i} className="flex gap-2">
                <span className="flex-shrink-0">&bull;</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Bounce notice (email only) */}
      {contactMethod === 'email' && (
        <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-xl">
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            Note: Some congressional emails may bounce. If that happens, use the official&apos;s contact form on their website.
          </p>
        </div>
      )}

      {/* Navigation between officials */}
      {selectedReps.length > 1 && (
        <div className="flex items-center justify-between mb-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setReviewIndex(Math.max(0, reviewIndex - 1))}
            disabled={reviewIndex === 0}
            className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {reviewIndex + 1} of {selectedReps.length}
          </span>
          <button
            onClick={() => setReviewIndex(Math.min(selectedReps.length - 1, reviewIndex + 1))}
            disabled={reviewIndex === selectedReps.length - 1}
            className="text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 disabled:text-gray-300 dark:disabled:text-gray-600 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack} className="flex-1">
          Back
        </Button>
        {selectedReps.length > 1 && reviewIndex < selectedReps.length - 1 ? (
          <Button onClick={() => setReviewIndex(reviewIndex + 1)} className="flex-1">
            Next: {selectedReps[reviewIndex + 1]?.lastName || selectedReps[reviewIndex + 1]?.name.split(' ').pop()}
          </Button>
        ) : (
          <Button onClick={handleContinue} className="flex-1">
            {contactMethod === 'phone' ? 'Continue to Call' : 'Continue to Send'}
          </Button>
        )}
      </div>
    </div>
  );
}
