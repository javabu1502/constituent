'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { CLOSED_STATUS, OPEN_STATUS, setCampaignOpenState } from '@/lib/campaign-close';

/**
 * Close a campaign, or reopen it. Sits next to the delete button, because
 * closing is what an org almost always wants when a bill is done: the page
 * stops collecting and every story, consent record and whip position stays.
 *
 * Closing a parent closes its steps, so the dialog says how many before the
 * org confirms. Reopening brings back only this campaign.
 */
export function CloseCampaignButton({
  slug,
  headline,
  closed,
  stepCount = 0,
  isStory = false,
}: {
  slug: string;
  headline: string;
  closed: boolean;
  stepCount?: number;
  isStory?: boolean;
}) {
  const router = useRouter();
  const [showConfirm, setShowConfirm] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setIsSaving(true);
    setError(null);
    try {
      await setCampaignOpenState(slug, closed ? OPEN_STATUS : CLOSED_STATUS);
      setShowConfirm(false);
      setIsSaving(false);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong. Try again.');
      setIsSaving(false);
    }
  };

  const steps = stepCount === 1 ? '1 step' : `${stepCount} steps`;

  return (
    <>
      <button
        type="button"
        onClick={() => { setError(null); setShowConfirm(true); }}
        className="px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 text-sm font-medium rounded-lg transition-colors"
      >
        {closed ? 'Reopen' : 'Close'}
      </button>

      {showConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-xl max-w-sm w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white text-center mb-2">
              {closed ? 'Reopen Campaign' : 'Close Campaign'}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-3">
              {closed ? 'Reopen' : 'Close'} &ldquo;{headline}&rdquo;?
            </p>
            {closed ? (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                The campaign starts collecting again. The public page and the embed go back to
                showing the form.
                {stepCount > 0 ? ` Its ${steps} stay closed. Reopen each step you want collecting again.` : ''}
              </p>
            ) : (
              <p className="text-sm text-gray-600 dark:text-gray-400 text-center mb-6">
                {isStory
                  ? 'The campaign stops collecting stories.'
                  : 'The campaign stops collecting messages.'}{' '}
                The public page and the embed say it is closed and show your recorded outcome.
                Nothing is deleted, and you can reopen it.
                {stepCount > 0 ? ` This closes its ${steps} too.` : ''}
              </p>
            )}
            {error && (
              <p className="mb-4 p-2 text-sm rounded-lg bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-700 text-red-700 dark:text-red-300" role="alert">
                {error}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setShowConfirm(false)}
                disabled={isSaving}
                className="flex-1 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-sm font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={run}
                disabled={isSaving}
                className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 disabled:bg-purple-400 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {isSaving ? (closed ? 'Reopening...' : 'Closing...') : closed ? 'Reopen' : 'Close campaign'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
