'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/analytics';
import { Button } from '@/components/ui/Button';
import { SupportNudge } from '@/components/ui/SupportNudge';
import { MicButton } from '@/components/chat/MicButton';
import { AddressAutocomplete, type ParsedAddress } from '@/components/ui/AddressAutocomplete';
import { STORY_USAGE_OPTIONS, usageLabels } from '@/lib/story-usage';
import type { Campaign, AttributionLevel, Official } from '@/lib/types';

type Step = 'intro' | 'interview' | 'review' | 'consent' | 'send' | 'done';

interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
}

const ATTR_LABELS: Record<AttributionLevel, { label: string; help: string }> = {
  named: { label: 'Use my full name', help: 'Your story is attributed to your name.' },
  first_name_only: { label: 'First name only', help: 'We remove your last name before the story is sent.' },
  anonymous: { label: 'Keep me anonymous', help: 'We strip identifying details so the story can’t be traced to you.' },
};

function buildGreeting(campaign: Campaign): string {
  const lead = "Hi — I’m here to help you put your experience into words. There’s no rush, and you can skip anything.";
  const prompt = campaign.story_prompt?.trim();
  if (prompt) {
    // Open with the exact prompt the campaign creator wrote.
    return `${lead}\n\nTo start: ${prompt}`;
  }
  return `${lead}\n\nTo start: what’s your experience with ${campaign.headline}, or what happened?`;
}

