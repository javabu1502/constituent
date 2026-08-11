'use client';

import { useState } from 'react';
import type { CampaignInsights } from '@/lib/insights';

/**
 * "What constituents are saying" — AI-themed insights for the campaign owner.
 * Reads a cached snapshot (passed from the server) and lets the owner generate
 * or refresh it on demand (one LLM pass, owner-only route). Neutral themes +
 * de-identified representative quotes; competitors' template tools can't do this.
 */
export function CampaignInsightsPanel({
  slug,
  initial,
  initialStale,
  kind,
}: {
  slug: string;
  initial: CampaignInsights | null;
  initialStale: boolean;
  kind: 'stories' | 'messages';
}) {
  const [insights, setInsights] = useState<CampaignInsights | null>(initial);
  const [stale, setStale] = useState(initialStale);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const noun = kind === 'stories' ? 'stories' : 'messages';

  async function generate() {
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch(`/api/campaigns/${slug}/insights`, { method: 'POST' });
      const data = (await res.json()) as { insights: CampaignInsights | null; reason?: string };
      if (data.insights) {
        setInsights(data.insights);
        setStale(false);
      } else {
        setNotice(data.reason ?? 'Not enough submissions yet to generate insights.');
      }
    } catch {
      setNotice('Could not generate insights right now. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6 p-5 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="flex items-start justify-between gap-3 mb-3">
        <div>
          <h4 className="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            What constituents are saying
            <span className="text-[10px] font-semibold uppercase tracking-wide px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 dark:bg-purple-900/40 dark:text-purple-300">
              AI
            </span>
          </h4>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Neutral themes drawn from your {noun}. Summarized, de-identified, and faithful to what people wrote.
          </p>
        </div>
        <button
          type="button"
          onClick={generate}
          disabled={loading}
          className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white transition-colors"
        >
          {loading ? 'Analyzing…' : insights ? 'Refresh' : 'Generate insights'}
        </button>
      </div>

      {insights && stale && !loading && (
        <p className="text-[11px] text-amber-600 dark:text-amber-400 mb-2">
          New {noun} have come in since this was generated — refresh for an up-to-date read.
        </p>
      )}

      {notice && <p className="text-sm text-gray-600 dark:text-gray-400">{notice}</p>}

      {!insights && !notice && (
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Generate a themed summary of what your constituents are sharing — the top themes, a representative quote for
          each, and an overall read you can use.
        </p>
      )}

      {insights && (
        <div className="space-y-4">
          <p className="text-sm text-gray-700 dark:text-gray-300">{insights.summary}</p>
          <div className="space-y-3">
            {insights.themes.map((t, i) => (
              <div key={i} className="border-l-2 border-purple-300 dark:border-purple-700 pl-3">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-gray-900 dark:text-white">{t.label}</span>
                  {t.prevalence > 0 && (
                    <span className="text-xs text-gray-500 dark:text-gray-400 shrink-0">
                      ~{t.prevalence} of {insights.sourceCount}
                    </span>
                  )}
                </div>
                {t.quote && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 italic mt-0.5">&ldquo;{t.quote}&rdquo;</p>
                )}
                {t.quotes && t.quotes.length > 0 && (
                  <details className="mt-1.5">
                    <summary className="text-xs font-medium text-purple-600 dark:text-purple-400 cursor-pointer select-none">
                      See {t.quotes.length} more direct quote{t.quotes.length !== 1 ? 's' : ''}
                    </summary>
                    <ul className="mt-2 space-y-2">
                      {t.quotes.map((q, qi) => (
                        <li key={qi} className="flex items-start justify-between gap-2 text-sm text-gray-600 dark:text-gray-400 italic bg-gray-50 dark:bg-gray-700/40 rounded-lg px-3 py-2">
                          <span>&ldquo;{q}&rdquo;</span>
                          <button
                            type="button"
                            onClick={() => navigator.clipboard.writeText(`"${q}"`)}
                            className="shrink-0 not-italic text-[11px] font-medium text-purple-600 dark:text-purple-400 hover:underline"
                            title="Copy quote"
                          >
                            Copy
                          </button>
                        </li>
                      ))}
                    </ul>
                  </details>
                )}
              </div>
            ))}
          </div>
          <p className="text-[11px] text-gray-400 dark:text-gray-500">
            Based on {insights.sourceCount} {noun}. AI-generated summary — spot-check against the full {noun} before quoting publicly.
          </p>
        </div>
      )}
    </div>
  );
}
