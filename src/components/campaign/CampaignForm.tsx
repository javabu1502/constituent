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
import { TargetPicker, type TargetMode, type TargetOfficial, type TargetParty } from '@/components/campaign/TargetPicker';

type BillLevel = '' | 'federal' | 'state';
interface ResolvedBill {
  level: 'federal' | 'state';
  state?: string;
  ref: string;
  title: string;
  url: string;
}

export interface CampaignEditInitial {
  campaignType: 'advocacy' | 'storytelling';
  headline: string;
  description: string;
  issueArea: string;
  issueCategory: string;
  targetLevel: 'federal' | 'state' | 'both';
  direction: 'support' | 'oppose' | '';
  messageTemplate: string;
  storyPrompt: string;
  usageTags: string[];
  resolvedBill: ResolvedBill | null;
}

export function CampaignForm({
  initialType,
  edit,
}: {
  initialType?: 'advocacy' | 'storytelling';
  edit?: { slug: string; initial: CampaignEditInitial };
} = {}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [headline, setHeadline] = useState(edit?.initial.headline ?? (searchParams.get('ask') || ''));
  const [description, setDescription] = useState(edit?.initial.description ?? '');
  const [issueArea, setIssueArea] = useState(edit?.initial.issueArea ?? (searchParams.get('issue') || ''));
  const [issueCategory, setIssueCategory] = useState(edit?.initial.issueCategory ?? (searchParams.get('category') || ''));
  const [targetLevel, setTargetLevel] = useState<'federal' | 'state' | 'both'>(edit?.initial.targetLevel ?? 'federal');

  // Narrow targeting: everyone at the level (default), specific officials,
  // or a party slice. Fixed at creation; committee actions use the committee
  // picker instead.
  const [targetMode, setTargetMode] = useState<TargetMode>('all');
  const [targetOfficials, setTargetOfficials] = useState<TargetOfficial[]>([]);
  const [targetParty, setTargetParty] = useState<TargetParty>({ party: 'D', chamber: 'both', level: 'federal' });
  const [direction, setDirection] = useState<'support' | 'oppose' | ''>(edit?.initial.direction ?? '');
  const [messageTemplate, setMessageTemplate] = useState(edit?.initial.messageTemplate ?? '');

  // Campaign type is fixed by the entry point (?type=advocacy|storytelling);
  // each type has its own track below. Advocacy campaigns are always public.
  // Fixed by the entry point. Prefer the server-provided prop (reliable on SSR);
  // fall back to the URL param so the component still works if used standalone.
  const [campaignType] = useState<'advocacy' | 'storytelling'>(
    edit?.initial.campaignType ?? initialType ?? (searchParams.get('type') === 'storytelling' ? 'storytelling' : 'advocacy')
  );

  // Stage mode: arriving via "Add a stage" on a parent campaign
  // (?parent=<id>&parent_name=<headline>&goal=<stage_goal>). The stage becomes
  // its own campaign linked to the parent; committee stages pick the committee
  // so messages only go to its members.
  const parentCampaignId = searchParams.get('parent') || '';
  const parentName = searchParams.get('parent_name') || '';
  // 2-letter code when the parent is a state-bill campaign: the committee
  // picker then offers that state legislature's committees instead of Congress.
  const stageState = (searchParams.get('state') || '').toUpperCase().slice(0, 2);
  const [stageGoal, setStageGoal] = useState<string>(searchParams.get('goal') || '');
  const supportersReachable = Number(searchParams.get('supporters') || '0') || 0;
  const [notifySupporters, setNotifySupporters] = useState(true);
  // Preselected by the live-bill-status "Add this stage" suggestion.
  const [targetCommittee, setTargetCommittee] = useState(searchParams.get('committee') || '');
  const [committees, setCommittees] = useState<{ id: string; name: string; chamber: string }[]>([]);
  useEffect(() => {
    if (stageGoal !== 'committee' || committees.length > 0) return;
    fetch(`/api/committees${stageState ? `?state=${stageState}` : ''}`)
      .then((r) => r.json())
      .then((d) => setCommittees((d.committees || []).filter((c: { chamber: string }) => c.chamber !== 'joint')))
      .catch(() => {});
  }, [stageGoal, committees.length, stageState]);

  // Branding is NOT collected here — campaigns automatically carry the org's
  // identity from /dashboard/settings, and orgs wanting the flow on their own
  // site use the embed widget.

  // Storytelling fields
  const [storyPrompt, setStoryPrompt] = useState(edit?.initial.storyPrompt ?? '');
  const [usageTags, setUsageTags] = useState<string[]>(edit?.initial.usageTags ?? []);

  // Optional related bill
  const [billLevel, setBillLevel] = useState<BillLevel>(edit?.initial.resolvedBill?.level ?? '');
  const [billState, setBillState] = useState(edit?.initial.resolvedBill?.state ?? '');
  const [billQuery, setBillQuery] = useState(edit?.initial.resolvedBill?.ref ?? '');
  const [resolvedBill, setResolvedBill] = useState<ResolvedBill | null>(edit?.initial.resolvedBill ?? null);
  const [billStatus, setBillStatus] = useState<'idle' | 'resolving' | 'notfound' | 'error'>('idle');

  // Suggestion from headline/description text
  const [suggestion, setSuggestion] = useState<
    { detectedRaw: string; ref: string; level: 'federal' | 'state'; title?: string; url?: string; state?: string; needsState?: boolean } | null
  >(null);
  const [dismissedRefs, setDismissedRefs] = useState<Set<string>>(new Set());
  const resolveCache = useRef<Map<string, ResolvedBill | null>>(new Map());

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Submission navigates straight to the manage page; guards double-saves of
  // the draft while the redirect is in flight.
  const [submitted, setSubmitted] = useState(false);

  // Validation errors live next to the field they describe, not in one box at
  // the top of a long form.
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const clearFieldError = (field: string) =>
    setFieldErrors((prev) => {
      if (!(field in prev)) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  const FieldError = ({ field }: { field: string }) =>
    fieldErrors[field] ? (
      <p className="text-sm text-red-600 dark:text-red-400 mt-1">{fieldErrors[field]}</p>
    ) : null;

  // Draft persistence — a refresh or crash shouldn't cost the org its work.
  // Stage mode is skipped: those forms carry URL context (parent, goal,
  // committee) that a stale draft would fight with.
  const draftKey = `campaign-draft:${campaignType}`;
  const skipDraft = !!parentCampaignId || !!edit;
  const [draftRestored, setDraftRestored] = useState(false);
  useEffect(() => {
    if (skipDraft) return;
    try {
      const raw = localStorage.getItem(draftKey);
      if (!raw) return;
      const d = JSON.parse(raw);
      // URL prefills (?ask, ?issue) win over the stored draft.
      if (d.headline && !searchParams.get('ask')) setHeadline(d.headline);
      if (d.description) setDescription(d.description);
      if (d.issueArea && !searchParams.get('issue')) {
        setIssueArea(d.issueArea);
        setIssueCategory(d.issueCategory || '');
      }
      if (d.targetLevel) setTargetLevel(d.targetLevel);
      if (d.direction) setDirection(d.direction);
      if (d.messageTemplate) setMessageTemplate(d.messageTemplate);
      if (d.storyPrompt) setStoryPrompt(d.storyPrompt);
      if (Array.isArray(d.usageTags) && d.usageTags.length > 0) setUsageTags(d.usageTags);
      if (d.billLevel) setBillLevel(d.billLevel);
      if (d.billState) setBillState(d.billState);
      if (d.billQuery) setBillQuery(d.billQuery);
      if (d.resolvedBill) setResolvedBill(d.resolvedBill);
      setDraftRestored(true);
    } catch {
      // corrupt draft — ignore it
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useEffect(() => {
    if (skipDraft || submitted) return;
    const timer = setTimeout(() => {
      const hasContent =
        headline.trim() || description.trim() || messageTemplate.trim() || storyPrompt.trim();
      if (!hasContent) return;
      try {
        localStorage.setItem(
          draftKey,
          JSON.stringify({
            headline, description, issueArea, issueCategory, targetLevel, direction,
            messageTemplate, storyPrompt, usageTags,
            billLevel, billState, billQuery, resolvedBill,
          })
        );
      } catch {
        // storage full/unavailable — drafts are best-effort
      }
    }, 800);
    return () => clearTimeout(timer);
  }, [
    skipDraft, submitted, draftKey, headline, description, issueArea, issueCategory, targetLevel,
    direction, messageTemplate, storyPrompt, usageTags,
    billLevel, billState, billQuery, resolvedBill,
  ]);
  const discardDraft = () => {
    try { localStorage.removeItem(draftKey); } catch { /* best-effort */ }
    setHeadline(searchParams.get('ask') || '');
    setDescription('');
    setIssueArea(searchParams.get('issue') || '');
    setIssueCategory(searchParams.get('category') || '');
    setTargetLevel('federal');
    setDirection('');
    setMessageTemplate('');
    setStoryPrompt('');
    setUsageTags([]);
    setBillLevel('');
    setBillState('');
    setBillQuery('');
    setResolvedBill(null);
    setFieldErrors({});
    setDraftRestored(false);
  };

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

    // Collect every problem at once, in the form's visual order, so one
    // submit shows everything that needs fixing.
    const errs: Record<string, string> = {};
    if (campaignType === 'advocacy' && parentCampaignId && !stageGoal) {
      errs.stageGoal = 'Choose what this stage is trying to achieve';
    }
    if (campaignType === 'advocacy' && stageGoal === 'committee' && !targetCommittee) {
      errs.targetCommittee = 'Pick the committee this stage targets';
    }
    if (!headline.trim() || headline.trim().length < 3) {
      errs.headline = 'Headline must be at least 3 characters';
    }
    if (!description.trim() || description.trim().length < 10) {
      errs.description = 'Description must be at least 10 characters';
    }
    if (campaignType === 'advocacy') {
      if (!issueArea.trim()) {
        errs.issueArea = 'Select an issue area';
      }
      // Stages inherit the parent's position — only standalone campaigns pick.
      if (!direction && !parentCampaignId) {
        errs.direction = 'Choose whether this campaign asks people to support or oppose';
      }
    } else {
      if (usageTags.length < 1) {
        errs.usageTags = 'Select at least one way you’d like to use these stories';
      }
    }
    setFieldErrors(errs);
    const firstError = Object.keys(errs)[0];
    if (firstError) {
      setTimeout(() => {
        document.querySelector(`[data-field="${firstError}"]`)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 0);
      return;
    }

    setIsSubmitting(true);

    try {
      // Branding is applied server-side from the org's profile settings.
      const sharedBody = {
        campaign_type: campaignType,
        headline: headline.trim(),
        description: description.trim(),
        issue_area: issueCategory || issueArea,
        issue_subtopic: issueCategory ? issueArea : null,
      };
      // Narrow targeting (create only; committee actions carry their own).
      const targetingBody =
        stageGoal === 'committee'
          ? {}
          : targetMode === 'officials' && targetOfficials.length > 0
            ? { target_officials: targetOfficials }
            : targetMode === 'party'
              ? { target_party: targetParty }
              : {};
      const body = campaignType === 'advocacy'
        ? {
            ...sharedBody,
            target_level: targetLevel,
            direction: direction || undefined,
            message_template: messageTemplate.trim() || null,
            ...(edit ? {} : targetingBody),
            ...(parentCampaignId
              ? {
                  parent_campaign_id: parentCampaignId,
                  stage_goal: stageGoal || 'custom',
                  notify_supporters: notifySupporters,
                  ...(stageGoal === 'committee' && targetCommittee
                    ? { target_committee: targetCommittee, ...(stageState ? { target_committee_state: stageState } : {}) }
                    : {}),
                }
              : {}),
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
            // Change/revoke is standardized (self-service), so there's no
            // per-campaign policy or recipient email to collect.
            edit_revoke_policy: null,
            recipient_email: null,
          };

      // Edits go to PATCH on the existing campaign; stage/parent structure,
      // campaign type, and story policy fields are fixed at creation.
      const editBody = campaignType === 'advocacy'
        ? {
            ...sharedBody,
            target_level: targetLevel,
            ...(direction ? { direction } : {}),
            message_template: messageTemplate.trim() || null,
            // Explicit nulls clear a previously linked bill.
            bill_level: resolvedBill?.level ?? null,
            bill_state: resolvedBill?.level === 'state' ? (resolvedBill.state ?? null) : null,
            bill_ref: resolvedBill?.ref ?? null,
            bill_title: resolvedBill?.title ?? null,
            bill_url: resolvedBill?.url ?? null,
          }
        : {
            ...sharedBody,
            story_prompt: storyPrompt.trim() || null,
            usage_tags: usageTags,
          };
      const res = edit
        ? await fetch(`/api/campaigns/${edit.slug}`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(editBody),
          })
        : await fetch('/api/campaigns', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body),
          });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || (edit ? 'Failed to save changes' : 'Failed to create campaign'));
      }

      trackEvent(edit ? 'campaign_edited' : 'campaign_created', { issue: issueArea });
      setSubmitted(true);
      try { localStorage.removeItem(draftKey); } catch { /* best-effort */ }
      // Live immediately — straight to the campaign's manage page (a new
      // action's manage route forwards to its parent's page).
      router.push(`/campaign/${data.slug}/manage`);
    } catch (err) {
      setError(err instanceof Error ? err.message : (edit ? 'Failed to save changes' : 'Failed to create campaign'));
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {draftRestored && (
        <div className="flex items-center justify-between gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl">
          <p className="text-sm text-gray-600 dark:text-gray-300">We restored your unsubmitted draft.</p>
          <button
            type="button"
            onClick={discardDraft}
            className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 underline shrink-0"
          >
            Start fresh
          </button>
        </div>
      )}

      {/* Stage mode — this campaign is one step of a parent initiative */}
      {parentCampaignId && campaignType === 'advocacy' && (
        <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl space-y-3">
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <span className="font-semibold">Adding an action{parentName ? ` to “${parentName}”` : ''}.</span> This
            action only messages the officials involved in its step, and its results count toward the campaign total.
          </p>
          <div data-field="stageGoal">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              What is this stage trying to achieve? <span className="text-red-500">*</span>
            </label>
            <select
              value={stageGoal}
              onChange={(e) => { setStageGoal(e.target.value); clearFieldError('stageGoal'); }}
              className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
            >
              <option value="">Choose a goal…</option>
              <option value="cosponsor">Recruit cosponsors</option>
              <option value="committee">Pass committee</option>
              <option value="floor_house">House floor vote</option>
              <option value="floor_senate">Senate floor vote</option>
              <option value="thank_you">Thank officials</option>
              <option value="custom">Something else</option>
            </select>
            <FieldError field="stageGoal" />
          </div>
          <label className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer select-none">
            <input type="checkbox" checked={notifySupporters} onChange={(e) => setNotifySupporters(e.target.checked)} className="mt-0.5" />
            <span>
              Email everyone who already acted on this campaign
              {supportersReachable > 0 ? ` (${supportersReachable.toLocaleString()} reachable supporters)` : ''} — &ldquo;the
              bill moved, here&apos;s the next action.&rdquo;
              <span className="block text-xs text-gray-500 dark:text-gray-400">Your past supporters are your fastest surge. Every email includes one-click unsubscribe.</span>
            </span>
          </label>
          {stageGoal === 'committee' && (
            <div data-field="targetCommittee">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Which committee? <span className="text-red-500">*</span>
              </label>
              <select
                value={targetCommittee}
                onChange={(e) => { setTargetCommittee(e.target.value); clearFieldError('targetCommittee'); }}
                className="w-full px-3 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm"
              >
                <option value="">Choose a committee…</option>
                {stageState ? (
                  <>
                    <optgroup label={`${stageState} House / Assembly`}>
                      {committees.filter((c) => c.chamber === 'lower').map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label={`${stageState} Senate`}>
                      {committees.filter((c) => c.chamber === 'upper').map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Chamber-wide / Joint">
                      {committees.filter((c) => c.chamber === 'legislature').map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                  </>
                ) : (
                  <>
                    <optgroup label="House">
                      {committees.filter((c) => c.chamber === 'house').map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                    <optgroup label="Senate">
                      {committees.filter((c) => c.chamber === 'senate').map((c) => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </optgroup>
                  </>
                )}
              </select>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Messages for this stage only go to members of this committee — participants whose reps aren&apos;t on it
                will be shown other ways to help.
              </p>
              <FieldError field="targetCommittee" />
            </div>
          )}
        </div>
      )}

      {/* Headline */}
      <div data-field="headline">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Campaign Headline <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={headline}
          onChange={(e) => { setHeadline(e.target.value); clearFieldError('headline'); }}
          placeholder={campaignType === 'storytelling'
            ? 'e.g., Tell your story: how housing costs hit your family'
            : 'e.g., Protect our local parks funding'}
          maxLength={100}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{headline.length}/100 characters</p>
        <FieldError field="headline" />
      </div>

      {/* Description */}
      <div data-field="description">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Description <span className="text-red-500">*</span>
        </label>
        <textarea
          value={description}
          onChange={(e) => { setDescription(e.target.value); clearFieldError('description'); }}
          placeholder={campaignType === 'storytelling'
            ? 'e.g., We’re collecting personal stories about how rising housing costs are affecting families in our community, to share with legislators and show why this issue matters.'
            : 'Explain the issue and why people should take action...'}
          rows={4}
          maxLength={500}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{description.length}/500 characters</p>
        <FieldError field="description" />
      </div>

      {campaignType === 'advocacy' && (
        <>
      {/* Issue Area (advocacy only — storytelling uses the story prompt for its topic) */}
      <div data-field="issueArea">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Issue Area <span className="text-red-500">*</span>
        </label>
        <IssuePicker
          value={issueArea}
          category={issueCategory}
          onChange={(issue, category) => {
            setIssueArea(issue);
            setIssueCategory(category);
            clearFieldError('issueArea');
          }}
        />
        <FieldError field="issueArea" />
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

      {/* Narrow targeting — hidden in edit mode (targeting is fixed at
          creation) and on committee actions (the committee picker rules). */}
      {!edit && stageGoal !== 'committee' && (
        <TargetPicker
          mode={targetMode}
          officials={targetOfficials}
          party={targetParty}
          billState={billState || stageState || undefined}
          onModeChange={setTargetMode}
          onOfficialsChange={setTargetOfficials}
          onPartyChange={setTargetParty}
        />
      )}

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

      {/* Direction — advocacy campaigns are one-way by design. Stages don't
          ask: a cosponsor push or a thank-you can't "oppose" its own
          initiative — the position carries over from the parent campaign. */}
      {!parentCampaignId && (
      <div data-field="direction">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          What position is this campaign taking? <span className="text-red-500">*</span>
        </label>
        <div className="grid grid-cols-2 gap-3">
          {(['support', 'oppose'] as const).map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => { setDirection(d); clearFieldError('direction'); }}
              className={`px-4 py-3 rounded-xl border-2 text-left transition-colors ${
                direction === d
                  ? d === 'support'
                    ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                    : 'border-rose-500 bg-rose-50 dark:bg-rose-900/20'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
              }`}
            >
              <span className="block text-base font-semibold text-gray-900 dark:text-white capitalize">{d}</span>
              <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Ask constituents to {d === 'support' ? 'support' : 'oppose'} it
              </span>
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Your campaign advocates one position. Every participant&apos;s message will make the case to {direction || 'your chosen side'}.
        </p>
        <FieldError field="direction" />
      </div>
      )}

      {/* Message Template (optional) */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          {parentCampaignId ? 'Talking points for this stage' : 'Message Template'}{' '}
          <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
        </label>
        {parentCampaignId && (
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            Each stage can carry its own talking points — cite the hearing date at the committee stage, the committee
            vote at the floor stage. Leave blank to reuse the parent campaign&apos;s points.
          </p>
        )}
        <textarea
          value={messageTemplate}
          onChange={(e) => setMessageTemplate(e.target.value)}
          placeholder="Provide talking points or a template for participants' messages..."
          rows={3}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Every participant&apos;s letter combines these points with their own reasons for caring, so no two letters read the same.
        </p>
      </div>

      {/* User campaigns are always link-only */}
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
        <p className="text-sm text-blue-800 dark:text-blue-300">
          Your campaign is <strong>shared by link only</strong>: it won&apos;t appear in the public directory,
          and it&apos;s written in your voice, for your cause. It carries your branding from{' '}
          <Link href="/dashboard/settings" className="underline hover:text-blue-900 dark:hover:text-blue-200">organization settings</Link>,
          and you can embed it on your own site from the dashboard.
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
              Supporters answer a few guided questions to shape their story, then it&apos;s saved straight to your campaign dashboard, where you can read every story and download them all as a spreadsheet.
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
          <div data-field="usageTags">
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
                      onChange={() => { setUsageTags((prev) => on ? prev.filter((t) => t !== opt.value) : [...prev, opt.value]); clearFieldError('usageTags'); }}
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
            <FieldError field="usageTags" />
          </div>

          {/* Attribution is always the storyteller's choice (named / first name only /
              anonymous), made on their end — the creator doesn't restrict it. We enforce
              whatever the storyteller picks before the story reaches the creator. */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <p className="text-xs text-gray-600 dark:text-gray-300">
              <strong>Attribution is the storyteller’s choice.</strong> Each person decides whether to be named, share first name only, or stay anonymous — and we enforce that choice before their story reaches you.
            </p>
          </div>

          {/* Change/revoke is standardized platform-wide — nothing to configure. */}
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Storytellers can change or revoke their own story anytime from their dashboard. You&apos;re flagged when
              they do, and revoked stories are hidden from you and the export.
            </p>
          </div>

        </>
      )}

      <Button type="submit" isLoading={isSubmitting} className="w-full" size="lg">
        {edit ? 'Save Changes' : 'Launch Campaign'}
      </Button>
      {!edit && (
        <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
          Your campaign goes live as soon as you launch it.
        </p>
      )}
    </form>
  );
}