export function StorytellerFlow({ campaign }: { campaign: Campaign }) {
  const [step, setStep] = useState<Step>('intro');
  const [error, setError] = useState<string | null>(null);

  // Interview chat
  const [messages, setMessages] = useState<ChatMessage[]>(() => [{ role: 'assistant', content: buildGreeting(campaign) }]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [composing, setComposing] = useState(false);

  // Composed story
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');

  // Consent / attribution — both are the storyteller's choice.
  const allowedAttribution: AttributionLevel[] = ['named', 'first_name_only', 'anonymous'];
  // The storyteller grants from the uses the campaign asked for (fallback: all).
  const availableUses = campaign.usage_tags?.length
    ? STORY_USAGE_OPTIONS.filter((o) => campaign.usage_tags!.includes(o.value))
    : STORY_USAGE_OPTIONS;
  const [attribution, setAttribution] = useState<AttributionLevel>('named');
  const [storytellerName, setStorytellerName] = useState('');
  const [grantedUses, setGrantedUses] = useState<string[]>([]);
  const [consentTruthful, setConsentTruthful] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Address is required (so everyone is a verified constituent), but sharing the
  // derived city/state + reps with the creator is opt-out. We use the address only
  // in-request, never send the street, and never store any of it.
  const [address, setAddress] = useState<ParsedAddress>({ street: '', city: '', state: '', zip: '' });
  const [shareLocation, setShareLocation] = useState(true);
  const [locationInfo, setLocationInfo] = useState<{ cityState: string; reps: string[] } | null>(null);

  // Result from submit
  const [finalBody, setFinalBody] = useState('');
  const [recipientEmail, setRecipientEmail] = useState('');
  const [mailtoSubject, setMailtoSubject] = useState('');
  const [flagged, setFlagged] = useState<string[]>([]);

  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    async function loadAuth() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Pre-fill the name for convenience; we never store the story itself.
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
        body: JSON.stringify({ campaignSlug: campaign.slug, messages: next.slice(-30) }),
      });
      if (!res.ok || !res.body) {
        throw new Error((await res.text().catch(() => '')) || 'Sorry — we couldn’t connect just now. Please try again.');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      setMessages((prev) => [...prev, { role: 'assistant', content: '' }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: acc };
          return copy;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
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
        body: JSON.stringify({ campaignSlug: campaign.slug, messages: messages.slice(-40) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not compose your story');
      setTitle(data.title || '');
      setBody(data.body || '');
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not compose your story');
    } finally {
      setComposing(false);
    }
  };

  // --- Submit (apply attribution, count, persist) ---
  const submitStory = async () => {
    setError(null);
    if (grantedUses.length < 1) {
      setError('Please choose at least one way your story may be used.');
      return;
    }
    if (!consentTruthful) {
      setError('Please confirm this is your own true experience.');
      return;
    }
    if (attribution !== 'anonymous' && !storytellerName.trim()) {
      setError('Please enter the name you’d like used, or choose to stay anonymous.');
      return;
    }
    if (!address.street.trim() || !address.city.trim() || !address.state.trim() || !address.zip.trim()) {
      setError('Please enter your full address. It stays private — you choose what to share below.');
      return;
    }
    setSubmitting(true);
    try {
      // Only if they leave sharing on do we derive city/state + match reps. We keep
      // just the city/state + rep names for the email — never the street, never stored.
      let location: { cityState: string; reps: string[] } | null = null;
      if (shareLocation) {
        const reps: string[] = [];
        try {
          const repRes = await fetch('/api/representatives', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ street: address.street.trim(), city: address.city.trim(), state: address.state.trim(), zip: address.zip.trim() }),
          });
          if (repRes.ok) {
            const repData = await repRes.json();
            for (const o of (repData.officials || []) as Official[]) {
              if (o.level === 'federal' || o.level === 'state') {
                reps.push(o.title ? `${o.name} (${o.title})` : o.name);
              }
            }
          }
        } catch {
          // rep lookup is best-effort — still share city/state
        }
        location = { cityState: `${address.city.trim()}, ${address.state.trim()}`, reps };
      }
      setLocationInfo(location);

      const res = await fetch('/api/stories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignSlug: campaign.slug,
          title: title.trim() || null,
          body: body.trim(),
          attribution_level: attribution,
          storyteller_name: attribution === 'anonymous' ? null : storytellerName.trim(),
          granted_uses: grantedUses,
          consent_usage: true,
          consent_truthful: true,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Could not submit your story');

      setFinalBody(data.final_body || body.trim());
      setRecipientEmail(data.recipient_email || '');
      setMailtoSubject(data.subject || `My story: ${campaign.headline}`);
      setFlagged(Array.isArray(data.flagged) ? data.flagged : []);
      trackEvent('story_submitted', { campaign: campaign.slug, attribution });
      setStep('send');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit your story');
    } finally {
      setSubmitting(false);
    }
  };

  const mailtoHref = () => {
    const fullName = storytellerName.trim();
    const firstName = fullName.split(/\s+/)[0] || '';
    const closing =
      attribution === 'named' && fullName ? `Thank you,\n${fullName}`
      : attribution === 'first_name_only' && firstName ? `Thank you,\n${firstName}`
      : 'Thank you,\nA community member (sharing anonymously)';
    const attrNote =
      attribution === 'named' ? 'You may use my name with this story.'
      : attribution === 'first_name_only' ? 'Please use my first name only, not my full name.'
      : 'Please keep me anonymous. Do not attribute this story to me or try to identify me.';
    const uses = usageLabels(grantedUses).map((u) => `  - ${u}`).join('\n');
    const greeting = `Hello,\n\nI’d like to share my personal story for your campaign, “${campaign.headline}.”`;
    let locationBlock = '';
    if (locationInfo) {
      locationBlock = `\nWhere I’m writing from: ${locationInfo.cityState}`;
      if (locationInfo.reps.length) {
        locationBlock += `\nMy representatives:\n${locationInfo.reps.map((r) => `  - ${r}`).join('\n')}`;
      }
      locationBlock += '\n';
    }
    const note = `A note on how I’d like my story used:\n- ${attrNote}\n- I’m OK with it being used in these ways:\n${uses}`;
    const bodyText = `${greeting}\n\n${finalBody}\n\n${closing}\n\n----------\n${note}\n${locationBlock}`;
    return `mailto:${encodeURIComponent(recipientEmail)}?subject=${encodeURIComponent(mailtoSubject)}&body=${encodeURIComponent(bodyText)}`;
  };

  // ---------- INTRO ----------
  if (step === 'intro') {
    return (
      <div className="space-y-5">
        {campaign.story_prompt && (
          <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
            <p className="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">What this campaign is asking</p>
            <p className="text-sm text-blue-900 dark:text-blue-200">{campaign.story_prompt}</p>
          </div>
        )}

        <div className="space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <p className="font-medium text-gray-900 dark:text-white">How it works</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>We’ll ask a few gentle questions to help you put your experience into words — at your pace.</li>
            <li>You review and edit the final story.</li>
            <li>You choose how you’re credited and confirm your consent.</li>
            <li>You email the story to the campaign from your own email.</li>
          </ol>
        </div>

        {campaign.usage_statement && (
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">How your story will be used</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{campaign.usage_statement}</p>
          </div>
        )}

        <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
          <p className="text-xs text-amber-800 dark:text-amber-300">
            Your story stays private until you review it, choose how you’re credited, and consent. Nothing is sent automatically — you send the final email yourself.
          </p>
        </div>

        <Button onClick={() => setStep('interview')} className="w-full" size="lg">
          Start my story
        </Button>
      </div>
    );
  }

  // ---------- INTERVIEW ----------
  if (step === 'interview') {
    // Ask for a bit of real substance first (a couple of exchanges) so the draft
    // isn't thin — the guide gathers a moment, its impact, and their ask.
    const answerCount = messages.filter((m) => m.role === 'user').length;
    const canCompose = answerCount >= 3;
    return (
      <div className="space-y-4">
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
            placeholder="Share as much or as little as you like…"
            rows={2}
            disabled={streaming}
            className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
          />
          <MicButton text={input} setText={setInput} disabled={streaming} className="self-end" />
          <Button onClick={sendMessage} isLoading={streaming} className="self-end">
            Send
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
            Turn this into my story
          </Button>
          <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1.5">
            {canCompose
              ? 'Ready whenever you are — you’ll be able to edit it and choose how you’re credited before anything is sent.'
              : 'Answer a few questions first so your story has real detail — this unlocks once you’ve shared enough.'}
          </p>
        </div>
      </div>
    );
  }

  // ---------- REVIEW ----------
  if (step === 'review') {
    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Title <span className="text-gray-400 font-normal">(optional)</span></label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            maxLength={120}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Your story</label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">This is your story — edit it freely until it sounds like you.</p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={12}
            maxLength={8000}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 resize-y bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm leading-relaxed"
          />
        </div>
        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setStep('interview')} className="flex-1">Back to the questions</Button>
          <Button onClick={() => { setError(null); setStep('consent'); }} disabled={body.trim().length < 20} className="flex-1">Continue</Button>
        </div>
      </div>
    );
  }

  // ---------- CONSENT ----------
  if (step === 'consent') {
    return (
      <div className="space-y-5">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">How you’re credited & your consent</h3>

        {/* Attribution */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Choose how you’re credited</label>
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
                  <span className="block text-sm font-medium text-gray-800 dark:text-gray-200">{ATTR_LABELS[opt].label}</span>
                  <span className="block text-xs text-gray-500 dark:text-gray-400">{ATTR_LABELS[opt].help}</span>
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Name (unless anonymous) */}
        {attribution !== 'anonymous' && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {attribution === 'first_name_only' ? 'Your first name' : 'Your name'}
            </label>
            <input
              type="text"
              value={storytellerName}
              onChange={(e) => setStorytellerName(e.target.value)}
              placeholder={attribution === 'first_name_only' ? 'First name' : 'Full name'}
              maxLength={200}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
            {attribution === 'first_name_only' && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">If you enter a full name, we’ll keep only your first name.</p>
            )}
          </div>
        )}

        {/* Address (required) — sharing the derived city/state + reps is opt-out */}
        <div className="p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl">
          <p className="text-sm font-medium text-purple-900 dark:text-purple-200 mb-1">📍 Your address <span className="text-red-500">*</span></p>
          <p className="text-xs text-purple-800 dark:text-purple-300 mb-3">
            We ask everyone for their address so the campaign knows its stories come from real constituents.
            It stays private — your <strong>street address is never shared and never stored</strong>. You choose below what the campaign sees.
          </p>
          <AddressAutocomplete
            label="Your address"
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
            <span className="text-sm text-purple-900 dark:text-purple-200">
              Share my <strong>city, state, and representatives</strong> with this campaign <span className="font-normal text-purple-700 dark:text-purple-300">(recommended)</span>
            </span>
          </label>

          {shareLocation ? (
            <p className="text-xs text-purple-800 dark:text-purple-300 mt-2">
              Why it helps: decision-makers listen hardest to people they actually represent. This connects your story to your own
              state and federal lawmakers so it reaches the people who can act on it.
              {address.city && address.state && (
                <> The campaign will see: <strong>{address.city}, {address.state}</strong> + your matched representatives.</>
              )}
            </p>
          ) : (
            <p className="text-xs text-amber-700 dark:text-amber-300 mt-2">
              You’ve chosen not to share your location. Your story still counts, but it won’t be tied to your lawmakers —
              which is what makes stories land hardest with decision-makers. You can turn this back on any time.
            </p>
          )}
        </div>

        {/* What the campaign hopes to do (context) */}
        {campaign.usage_statement && (
          <div className="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
            <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">What {campaign.headline} hopes to do with stories</p>
            <p className="text-sm text-gray-600 dark:text-gray-300">{campaign.usage_statement}</p>
          </div>
        )}

        {/* Storyteller's usage permissions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">How is it OK to use your story?</label>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            You’re in control. Check only the uses you’re comfortable with — we pass your choices to the campaign and they should only use your story in the ways you allow. Pick at least one.
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

        {/* Photo prompt */}
        <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-xl">
          <p className="text-sm text-blue-900 dark:text-blue-200 font-medium mb-1">📷 A photo makes your story land</p>
          <p className="text-xs text-blue-800 dark:text-blue-300">
            Stories with a face or a moment behind them are far more powerful. On the next step you’ll send the story from your own email — feel free to attach a photo there.
            One privacy tip: photos can carry hidden location data, so only share images you’re comfortable making public.
          </p>
        </div>

        {/* Consent gate */}
        <div className="space-y-2">
          <label className="flex items-start gap-3 cursor-pointer">
            <input type="checkbox" checked={consentTruthful} onChange={(e) => setConsentTruthful(e.target.checked)} className="mt-1 h-4 w-4 rounded text-purple-600 focus:ring-purple-500" />
            <span className="text-sm text-gray-700 dark:text-gray-300">
              This is my own experience and it’s truthful to the best of my knowledge.
            </span>
          </label>
        </div>

        {campaign.edit_revoke_policy && (
          <p className="text-xs text-gray-500 dark:text-gray-400">
            <strong>Changed your mind later?</strong> {campaign.edit_revoke_policy}
          </p>
        )}

        {error && <p className="text-sm text-red-600 dark:text-red-400">{error}</p>}

        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setStep('review')} className="flex-1">Back</Button>
          <Button onClick={submitStory} isLoading={submitting} disabled={grantedUses.length < 1 || !consentTruthful} className="flex-1">
            Prepare my email
          </Button>
        </div>
      </div>
    );
  }

  // ---------- SEND ----------
  if (step === 'send') {
    return (
      <div className="space-y-5">
        <div className="text-center">
          <div className="w-16 h-16 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg className="w-8 h-8 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Your story is ready to send</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            We’ve applied your <strong>{ATTR_LABELS[attribution].label.toLowerCase()}</strong> choice. Send it from your own email — and attach a photo if you have one.
          </p>
        </div>

        {flagged.length > 0 && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
            <p className="text-xs text-amber-800 dark:text-amber-300">
              Heads up: before sending, you may want to review these possibly-identifying details we couldn’t fully resolve: {flagged.join(', ')}.
            </p>
          </div>
        )}

        <div className="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-xl max-h-56 overflow-y-auto">
          <p className="text-sm text-gray-700 dark:text-gray-200 whitespace-pre-line leading-relaxed">{finalBody}</p>
        </div>

        {recipientEmail ? (
          <a
            href={mailtoHref()}
            onClick={() => trackEvent('story_email_opened', { campaign: campaign.slug })}
            className="flex items-center justify-center gap-2 w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-xl font-medium transition-colors"
          >
            ✉️ Open email to send my story
          </a>
        ) : (
          <p className="text-sm text-red-600 dark:text-red-400 text-center">No recipient is configured for this campaign yet.</p>
        )}

        <Button variant="secondary" onClick={() => setStep('done')} className="w-full">
          I’ve sent my story
        </Button>
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
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thank you for sharing</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Your story adds a human voice to this cause, and that’s what moves people.
      </p>

      <div className="mb-6 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl">
        <p className="text-sm text-gray-600 dark:text-gray-300">
          We don’t keep a copy of your story. Your record of it is the email you just sent, so look there if you’d like to see it again.
        </p>
      </div>

      <SupportNudge />
    </div>
  );
}
