'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { trackEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/Button';
import { IssuePicker } from '@/components/ui/IssuePicker';
import { US_STATES } from '@/lib/constants';
import { detectBillReferences } from '@/lib/bills';
import { STORY_USAGE_OPTIONS } from '@/lib/story-usage';

type BillLevel = '' | 'federal' | 'state';
interface ResolvedBill {
  level: 'federal' | 'state';
  state?: string;
  ref: string;
  title: string;
  url: string;
}

export function CampaignForm({ initialType }: { initialType?: 'advocacy' | 'storytelling' } = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [headline, setHeadline] = useState(searchParams.get('ask') || '');
  const [description, setDescription] = useState('');
  const [issueArea, setIssueArea] = useState(searchParams.get('issue') || '');
  const [issueCategory, setIssueCategory] = useState(searchParams.get('category') || '');
  const [targetLevel, setTargetLevel] = useState<'federal' | 'state' | 'both'>('federal');
  const [messageTemplate, setMessageTemplate] = useState('');
  const [distributionPlan, setDistributionPlan] = useState('');

  // Campaign type is fixed by the entry point (?type=advocacy|storytelling);
  // each type has its own track below. Advocacy campaigns are always public.
  // Fixed by the entry point. Prefer the server-provided prop (reliable on SSR);
  // fall back to the URL param so the component still works if used standalone.
  const [campaignType] = useState<'advocacy' | 'storytelling'>(
    initialType ?? (searchParams.get('type') === 'storytelling' ? 'storytelling' : 'advocacy')
  );
  const visibility: 'public' | 'unlisted' = 'public';

  // Storytelling fields
  const [storyPrompt, setStoryPrompt] = useState('');
  const [usageTags, setUsageTags] = useState<string[]>([]);
  const [editRevokePolicy, setEditRevokePolicy] = useState(
    'To change or withdraw your story later, contact the campaign organizer at the email where stories are sent (set below). If you created an account, you can also request this from your dashboard. Anything already shared or published may not be fully recallable.'
  );
  const [recipientEmail, setRecipientEmail] = useState('');

  // Optional related bill
  const [billLevel, setBillLevel] = useState<BillLevel>('');
  const [billState, setBillState] = useState('');
  const [billQuery, setBillQuery] = useState('');
  const [resolvedBill, setResolvedBill] = useState<ResolvedBill | null>(null);
  const [billStatus, setBillStatus] = useState<'idle' | 'resolving' | 'notfound' | 'error'>('idle');

  // Suggestion from headline/description text
  const [suggestion, setSuggestion] = useState<
    { detectedRaw: string; ref: string; level: 'federal' | 'state'; title?: string; url?: string; state?: string; needsState?: boolean } | null
  >(null);
  const [dismissedRefs, setDismissedRefs] = useState<Set<string>>(new Set());
  const resolveCache = useRef<Map<string, ResolvedBill | null>>(new Map());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  // Reset any prior resolution when the bill inputs change
  const resetBill = () => {
    setResolvedBill(null);
    setBillStatus('idle');
  };

  const resolveBill = async () => {
    const query = billQuery.trim();
    if (!billLevel || !query) return;
    if (billLevel === 'state' && !billState) {
      setBillStatus('error');
      return;
    }
    setBillStatus('resolving');
    setResolvedBill(null);
    try {
      const res = await fetch('/api/bills/resolve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          level: billLevel,
          state: billLevel === 'state' ? billState : undefined,
          query,
        }),
      });
      const data = await res.json();
      if (res.ok && data.found) {
        setResolvedBill({
          level: billLevel,
          state: data.state,
          ref: data.ref,
          title: data.title,
          url: data.url,
        });
        setBillStatus('idle');
      } else {
        setBillStatus('notfound');
      }
    } catch {
      setBillStatus('error');
    }
  };

  // Suggest a bill detected in the headline/description (debounced, cached).
  // Suggestion only — never sets a bill without an explicit "Use this" click.
  useEffect(() => {
    if (resolvedBill) { setSuggestion(null); return; }
    const refs = detectBillReferences(`${headline} ${description}`);
    if (refs.length === 0) { setSuggestion(null); return; }
    const ref = refs[0];
    if (dismissedRefs.has(ref.raw)) { setSuggestion(null); return; }

    const timer = setTimeout(async () => {
      // State bills can't be resolved without a chosen state
      if (ref.level === 'state' && !billState) {
        setSuggestion({ detectedRaw: ref.raw, ref: ref.raw, level: 'state', needsState: true });
        return;
      }
      const cacheKey = ref.level === 'state' ? `state:${billState}:${ref.raw}` : `fed:${ref.raw}`;
      let resolved = resolveCache.current.get(cacheKey);
      if (resolved === undefined) {
        try {
          const res = await fetch('/api/bills/resolve', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              level: ref.level,
              state: ref.level === 'state' ? billState : undefined,
              query: ref.raw,
            }),
          });
          const data = await res.json();
          resolved = res.ok && data.found
            ? { level: ref.level, state: data.state, ref: data.ref, title: data.title, url: data.url }
            : null;
        } catch {
          resolved = null;
        }
        resolveCache.current.set(cacheKey, resolved);
      }
      setSuggestion(
        resolved
          ? { detectedRaw: ref.raw, ref: resolved.ref, level: resolved.level, title: resolved.title, url: resolved.url, state: resolved.state }
          : null
      );
    }, 600);

    return () => clearTimeout(timer);
  }, [headline, description, billState, resolvedBill, dismissedRefs]);

  const useSuggestion = () => {
    if (!suggestion?.url || !suggestion.title) return;
    setBillLevel(suggestion.level);
    if (suggestion.level === 'state' && suggestion.state) setBillState(suggestion.state);
    setBillQuery(suggestion.ref);
    setResolvedBill({
      level: suggestion.level,
      state: suggestion.state,
      ref: suggestion.ref,
      title: suggestion.title,
      url: suggestion.url,
    });
    setBillStatus('idle');
    setSuggestion(null);
  };

  const dismissSuggestion = () => {
    if (suggestion) setDismissedRefs((prev) => new Set(prev).add(suggestion.detectedRaw));
    setSuggestion(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!headline.trim() || headline.trim().length < 3) {
      setError('Headline must be at least 3 characters');
      return;
    }
    if (!description.trim() || description.trim().length < 10) {
      setError('Description must be at least 10 characters');
      return;
    }
    if (campaignType === 'advocacy') {
      if (!issueArea.trim()) {
        setError('Please select an issue area');
        return;
      }
      if (!distributionPlan.trim() || distributionPlan.trim().length < 10) {
        setError('Please describe your distribution plan (at least 10 characters)');
        return;
      }
    } else {
      if (usageTags.length < 1) {
        setError('Select at least one way you’d like to use these stories');
        return;
      }
      if (!editRevokePolicy.trim() || editRevokePolicy.trim().length < 10) {
        setError('Please describe how storytellers can edit or revoke their story');
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const sharedBody = {
        campaign_type: campaignType,
        headline: headline.trim(),
        description: description.trim(),
        issue_area: issueCategory || issueArea,
        issue_subtopic: issueCategory ? issueArea : null,
      };
      const body = campaignType === 'advocacy'
        ? {
            ...sharedBody,
            visibility,
            target_level: targetLevel,
            message_template: messageTemplate.trim() || null,
            distribution_plan: distributionPlan.trim(),
            ...(resolvedBill
              ? {
                  bill_level: resolvedBill.level,
                  bill_state: resolvedBill.level === 'state' ? resolvedBill.state : undefined,
                  bill_ref: resolvedBill.ref,
                  bill_title: resolvedBill.title,
                  bill_url: resolvedBill.url,
                }
              : {}),
          }
        : {
            ...sharedBody,
            story_prompt: storyPrompt.trim() || null,
            usage_tags: usageTags,
            edit_revoke_policy: editRevokePolicy.trim(),
            recipient_email: recipientEmail.trim() || null,
          };

      const res = await fetch('/api/campaigns', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create campaign');
      }

      trackEvent('campaign_created', { issue: issueArea });
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign');
      setIsSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Campaign Submitted for Review</h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Your campaign has been submitted and is pending approval. We review campaigns to ensure quality and safety. You&apos;ll be able to see its status on your{' '}
          <Link href="/dashboard" className="text-purple-600 dark:text-purple-400 underline hover:text-purple-800 dark:hover:text-purple-200">dashboard</Link>.
        </p>
        <Button onClick={() => router.push('/dashboard')} variant="secondary">Go to Dashboard</Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="flex items-center gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl">
        <svg className="w-4 h-4 text-purple-600 dark:text-purple-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-sm text-purple-700 dark:text-purple-300">
          Campaigns are reviewed before going live. Strong campaigns have a clear ask, a defined audience, and a plan for getting the word out.
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Headline */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Campaign Headline <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={headline}
          onChange={(e) => setHeadline(e.target.value)}
          placeholder={campaignType === 'storytelling'
            ? 'e.g., Tell your story: how housing costs hit your family'
            : 'e.g., Protect our local parks funding'}
          maxLength={100}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{headline.length}/100 characters</p>
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={campaignType === 'storytelling'
            ? 'e.g., We’re collecting personal stories about how rising housing costs are affecting families in our community, to share with legislators and show why this issue matters.'
            : 'Explain the issue and why people should take action...'}
          rows={4}
          maxLength={500}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description.length}/500 characters</p>
      </div>

      {campaignType === 'advocacy' && (
        <>
      {/* Issue Area (advocacy only — storytelling uses the story prompt for its topic) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Issue Area <span className="text-red-500">*</span>
        </label>
        <IssuePicker
          value={issueArea}
          category={issueCategory}
          onChange={(issue, category) => {
            setIssueArea(issue);
            setIssueCategory(category);
          }}
        />
      </div>

      {/* Target Level */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Target Representatives <span className="text-red-500">*</span>
        </label>
        <div className="flex gap-3">
          {(['federal', 'state', 'both'] as const).map((level) => (
            <label
              key={level}
              className={`flex-1 text-center px-4 py-3 rounded-xl border-2 cursor-pointer transition-colors ${
                targetLevel === level
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="targetLevel"
                value={level}
                checked={targetLevel === level}
                onChange={() => setTargetLevel(level)}
                className="sr-only"
              />
              <span className="text-sm font-medium capitalize">{level === 'both' ? 'Both' : level}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Related Bill (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Related Bill <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
        </label>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
          Link a specific bill so participants&apos; letters reference it directly.
        </p>

        {suggestion && (
          <div className="mb-3 flex items-start gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
            <span aria-hidden="true">💡</span>
            <div className="flex-1">
              {suggestion.needsState ? (
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  Looks like you mentioned a bill (<span className="font-semibold">{suggestion.detectedRaw}</span>) — choose <strong>State</strong> below and pick its state, and we can link it.
                </p>
              ) : (
                <p className="text-sm text-blue-800 dark:text-blue-300">
                  We found a possible bill: <span className="font-semibold">{suggestion.ref}</span>{suggestion.title ? ` — ${suggestion.title}` : ''}.
                </p>
              )}
              <div className="mt-2 flex gap-2">
                {!suggestion.needsState && (
                  <button
                    type="button"
                    onClick={useSuggestion}
                    className="text-xs font-medium px-2.5 py-1 bg-purple-600 hover:bg-purple-700 text-white rounded-md"
                  >
                    Use this
                  </button>
                )}
                <button
                  type="button"
                  onClick={dismissSuggestion}
                  className="text-xs px-2.5 py-1 border border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-300 rounded-md hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  Dismiss
                </button>
              </div>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-3">
          {([['', 'None'], ['federal', 'Federal'], ['state', 'State']] as const).map(([val, lbl]) => (
            <label
              key={val || 'none'}
              className={`flex-1 text-center px-3 py-2 rounded-lg border-2 cursor-pointer text-sm font-medium transition-colors ${
                billLevel === val
                  ? 'border-purple-600 bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                  : 'border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400'
              }`}
            >
              <input
                type="radio"
                name="billLevel"
                value={val}
                checked={billLevel === val}
                onChange={() => { setBillLevel(val); setBillQuery(''); resetBill(); }}
                className="sr-only"
              />
              {lbl}
            </label>
          ))}
        </div>

        {billLevel && (
          <>
            <div className="flex gap-2">
              {billLevel === 'state' && (
                <select
                  value={billState}
                  onChange={(e) => { setBillState(e.target.value); resetBill(); }}
                  className="px-3 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                >
                  <option value="">State…</option>
                  {US_STATES.map((s) => (
                    <option key={s.code} value={s.code}>{s.code}</option>
                  ))}
                </select>
              )}
              <input
                type="text"
                value={billQuery}
                onChange={(e) => { setBillQuery(e.target.value); resetBill(); }}
                onBlur={resolveBill}
                placeholder={billLevel === 'federal' ? 'e.g., H.R. 22 or a congress.gov link' : 'e.g., AB 1234'}
                className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
              <Button type="button" variant="secondary" onClick={resolveBill} isLoading={billStatus === 'resolving'}>
                Look up
              </Button>
            </div>

            {resolvedBill && (
              <div className="mt-2 flex items-start gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800">
                <span className="text-green-600 dark:text-green-400">✓</span>
                <p className="text-sm text-green-800 dark:text-green-300">
                  <span className="font-semibold">{resolvedBill.ref}</span> — {resolvedBill.title}
                </p>
              </div>
            )}
            {billStatus === 'notfound' && (
              <p className="mt-2 text-sm text-amber-600 dark:text-amber-400">
                Couldn&apos;t find that bill. Check the number{billLevel === 'state' ? ' and state' : ''} and try again.
              </p>
            )}
            {billStatus === 'error' && (
              <p className="mt-2 text-sm text-red-600 dark:text-red-400">
                {billLevel === 'state' && !billState ? 'Pick a state first.' : 'Lookup failed — try again.'}
              </p>
            )}
            {billLevel === 'state' && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                State bills apply to a single state — this campaign will be scoped to {billState || 'that state'}.
              </p>
            )}
          </>
        )}
      </div>

      {/* Message Template (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Message Template <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
        </label>
        <textarea
          value={messageTemplate}
          onChange={(e) => setMessageTemplate(e.target.value)}
          placeholder="Provide talking points or a template for participants' messages..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          This message will be woven into every participant&apos;s personalized letter, combined with their own personal reasons for caring. The AI will make each letter unique.
        </p>
      </div>

      {/* Distribution Plan */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Distribution &amp; Engagement Plan <span className="text-red-500">*</span>
        </label>
        <textarea
          value={distributionPlan}
          onChange={(e) => setDistributionPlan(e.target.value)}
          placeholder="How will you get people involved? e.g., sharing in community groups, social media outreach, partnering with local organizations..."
          rows={4}
          maxLength={1000}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Campaigns with a clear outreach strategy are more likely to be approved. ({distributionPlan.length}/1000)
        </p>
      </div>

        </>
      )}

      {/* Storytelling fields */}
      {campaignType === 'storytelling' && (
        <>
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
            <p className="text-sm text-blue-800 dark:text-blue-300">
              Storytelling campaigns are <strong>shared by link only</strong> — they never appear in the public directory.
              Supporters answer a few guided questions to shape their story, then email it to you.
            </p>
          </div>

          {/* Story prompt */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Story Prompt <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
            </label>
            <textarea
              value={storyPrompt}
              onChange={(e) => setStoryPrompt(e.target.value)}
              placeholder="What kind of story are you asking for? e.g., How has the cost of housing affected your family?"
              rows={3}
              maxLength={2000}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>

          {/* Intended uses (checkboxes) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              How would you like to use these stories? <span className="text-red-500">*</span>
            </label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
              Pick the ways you’d like to use the stories you collect. Each storyteller then chooses which of these they’re comfortable with — we only pass along the uses they grant.
            </p>
            <div className="space-y-2">
              {STORY_USAGE_OPTIONS.map((opt) => {
                const on = usageTags.includes(opt.value);
                return (
                  <label
                    key={opt.value}
                    className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                      on ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-400'
                    }`}
                  >
                    <input
                      type="checkbox"
                      checked={on}
                      onChange={() => setUsageTags((prev) => on ? prev.filter((t) => t !== opt.value) : [...prev, opt.value])}
                      className="mt-1 h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
                    />
                    <span>
                      <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">{opt.label}</span>
                      <span className="block text-xs text-gray-500 dark:text-gray-400">{opt.description}</span>
                    </span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Attribution is always the storyteller's choice (named / first name only /
              anonymous), made on their end — the creator doesn't restrict it. We enforce
              whatever the storyteller picks before the story reaches the creator. */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <p className="text-xs text-gray-600 dark:text-gray-300">
              <strong>Attribution is the storyteller’s choice.</strong> Each person decides whether to be named, share first name only, or stay anonymous — and we enforce that choice before their story reaches you.
            </p>
          </div>

          {/* Edit / revoke policy */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Edit / Revoke Policy <span className="text-red-500">*</span>
            </label>
            <textarea
              value={editRevokePolicy}
              onChange={(e) => setEditRevokePolicy(e.target.value)}
              placeholder="How can a storyteller edit or revoke their story later?"
              rows={3}
              maxLength={2000}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Revocation is handled by contacting you — stories already shared or used can&apos;t be auto-recalled.
            </p>
          </div>

          {/* Recipient email */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Where should stories be sent? <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              placeholder="Defaults to your account email"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Storytellers email their finished story to this address from their own email.</p>
          </div>
        </>
      )}

      <Button type="submit" isLoading={isSubmitting} className="w-full" size="lg">
        {campaignType === 'storytelling' ? 'Submit Storytelling Campaign for Review' : 'Submit Advocacy Campaign for Review'}
      </Button>
    </form>
  );
}
