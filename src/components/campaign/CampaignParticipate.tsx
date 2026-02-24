'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import type { Campaign } from '@/lib/types';
import type { Official } from '@/lib/types';
import { US_STATES } from '@/lib/constants';
import { Button } from '@/components/ui/Button';
import { formatPhone } from '@/lib/utils';
import {
  determineDeliveryMethod,
  generateMailtoLink,
  type DeliveryInfo,
} from '@/lib/delivery';

type Step = 'form' | 'loading' | 'review' | 'done';

interface OfficialMessage {
  subject: string;
  body: string;
}

export function CampaignParticipate({ campaign }: { campaign: Campaign }) {
  const [step, setStep] = useState<Step>('form');

  // Form fields
  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [personalWhy, setPersonalWhy] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Data from API calls
  const [officials, setOfficials] = useState<Official[]>([]);
  const [messages, setMessages] = useState<Record<string, OfficialMessage>>({});
  const [sentCount, setSentCount] = useState(0);

  // Step 1: Form submission
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) { setError('Please enter your name'); return; }
    if (!street.trim()) { setError('Please enter your street address'); return; }
    if (!city.trim()) { setError('Please enter your city'); return; }
    if (!state) { setError('Please select your state'); return; }
    if (!zip.trim()) { setError('Please enter your ZIP code'); return; }

    setStep('loading');

    try {
      // Fetch representatives
      const repRes = await fetch('/api/representatives', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ street: street.trim(), city: city.trim(), state, zip: zip.trim() }),
      });

      const repData = await repRes.json();
      if (!repRes.ok) throw new Error(repData.error || 'Failed to find representatives');

      // Filter by campaign target level
      let filtered: Official[] = repData.officials || [];
      if (campaign.target_level === 'federal') {
        filtered = filtered.filter((o: Official) => o.level === 'federal');
      } else if (campaign.target_level === 'state') {
        filtered = filtered.filter((o: Official) => o.level === 'state');
      }

      if (filtered.length === 0) {
        throw new Error('No representatives found for your address at the targeted level');
      }

      setOfficials(filtered);

      // Generate messages
      const ask = campaign.message_template
        ? `${campaign.headline}. ${campaign.message_template}`
        : campaign.headline;

      const msgRes = await fetch('/api/generate-message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          officials: filtered.map((o: Official) => ({
            name: o.name,
            lastName: o.lastName,
            stafferFirstName: o.stafferFirstName,
            title: o.title,
            party: o.party,
            state: o.state,
          })),
          issue: campaign.issue_subtopic || campaign.issue_area,
          ask,
          personalWhy: personalWhy.trim() || undefined,
          senderName: name.trim(),
          address: { street: street.trim(), city: city.trim(), state, zip: zip.trim() },
          contactMethod: 'email',
        }),
      });

      const msgData = await msgRes.json();
      if (!msgRes.ok) throw new Error(msgData.error || 'Failed to generate messages');

      const msgMap: Record<string, OfficialMessage> = {};
      for (const msg of msgData.messages) {
        msgMap[msg.officialName] = { subject: msg.subject, body: msg.body };
      }
      setMessages(msgMap);
      setStep('review');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
      setStep('form');
    }
  };

  // Delivery info for each official
  const deliveryInfoMap = useMemo(() => {
    const map = new Map<string, DeliveryInfo>();
    for (const official of officials) {
      map.set(official.id, determineDeliveryMethod(official, 'email'));
    }
    return map;
  }, [officials]);

  // Track send for a single official
  const trackSend = (official: Official, deliveryStatus: string) => {
    const msg = messages[official.name];
    if (!msg) return;

    setSentCount((c) => c + 1);

    fetch('/api/track-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        advocate_name: name.trim(),
        advocate_city: city.trim(),
        advocate_state: state,
        legislator_name: official.name,
        legislator_id: official.id,
        legislator_party: official.party,
        legislator_level: official.level,
        legislator_chamber: official.chamber,
        issue_area: campaign.issue_area,
        issue_subtopic: campaign.issue_subtopic || campaign.issue_area,
        message_body: msg.body,
        delivery_method: 'email',
        delivery_status: deliveryStatus,
        campaign_id: campaign.id,
      }),
    }).catch((err) => console.error('[track-send] Failed:', err));
  };

  // Complete participation
  const handleDone = async () => {
    setStep('done');

    fetch(`/api/campaigns/${campaign.slug}/participate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        participant_name: name.trim(),
        participant_city: city.trim(),
        participant_state: state,
        messages_sent: sentCount,
      }),
    }).catch((err) => console.error('[participate] Failed:', err));
  };

  // Step 1: Form
  if (step === 'form') {
    return (
      <form onSubmit={handleFormSubmit} className="space-y-5">
        {error && (
          <div className="p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-xl">
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Your Name <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Your full name"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Street Address <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            value={street}
            onChange={(e) => setStreet(e.target.value)}
            placeholder="123 Main St"
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              City <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="City"
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              State <span className="text-red-500">*</span>
            </label>
            <select
              value={state}
              onChange={(e) => setState(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">Select state</option>
              {US_STATES.map((s) => (
                <option key={s.code} value={s.code}>{s.name}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            ZIP Code <span className="text-red-500">*</span>
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

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Why does this matter to you? <span className="text-gray-400 dark:text-gray-500 font-normal">(optional)</span>
          </label>
          <textarea
            value={personalWhy}
            onChange={(e) => setPersonalWhy(e.target.value)}
            placeholder="Share your personal connection to this issue..."
            rows={3}
            className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-transparent resize-none bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Personal stories make messages more impactful.
          </p>
        </div>

        <div className="p-3 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-xl">
          <p className="text-xs text-purple-700 dark:text-purple-300">
            AI will write personalized messages to your representatives based on this campaign. You&apos;ll review before sending.
          </p>
        </div>

        <Button type="submit" className="w-full" size="lg">
          Find My Representatives
        </Button>

        <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
          Your address is used only to find your representatives. See our{' '}
          <a href="/privacy" className="underline hover:text-gray-600 dark:hover:text-gray-300">Privacy Policy</a>.
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
        <p className="text-gray-600 dark:text-gray-300 mt-4 font-medium">Finding your representatives...</p>
        <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">Generating personalized messages</p>
      </div>
    );
  }

  // Step 3: Review & Send
  if (step === 'review') {
    return (
      <div className="space-y-4">
        <div className="text-center mb-2">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            {officials.length} Message{officials.length !== 1 ? 's' : ''} Ready
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Send each message using the options below
          </p>
        </div>

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
              official={official}
              message={msg}
              deliveryInfo={deliveryInfo}
              mailtoLink={mailtoLink}
              onSend={(status) => trackSend(official, status)}
            />
          );
        })}

        <Button onClick={handleDone} className="w-full" size="lg">
          Done
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
      <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">Thank You!</h3>
      <p className="text-gray-600 dark:text-gray-300 mb-6">
        Your voice matters. Every message counts toward making a difference.
      </p>

      {/* Share buttons */}
      <div className="flex flex-col gap-3 mb-6">
        <ShareButton slug={campaign.slug} />
        <a
          href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just took action on "${campaign.headline}" — you should too!`)}&url=${encodeURIComponent(typeof window !== 'undefined' ? `${window.location.origin}/campaign/${campaign.slug}` : `/campaign/${campaign.slug}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 border-2 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg font-medium transition-colors text-center"
        >
          Share on X / Twitter
        </a>
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

function ShareButton({ slug }: { slug: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    const url = `${window.location.origin}/campaign/${slug}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <button
      onClick={handleCopy}
      className="w-full py-3 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
    >
      {copied ? 'Link Copied!' : 'Copy Campaign Link'}
    </button>
  );
}

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
}: {
  official: Official;
  message: OfficialMessage;
  deliveryInfo: DeliveryInfo;
  mailtoLink: string | null;
  onSend: (status: string) => void;
}) {
  const [copied, setCopied] = useState(false);
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
              State
            </span>
          )}
        </div>
        <p className="font-semibold text-gray-900 dark:text-white">{official.name}</p>
        <p className="text-sm text-gray-600 dark:text-gray-400">{official.title}</p>
      </div>

      {/* Actions */}
      <div className="space-y-2">
        {deliveryInfo.method === 'staffer_email' && mailtoLink ? (
          <button
            onClick={() => {
              window.open(mailtoLink, '_blank');
              onSend('email_opened');
            }}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            Send Email{deliveryInfo.stafferName ? ` to ${deliveryInfo.stafferName}` : ''}
          </button>
        ) : deliveryInfo.method === 'contact_form' && deliveryInfo.contactFormUrl ? (
          <a
            href={deliveryInfo.contactFormUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { copyMessage(); onSend('form_opened'); }}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Open Contact Form
          </a>
        ) : deliveryInfo.method === 'website' && deliveryInfo.websiteUrl ? (
          <a
            href={deliveryInfo.actionUrl || deliveryInfo.websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            onClick={() => { copyMessage(); onSend('website_opened'); }}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
            </svg>
            Visit Website
          </a>
        ) : official.phone ? (
          <a
            href={`tel:${official.phone.replace(/[^\d+]/g, '')}`}
            onClick={() => onSend('called')}
            className="flex items-center justify-center gap-2 w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
            </svg>
            Call {formatPhone(official.phone)}
          </a>
        ) : (
          <span className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm">
            No contact method available
          </span>
        )}

        <button
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
          {copied ? 'Copied!' : 'Copy Message'}
        </button>
      </div>

      {/* Message preview */}
      <details className="mt-3 group">
        <summary className="cursor-pointer text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
          <svg className="w-3 h-3 transition-transform group-open:rotate-90" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
          Preview message
        </summary>
        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-300 whitespace-pre-line max-h-32 overflow-y-auto">
          <p className="font-medium mb-1">Subject: {message.subject}</p>
          {message.body}
        </div>
      </details>
    </div>
  );
}
