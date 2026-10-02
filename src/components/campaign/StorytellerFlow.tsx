'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/Button';
import { SupportNudge } from '@/components/ui/SupportNudge';
import { SocialShare } from '@/components/ui/SocialShare';
import { useTurnstile } from '@/components/ui/Turnstile';
import { MicButton } from '@/components/chat/MicButton';
import { AddressAutocomplete, type ParsedAddress } from '@/components/ui/AddressAutocomplete';
import { STORY_USAGE_OPTIONS } from '@/lib/story-usage';
import { storytellerCopy, type StorytellerCopy } from '@/lib/copy/storyteller';
import type { Campaign, AttributionLevel, Official } from '@/lib/types';

type Step = 'intro' | 'interview' | 'review' | 'consent' | 'preview' | 'done';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

function buildGreeting(campaign: Campaign, t: StorytellerCopy): string {
  const prompt = campaign.story_prompt?.trim();
  if (prompt) {
    // Open with the exact prompt the campaign creator wrote.
    return `${t.greetingLead}\n\n${t.toStart} ${prompt}`;
  }
  return `${t.greetingLead}\n\n${t.toStart} ${t.toStartDefault(campaign.headline)}`;
}

export function StorytellerFlow({ campaign }: { campaign: Campaign }) {
  const [step, setStep] = useState<Step>('intro');
  const [error, setError] = useState<string | null>(null);

  // Interview chat
  // Storyteller-facing copy in the campaign's language (English or Spanish).
  const t = storytellerCopy(campaign.language);
  const [messages, setMessages] = useState<ChatMessage[]>(() => [{ role: 'assistant', content: buildGreeting(campaign, t) }]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [composing, setComposing] = useState(false);

  // Composed story
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  // What the draft left out or changed, in the writer's words to the storyteller.
  const [draftNotes, setDraftNotes] = useState<string[]>([]);

  // AI edit on the review step: a plain-language request applied to the draft.
  const [reviseNote, setReviseNote] = useState('');
  const [revising, setRevising] = useState(false);

  // Consent / attribution — both are the storyteller's choice.
  const allowedAttribution: AttributionLevel[] = ['named', 'first_name_only', 'anonymous'];
  // The storyteller grants from the uses the campaign asked for (fallback: all).
  const availableUses = (campaign.usage_tags?.length
    ? STORY_USAGE_OPTIONS.filter((o) => campaign.usage_tags!.includes(o.value))
    : STORY_USAGE_OPTIONS
  ).map((o) => ({ ...o, ...(t.usage[o.value] ?? {}) }));
  // Attribution is the storyteller's pick, nothing pre-selected. Uses start
  // ALL checked and the storyteller unchecks what they are not comfortable
  // with (Jared, 10-02; reversed the 09-29 all-unchecked default).
  const [attribution, setAttribution] = useState<AttributionLevel | null>(null);
  const [storytellerName, setStorytellerName] = useState('');
  const [storytellerEmail, setStorytellerEmail] = useState('');
  const [grantedUses, setGrantedUses] = useState<string[]>(() => availableUses.map((o) => o.value));
  const [consentShare, setConsentShare] = useState(false);
  const [consentTruthful, setConsentTruthful] = useState(false);
  const [consentAdult, setConsentAdult] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [signedIn, setSignedIn] = useState(false);

  // Address is required (so everyone is a verified constituent), but sharing the
  // derived city/state + reps with the creator is opt-out. We use the address only
  // in-request, never send the street, and never store any of it.
  const [address, setAddress] = useState<ParsedAddress>({ street: '', city: '', state: '', zip: '' });
  const [shareLocation, setShareLocation] = useState(false);

  // Result from preview / submit
  const [finalBody, setFinalBody] = useState('');
  const [flagged, setFlagged] = useState<string[]>([]);
  const [revokeToken, setRevokeToken] = useState<string | null>(null);
  const [storyId, setStoryId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const { getToken, TurnstileWidget } = useTurnstile();

  useEffect(() => {
    async function loadAuth() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          setSignedIn(true);
          // Pre-fill the name for convenience. The contact email is never
          // pre-filled: it is shared only if the storyteller types it.
          const n = user.user_metadata?.full_name || '';
          if (n) setStorytellerName(n);
        }
      } catch {
        // anonymous — fine
      }
    }
    loadAuth();
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, streaming]);

  // --- Interview streaming ---
  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setError(null);
    setInput('');

    const next: ChatMessage[] = [...messages, { role: 'user', content: text }];
    setMessages(next);
    setStreaming(true);

    try {
      const res = await fetch('/api/chat/story-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignSlug: campaign.slug, messages: next.slice(-30), turnstileToken: (await getToken().catch(() => '')) || undefined }),
      });
      if (!res.ok || !res.body) {
        throw new Error((await res.text().catch(() => '')) || t.connectError);
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const shown = acc.replace(/\s*[—–]\s*/g, ', ').replace(/\*\*/g, '');
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: shown };
          return copy;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.somethingWrong);
      // drop the empty assistant placeholder if present
      setMessages((prev) => (prev[prev.length - 1]?.content === '' ? prev.slice(0, -1) : prev));
    } finally {
      setStreaming(false);
    }
  };

  // --- Compose final story ---
  const composeStory = async () => {
    setError(null);
    setComposing(true);
    try {
      const res = await fetch('/api/stories/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ campaignSlug: campaign.slug, messages: messages.slice(-40), turnstileToken: (await getToken().catch(() => '')) || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.composeFailed);
      setTitle(data.title || '');
      setBody(data.body || '');
      setDraftNotes(Array.isArray(data.notes) ? data.notes : []);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.composeFailed);
    } finally {
      setComposing(false);
    }
  };

  // --- AI revision of the draft (review step) ---
  const reviseStory = async () => {
    const note = reviseNote.trim();
    if (!note || revising) return;
    setError(null);
    setRevising(true);
    try {
      const res = await fetch('/api/stories/compose', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignSlug: campaign.slug,
          messages: messages.slice(-40),
          currentTitle: title,
          currentBody: body,
          revisionNote: note,
          turnstileToken: (await getToken().catch(() => '')) || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.editFailed);
      if (data.title) setTitle(data.title);
      setBody(data.body || body);
      setDraftNotes(Array.isArray(data.notes) ? data.notes : []);
      setReviseNote('');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.editFailed);
    } finally {
      setRevising(false);
    }
  };

  // --- Submit: validate, then (anonymous) preview the redacted text, then save ---
  const validateConsent = (): string | null => {
    if (!attribution) return t.vChooseCredit;
    if (!consentShare) return t.vConfirmShare(campaign.headline);
    if (!consentTruthful) return t.vConfirmTruthful;
    if (!consentAdult) return t.vConfirmAdult;
    if (attribution !== 'anonymous' && !storytellerName.trim()) return t.vEnterName;
    if (attribution !== 'anonymous' && (!address.street.trim() || !address.city.trim() || !address.state.trim() || !address.zip.trim())) {
      return t.vEnterAddress;
    }
    return null;
  };

  type SharedRep = { name: string; title: string | null; level: 'federal' | 'state' | 'local'; chamber: string | null; party: string | null; state: string | null };
  const lookupReps = async (): Promise<SharedRep[]> => {
    const reps: SharedRep[] = [];
    try {
      const repRes = await fetch('/api/representatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ street: address.street.trim(), city: address.city.trim(), state: address.state.trim(), zip: address.zip.trim() }),
      });
      if (repRes.ok) {
        const repData = await repRes.json();
        for (const o of (repData.officials || []) as Official[]) {
          reps.push({ name: o.name, title: o.title || null, level: o.level, chamber: o.chamber || null, party: o.party || null, state: o.state || null });
        }
      }
    } catch {
      // rep lookup is best-effort; city/state still go through
    }
    return reps.slice(0, 30);
  };

  const buildPayload = (opts: { preview: boolean; sharedReps: SharedRep[]; turnstileToken: string }) => {
    const anon = attribution === 'anonymous';
    const shareLoc = shareLocation && !anon;
    return {
      campaignSlug: campaign.slug,
      title: title.trim() || null,
      body: body.trim(),
      attribution_level: attribution,
      storyteller_name: anon ? null : storytellerName.trim(),
      granted_uses: grantedUses,
      consent_usage: true,
      consent_truthful: true,
      consent_adult: true,
      store: true,
      preview: opts.preview,
      city: shareLoc ? address.city.trim() : null,
      state: shareLoc ? address.state.trim() : null,
      shared_reps: shareLoc && opts.sharedReps.length ? opts.sharedReps : null,
      // Shared only if typed, and only with the follow-up permission.
      storyteller_email: !anon && grantedUses.includes('contact_me_followup') && storytellerEmail.trim() ? storytellerEmail.trim() : null,
      turnstileToken: opts.turnstileToken || undefined,
    };
  };

  const submitStory = async () => {
    setError(null);
    const problem = validateConsent();
    if (problem) { setError(problem); return; }
    setSubmitting(true);
    try {
      const turnstileToken = (await getToken().catch(() => '')) || '';
      // Anonymous: show the redacted text first. Nothing is saved yet.
      if (attribution === 'anonymous' && step === 'consent') {
        const res = await fetch('/api/stories', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(buildPayload({ preview: true, sharedReps: [], turnstileToken })),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || t.prepareFailed);
        setFinalBody(data.final_body || body.trim());
        setFlagged(Array.isArray(data.flagged) ? data.flagged : []);
        setStep('preview');
        return;
      }
      const sharedReps = shareLocation && attribution !== 'anonymous' ? await lookupReps() : [];
      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(buildPayload({ preview: false, sharedReps, turnstileToken })),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t.submitFailed);
      setFinalBody(data.final_body || body.trim());
      setFlagged(Array.isArray(data.flagged) ? data.flagged : []);
      setRevokeToken(data.revoke_token || null);
      setStoryId(data.story_id || null);
      trackEvent('story_submitted', { campaign: campaign.slug, attribution: attribution ?? 'unknown' });
      setStep('done');
    } catch (err) {
      setError(err instanceof Error ? err.message : t.submitFailed);
    } finally {
      setSubmitting(false);
    }
  };

  const withdrawStory = async () => {
    if (!storyId || !revokeToken) return;
    setError(null);
    try {
      const res = await fetch(`/api/stories/${storyId}?token=${encodeURIComponent(revokeToken)}`, { method: 'DELETE' });
      if (!res.ok) throw new Error(t.withdrawFailed);
      setStoryId(null);
      setRevokeToken(null);
      setFinalBody('');
      setError(t.withdrawn);
    } catch (err) {
      setError(err instanceof Error ? err.message : t.withdrawFailed);
    }
  };

  const copyStory = async () => {
    try {
      await navigator.clipboard.writeText(finalBody);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // clipboard unavailable
    }
  };

  // ---------- INTRO ----------
  if (step === 'intro') {
    return (
      <div className="space-y-5">
        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <p className="font-medium text-gray-900 dark:text-white">{t.howItWorks}</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>{t.step1}</li>
            <li>{t.step2}</li>
            <li>{t.step3}</li>
            <li>{t.step4}</li>
          </ol>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 border border-gray-200 dark:border-gray-600 rounded-xl">
          <p className="text-xs text-gray-700 dark:text-gray-300">
            {t.nothingSharedUntil}
          </p>
        </div>

        <Button onClick={() => setStep('interview')} className="w-full" size="lg">
          {t.startMyStory}
        </Button>
      </div>
    );
  }

  // ---------- INTERVIEW ----------
  if (step === 'interview') {
    // Ask for a bit of real substance first (a couple of exchanges) so the draft
    // isn't thin — the guide gathers a moment, its impact, and their ask.
    const answers = messages.filter((m) => m.role === 'user');
    const answerWords = answers.reduce((n, m) => n + m.content.split(/\s+/).filter(Boolean).length, 0);
    const lastGuide = [...messages].reverse().find((m) => m.role === 'assistant')?.content ?? '';
    const guideSaidReady = /Turn this into my story|Convertir esto en mi historia/i.test(lastGuide);
    // Substance, not turn count: a real draft needs about 60 of their own words,
    // or the guide's explicit hand-off.
    const canCompose = answerWords >= 60 || (guideSaidReady && answerWords >= 30);
    const declineAnswer = () => { setInput(t.ratherNotSayInput); };
    return (
      <div className="space-y-4">
        <TurnstileWidget />
        <div
          ref={scrollRef}
          className="h-80 overflow-y-auto space-y-3 p-1"
        >
          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
              <div
                className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line ${
                  m.role === 'user'
                    ? 'bg-purple-600 text-white rounded-br-sm'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm'
                }`}
              >
                {m.content || (streaming ? '…' : '')}
              </div>
            </div>
          ))}
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder={t.sharePlaceholder}
            rows={2}
            disabled={streaming}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
          />
          <button type="button" onClick={declineAnswer} disabled={streaming} className="self-end text-xs text-gray-500 dark:text-gray-400 underline whitespace-nowrap pb-3">{t.ratherNotSay}</button>
          <MicButton text={input} setText={setInput} disabled={streaming} className="self-end" />
          <Button onClick={sendMessage} isLoading={streaming} className="self-end">
            {t.send}
          </Button>
        </div>

        <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
          <Button
            onClick={composeStory}
            isLoading={composing}
            disabled={!canCompose || streaming}
            variant="secondary"
            className="w-full"
          >
            {t.turnIntoStory}
          </Button>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1.5">
            {canCompose
              ? t.canComposeHint
              : t.needMoreHint}
          </p>
        </div>
      </div>
    );
  }

  // ---------- REVIEW ----------
  if (step === 'review') {
    return (
      <div className="space-y-4">
        <TurnstileWidget />
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.titleLabel} <span className="text-gray-400 font-normal">{t.optional}</span></label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.yourStory}</label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">{t.draftNote}</p>
          {draftNotes.length > 0 && (
            <ul className="mb-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 text-xs text-gray-700 dark:text-gray-300 space-y-1 list-disc list-inside">
              {draftNotes.map((n, i) => <li key={i}>{n}</li>)}
            </ul>
          )}
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            maxLength={8000}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 resize-y bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm leading-relaxed"
          />
        </div>

        {/* AI edit: type a request instead of editing by hand */}
        <div className="p-3 bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-xl">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            {t.wantChange}
          </label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
            {t.describeEdit}
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={reviseNote}
              onChange={(e) => setReviseNote(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); reviseStory(); } }}
              maxLength={500}
              placeholder={t.editPlaceholder}
              className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
            />
            <Button type="button" variant="secondary" onClick={reviseStory} isLoading={revising} disabled={reviseNote.trim().length < 3}>
              {t.makeEdit}
            </Button>
          </div>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setStep('interview')} className="flex-1">{t.backToQuestions}</Button>
          <Button onClick={() => { setError(null); setStep('consent'); }} disabled={body.trim().length < 20 || revising} className="flex-1">{t.continue}</Button>
        </div>
      </div>
    );
  }

  // ---------- CONSENT ----------
  if (step === 'consent') {
    return (
      <div className="space-y-5">
        <TurnstileWidget />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t.consentTitle}</h3>

        {/* Attribution */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">{t.chooseCredit}</label>
          <div className="space-y-2">
            {allowedAttribution.map((opt) => (
              <label
                key={opt}
                className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                  attribution === opt ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-700'
                }`}
              >
                <input
                  type="radio"
                  name="attribution"
                  checked={attribution === opt}
                  onChange={() => setAttribution(opt)}
                  className="mt-1 h-4 w-4 text-purple-600 focus:ring-purple-500"
                />
                <span>
                  <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">{t.attribution[opt].label}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">{t.attribution[opt].help}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Name (unless anonymous) */}
        {attribution !== 'anonymous' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {attribution === 'first_name_only' ? t.yourFirstName : t.yourName}
            </label>
            <input
              type="text"
              value={storytellerName}
              onChange={(e) => setStorytellerName(e.target.value)}
              placeholder={attribution === 'first_name_only' ? t.firstNamePlaceholder : t.fullNamePlaceholder}
              maxLength={200}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {attribution === 'first_name_only' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{t.keepFirstOnly}</p>
            )}
          </div>
        )}

        {/* Address: only when the story carries a name. Anonymous stories carry no location at all. */}
        {attribution && attribution !== 'anonymous' && (
          <div className="p-4 bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-xl">
            <p className="text-sm font-medium text-gray-900 dark:text-white mb-1">{t.yourAddress} <span className="text-red-500">*</span></p>
            <p className="text-xs text-gray-600 dark:text-gray-300 mb-3">
              {t.addressOnce}
            </p>
            <AddressAutocomplete
              label={t.yourAddress}
              initialAddress={address}
              onAddressChange={setAddress}
            />

            <label className="flex items-start gap-3 mt-3 cursor-pointer">
              <input
                type="checkbox"
                checked={shareLocation}
                onChange={(e) => setShareLocation(e.target.checked)}
                className="mt-1 h-4 w-4 rounded text-purple-600 focus:ring-purple-500"
              />
              <span className="text-sm text-gray-800 dark:text-gray-200">
                {t.shareLocationLabel}
              </span>
            </label>
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-2">
              {shareLocation
                ? <>{t.campaignWillSeeA} {address.city && address.state ? <strong>{address.city}, {address.state}</strong> : t.yourCityState} {t.campaignWillSeeB}</>
                : t.withoutLocation}
            </p>
          </div>
        )}

        {/* What the campaign hopes to do (context) */}
        {campaign.usage_statement && (
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{t.howMayUse}</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{campaign.usage_statement}</p>
          </div>
        )}

        {/* Storyteller's usage permissions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{t.howMayUseQ}</label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {t.checkEach}
          </p>
          <div className="space-y-2">
            {availableUses.map((opt) => {
              const on = grantedUses.includes(opt.value);
              return (
                <label
                  key={opt.value}
                  className={`flex items-start gap-3 p-3 rounded-xl border cursor-pointer transition-colors ${
                    on ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20' : 'border-gray-200 dark:border-gray-700'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={on}
                    onChange={() => setGrantedUses((prev) => on ? prev.filter((u) => u !== opt.value) : [...prev, opt.value])}
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

        {/* Optional contact email — shown when the storyteller allows follow-up */}
        {attribution !== 'anonymous' && grantedUses.includes('contact_me_followup') && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              {t.contactEmail}
            </label>
            <input
              type="email"
              value={storytellerEmail}
              onChange={(e) => setStorytellerEmail(e.target.value)}
              placeholder={t.emailPlaceholder}
              className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t.sharedOnlyIfTyped}
            </p>
          </div>
        )}

        {/* Consent gates */}
        <div className="space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={consentShare} onChange={(e) => setConsentShare(e.target.checked)} className="mt-1 h-4 w-4 rounded text-purple-600 focus:ring-purple-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t.shareWith} <strong>{campaign.headline}</strong> {t.throughDashboard}
              {attribution === 'anonymous' ? t.anonSavedNote : t.detailsGoNote}
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={consentTruthful} onChange={(e) => setConsentTruthful(e.target.checked)} className="mt-1 h-4 w-4 rounded text-purple-600 focus:ring-purple-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t.truthful}
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={consentAdult} onChange={(e) => setConsentAdult(e.target.checked)} className="mt-1 h-4 w-4 rounded text-purple-600 focus:ring-purple-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              {t.adult}
            </span>
          </label>
        </div>

        <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
          <p className="text-[11px] text-gray-600 dark:text-gray-400">
            {signedIn
              ? t.laterSignedIn
              : t.laterAnon}
          </p>
        </div>

        {error && <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>}

        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setStep('review')} className="flex-1">{t.back}</Button>
          <Button onClick={submitStory} isLoading={submitting} className="flex-1">
            {attribution === 'anonymous' ? t.checkAnonVersion : t.submitStory}
          </Button>
        </div>
      </div>
    );
  }

  // ---------- PREVIEW (anonymous only): what the campaign will receive ----------
  if (step === 'preview') {
    return (
      <div className="space-y-4">
        <TurnstileWidget />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t.previewTitle}</h3>
        <p className="text-sm text-gray-600 dark:text-gray-300">{t.previewNote}</p>
        {flagged.length > 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
            <p className="text-xs text-amber-800 dark:text-amber-300">{t.checkDetails} {flagged.join('; ')}.</p>
          </div>
        )}
        <textarea
          value={finalBody}
          onChange={(e) => setFinalBody(e.target.value)}
          rows={12}
          maxLength={8000}
          aria-label={t.anonAria}
          className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 resize-y bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm leading-relaxed"
        />
        {error && <p className="text-sm text-red-600 dark:text-red-400" role="alert">{error}</p>}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setStep('consent')} className="flex-1">{t.back}</Button>
          <Button onClick={() => { setBody(finalBody); void submitStory(); }} isLoading={submitting} disabled={finalBody.trim().length < 20} className="flex-1">
            {t.submitThisVersion}
          </Button>
        </div>
      </div>
    );
  }

  // ---------- DONE ----------
  return (
    <div className="text-center py-6">
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-5">
        <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{storyId ? t.thankYou : t.storyWithdrawn}</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        {storyId ? t.canReadNow : t.canNoLonger}
      </p>

      {flagged.length > 0 && storyId && (
        <div className="mb-6 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl text-left">
          <p className="text-xs text-amber-800 dark:text-amber-300">{t.unresolved} {flagged.join('; ')}.</p>
        </div>
      )}

      {finalBody && (
        <div className="mb-6 text-left">
          <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl max-h-64 overflow-y-auto">
            <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line leading-relaxed">{finalBody}</p>
          </div>
          <button type="button" onClick={copyStory} className="mt-2 text-sm text-purple-600 dark:text-purple-400 underline">
            {copied ? t.copied : t.copyMyStory}
          </button>
        </div>
      )}

      {storyId && (
        <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl text-left">
          <p className="text-xs text-gray-600 dark:text-gray-400">
            {signedIn ? (
              <>{t.editFromDashboardA} <Link href="/dashboard" className="underline">{t.dashboard}</Link>.</>
            ) : (
              <>{t.changedMind} <button type="button" onClick={withdrawStory} className="underline">{t.withdrawNow}</button>{t.keepLink} <span className="break-all font-mono text-[11px]">{`https://www.mydemocracy.app/stories/withdraw?id=${storyId}&token=${revokeToken ?? ''}`}</span></>
            )}
          </p>
        </div>
      )}

      {error && <p className="text-sm text-gray-700 dark:text-gray-300 mb-4" role="alert">{error}</p>}

      <div className="mb-6 text-left">
        <SocialShare
          url={
            campaign.custom_domain
              ? `https://${campaign.custom_domain}/`
              : `https://www.mydemocracy.app/campaign/${campaign.slug}`
          }
          text={t.shareText(campaign.headline)}
          title={t.shareTitle(campaign.headline)}
          prompt={t.sharePrompt}
        />
        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-2 text-center">
          {t.sharesLinkOnly}
        </p>
      </div>

      <SupportNudge />
    </div>
  );
}
