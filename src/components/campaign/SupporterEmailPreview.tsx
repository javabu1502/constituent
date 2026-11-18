'use client';

import { useState } from 'react';

interface Preview {
  subject: string;
  html: string;
  audience: { eligible: number; suppressed: number; testData: number; willSend: number };
}

/**
 * Read the email before sending it, and see where it goes.
 *
 * An organisation ticking "email everyone who already acted" was mailing its
 * whole supporter list without being able to read the message, know how many
 * people would get it, or say how it was delivered. That is a lot to ask on
 * trust, and the first question any of them asks is what it says.
 *
 * The body comes from the same template the sender renders, so what is shown
 * here is what arrives.
 */
export function SupporterEmailPreview({
  parentSlug,
  headline,
}: {
  parentSlug: string;
  headline: string;
}) {
  const [open, setOpen] = useState(false);
  const [data, setData] = useState<Preview | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const show = async () => {
    setOpen(true);
    if (data || loading) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `/api/campaigns/${parentSlug}/update-preview?headline=${encodeURIComponent(headline || '')}`
      );
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || 'Could not build the preview');
      setData(body as Preview);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not build the preview');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button
        type="button"
        onClick={show}
        className="text-xs font-semibold text-purple-700 dark:text-purple-300 hover:underline"
      >
        Preview the email
      </button>

      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setOpen(false)}>
          <div
            className="bg-surface dark:bg-gray-800 rounded-xl border border-rule dark:border-gray-700 max-w-2xl w-full max-h-[85vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-4 p-5 border-b border-rule dark:border-gray-700">
              <h3 className="text-base font-semibold text-gray-900 dark:text-white">The email supporters receive</h3>
              <button
                type="button"
                onClick={() => setOpen(false)}
                aria-label="Close preview"
                className="text-gray-400 hover:text-gray-900 dark:hover:text-white"
              >
                &times;
              </button>
            </div>

            <div className="p-5">
              {loading && <p className="text-sm text-gray-500 dark:text-gray-400">Building the preview…</p>}
              {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

              {data && (
                <>
                  <dl className="mb-4 grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 text-sm">
                    <dt className="text-gray-500 dark:text-gray-400">From</dt>
                    <dd className="text-gray-900 dark:text-white">My Democracy, on your behalf</dd>
                    <dt className="text-gray-500 dark:text-gray-400">Subject</dt>
                    <dd className="text-gray-900 dark:text-white font-medium">{data.subject}</dd>
                  </dl>

                  <div className="rounded-lg border border-rule dark:border-gray-700 bg-white overflow-hidden">
                    <div dangerouslySetInnerHTML={{ __html: data.html }} />
                  </div>

                  <div className="mt-5 rounded-lg border border-rule dark:border-gray-700 bg-gray-50 dark:bg-gray-900/40 p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-gray-400 dark:text-gray-500 mb-2">
                      Who receives it
                    </p>
                    <ul className="space-y-1 text-sm text-gray-700 dark:text-gray-300">
                      <li>
                        <strong className="font-semibold text-gray-900 dark:text-white">{data.audience.willSend}</strong>{' '}
                        people, each a separate email addressed to them.
                      </li>
                      {data.audience.suppressed > 0 && (
                        <li>{data.audience.suppressed} skipped, having unsubscribed from campaign updates.</li>
                      )}
                      {data.audience.testData > 0 && (
                        <li>{data.audience.testData} skipped as test or demo addresses.</li>
                      )}
                    </ul>
                    <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
                      Sent through Resend from a My Democracy address, so a reply reaches us rather than you. Each one
                      carries its own one-click unsubscribe, which records a suppression and applies to every later
                      update from any of your campaigns.
                    </p>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
