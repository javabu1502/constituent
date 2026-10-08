'use client';

import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/analytics';
import type { Campaign } from '@/lib/types';
import type { Official } from '@/lib/types';
import { US_STATES } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { formatPhone, salutationTitle } from '@/lib/utils';
import { buildEnvelope } from '@/lib/envelope';
import { participateCopy, type ParticipateCopy } from '@/lib/copy/participate';
import { MicButton } from '@/components/chat/MicButton';
import { CAMPAIGN_GUIDE_HANDOFF } from '@/lib/campaign-interview-prompt';
import { detectBillReferences, CURRENT_CONGRESS } from '@/lib/bills';
import {
  determineDeliveryMethod,
  generateMailtoLink,
  type DeliveryInfo,
} from '@/lib/delivery';
import { useTurnstile } from '@/components/ui/Turnstile';
import { SupportNudge } from '@/components/ui/SupportNudge';
import { SocialShare } from '@/components/ui/SocialShare';
import { CWC_PREFIXES, CWC_ENABLED } from '@/lib/cwc-prefixes';
import { useCwcActiveOffices, congressChannel, isNonParticipatingSenator, participatingSenateCount, cwcOfficeCodeFor, submitAdoptionSignature, CWC_SUBMITTED_STATUS, WEBFORM_SUBMITTED_STATUS, describeCwcOutcome, type SendOutcome, type CwcButtonState } from '@/lib/cwc-client';
import { CwcAdoptionAsk } from '@/components/ui/CwcAdoptionAsk';

type Step = 'stance' | 'compose' | 'form' | 'loading' | 'review' | 'done' | 'noTarget' | 'wrongState';
type Stance = 'support' | 'oppose' | 'undecided';

/** Errors whose message is safe to show users (our own API copy). Anything
 * else — WebKit URL/pattern DOMExceptions, network noise — stays in the
 * console and the user sees actionable guidance instead. */
class FriendlyError extends Error {}

/** Map a full state name (bad autofill / legacy profile values) to its code. */
function toStateCode(value: string): string {
  const v = value.trim();
  if (/^[A-Za-z]{2}$/.test(v)) return v.toUpperCase();
  const match = US_STATES.find((s) => s.name.toLowerCase() === v.toLowerCase());
  return match ? match.code : v;
}

interface OfficialMessage {
  subject: string;
  body: string;
}

/** Starter draft for when AI generation is unavailable (CAPTCHA failure,
 * outage, daily quota). Neutral scaffolding only: official weigh-ins carry
 * the PARTICIPANT's stance, and the bracketed prompt is theirs to fill —
 * the platform never supplies a position. */
function buildFallbackMessage(
  campaign: Campaign,
  official: Official,
  opts: {
    stance: Stance | null;
    personalWhy: string;
    senderName: string;
    city: string;
    stateCode: string;
    zip: string;
  }
): OfficialMessage {
  let topic = `"${campaign.headline}"`;
  if (campaign.is_bill_specific && campaign.bill_type && campaign.bill_number) {
    const typeLabels: Record<string, string> = {
      hr: 'H.R.', s: 'S.', hres: 'H.Res.', sres: 'S.Res.',
      hjres: 'H.J.Res.', sjres: 'S.J.Res.', hconres: 'H.Con.Res.', sconres: 'S.Con.Res.',
    };
    topic += ` (${typeLabels[campaign.bill_type.toLowerCase()] ?? campaign.bill_type.toUpperCase()} ${campaign.bill_number})`;
  }
  const lastName = official.lastName || official.name.split(' ').pop();
  const salutation = salutationTitle(official.title);
  const opening =
    opts.stance === 'support'
      ? `I am writing to express my support for ${topic}, and to ask for yours.`
      : opts.stance === 'oppose'
        ? `I am writing to express my opposition to ${topic}, and to ask you to oppose it as well.`
        : `I am writing about ${topic}.`;
  const body = [
    `Dear ${salutation} ${lastName},`,
    `I am your constituent from ${opts.city}, ${opts.stateCode}. ${opening}`,
    opts.personalWhy.trim() || '[Add a sentence or two about why this matters to you and what you would like them to do.]',
    'Thank you for your time and service.',
    `Sincerely,\n${opts.senderName}\n${opts.city}, ${opts.stateCode} ${opts.zip}`,
  ].join('\n\n');
  return { subject: `Constituent message: ${campaign.headline}`, body };
}

