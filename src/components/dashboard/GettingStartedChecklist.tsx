'use client';

import Link from 'next/link';

interface GettingStartedChecklistProps {
  hasAddress: boolean;
  hasReps: boolean;
  hasMessages: boolean;
}

const steps = [
  {
    key: 'address',
    title: 'Add your address',
    description: 'We use it to find your elected officials at every level of government.',
    doneText: 'Address saved',
    href: '/contact',
  },
  {
    key: 'reps',
    title: 'See your representatives',
    description: 'View who represents you in Congress and your state legislature.',
    doneText: 'Representatives found',
    href: null, // auto-done when address is added
  },
  {
    key: 'message',
    title: 'Send your first message',
    description: 'Pick a topic, and AI writes a personalized letter to your officials. You review before sending.',
    doneText: 'First message sent',
    href: '/contact',
  },
] as const;

export function GettingStartedChecklist({ hasAddress, hasReps, hasMessages }: GettingStartedChecklistProps) {
  const completedMap: Record<string, boolean> = {
    address: hasAddress,
    reps: hasReps,
    message: hasMessages,
  };

  const completedCount = Object.values(completedMap).filter(Boolean).length;
  const allDone = completedCount === steps.length;

  if (allDone) return null;

  return (
    <div className="mb-8 bg-gradient-to-br from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20 rounded-2xl border border-purple-200 dark:border-purple-800 p-6">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-10 h-10 bg-purple-600 rounded-full flex items-center justify-center flex-shrink-0">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">Get started in 3 steps</h2>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {completedCount} of {steps.length} complete
          </p>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full h-2 bg-purple-200 dark:bg-purple-800 rounded-full mt-4 mb-5">
        <div
          className="h-2 bg-purple-600 rounded-full transition-all duration-500"
          style={{ width: `${(completedCount / steps.length) * 100}%` }}
        />
      </div>

      <div className="space-y-3">
        {steps.map((step, i) => {
          const done = completedMap[step.key];
          const isNext = !done && steps.slice(0, i).every((s) => completedMap[s.key]);

          return (
            <div
              key={step.key}
              className={`flex items-start gap-3 p-4 rounded-xl transition-colors ${
                done
                  ? 'bg-white/60 dark:bg-gray-800/40'
                  : isNext
                  ? 'bg-white dark:bg-gray-800 shadow-sm border border-purple-200 dark:border-purple-700'
                  : 'bg-white/40 dark:bg-gray-800/20 opacity-60'
              }`}
            >
              {/* Step indicator */}
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                done
                  ? 'bg-green-100 dark:bg-green-900'
                  : isNext
                  ? 'bg-purple-100 dark:bg-purple-900'
                  : 'bg-gray-100 dark:bg-gray-700'
              }`}>
                {done ? (
                  <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className={`text-sm font-bold ${isNext ? 'text-purple-600 dark:text-purple-400' : 'text-gray-400 dark:text-gray-500'}`}>
                    {i + 1}
                  </span>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <p className={`font-semibold text-sm ${done ? 'text-green-700 dark:text-green-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                  {done ? step.doneText : step.title}
                </p>
                {!done && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {step.description}
                  </p>
                )}
              </div>

              {/* Action */}
              {isNext && step.href && (
                <Link
                  href={step.href}
                  className="px-4 py-2 text-xs font-medium bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors flex-shrink-0"
                >
                  {step.key === 'message' ? 'Write message' : 'Get started'}
                </Link>
              )}
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center">
        Most people complete all 3 steps in under 5 minutes.
      </p>
    </div>
  );
}
