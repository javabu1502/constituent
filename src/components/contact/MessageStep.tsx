'use client';

import { useEffect, useState } from 'react';
import type { ContactState, ContactAction, OfficialMessage } from './ContactFlow';
import { Button } from '@/components/ui/Button';
import { PHONE_TIPS } from '@/lib/phone-tips';
import { useTurnstile } from '@/components/ui/Turnstile';

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
  const [feedback, setFeedback] = useState<Record<string, 'positive' | 'negative'>>({});
  const { getToken, TurnstileWidget } = useTurnstile();

  const currentRep = selectedReps[reviewIndex];
  const currentMessage = currentRep ? messages[currentRep.name] : null;

  const generateMessages = async () => {
    setIsGenerating(true);
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const turnstileToken = await getToken();
      const response = await fetch('/api/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officials: selectedReps.map(o => ({
            name: o.name,
            lastName: o.lastName,
            stafferFirstName: o.stafferFirstName,
            bioguideId: o.level === 'federal' ? o.id : undefined,
            title: o.title,
            party: o.party,
            state: o.state,
            level: o.level,
            district: o.district,
          })),
          issue: issue.trim(),
          issueCategory: state.issueCategory || undefined,
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
          tone: state.tone,
          turnstileToken: turnstileToken || undefined,
        }),
      });

      if (!response.ok) {
        // Non-OK response: try to parse JSON error
        const data = await response.json().catch(() => ({ error: 'Failed to generate messages' }));
        throw new Error(data.error || 'Failed to generate messages');
      }

      // SSE stream consumption
      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const msg = JSON.parse(data) as { officialName: string; subject: string; body: string };
            dispatch({
              type: 'SET_MESSAGE',
              payload: { officialName: msg.officialName, message: { subject: msg.subject, body: msg.body } },
            });
          } catch {
            // Skip malformed lines
          }
        }
      }
    } catch (err) {
      console.error('Error generating messages:', err);
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to generate messages' });
    } finally {
      setIsGenerating(false);
    }
  };

  const regenerateSingle = async (rep: typeof selectedReps[0]) => {
    dispatch({ type: 'SET_LOADING_ID', payload: { officialId: rep.name, loading: true } });
    dispatch({ type: 'SET_ERROR', payload: null });

    try {
      const turnstileToken = await getToken();
      const response = await fetch('/api/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officials: [{
            name: rep.name,
            lastName: rep.lastName,
            stafferFirstName: rep.stafferFirstName,
            bioguideId: rep.level === 'federal' ? rep.id : undefined,
            title: rep.title,
            party: rep.party,
            state: rep.state,
            level: rep.level,
            district: rep.district,
          }],
          issue: issue.trim(),
          issueCategory: state.issueCategory || undefined,
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
          tone: state.tone,
          turnstileToken: turnstileToken || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Failed to regenerate message' }));
        throw new Error(data.error || 'Failed to regenerate message');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('No response stream');

      const decoder = new TextDecoder();
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() || '';

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue;
          const data = line.slice(6).trim();
          if (data === '[DONE]') continue;

          try {
            const msg = JSON.parse(data) as { officialName: string; subject: string; body: string };
            dispatch({
              type: 'SET_MESSAGE',
              payload: { officialName: msg.officialName, message: { subject: msg.subject, body: msg.body } },
            });
          } catch {
            // Skip malformed lines
          }
        }
      }
    } catch (err) {
      console.error('Error regenerating message:', err);
      dispatch({ type: 'SET_ERROR', payload: err instanceof Error ? err.message : 'Failed to regenerate message' });
    } finally {
      dispatch({ type: 'SET_LOADING_ID', payload: { officialId: rep.name, loading: false } });
      // Clear feedback for this rep since the message changed
      setFeedback(prev => {
        const next = { ...prev };
        delete next[rep.name];
        return next;
      });
    }
  };

  const computeMessageHash = (party: string, issueCategory: string, tone: string): string => {
    const str = `${party}|${issueCategory}|${tone}`;
    let hash = 5381;
    for (let i = 0; i < str.length; i++) {
      hash = ((hash << 5) + hash + str.charCodeAt(i)) & 0xffffffff;
    }
    return Math.abs(hash).toString(36);
  };

  const submitFeedback = (rep: typeof selectedReps[0], rating: 'positive' | 'negative') => {
    setFeedback(prev => ({ ...prev, [rep.name]: rating }));
    fetch('/api/message-feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        messageHash: computeMessageHash(rep.party, state.issueCategory || '', state.tone),
        officialName: rep.name,
        officialParty: rep.party,
        issueCategory: state.issueCategory || undefined,
        tone: state.tone,
        contactMethod,
        rating,
      }),
    }).catch(() => {
      // Fire-and-forget — don't block the user
    });
  };

  // Generate messages on mount if not already present
  useEffect(() => {
    const repsNeedingMessages = selectedReps.filter(rep => !messages[rep.name]);
    if (repsNeedingMessages.length === 0) return;
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

  const loadedCount = Object.keys(messages).filter(name =>
    selectedReps.some(rep => rep.name === name)
  ).length;

  // Show full-screen spinner only when generating AND no messages have arrived yet
  if (isGenerating && loadedCount === 0) {
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
            ? `${contactMethod === 'phone' ? 'Script' : 'Message'} ${reviewIndex + 1} of ${selectedReps.length} - edit as needed`
            : 'Edit as needed, then continue'}
        </p>
      </div>

      {isGenerating && loadedCount > 0 && (
        <div className="mb-4 p-3 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-xl">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 border-2 border-purple-200 dark:border-purple-700 rounded-full animate-spin border-t-purple-600" />
            <p className="text-sm text-purple-700 dark:text-purple-300">
              {loadedCount} of {selectedReps.length} {contactMethod === 'phone' ? 'scripts' : 'messages'} ready
            </p>
          </div>
        </div>
      )}

      {state.error && (
        <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
          <div className="flex items-center justify-between gap-3">
            <p className="text-sm text-red-700 dark:text-red-300">{state.error}</p>
            {Object.keys(messages).length < selectedReps.length && (
              <button
                onClick={generateMessages}
                className="shrink-0 px-3 py-1.5 text-sm font-medium text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/50 hover:bg-red-200 dark:hover:bg-red-900/70 rounded-lg transition-colors"
              >
                Try Again
              </button>
            )}
          </div>
        </div>
      )}

      {/* Official tabs */}
      {selectedReps.length > 1 && (
        <div className="relative mb-4">
        <div className="flex gap-1 overflow-x-auto pb-3 -mx-2 px-2">
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
                {state.loadingIds.has(rep.name) ? (
                  <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-500 rounded-full animate-spin border-t-purple-600" />
                ) : hasMessage ? (
                  <svg className="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                ) : isGenerating ? (
                  <div className="w-4 h-4 border-2 border-gray-300 dark:border-gray-500 rounded-full animate-spin border-t-purple-600" />
                ) : null}
              </button>
            );
          })}
        </div>
        <div className="pointer-events-none absolute right-0 top-0 bottom-3 w-8 bg-gradient-to-l from-white dark:from-gray-800 to-transparent sm:hidden" />
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
              rows={contactMethod === 'phone' ? 6 : 8}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none font-mono text-sm leading-relaxed bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {/* Regenerate + Feedback row */}
            <div className="flex items-center justify-between mt-2">
              {/* Feedback */}
              <div className="flex items-center gap-1">
                {currentRep && feedback[currentRep.name] ? (
                  <span className="text-xs text-gray-500 dark:text-gray-400">Thanks!</span>
                ) : currentRep ? (
                  <>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mr-1">Helpful?</span>
                    <button
                      onClick={() => currentRep && submitFeedback(currentRep, 'positive')}
                      className="p-1 text-gray-400 hover:text-green-600 dark:hover:text-green-400 transition-colors"
                      title="Yes, helpful"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 20m7-10V5a2 2 0 00-2-2h-.095c-.5 0-.905.405-.905.905 0 .714-.211 1.412-.608 2.006L7 11v9m7-10h-2M7 20H5a2 2 0 01-2-2v-6a2 2 0 012-2h2.5" />
                      </svg>
                    </button>
                    <button
                      onClick={() => currentRep && submitFeedback(currentRep, 'negative')}
                      className="p-1 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                      title="No, not helpful"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.736 3h4.018c.163 0 .326.02.485.06L17 4m-7 10v2a3.5 3.5 0 003.5 3.5h.095a.905.905 0 00.905-.905c0-.714.211-1.412.608-2.006L17 13V4m-7 10h2m5-6h2a2 2 0 012 2v6a2 2 0 01-2 2h-2.5" />
                      </svg>
                    </button>
                  </>
                ) : null}
              </div>
              {/* Regenerate */}
              {currentRep && (
                <button
                  onClick={() => regenerateSingle(currentRep)}
                  disabled={state.loadingIds.has(currentRep.name)}
                  className="flex items-center gap-1 text-sm font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {state.loadingIds.has(currentRep.name) ? (
                    <div className="w-4 h-4 border-2 border-purple-200 dark:border-purple-700 rounded-full animate-spin border-t-purple-600" />
                  ) : (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                  )}
                  Regenerate
                </button>
              )}
            </div>
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
      <TurnstileWidget />
    </div>
  );
}
