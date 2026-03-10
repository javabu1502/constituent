'use client';

import { useState } from 'react';

interface FollowUpModalProps {
  messageId: string;
  officialName: string;
  issueArea: string;
  deliveryMethod: string;
  senderName: string;
  onClose: () => void;
}

export function FollowUpModal({
  messageId,
  officialName,
  issueArea,
  deliveryMethod,
  senderName,
  onClose,
}: FollowUpModalProps) {
  const [followUpType, setFollowUpType] = useState<'no_response' | 'thank_you'>('no_response');
  const [additionalContext, setAdditionalContext] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<{ subject: string; body: string } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const generate = async () => {
    setIsGenerating(true);
    setError(null);
    setResult(null);

    try {
      const response = await fetch('/api/generate-follow-up', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          originalMessageId: messageId,
          followUpType,
          senderName,
          additionalContext: additionalContext.trim() || undefined,
        }),
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({ error: 'Failed to generate follow-up' }));
        throw new Error(data.error || 'Failed to generate follow-up');
      }

      const data = await response.json();
      setResult({ subject: data.subject, body: data.body });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate follow-up');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleCopy = async () => {
    if (!result) return;
    const text = result.subject ? `Subject: ${result.subject}\n\n${result.body}` : result.body;
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div
        className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Follow Up with {officialName}
            </h3>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Re: {issueArea} ({deliveryMethod})
          </p>

          {!result ? (
            <>
              {/* Follow-up type radio */}
              <div className="space-y-2 mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Follow-up type
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <input
                    type="radio"
                    name="followUpType"
                    checked={followUpType === 'no_response'}
                    onChange={() => setFollowUpType('no_response')}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">No Response Received</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Follow up on unanswered message</p>
                  </div>
                </label>
                <label className="flex items-center gap-3 p-3 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <input
                    type="radio"
                    name="followUpType"
                    checked={followUpType === 'thank_you'}
                    onChange={() => setFollowUpType('thank_you')}
                    className="text-purple-600 focus:ring-purple-500"
                  />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Thank You / Response Received</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Thank them and stay engaged</p>
                  </div>
                </label>
              </div>

              {/* Additional context */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Additional context (optional)
                </label>
                <textarea
                  value={additionalContext}
                  onChange={(e) => setAdditionalContext(e.target.value)}
                  maxLength={1000}
                  rows={3}
                  placeholder="Any updates or new information to include..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                  <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
                </div>
              )}

              <button
                onClick={generate}
                disabled={isGenerating}
                className="w-full px-4 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                {isGenerating ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 rounded-full animate-spin border-t-white" />
                    Generating...
                  </>
                ) : (
                  'Generate Follow-Up'
                )}
              </button>
            </>
          ) : (
            <>
              {/* Result display */}
              {result.subject && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Subject</label>
                  <p className="text-sm font-medium text-gray-900 dark:text-white">{result.subject}</p>
                </div>
              )}
              <div className="mb-4">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  {deliveryMethod === 'phone' ? 'Script' : 'Message'}
                </label>
                <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm text-gray-900 dark:text-white whitespace-pre-wrap font-mono leading-relaxed max-h-60 overflow-y-auto">
                  {result.body}
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handleCopy}
                  className="flex-1 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white font-medium rounded-lg transition-colors text-sm"
                >
                  {copied ? 'Copied!' : 'Copy'}
                </button>
                <button
                  onClick={() => { setResult(null); setError(null); }}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 font-medium rounded-lg transition-colors text-sm"
                >
                  Regenerate
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