export function CampaignParticipate({
  campaign,
  parentCampaign = null,
}: {
  campaign: Campaign;
  parentCampaign?: { slug: string; headline: string } | null;
}) {
  // Official weigh-ins are neutral: the participant picks their OWN position
  // first and the message carries that stance. User-created campaigns are
  // the creator's own directional ask — no stance step, no poll.
  const isOfficial = !!campaign.is_official;
  // Participant-facing copy in the campaign's language (English or Spanish).
  const t = participateCopy(campaign.language);
  const [step, setStep] = useState<Step>(isOfficial ? 'stance' : 'compose');
  // Message-first: the constituent's approved core message, drafted before we
  // know who their officials are.
  const [coreDraft, setCoreDraft] = useState('');
  // AI-drafted frame from the same call: subject (used only without a bill
  // ref), opening, and validated ask — per-sender variance so a hundred
  // participants don't share one template frame.
  const [coreSubject, setCoreSubject] = useState<string | null>(null);
  const [coreOpening, setCoreOpening] = useState<string | null>(null);
  const [coreAsk, setCoreAsk] = useState<string | null>(null);
  // Bilingual: a Spanish reading copy of the core (review only) and the
  // participant's own Spanish, which every letter carries verbatim.
  const [coreBodyEs, setCoreBodyEs] = useState<string | null>(null);
  const [coreOriginal, setCoreOriginal] = useState<{ language: 'en' | 'es'; text: string } | null>(null);
  const [coreStatus, setCoreStatus] = useState<'idle' | 'drafting'>('idle');
  const [stance, setStance] = useState<Stance | null>(null);

  // Form fields
  const [name, setName] = useState('');
  // CWC delivery (federal targets only) needs fields mailto never did: a
  // Senate-valid title and the constituent's email (offices reply to it).
  // Collected up front once the flag is on so the payload is complete when
  // the delivery path ships; state-only campaigns never see these fields.
  const cwcFields = CWC_ENABLED && campaign.target_level !== 'state';
  const [prefix, setPrefix] = useState('');
  // Org campaigns collect email (with notice) so the campaign can re-engage
  // participants when the bill advances. Official weigh-ins stay email-free.
  const collectEmail = !campaign.is_official && campaign.campaign_type !== 'storytelling';
  const [email, setEmail] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [personalWhy, setPersonalWhy] = useState('');
  // Guided chat (default) vs. the plain textarea. The guide's own turns are
  // never passed to drafting: only the participant's messages become their
  // "why", so nothing we asked can be mistaken for something they said.
  const [composeMode, setComposeMode] = useState<'chat' | 'write'>('chat');
  const [chatMessages, setChatMessages] = useState<{ role: 'user' | 'assistant'; content: string }[]>(() => [
    { role: 'assistant', content: t.guideGreeting(campaign.headline) },
  ]);
  const [chatInput, setChatInput] = useState('');
  const [chatStreaming, setChatStreaming] = useState(false);
  const chatScrollRef = useRef<HTMLDivElement>(null);
  // Optional follow-up questions (compose step sub-phase): 1-4 short AI
  // questions that draw out concrete detail before drafting. Empty array =
  // phase not active.
  const [followUpQuestions, setFollowUpQuestions] = useState<string[]>([]);
  const [followUpAnswers, setFollowUpAnswers] = useState<string[]>([]);
  const [fetchingQuestions, setFetchingQuestions] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  // True when any review message is a manual-compose starter draft instead
  // of an AI draft — the review step then opens editors and says so.
  const [usedFallback, setUsedFallback] = useState(false);
  const [profileLoaded, setProfileLoaded] = useState(false);
  const { getToken, TurnstileWidget } = useTurnstile();

  // Funnel telemetry: one event per step reached, so we can finally see WHERE
  // visitors drop between landing and a sent message (49 sends all-time says
  // the funnel leaks badly; until now nothing measured the middle).
  const funnelFired = useRef<Set<string>>(new Set());
  const fireFunnel = (event: string) => {
    if (funnelFired.current.has(event)) return;
    funnelFired.current.add(event);
    trackEvent(event, { campaign: campaign.slug });
  };
  useEffect(() => {
    if (step === 'compose') fireFunnel('participate_compose_viewed');
    if (step === 'form') fireFunnel('participate_form_viewed');
    if (step === 'loading') fireFunnel('participate_submitted');
    if (step === 'review') fireFunnel('participate_generated');
    if (step === 'noTarget') fireFunnel('participate_no_target');
    if (step === 'wrongState') fireFunnel('participate_wrong_state');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step]);

  // whyOverride lets the follow-up step pass its just-enriched text directly
  // (state updates haven't flushed yet when it calls this).
  const draftCore = async (whyOverride?: string, interview?: { role: 'user' | 'assistant'; content: string }[]) => {
    setError(null);
    setCoreStatus('drafting');
    try {
      const turnstileToken = await getToken().catch(() => '');
      const res = await fetch('/api/generate-core-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignSlug: campaign.slug,
          stance: isOfficial ? stance ?? undefined : undefined,
          personalWhy: (whyOverride ?? personalWhy).trim() || undefined,
          interview: interview && interview.length > 1 ? interview.slice(-30) : undefined,
          turnstileToken: turnstileToken || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new FriendlyError(data.error || 'Drafting failed');
      setCoreDraft(data.body);
      setCoreSubject(typeof data.subject === 'string' ? data.subject : null);
      setCoreOpening(typeof data.opening === 'string' ? data.opening : null);
      setCoreAsk(typeof data.ask === 'string' ? data.ask : null);
      setCoreBodyEs(typeof data.body_es === 'string' ? data.body_es : null);
      setCoreOriginal(data.original && typeof data.original.text === 'string' ? data.original : null);
      fireFunnel('participate_core_generated');
    } catch (err) {
      setError(err instanceof FriendlyError ? err.message : t.draftFailed);
    } finally {
      setCoreStatus('idle');
    }
  };

  useEffect(() => {
    chatScrollRef.current?.scrollTo({ top: chatScrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [chatMessages, chatStreaming]);

  const sendChat = async () => {
    const text = chatInput.trim();
    if (!text || chatStreaming) return;
    setError(null);
    setChatInput('');
    const next = [...chatMessages, { role: 'user' as const, content: text }];
    setChatMessages(next);
    setChatStreaming(true);
    try {
      const turnstileToken = await getToken().catch(() => '');
      const res = await fetch('/api/chat/campaign-interview', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          campaignSlug: campaign.slug,
          stance: isOfficial ? stance ?? undefined : undefined,
          messages: next.slice(-30),
          turnstileToken: turnstileToken || undefined,
        }),
      });
      if (!res.ok || !res.body) throw new Error((await res.text().catch(() => '')) || t.draftFailed);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = '';
      setChatMessages((prev) => [...prev, { role: 'assistant', content: '' }]);
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        const shown = acc.replace(/\s*[—–]\s*/g, ', ').replace(/\*\*/g, '');
        setChatMessages((prev) => {
          const copy = [...prev];
          copy[copy.length - 1] = { role: 'assistant', content: shown };
          return copy;
        });
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : t.draftFailed);
      setChatMessages((prev) => (prev[prev.length - 1]?.content === '' ? prev.slice(0, -1) : prev));
    } finally {
      setChatStreaming(false);
    }
  };

  // The participant's own chat turns become their "why". Substance, not turn
  // count: about 40 of their words, or the guide's explicit hand-off.
  const chatAnswers = chatMessages.filter((m) => m.role === 'user').map((m) => m.content.trim()).filter(Boolean);
  const chatWords = chatAnswers.reduce((n, a) => n + a.split(/\s+/).filter(Boolean).length, 0);
  const lastGuide = [...chatMessages].reverse().find((m) => m.role === 'assistant')?.content ?? '';
  const guideHandedOff = CAMPAIGN_GUIDE_HANDOFF.test(lastGuide);
  const canDraftFromChat = chatWords >= 40 || (guideHandedOff && chatWords >= 15);
  const draftFromChat = () => {
    const why = chatAnswers.join('\n\n').slice(0, 4000);
    setPersonalWhy(why);
    fireFunnel('participate_guide_completed');
    void draftCore(why, chatMessages.filter((m) => m.content.trim()));
  };

  // Between the why-input and drafting: fetch 1-4 short follow-up questions.
  // This step is optional by design — any failure, non-OK response, or zero
  // questions falls straight through to drafting, exactly as before.
  const startDraftFlow = async () => {
    setError(null);
    setFetchingQuestions(true);
    try {
      const res = await fetch('/api/follow-up-questions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          headline: campaign.headline.slice(0, 200),
          language: campaign.language === 'es' ? 'es' : undefined,
          stance: isOfficial ? stance ?? undefined : undefined,
          personalWhy: personalWhy.trim().slice(0, 2000),
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const qs = Array.isArray(data?.questions)
          ? data.questions.filter((q: unknown): q is string => typeof q === 'string' && !!q.trim()).slice(0, 4)
          : [];
        if (qs.length > 0) {
          setFollowUpQuestions(qs);
          setFollowUpAnswers(qs.map(() => ''));
          setFetchingQuestions(false);
          fireFunnel('participate_followups_viewed');
          return;
        }
      }
    } catch {
      // Questions are a bonus, never a gate.
    }
    setFetchingQuestions(false);
    void draftCore();
  };

  // Continue and Skip both land here: append only the participant's ANSWERS
  // (their own words) to the personal why — never our question text, which
  // downstream checks would treat as words the constituent wrote themselves.
  // Questions are cleared before drafting so a failed draft can't re-append.
  const finishFollowUps = () => {
    const answers = followUpAnswers.map((a) => a.trim()).filter(Boolean);
    const enrichedWhy = [personalWhy.trim(), answers.join('\n')].filter(Boolean).join('\n\n');
    setPersonalWhy(enrichedWhy);
    setFollowUpQuestions([]);
    setFollowUpAnswers([]);
    void draftCore(enrichedWhy);
  };

  // Auto-fill from profile for logged-in users
  useEffect(() => {
    async function loadProfile() {
      try {
        const supabase = createClient();
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Pre-fill name from auth metadata
        if (user.user_metadata?.full_name && !name) {
          setName(user.user_metadata.full_name);
        }

        // Fetch saved address from profile
        const res = await fetch('/api/profile');
        if (!res.ok) return;
        const profile = await res.json();

        if (profile.street && !street) setStreet(profile.street);
        if (profile.city && !city) setCity(profile.city);
        if (profile.state && !state) setState(toStateCode(profile.state));
        if (profile.zip && !zip) setZip(profile.zip);
        setProfileLoaded(true);
      } catch {
        // Not logged in or profile fetch failed - no problem
      }
    }
    loadProfile();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Data from API calls
  const [officials, setOfficials] = useState<Official[]>([]);
  // Committee name shown when none of the participant's reps sit on the
  // stage's targeted committee (the 'noTarget' step).
  const [noTargetName, setNoTargetName] = useState('');
  // Per-official message intent (stage campaigns): thank vs persuade.
  const [intentByOfficial, setIntentByOfficial] = useState<Record<string, 'persuade' | 'thank'>>({});
  const [messages, setMessages] = useState<Record<string, OfficialMessage>>({});
  const [sentCount, setSentCount] = useState(0);
  // Officials whose message the CWC queue accepted this session: survives
  // Back/Next within the flow so the button never re-arms after a send.
  const [cwcSentIds, setCwcSentIds] = useState<Record<string, boolean>>({});
  // Reader-poll aggregates, fetched fresh after this participant is counted.
  const [pollResults, setPollResults] = useState<{ support: number; oppose: number; undecided: number } | null>(null);

  // Step 1: Form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (cwcFields && !prefix) { setError('Please select a title. Congressional offices require one to accept your message.'); return; }
    if (!name.trim()) { setError('Please enter your name'); return; }
    if (cwcFields && name.trim().split(/\s+/).length < 2) { setError('Please enter your first and last name. Congressional offices require both.'); return; }
    if (collectEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter your email so the campaign can update you when the bill moves');
      return;
    }
    if (cwcFields && !collectEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError('Please enter your email. Congressional offices require it for delivery.');
      return;
    }
    if (!street.trim()) { setError('Please enter your street address'); return; }
    if (!city.trim()) { setError('Please enter your city'); return; }
    if (!state) { setError('Please select your state'); return; }
    if (!zip.trim()) { setError('Please enter your ZIP code'); return; }

    // Mint the CAPTCHA token BEFORE leaving the form step: the invisible
    // Turnstile widget lives in the form's JSX, and switching to 'loading'
    // unmounts it — getToken() after that times out to an empty token and
    // anonymous users get a 403 from the AI routes. Minting can take seconds
    // on cautious networks, so the button shows a busy state the whole time.
    setSubmitting(true);
    let turnstileToken = '';
    try {
      turnstileToken = await getToken();
    } catch (tokenErr) {
      console.error('[participate] turnstile token failed:', tokenErr);
    }

    setStep('loading');
    setSubmitting(false);

    // Normalize before lookup: 2-letter state code (autofill may have stored
    // a full name) and a plain 5-digit ZIP (the Census geocoder is happiest
    // without the +4; we keep the user's full ZIP for display).
    const stateCode = toStateCode(state);
    const zip5 = zip.trim().match(/^\d{5}/)?.[0] ?? zip.trim();
    let committeeName: string | null = null;

    // State-bill campaigns are for that state's constituents: a Californian's
    // legislators have no vote on a Nevada bill, so their message would land
    // on the wrong desks. Check BEFORE any lookups.
    const requiredState =
      campaign.target_level === 'state' ? campaign.bill_state || campaign.target_filter?.state || null : null;
    if (requiredState && stateCode !== requiredState) {
      setStep('wrongState');
      setSubmitting(false);
      return;
    }

    try {
      // Fetch representatives
      const repRes = await fetch('/api/representatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ street: street.trim(), city: city.trim(), state: stateCode, zip: zip5 }),
      });

      const repData = await repRes.json();
      if (!repRes.ok) throw new FriendlyError(repData.error || 'Failed to find representatives');

      // Filter by campaign target level
      let filtered: Official[] = repData.officials || [];
      if (campaign.target_level === 'federal') {
        filtered = filtered.filter((o: Official) => o.level === 'federal');
      } else if (campaign.target_level === 'state') {
        filtered = filtered.filter((o: Official) => o.level === 'state');
      }

      // Stage targeting: only contact the officials who matter at this step
      // of the legislative journey. Floor stages narrow to the chamber that's
      // voting (house/lower vs senate/upper covers Congress and the states);
      // committee stages narrow to the committee's members — a message to an
      // office that isn't involved hurts the campaign's credibility.
      if (campaign.stage_goal === 'floor_house') {
        filtered = filtered.filter((o: Official) => o.chamber === 'house' || o.chamber === 'lower');
      } else if (campaign.stage_goal === 'floor_senate') {
        filtered = filtered.filter((o: Official) => o.chamber === 'senate' || o.chamber === 'upper');
      }
      if (campaign.target_filter?.type === 'committee' && campaign.target_filter.committee_id) {
        const cmteState = campaign.target_filter.state;
        const cmteRes = await fetch(
          `/api/committees/${campaign.target_filter.committee_id}/members${cmteState ? `?state=${cmteState}` : ''}`
        );
        const cmteData = await cmteRes.json();
        if (!cmteRes.ok) {
          throw new FriendlyError('We couldn’t load the committee roster for this campaign. Please try again.');
        }
        committeeName = cmteData.committee?.name ?? null;
        const roster = new Set<string>(cmteData.memberIds || []);
        filtered = filtered.filter((o: Official) => (cmteState ? o.level === 'state' : o.level === 'federal') && roster.has(o.id));
        if (filtered.length === 0) {
          setNoTargetName(cmteData.committee?.name || 'the targeted committee');
          setStep('noTarget');
          return;
        }
      }

      // Hand-picked officials: messages go only to the campaign's chosen
      // targets. A participant none of whose reps are targeted still gets
      // the other-ways-to-help path instead of a dead end.
      if (campaign.target_filter?.type === 'officials' && campaign.target_filter.officials?.length) {
        const roster = new Set(campaign.target_filter.officials.map((t) => t.id));
        filtered = filtered.filter((o: Official) => roster.has(o.id));
        if (filtered.length === 0) {
          setNoTargetName('the officials this campaign is targeting');
          setStep('noTarget');
          return;
        }
      }

      // Party slice: e.g. House Democrats, or one state's Republicans.
      if (campaign.target_filter?.type === 'party' && campaign.target_filter.party) {
        const f = campaign.target_filter;
        const wantParty = f.party as string;
        filtered = filtered.filter((o: Official) => {
          if (f.level && o.level !== f.level) return false;
          if (f.state && o.state !== f.state) return false;
          if (f.chamber && f.chamber !== 'both') {
            const houseLike = o.chamber === 'house' || o.chamber === 'lower';
            if (f.chamber === 'house' ? !houseLike : houseLike) return false;
          }
          return (o.party || '').charAt(0).toUpperCase() === wantParty;
        });
        if (filtered.length === 0) {
          setNoTargetName('the officials this campaign is targeting');
          setStep('noTarget');
          return;
        }
      }

      if (filtered.length === 0) {
        throw new FriendlyError('No representatives found for your address at the targeted level');
      }

      // Message mapping: on cosponsor stages, officials already on the bill
      // get a thank-you instead of a pitch; thank_you stages thank everyone.
      // Fails open (no intent) — a sponsor-lookup hiccup shouldn't block anyone.
      const intents: Record<string, 'persuade' | 'thank'> = {};
      if (campaign.stage_goal === 'thank_you') {
        for (const o of filtered) intents[o.id] = 'thank';
      } else if (campaign.stage_goal === 'cosponsor') {
        try {
          if (campaign.bill_level === 'state' && campaign.bill_state && campaign.bill_ref) {
            const csRes = await fetch(
              `/api/bills/state-sponsors?state=${campaign.bill_state}&ref=${encodeURIComponent(campaign.bill_ref)}`
            );
            if (csRes.ok) {
              const onBill = new Set<string>((await csRes.json()).memberIds || []);
              for (const o of filtered) {
                if (o.level === 'state') intents[o.id] = onBill.has(o.id) ? 'thank' : 'persuade';
              }
            }
          } else {
            // Federal: official weigh-ins store congress/type/number; user
            // campaigns store bill_ref ("H.R. 1234"), which we parse. Bills in
            // campaigns are current, so the ref path assumes this Congress.
            let congress = campaign.bill_congress ? String(campaign.bill_congress) : '';
            let type = campaign.bill_type || '';
            let number = campaign.bill_number || '';
            if (!(congress && type && number) && campaign.bill_ref) {
              const fed = detectBillReferences(campaign.bill_ref).find((r) => r.level === 'federal');
              if (fed) {
                congress = String(CURRENT_CONGRESS);
                type = fed.type;
                number = fed.number;
              }
            }
            if (congress && type && number) {
              const csRes = await fetch(
                `/api/bills/cosponsors?congress=${congress}&type=${encodeURIComponent(type)}&number=${encodeURIComponent(number)}`
              );
              if (csRes.ok) {
                const onBill = new Set<string>((await csRes.json()).bioguides || []);
                for (const o of filtered) {
                  if (o.level === 'federal') intents[o.id] = onBill.has(o.id) ? 'thank' : 'persuade';
                }
              }
            }
          }
        } catch (csErr) {
          console.warn('[participate] sponsor lookup failed, generating without intent:', csErr);
        }
      }
      setIntentByOfficial(intents);

      setOfficials(filtered);

      // Message-first assembly: the constituent already approved their core
      // message on the compose step. Each official gets a deterministic
      // envelope around that SAME core — no second AI pass, and the approved
      // words are never altered. Falls back to a starter draft if somehow no
      // core exists (e.g. drafting was down and they skipped ahead).
      const billRef =
        campaign.bill_ref ??
        (campaign.is_bill_specific && campaign.bill_type && campaign.bill_number
          ? `${({ hr: 'H.R.', s: 'S.', hres: 'H.Res.', sres: 'S.Res.', hjres: 'H.J.Res.', sjres: 'S.J.Res.', hconres: 'H.Con.Res.', sconres: 'S.Con.Res.' } as Record<string, string>)[campaign.bill_type.toLowerCase()] ?? campaign.bill_type.toUpperCase()} ${campaign.bill_number}`
          : null);
      const verb: 'support' | 'oppose' | null = isOfficial
        ? stance === 'oppose' ? 'oppose' : stance === 'support' ? 'support' : null
        : campaign.direction === 'oppose' ? 'oppose' : 'support';

      const msgMap: Record<string, OfficialMessage> = {};
      let fallback = false;
      for (const o of filtered) {
        if (coreDraft.trim()) {
          msgMap[o.name] = buildEnvelope(coreDraft.trim(), o, {
            intent: intents[o.id],
            committeeName,
            verb,
            billRef,
            stageGoal: campaign.stage_goal,
            headline: campaign.headline,
            senderName: name.trim(),
            city: city.trim(),
            stateCode,
            zip: zip5,
            coreSubject,
            coreOpening,
            coreAsk,
            originalWords: coreOriginal,
            // CWC carries name and address in separate fields: no signature in the text.
            signature: !cwcDeliverable(o),
          });
        } else {
          msgMap[o.name] = buildFallbackMessage(campaign, o, {
            stance, personalWhy, senderName: name.trim(), city: city.trim(), stateCode, zip: zip5,
          });
          fallback = true;
        }
      }
      setUsedFallback(fallback);
      setMessages(msgMap);
      setStep('review');
    } catch (err) {
      // Full detail (message + stack) stays in the console for debugging;
      // users never see raw runtime exceptions like WebKit's
      // "The string did not match the expected pattern."
      console.error('[participate] submit failed:', err, err instanceof Error ? err.stack : '');
      setError(
        err instanceof FriendlyError
          ? err.message
          : "We couldn't look up your officials. Double-check your address, or try just your 5-digit ZIP."
      );
      setStep('form');
    }
  };

  const updateMessage = (officialName: string, patch: Partial<OfficialMessage>) => {
    setMessages((prev) => ({ ...prev, [officialName]: { ...prev[officialName], ...patch } }));
  };

  // Delivery info for each official
  // Which offices accept CWC delivery (live list; empty until loaded → email path).
  const cwcOffices = useCwcActiveOffices();
  const channelFor = (official: Official) => (cwcFields ? congressChannel(official, cwcOffices, { prefix, email, street, zip }) : null);
  const cwcDeliverable = (official: Official) => channelFor(official) !== null;

  const deliveryInfoMap = useMemo(() => {
    const map = new Map<string, DeliveryInfo>();
    for (const official of officials) {
      try {
        map.set(official.id, determineDeliveryMethod(official, 'email'));
      } catch (err) {
        console.error('[participate] delivery method failed for', official.name, err);
      }
    }
    return map;
  }, [officials]);

  // Product decisions encoded here: opening a message into mail/form/phone
  // counts as sent (we never ask people to come back and confirm), and EACH
  // official engaged counts as an action. The first send click inserts the
  // participation row (stance counted once) and returns its id; every
  // further official bumps that row's messages_sent + the public action
  // count. Calls are serialized through a promise chain so follow-up clicks
  // see the action_id from the first, and each runs while the review step's
  // Turnstile widget is still mounted.
  const actionIdRef = useRef<string | null>(null);
  const participationChainRef = useRef<Promise<void>>(Promise.resolve());
  const recordEngagement = (initialMessagesSent = 1) => {
    participationChainRef.current = participationChainRef.current.then(async () => {
      const isFirst = !actionIdRef.current;
      if (isFirst) {
        trackEvent('campaign_action', { campaign: campaign.slug, issue: campaign.issue_area });
      }
      const turnstileToken = await getToken();
      try {
        const res = await fetch(`/api/campaigns/${campaign.slug}/participate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            participant_name: name.trim(),
            participant_email: collectEmail && email.trim() ? email.trim() : undefined,
            participant_city: city.trim(),
            participant_state: state,
            messages_sent: isFirst ? initialMessagesSent : undefined,
            stance: isFirst && isOfficial ? stance ?? undefined : undefined,
            action_id: actionIdRef.current ?? undefined,
            turnstileToken: turnstileToken || undefined,
          }),
        });
        if (!res.ok) {
          console.error('[participate] Failed:', res.status, await res.text());
          return;
        }
        const data = await res.json();
        if (data?.action_id) actionIdRef.current = data.action_id;
      } catch (err) {
        console.error('[participate] Failed:', err);
      }
    });
    return participationChainRef.current;
  };

  // Track send for a single official
  const trackSend = async (official: Official, deliveryStatus: string): Promise<SendOutcome> => {
    const msg = messages[official.name];
    if (!msg) return { ok: false };

    const isCwc = deliveryStatus === CWC_SUBMITTED_STATUS || deliveryStatus === WEBFORM_SUBMITTED_STATUS;
    setSentCount((c) => c + 1);
    fireFunnel('participate_send_clicked');
    const turnstileToken = await getToken();

    let outcome: SendOutcome = { ok: false };
    try {
    const res = await fetch('/api/track-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        advocate_name: name.trim(),
        advocate_email: collectEmail && email.trim() ? email.trim() : undefined,
        advocate_city: city.trim(),
        advocate_state: state,
        advocate_district: official.level === 'federal' && official.chamber === 'house' ? official.district || undefined : undefined,
        legislator_name: official.name,
        legislator_id: official.id,
        legislator_party: official.party,
        legislator_level: official.level,
        legislator_chamber: official.chamber,
        issue_area: campaign.issue_area,
        issue_subtopic: campaign.issue_subtopic || campaign.issue_area,
        message_body: msg.body,
        delivery_method: deliveryStatus === CWC_SUBMITTED_STATUS ? 'cwc' : deliveryStatus === WEBFORM_SUBMITTED_STATUS ? 'webform' : 'email',
        delivery_status: deliveryStatus,
        message_intent: intentByOfficial[official.id],
        campaign_id: campaign.id,
        turnstileToken: turnstileToken || undefined,
        // CWC delivery payload: ONLY on the "Send to Congress" click (never on
        // an email/copy click, so an office can't get the message twice), and
        // only when the rollout flag is on, the office is federal, and every
        // required field was collected. The server gates again.
        cwc:
          isCwc && cwcFields && official.level === 'federal' && prefix && email.trim() && street.trim() && /^\d{5}/.test(zip.trim())
            ? {
                prefix,
                street: street.trim(),
                zip: zip.trim().match(/^\d{5}(-\d{4})?/)?.[0] ?? zip.trim(),
                email: email.trim(),
                subject: (msg.subject || `Constituent message: ${campaign.headline}`).slice(0, 500),
                stance: stance === 'support' ? 'pro' : stance === 'oppose' ? 'con' : undefined,
                senate_class: official.chamber === 'senate' ? official.senateClass : undefined,
              }
            : undefined,
      }),
    });
      const data = await res.json().catch(() => null);
      if (!res.ok) {
        console.error('[track-send] Failed:', res.status, data);
        outcome = { ok: false, error: typeof data?.error === 'string' ? data.error : undefined };
      } else {
        outcome = { ok: true, cwc: data?.cwc };
      }
    } catch (err) {
      console.error('[track-send] Failed:', err);
    }

    // A CWC hand-off that failed is NOT a send: give the count back and let
    // the card fall back to the email path. (An email-app open counts as
    // sent regardless of tracking, so those paths record the engagement.)
    if (isCwc && !(outcome.ok && (outcome.cwc?.status === 'queued' || outcome.cwc?.status === 'held'))) {
      setSentCount((c) => Math.max(0, c - 1));
      return outcome;
    }
    if (isCwc) setCwcSentIds((m) => ({ ...m, [official.id]: true }));

    // Opened-into-mail counts as sent: record this official's engagement
    // now, while the user (and the Turnstile widget) are on the review step.
    void recordEngagement();
    return outcome;
  };

  // Complete participation
  const handleDone = async () => {
    // Engagements are normally already recorded per send click; this covers
    // the generated-but-never-clicked-send path. Must complete BEFORE
    // setStep('done') — the done step unmounts the TurnstileWidget, and
    // getToken() after that times out to an empty token, which 403s the
    // anonymous participate call. Same ordering rule as handleSubmit.
    await participationChainRef.current;
    // Only a real send counts. A reader who reviewed and clicked Done without
    // sending is not "someone who weighed in" (audit 2026-09-28).
    if (!actionIdRef.current && sentCount > 0) {
      await recordEngagement(sentCount);
    }
    setStep('done');

    if (!isOfficial) return;
    try {
      const res = await fetch(`/api/campaigns/${campaign.slug}`);
      if (res.ok) {
        const data = await res.json();
        setPollResults({
          support: Number(data.support_count) || 0,
          oppose: Number(data.oppose_count) || 0,
          undecided: Number(data.undecided_count) || 0,
        });
      }
    } catch {
      // Results reveal is best-effort.
    }
  };

  // Step 1: Form
  if (step === 'stance') {
    const stanceButton = (value: Stance, label: string, help: string) => (
      <button
        type="button"
        onClick={() => {
          setStance(value);
          trackEvent('campaign_stance_selected', { campaign: campaign.slug, stance: value });
          setStep('compose');
        }}
        className="w-full p-4 rounded-xl border-2 border-gray-200 dark:border-gray-600 hover:border-purple-500 hover:bg-purple-50 dark:hover:bg-purple-900/20 text-left transition-colors"
      >
        <span className="block text-base font-semibold text-gray-900 dark:text-white">{label}</span>
        <span className="block text-sm text-gray-500 dark:text-gray-400 mt-0.5">{help}</span>
      </button>
    );

    return (
      <div className="space-y-5">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t.positionTitle}</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            {t.positionHelp}
          </p>
        </div>

        <div className="space-y-2">
          {stanceButton('support', t.supportLabel, t.supportHelp)}
          {stanceButton('oppose', t.opposeLabel, t.opposeHelp)}
        </div>
      </div>
    );
  }

  // Step: compose — the message comes FIRST. Value before identity: they see
  // and approve their own message before we ask for an address.
  if (step === 'compose') {
    return (
      <div className="space-y-5">
        <TurnstileWidget />
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {!coreDraft && followUpQuestions.length > 0 ? (
          <>
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">{t.followUpTitle}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                {t.followUpHelp}
              </p>
            </div>
            <div className="space-y-4">
              {followUpQuestions.map((question, i) => (
                <div key={i}>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {question}
                  </label>
                  <input
                    type="text"
                    value={followUpAnswers[i] ?? ''}
                    onChange={(e) =>
                      setFollowUpAnswers((prev) => prev.map((a, j) => (j === i ? e.target.value : a)))
                    }
                    maxLength={300}
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button onClick={finishFollowUps} disabled={coreStatus === 'drafting'} className="flex-1">
                {coreStatus === 'drafting' ? t.writing : t.continue}
              </Button>
              <button
                type="button"
                onClick={finishFollowUps}
                disabled={coreStatus === 'drafting'}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {t.skip}
              </button>
            </div>
          </>
        ) : !coreDraft && composeMode === 'chat' ? (
          <>
            <div ref={chatScrollRef} className="max-h-[22rem] overflow-y-auto space-y-3 pr-1">
              {chatMessages.map((m, i) => (
                <div key={i} className={m.role === 'user' ? 'flex justify-end' : 'flex justify-start'}>
                  <div
                    className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm whitespace-pre-line ${
                      m.role === 'user'
                        ? 'bg-purple-600 text-white rounded-br-sm'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-100 rounded-bl-sm'
                    }`}
                  >
                    {m.content || (chatStreaming ? '…' : '')}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <textarea
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    void sendChat();
                  }
                }}
                placeholder={t.chatPlaceholder}
                rows={2}
                disabled={chatStreaming}
                className="flex-1 px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 text-sm"
              />
              <button type="button" onClick={() => setChatInput(t.ratherNotSayInput)} disabled={chatStreaming} className="self-end text-xs text-gray-500 dark:text-gray-400 underline whitespace-nowrap pb-3">{t.ratherNotSay}</button>
              <MicButton text={chatInput} setText={setChatInput} disabled={chatStreaming} className="self-end" />
              <Button onClick={() => void sendChat()} isLoading={chatStreaming} className="self-end">
                {t.send}
              </Button>
            </div>
            <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
              <Button
                onClick={draftFromChat}
                disabled={!canDraftFromChat || chatStreaming || coreStatus === 'drafting'}
                className="w-full"
              >
                {coreStatus === 'drafting' ? t.writing : t.draftMyMessage}
              </Button>
              <p className="text-xs text-gray-400 dark:text-gray-500 text-center mt-1.5">
                {canDraftFromChat ? t.guideReadyHint : t.guideMoreHint}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setComposeMode('write')}
              className="block mx-auto text-xs text-gray-500 dark:text-gray-400 underline"
            >
              {t.writeItMyself}
            </button>
          </>
        ) : !coreDraft ? (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.whyLabel} <span className="text-gray-400 dark:text-gray-500 font-normal">{t.whyOptional}</span>
              </label>
              <textarea
                value={personalWhy}
                onChange={(e) => setPersonalWhy(e.target.value)}
                placeholder={t.whyPlaceholder}
                rows={4}
                maxLength={2000}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-y bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
              />
            </div>
            <Button
              onClick={() => void startDraftFlow()}
              disabled={coreStatus === 'drafting' || fetchingQuestions}
              className="w-full"
            >
              {coreStatus === 'drafting' ? t.writing : fetchingQuestions ? t.oneMoment : t.draftMyMessage}
            </Button>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center">
              {t.reviewBeforeAnything}
            </p>
            <button
              type="button"
              onClick={() => setComposeMode('chat')}
              className="block mx-auto text-xs text-gray-500 dark:text-gray-400 underline"
            >
              {t.useTheGuide}
            </button>
          </>
        ) : (
          <>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.yourMessage} <span className="text-gray-400 dark:text-gray-500 font-normal">{t.yourMessageHint}</span>
              </label>
              <textarea
                value={coreDraft}
                onChange={(e) => setCoreDraft(e.target.value)}
                rows={10}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-y bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {t.greetingAdded}
              </p>
              {coreOriginal && (
                <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-xl space-y-2">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    Su mensaje se enviará en inglés junto con sus propias palabras en español.
                  </p>
                  {coreBodyEs && (
                    <details>
                      <summary className="text-sm text-purple-700 dark:text-purple-300 cursor-pointer select-none">
                        Leer el mensaje en español
                      </summary>
                      <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line border-l-2 border-purple-400 pl-3">
                        {coreBodyEs}
                      </p>
                      <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                        Esta es una traducción para que usted la revise. Si edita el texto en inglés arriba, esta copia no cambia.
                      </p>
                    </details>
                  )}
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => {
                  fireFunnel('participate_core_approved');
                  setStep('form');
                }}
                className="flex-1"
              >
                {t.looksGoodNext}
              </Button>
              <button
                type="button"
                onClick={() => void draftCore(undefined, composeMode === 'chat' ? chatMessages.filter((m) => m.content.trim()) : undefined)}
                disabled={coreStatus === 'drafting'}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-sm text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {coreStatus === 'drafting' ? t.redrafting : t.redraft}
              </button>
            </div>
          </>
        )}
      </div>
    );
  }

  if (step === 'form') {
    return (
      <form onSubmit={handleFormSubmit} className="space-y-5">
        {stance && (
          <div className="flex items-center justify-between gap-2 p-3 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-xl">
            <p className="text-xs text-purple-900 dark:text-purple-200">
              {t.yourPosition}{' '}
              <span className="font-semibold">
                {stance === 'support' ? t.stanceSupport : stance === 'oppose' ? t.stanceOppose : t.stanceUndecided}
              </span>
            </p>
            <button
              type="button"
              onClick={() => setStep('stance')}
              className="text-xs font-medium text-purple-600 dark:text-purple-400 hover:underline shrink-0"
            >
              {t.change}
            </button>
          </div>
        )}
        {profileLoaded && (
          <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-xl">
            <p className="text-xs text-green-700 dark:text-green-300 flex items-center gap-1.5">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              {t.prefilled}
            </p>
          </div>
        )}
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div className={cwcFields ? 'grid grid-cols-[7rem_1fr] gap-3' : undefined}>
          {cwcFields && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t.title} <span className="text-red-500">*</span>
              </label>
              <select
                value={prefix}
                onChange={(e) => setPrefix(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="" disabled>{t.choose}</option>
                {CWC_PREFIXES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.yourName} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={t.yourNamePlaceholder}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
        </div>

        {cwcFields && !collectEmail && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.email} <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t.emailRequiredNote}
            </p>
          </div>
        )}

        {collectEmail && (
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.email} <span className="text-red-500">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {t.emailFollowUpNote(campaign.org_name || t.organizerFallback)}
            </p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t.streetAddress} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder={t.streetPlaceholder}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.city} <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder={t.city}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {t.state} <span className="text-red-500">*</span>
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">{t.selectState}</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            {t.zip} <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={zip}
            onChange={(e) => setZip(e.target.value)}
            placeholder="12345"
            maxLength={10}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        <div className="p-3 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-xl">
          <p className="text-xs text-purple-700 dark:text-purple-300">
            {t.approvedGoesToEach}
          </p>
        </div>

        <TurnstileWidget />

        <Button type="submit" className="w-full" size="lg" isLoading={submitting}>
          {t.findMyOfficials}
        </Button>

        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          {t.addressUse}{' '}
          <a href="/privacy" className="underline hover:text-gray-600 dark:hover:text-gray-300">{t.privacyPolicy}</a>.
        </p>
      </form>
    );
  }

  // Step 2: Loading
  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center py-16">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-purple-200 dark:border-purple-800 rounded-full animate-spin border-t-purple-600"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-300 mt-4 font-medium">{t.findingOfficials}</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">{t.generatingMessages}</p>
      </div>
    );
  }

  // Committee stage, but none of this participant's reps sit on the
  // committee: never send to uninvolved offices — offer other ways to help.
  if (step === 'noTarget') {
    const shareUrl = campaign.custom_domain
      ? `https://${campaign.custom_domain}/`
      : `https://www.mydemocracy.app/campaign/${campaign.slug}`;
    return (
      <div className="max-w-xl mx-auto py-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          Your representatives aren&apos;t on {noTargetName}
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          This stage of the campaign targets only the members of {noTargetName}, so their offices hear from the
          constituents they represent. Your voice still matters. Here are the best ways to help right now.
        </p>
        {parentCampaign && (
          <Link
            href={`/campaign/${parentCampaign.slug}`}
            className="inline-block mb-4 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Send a broader message to your own legislators instead
          </Link>
        )}
        <div className="mb-6 text-left">
          <SocialShare url={shareUrl} text={`"${campaign.headline}" is in front of ${noTargetName} right now. If your rep is on the committee, they need to hear from you.`} />
        </div>
        <button
          onClick={() => setStep('form')}
          className="text-sm text-purple-600 dark:text-purple-400 hover:underline"
        >
          &larr; Try a different address
        </button>
      </div>
    );
  }

  // State-bill campaign, participant from another state: their legislators
  // have no vote here — don't generate an irrelevant message. Explain why and
  // offer ways to stay useful.
  if (step === 'wrongState') {
    const requiredState = campaign.bill_state || campaign.target_filter?.state || '';
    const stateName = US_STATES.find((s) => s.code === requiredState)?.name || requiredState;
    const shareUrl = campaign.custom_domain
      ? `https://${campaign.custom_domain}/`
      : `https://www.mydemocracy.app/campaign/${campaign.slug}`;
    return (
      <div className="max-w-xl mx-auto py-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
          <svg className="w-8 h-8 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">
          This campaign is for {stateName} constituents
        </h3>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          It&apos;s about a bill in the {stateName} legislature, and only {stateName} legislators vote on it. Your
          own state legislators aren&apos;t part of this decision. The most useful thing you can do is pass it along
          to people in {stateName}, or find an issue where <em>your</em> officials are the ones deciding.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 justify-center mb-6">
          <Link
            href="/issues"
            className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium rounded-lg transition-colors"
          >
            Find an issue for your state
          </Link>
        </div>
        <div className="mb-6 text-left">
          <SocialShare url={shareUrl} text={`${stateName} friends: "${campaign.headline}" needs your voice. Your legislators are the ones deciding.`} />
        </div>
        <button onClick={() => setStep('form')} className="text-sm text-purple-600 dark:text-purple-400 hover:underline">
          &larr; I entered the wrong address
        </button>
      </div>
    );
  }

  // Step 3: Review & Send
  if (step === 'review') {
    return (
      <div className="space-y-4">
        <TurnstileWidget />
        <div className="text-center mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {t.messagesReady(officials.length)}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {t.sendEachBelow}
          </p>
        </div>

        {campaign.message_template && (
          <details className="p-3 bg-gray-50 dark:bg-gray-700/40 border border-gray-200 dark:border-gray-600 rounded-xl">
            <summary className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer select-none">
              {t.seeTalkingPoints}
            </summary>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 whitespace-pre-line border-l-2 border-purple-400 pl-3">
              {campaign.message_template}
            </p>
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              {t.everythingElseYourVoice}
            </p>
          </details>
        )}

        {usedFallback && (
          <div className="p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-xl">
            <p className="text-sm text-amber-800 dark:text-amber-300 font-medium">
              {t.aiUnavailable}
            </p>
            <p className="text-xs text-amber-700 dark:text-amber-400 mt-1">
              {t.makeItYourOwn}
            </p>
          </div>
        )}

        {officials.map((official) => {
          const msg = messages[official.name];
          const deliveryInfo = deliveryInfoMap.get(official.id);
          if (!msg || !deliveryInfo) return null;

          const mailtoLink = deliveryInfo.email
            ? generateMailtoLink(deliveryInfo.email, msg.subject, msg.body)
            : null;

          return (
            <OfficialSendCard
              key={official.id}
              ui={t}
              official={official}
              message={msg}
              deliveryInfo={deliveryInfo}
              mailtoLink={mailtoLink}
              onSend={(status) => trackSend(official, status)}
              onEdit={(patch) => updateMessage(official.name, patch)}
              startOpen={usedFallback}
              cwcDelivery={channelFor(official)}
              alreadySent={!!cwcSentIds[official.id]}
              adoptionAsk={
                isNonParticipatingSenator(official, cwcOffices) && email.trim()
                  ? {
                      participating: participatingSenateCount(cwcOffices),
                      // The platform's own ask: pre-checked on official weigh-ins and the
                      // contact flow; off by default on an organization's campaign.
                      defaultChecked: isOfficial,
                      onSign: () => {
                        void (async () => {
                          const turnstileToken = await getToken().catch(() => '');
                          submitAdoptionSignature({
                            senator_id: official.id,
                            senator_name: official.name,
                            state: state.slice(0, 2).toUpperCase(),
                            office_code: cwcOfficeCodeFor(official) ?? undefined,
                            name: name.trim(),
                            email: email.trim(),
                            city: city.trim() || undefined,
                            zip: zip.trim().match(/^\d{5}(-\d{4})?/)?.[0],
                            source: 'campaign',
                            campaign_id: campaign.id,
                            turnstileToken: turnstileToken || undefined,
                          });
                        })();
                      },
                    }
                  : undefined
              }
            />
          );
        })}

        <Button onClick={handleDone} className="w-full" size="lg">
          {t.done}
        </Button>
      </div>
    );
  }

  // Step 4: Done
  return (
    <div className="text-center py-8">
      <div className="w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg className="w-10 h-10 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">{sentCount > 0 || actionIdRef.current ? t.sent : t.nothingSentYet}</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        {sentCount > 0 || actionIdRef.current
          ? t.inTheCount
          : t.sendWhenReady}
      </p>

      {/* Reader-poll results — revealed only AFTER this reader picked and acted */}
      {stance && pollResults && (() => {
        const total = pollResults.support + pollResults.oppose + pollResults.undecided;
        const rows: Array<{ key: Stance; label: string; count: number }> = [
          { key: 'support', label: t.stanceSupport, count: pollResults.support },
          { key: 'oppose', label: t.stanceOppose, count: pollResults.oppose },
          // "Still deciding" is no longer an option; only show it if older
          // campaigns still carry historical undecided counts.
          ...(pollResults.undecided > 0
            ? [{ key: 'undecided' as Stance, label: t.stanceUndecided, count: pollResults.undecided }]
            : []),
        ];
        const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);
        const ownPct = pct(rows.find((r) => r.key === stance)?.count ?? 0);
        return (
          <div className="mb-6 p-4 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-sm text-left">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
              {t.readersSoFar}
            </h4>
            {total < 20 ? (
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {t.beFirst}
              </p>
            ) : (
              <>
                <p className="text-xs text-purple-600 dark:text-purple-400 font-medium mb-3">
                  {t.youreWith(ownPct)}
                </p>
                <div className="space-y-2.5">
                  {rows.map(({ key, label, count }) => (
                    <div key={key}>
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className={key === stance ? 'font-semibold text-purple-700 dark:text-purple-300' : 'font-medium text-gray-600 dark:text-gray-400'}>
                          {label}{key === stance ? t.yourPositionSuffix : ''}
                        </span>
                        <span className="text-gray-500 dark:text-gray-400">{pct(count)}%</span>
                      </div>
                      <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2.5">
                        <div
                          className={`h-2.5 rounded-full transition-all ${key === stance ? 'bg-purple-600 dark:bg-purple-400' : 'bg-gray-300 dark:bg-gray-500'}`}
                          style={{ width: `${pct(count)}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-3">
                  {total.toLocaleString()} reader{total !== 1 ? 's have' : ' has'} weighed in. A reader poll, not a scientific survey.
                </p>
              </>
            )}
          </div>
        );
      })()}

      <SupportNudge />

      {/* Share section — opt-in; shares your position, never your name */}
      <div className="mb-6 text-left">
        <SocialShare
          url={
            stance
              ? `${campaign.custom_domain ? `https://${campaign.custom_domain}/` : `https://www.mydemocracy.app/campaign/${campaign.slug}`}?from=stance&pos=${stance}`
              : campaign.custom_domain
                ? `https://${campaign.custom_domain}/`
                : `https://www.mydemocracy.app/campaign/${campaign.slug}`
          }
          text={
            stance
              ? `I just weighed in on "${campaign.headline}". Where do you land? 👇`
              : `I just took action on "${campaign.headline}". Join me.`
          }
          title={campaign.headline}
          prompt="Share where you stand. Your position, never your name."
          appendUtmSource
        />
      </div>

      <Link
        href="/campaign/create"
        className="text-sm text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 font-medium"
      >
        Start your own campaign
      </Link>
    </div>
  );
}

// Sub-components

function getPartyColors(party: string): { bg: string; text: string } {
  const p = party.toLowerCase();
  if (p.includes('democrat')) return { bg: 'bg-blue-100', text: 'text-blue-700' };
  if (p.includes('republican')) return { bg: 'bg-red-100', text: 'text-red-700' };
  return { bg: 'bg-gray-100', text: 'text-gray-700' };
}

function OfficialSendCard({
  official,
  message,
  deliveryInfo,
  mailtoLink,
  onSend,
  onEdit,
  startOpen,
  cwcDelivery,
  alreadySent,
  adoptionAsk,
  ui,
}: {
  official: Official;
  /** Copy in the campaign's language. */
  ui: ParticipateCopy;
  message: OfficialMessage;
  deliveryInfo: DeliveryInfo;
  mailtoLink: string | null;
  onSend: (status: string) => Promise<SendOutcome | void> | void;
  onEdit: (patch: Partial<OfficialMessage>) => void;
  startOpen: boolean;
  /** 'cwc' or 'webform': ONE "Send to Congress" action, no email/copy. */
  cwcDelivery?: 'cwc' | 'webform' | null;
  /** True when this session already handed this official's message to CWC. */
  alreadySent?: boolean;
  /** Present for a senator whose office is not on the CWC list. */
  adoptionAsk?: { participating: number; defaultChecked: boolean; onSign: () => void };
}) {
  const [signChecked, setSignChecked] = useState(adoptionAsk?.defaultChecked ?? false);
  const [signed, setSigned] = useState(false);
  const send = (status: string) => {
    if (adoptionAsk && signChecked) { adoptionAsk.onSign(); setSigned(true); }
    return onSend(status);
  };
  const [copied, setCopied] = useState(false);
  const copy = cwcDelivery === 'webform'
    ? { idle: ui.webformIdle, sending: ui.webformSending, sent: ui.webformSent }
    : { idle: ui.cwcIdle, sending: ui.cwcSending, sent: ui.cwcSent };
  const submitStatus = cwcDelivery === 'webform' ? WEBFORM_SUBMITTED_STATUS : CWC_SUBMITTED_STATUS;
  const [cwcState, setCwcState] = useState<CwcButtonState>(alreadySent ? 'sent' : 'idle');
  const [cwcNote, setCwcNote] = useState<string>(alreadySent ? copy.sent : copy.idle);
  // After a failed hand-off the card falls back to the email/form actions.
  const showCwc = cwcDelivery && cwcState !== 'failed';
  // Starter drafts open ready to write; AI drafts start collapsed. Track
  // open state ourselves so re-renders from typing don't fight the toggle.
  const [editOpen, setEditOpen] = useState(startOpen);
  const partyColors = getPartyColors(official.party);

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.body);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="p-4 rounded-xl border border-gray-200 dark:border-gray-700">
      {/* Official info */}
      <div className="mb-3">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${partyColors.bg} ${partyColors.text}`}>
            {official.party}
          </span>
          {official.level === 'state' && (
            <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
              {ui.stateBadge}
            </span>
          )}
        </div>
        <p className="font-semibold text-gray-900 dark:text-white">{official.name}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{official.title}</p>
      </div>

      {cwcDelivery && cwcState === 'failed' && (
        <p className="mb-3 p-2 text-xs rounded-lg bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 text-amber-700 dark:text-amber-300">{cwcNote}</p>
      )}

      {/* Actions */}
      <div className="space-y-2">
        {showCwc ? (
          // Office participates in Communicating With Congress: one action,
          // delivered by us. No email app, no copy: sending it twice breaks
          // the office's grouping and counts the constituent twice.
          <>
            <button
              type="button"
              disabled={cwcState !== 'idle'}
              onClick={async () => {
                setCwcState('sending');
                setCwcNote(copy.sending);
                const outcome = await onSend(submitStatus);
                const d = describeCwcOutcome(outcome ?? undefined);
                setCwcState(d.state);
                setCwcNote(d.state === 'sent' ? copy.sent : d.note);
              }}
              className={`flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium transition-colors ${cwcState === 'sent' ? 'bg-green-600 text-white cursor-default' : cwcState === 'sending' ? 'bg-purple-400 text-white cursor-wait' : 'bg-purple-600 hover:bg-purple-700 text-white'}`}
            >
              {cwcState === 'sent' ? (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
              ) : (
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
              )}
              {cwcState === 'sent' ? ui.sentToCongress : cwcState === 'sending' ? ui.sending : ui.sendToCongress}
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400">{cwcNote}</p>
          </>
        ) : deliveryInfo.method === 'staffer_email' && mailtoLink ? (
          <>
            <button
              onClick={() => {
                window.open(mailtoLink, '_blank');
                send('email_opened');
              }}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              {ui.sendEmail}{deliveryInfo.stafferName ? ` (${deliveryInfo.stafferName})` : ''}
            </button>
            {!deliveryInfo.captchaBlocked && deliveryInfo.note && (
              <p className="text-xs text-gray-500 dark:text-gray-400">{deliveryInfo.note}</p>
            )}
          </>
        ) : deliveryInfo.method === 'contact_form' && deliveryInfo.contactFormUrl ? (
          <a
            href={deliveryInfo.contactFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { copyMessage(); send('form_opened'); }}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {ui.openContactForm}
          </a>
        ) : deliveryInfo.method === 'website' && deliveryInfo.websiteUrl ? (
          <a
            href={deliveryInfo.actionUrl || deliveryInfo.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { copyMessage(); send('website_opened'); }}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            {ui.visitWebsite}
          </a>
        ) : official.phone ? (
          <a
            href={`tel:${official.phone.replace(/[^\d+]/g, '')}`}
            onClick={() => send('called')}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            {ui.call} {formatPhone(official.phone)}
          </a>
        ) : (
          <span className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm">
            {ui.noContactMethod}
          </span>
        )}

        {!showCwc && adoptionAsk && (
          <CwcAdoptionAsk
            senatorLastName={official.lastName || official.name.split(' ').pop() || official.name}
            participating={adoptionAsk.participating}
            defaultChecked={adoptionAsk.defaultChecked}
            onCheckedChange={setSignChecked}
            signed={signed}
          />
        )}

        {!showCwc && <button
          onClick={copyMessage}
          className="flex items-center justify-center gap-1.5 w-full py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-xs font-medium transition-colors"
        >
          {copied ? (
            <svg className="w-3.5 h-3.5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
          )}
          {copied ? ui.copied : ui.copyMessage}
        </button>}
      </div>

      {/* Message editor — edits flow back up so mailto/copy use them */}
      <details
        className="mt-3 group"
        open={editOpen}
        onToggle={(e) => setEditOpen((e.target as HTMLDetailsElement).open)}
      >
        <summary className="cursor-pointer text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
          <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          {ui.viewEditMessage}
        </summary>
        <div className="mt-2 space-y-2">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{ui.subject}</label>
            <input
              type="text"
              value={message.subject}
              onChange={(e) => onEdit({ subject: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-sm text-gray-900 dark:text-white"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{ui.message}</label>
            <textarea
              value={message.body}
              onChange={(e) => onEdit({ body: e.target.value })}
              rows={10}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-y bg-white dark:bg-gray-700 text-sm leading-relaxed text-gray-900 dark:text-white"
            />
          </div>
        </div>
      </details>
    </div>
  );
}
