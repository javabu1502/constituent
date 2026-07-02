'use client';

import { useState, useMemo, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { trackEvent } from '@/lib/analytics';
import type { ContactState, ContactAction } from './ContactFlow';
import type { Official } from '@/lib/types';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { formatPhone } from '@/lib/utils';
import {
  determineDeliveryMethod,
  generateMailtoLink,
  type DeliveryInfo,
} from '@/lib/delivery';
import { PHONE_TIPS } from '@/lib/phone-tips';

interface SendStepProps {
  state: ContactState;
  dispatch: React.Dispatch<ContactAction>;
  onBack: () => void;
}

function getPartyColors(party: string): { bg: string; text: string; border: string } {
  const p = party.toLowerCase();
  if (p.includes('democrat')) {
    return { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-200' };
  }
  if (p.includes('republican')) {
    return { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-200' };
  }
  return { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-200' };
}

// Icons
function EmailIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

function ExternalLinkIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
    </svg>
  );
}

function PhoneIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
    </svg>
  );
}

function CopyIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 5H6a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2v-1M8 5a2 2 0 002 2h2a2 2 0 002-2M8 5a2 2 0 012-2h2a2 2 0 012 2" />
    </svg>
  );
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
  );
}

function ChevronIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
  );
}

function WarningIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
    </svg>
  );
}

/** Result of a POST /api/deliver call, normalized for the UI. */
interface CWCDeliverResult {
  status: number;
  decision?: 'pass' | 'review' | 'block';
  delivered?: boolean;
  shareId?: string;
  reasons?: string[];
  error?: string;
  message?: string;
}

interface OfficialCardProps {
  official: Official;
  message: { subject: string; body: string };
  deliveryInfo: DeliveryInfo;
  contactMethod: 'email' | 'phone';
  isCallComplete?: boolean;
  onMarkCallComplete?: () => void;
  onSend?: (deliveryStatus: string) => void;
  /** When true, this recipient can be delivered server-side via CWC. */
  cwcEligible?: boolean;
  onDeliverCWC?: () => Promise<CWCDeliverResult>;
}

/**
 * Official CWC delivery for a federal recipient: one button, three honest
 * outcomes (delivered / under review / needs revision). Replaces the mailto
 * path for congressional offices when CWC is enabled.
 */
function CWCDeliverPanel({ onDeliverCWC }: { onDeliverCWC: () => Promise<CWCDeliverResult> }) {
  const [state, setState] = useState<'idle' | 'sending' | 'delivered' | 'review' | 'blocked' | 'error'>('idle');
  const [detail, setDetail] = useState<string | null>(null);

  const deliver = async () => {
    if (state === 'sending' || state === 'delivered' || state === 'review') return; // one-shot
    setState('sending');
    setDetail(null);
    try {
      const r = await onDeliverCWC();
      if (r.decision === 'block' || r.status === 422) {
        setState('blocked');
        setDetail(r.reasons?.length ? r.reasons.join(' ') : r.error ?? null);
      } else if (r.decision === 'review' || r.status === 202) {
        setState('review');
        setDetail(r.message ?? null);
      } else if (r.delivered) {
        setState('delivered');
      } else {
        setState('error');
        setDetail(r.error ?? 'Delivery could not be completed. Please try again shortly.');
      }
    } catch {
      setState('error');
      setDetail('Something went wrong. Please try again.');
    }
  };

  if (state === 'delivered') {
    return (
      <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg flex items-start gap-2">
        <CheckIcon className="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
        <p className="text-sm text-green-700 dark:text-green-300">Delivered to the office via the official congressional system.</p>
      </div>
    );
  }
  if (state === 'review') {
    return (
      <div className="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">{detail ?? 'Received and undergoing a quick review before delivery.'}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <button
        onClick={deliver}
        disabled={state === 'sending'}
        className="flex items-center justify-center gap-2 w-full py-2.5 bg-purple-600 hover:bg-purple-700 disabled:opacity-60 text-white rounded-lg text-sm font-medium transition-colors"
      >
        <EmailIcon className="w-4 h-4" />
        {state === 'sending' ? 'Delivering…' : 'Deliver to Congress'}
      </button>
      {state === 'blocked' && (
        <div className="p-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg flex items-start gap-2">
          <WarningIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            {detail ?? 'This message could not be submitted. Please revise it to be a genuine message from you, with your real name and details.'}
          </p>
        </div>
      )}
      {state === 'error' && (
        <p className="text-xs text-red-600 dark:text-red-400 text-center">{detail}</p>
      )}
      <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
        Sent directly through the official Communicating With Congress system.
      </p>
    </div>
  );
}

function OfficialCard({ official, message, deliveryInfo, contactMethod, isCallComplete, onMarkCallComplete, onSend, cwcEligible, onDeliverCWC }: OfficialCardProps) {
  const [messageCopied, setMessageCopied] = useState(false);
  const [emailCopied, setEmailCopied] = useState(false);
  const [phoneCopied, setPhoneCopied] = useState(false);
  const partyColors = getPartyColors(official.party);

  const copyMessage = async () => {
    try {
      await navigator.clipboard.writeText(message.body);
      setMessageCopied(true);
      setTimeout(() => setMessageCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const copyEmail = async () => {
    if (!deliveryInfo.email) return;
    try {
      await navigator.clipboard.writeText(deliveryInfo.email);
      setEmailCopied(true);
      setTimeout(() => setEmailCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy email:', err);
    }
  };

  const copyPhone = async () => {
    if (!deliveryInfo.phone) return;
    try {
      await navigator.clipboard.writeText(deliveryInfo.phone);
      setPhoneCopied(true);
      setTimeout(() => setPhoneCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy phone:', err);
    }
  };

  // Generate mailto link if email available
  const mailtoLink = deliveryInfo.email
    ? generateMailtoLink(deliveryInfo.email, message.subject, message.body)
    : null;

  // Render phone card
  if (contactMethod === 'phone') {
    return (
      <div className={`p-4 rounded-xl border ${isCallComplete ? 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20' : 'border-gray-200 dark:border-gray-700'}`}>
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
            {isCallComplete && (
              <span className="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 text-green-700 dark:bg-green-800 dark:text-green-300 flex items-center gap-1">
                <CheckIcon className="w-3 h-3" />
                Called
              </span>
            )}
          </div>
          <p className="font-semibold text-gray-900 dark:text-white">{official.name}</p>
          <p className="text-sm text-gray-600 dark:text-gray-400">{official.title}</p>
        </div>

        {/* Phone number and actions */}
        <div className="mb-3 space-y-3">
          {deliveryInfo.phone ? (
            <>
              {/* Prominent phone number as tel: link */}
              <div className="p-3 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-xl text-center">
                <p className="text-xs text-purple-600 dark:text-purple-400 mb-1">Tap to call</p>
                <a
                  href={`tel:${deliveryInfo.phone.replace(/[^\d+]/g, '')}`}
                  onClick={() => onSend?.('initiated')}
                  className="text-2xl font-bold text-purple-700 dark:text-purple-300 hover:text-purple-800 dark:hover:text-purple-200 transition-colors"
                >
                  {formatPhone(deliveryInfo.phone)}
                </a>
              </div>
              {/* Copy phone number */}
              <button
                onClick={copyPhone}
                className="w-full flex items-center justify-center gap-1.5 py-2 border border-purple-300 dark:border-purple-600 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded-lg text-sm font-medium transition-colors"
              >
                {phoneCopied ? (
                  <CheckIcon className="w-4 h-4 text-green-600 dark:text-green-400" />
                ) : (
                  <CopyIcon className="w-4 h-4" />
                )}
                {phoneCopied ? 'Copied!' : 'Copy Number'}
              </button>
              {/* Mark as complete button */}
              {!isCallComplete ? (
                <button
                  onClick={() => { onMarkCallComplete?.(); }}
                  className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-green-300 dark:border-green-600 text-green-700 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded-lg text-sm font-medium transition-colors"
                >
                  <CheckIcon className="w-4 h-4" />
                  I Made This Call
                </button>
              ) : (
                <span className="w-full flex items-center justify-center gap-2 py-2.5 bg-green-100 dark:bg-green-800 text-green-700 dark:text-green-300 rounded-lg text-sm font-medium">
                  <CheckIcon className="w-4 h-4" />
                  Call Complete
                </span>
              )}
            </>
          ) : (
            <div className="space-y-2">
              <div className="p-3 bg-gray-100 dark:bg-gray-700 rounded-xl text-center">
                <p className="text-sm text-gray-500 dark:text-gray-400">No phone number available</p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  Visit their website to find contact information
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Script preview */}
        <details className="group">
          <summary className="cursor-pointer text-xs font-medium text-purple-600 dark:text-purple-400 hover:text-purple-700 dark:hover:text-purple-300 flex items-center gap-1">
            <ChevronIcon className="w-3 h-3 transition-transform group-open:rotate-90" />
            View your script
          </summary>
          <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-xs text-gray-700 dark:text-gray-300 whitespace-pre-line">
            {message.body}
          </div>
          <button
            onClick={copyMessage}
            className="mt-2 flex items-center justify-center gap-1.5 w-full py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-xs font-medium transition-colors"
          >
            {messageCopied ? (
              <CheckIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
            ) : (
              <CopyIcon className="w-3.5 h-3.5" />
            )}
            {messageCopied ? 'Copied!' : 'Copy Script'}
          </button>
        </details>
      </div>
    );
  }

  // Render email card based on delivery method
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
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 italic truncate">
          Subject: {message.subject}
        </p>
      </div>

      {/* CAPTCHA blocked note */}
      {deliveryInfo.captchaBlocked && deliveryInfo.note && (
        <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-700 rounded-lg flex items-start gap-2">
          <WarningIcon className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-700 dark:text-amber-300">{deliveryInfo.note}</p>
        </div>
      )}

      {/* Primary action based on delivery method */}
      <div className="space-y-2">
        {cwcEligible && onDeliverCWC ? (
          // Official CWC delivery for federal recipients (server-side).
          <CWCDeliverPanel onDeliverCWC={onDeliverCWC} />
        ) : deliveryInfo.method === 'staffer_email' && deliveryInfo.email ? (
          // Staffer email - open in email client as primary action
          <>
            {mailtoLink ? (
              <button
                onClick={() => { window.open(mailtoLink, '_blank'); onSend?.('email_opened'); }}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                <EmailIcon className="w-4 h-4" />
                Send with Your Email
              </button>
            ) : (
              <button
                onClick={() => { copyEmail(); onSend?.('email_copied'); }}
                className="flex items-center justify-center gap-2 w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
              >
                {emailCopied ? <CheckIcon className="w-4 h-4" /> : <CopyIcon className="w-4 h-4" />}
                {emailCopied ? 'Copied!' : 'Copy Email Address'}
              </button>
            )}
            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
              Opens your email app with the message pre-filled. Just hit send.
            </p>
          </>
        ) : deliveryInfo.method === 'contact_form' && deliveryInfo.contactFormUrl ? (
          // Contact form - copy message then open form
          <>
            <a
              href={deliveryInfo.contactFormUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { copyMessage(); onSend?.('form_opened'); }}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <ExternalLinkIcon className="w-4 h-4" />
              Open Contact Form
            </a>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
              Your message is copied to clipboard. Paste it into the form.
            </p>
          </>
        ) : deliveryInfo.method === 'website' && deliveryInfo.websiteUrl ? (
          // Website fallback
          <>
            <a
              href={deliveryInfo.actionUrl || deliveryInfo.websiteUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => { copyMessage(); onSend?.('website_opened'); }}
              className="flex items-center justify-center gap-2 w-full py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors"
            >
              <ExternalLinkIcon className="w-4 h-4" />
              Visit Website
            </a>
            <p className="text-[10px] text-gray-400 dark:text-gray-500 text-center">
              Your message is copied to clipboard. Paste it on their site.
            </p>
          </>
        ) : (
          // No method available
          <span className="flex items-center justify-center gap-2 w-full py-2.5 bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded-lg text-sm">
            No contact method available
          </span>
        )}

        {/* Secondary actions row */}
        <div className="flex flex-col sm:flex-row gap-2">
          {deliveryInfo.method === 'staffer_email' ? (
            <>
              {/* Copy Email Address */}
              <button
                onClick={() => { copyEmail(); onSend?.('email_copied'); }}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-xs font-medium transition-colors"
              >
                {emailCopied ? (
                  <CheckIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                ) : (
                  <CopyIcon className="w-3.5 h-3.5" />
                )}
                {emailCopied ? 'Copied!' : 'Copy Email Address'}
              </button>
              {/* Copy Message */}
              <button
                onClick={copyMessage}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-xs font-medium transition-colors"
              >
                {messageCopied ? (
                  <CheckIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                ) : (
                  <CopyIcon className="w-3.5 h-3.5" />
                )}
                {messageCopied ? 'Copied!' : 'Copy Message'}
              </button>
            </>
          ) : (
            <>
              {/* Copy Email Address (secondary for non-staffer methods) */}
              {deliveryInfo.email && (
                <button
                  onClick={copyEmail}
                  className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-xs font-medium transition-colors"
                >
                  {emailCopied ? (
                    <CheckIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                  ) : (
                    <CopyIcon className="w-3.5 h-3.5" />
                  )}
                  {emailCopied ? 'Copied!' : 'Copy Email'}
                </button>
              )}
              {/* Copy Message */}
              <button
                onClick={copyMessage}
                className="flex-1 flex items-center justify-center gap-1.5 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg text-xs font-medium transition-colors"
              >
                {messageCopied ? (
                  <CheckIcon className="w-3.5 h-3.5 text-green-600 dark:text-green-400" />
                ) : (
                  <CopyIcon className="w-3.5 h-3.5" />
                )}
                {messageCopied ? 'Copied!' : 'Copy Message'}
              </button>
            </>
          )}
        </div>
      </div>

      {/* Note for contact form method */}
      {deliveryInfo.method === 'contact_form' && !deliveryInfo.captchaBlocked && deliveryInfo.note && (
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 italic">{deliveryInfo.note}</p>
      )}

      {/* Message preview */}
      <details className="mt-3 group">
        <summary className="cursor-pointer text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
          <ChevronIcon className="w-3 h-3 transition-transform group-open:rotate-90" />
          Preview message
        </summary>
        <div className="mt-2 p-3 bg-gray-50 dark:bg-gray-700 rounded-lg border border-gray-200 dark:border-gray-600 text-xs text-gray-600 dark:text-gray-300 whitespace-pre-line max-h-32 overflow-y-auto">
          {message.body}
        </div>
      </details>
    </div>
  );
}

export function SendStep({ state, dispatch, onBack }: SendStepProps) {
  const { selectedReps, messages, contactMethod } = state;
  const [completedCalls, setCompletedCalls] = useState<Set<string>>(new Set());
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) setUserId(user.id);
    });
  }, []);

  // Calculate delivery info for each official
  const deliveryInfoMap = useMemo(() => {
    const map = new Map<string, DeliveryInfo>();
    for (const official of selectedReps) {
      map.set(official.id, determineDeliveryMethod(official, contactMethod));
    }
    return map;
  }, [selectedReps, contactMethod]);

  const markCallComplete = (officialId: string) => {
    setCompletedCalls(prev => new Set([...prev, officialId]));
  };

  // Count delivery methods for summary
  const deliverySummary = useMemo(() => {
    let emailCount = 0;
    let formCount = 0;
    let phoneCount = 0;

    for (const info of deliveryInfoMap.values()) {
      if (info.method === 'staffer_email') emailCount++;
      else if (info.method === 'contact_form' || info.method === 'website') formCount++;
      else if (info.method === 'phone') phoneCount++;
    }

    return { emailCount, formCount, phoneCount };
  }, [deliveryInfoMap]);

  const trackSend = (official: Official, deliveryStatus: string) => {
    const msg = messages[official.name];
    const deliveryInfo = deliveryInfoMap.get(official.id);
    if (!msg || !deliveryInfo) return;

    fetch('/api/track-send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        advocate_name: state.userName,
        advocate_email: state.userEmail || undefined,
        advocate_city: state.address?.city || '',
        advocate_state: state.address?.state || '',
        advocate_district: official.district || undefined,
        legislator_name: official.name,
        legislator_id: official.id,
        legislator_party: official.party,
        legislator_level: official.level,
        legislator_chamber: official.chamber,
        issue_area: state.issueCategory || state.issue,
        issue_subtopic: state.issue,
        message_body: msg.body,
        delivery_method: contactMethod === 'phone' ? 'phone' : deliveryInfo.method,
        delivery_status: deliveryStatus,
        user_id: userId || undefined,
      }),
    })
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data?.shareId) {
          dispatch({ type: 'SET_SHARE_ID', payload: data.shareId });
        }
        trackEvent('message_sent', {
          method: contactMethod === 'phone' ? 'phone' : 'email',
          issue: state.issueCategory || 'unknown',
        });
      })
      .catch((err) => console.error('[track-send] Failed:', err));
  };

  // CWC server-side delivery is gated by a build flag so it stays dormant until
  // the API key is live and validated on staging. A federal email recipient is
  // eligible only when we have the full sender identity CWC requires.
  const cwcEnabled = process.env.NEXT_PUBLIC_CWC_ENABLED === 'true';
  const canDeliverCWC = (official: Official) =>
    cwcEnabled &&
    contactMethod === 'email' &&
    official.level !== 'state' &&
    Boolean(state.userEmail && state.address?.street && state.address?.zip);

  const deliverViaCWC = async (official: Official): Promise<CWCDeliverResult> => {
    const msg = messages[official.name];
    if (!msg || !state.address) {
      return { status: 400, error: 'Missing message or address.' };
    }
    try {
      const res = await fetch('/api/deliver', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          advocate_name: state.userName,
          advocate_email: state.userEmail,
          advocate_street: state.address.street,
          advocate_city: state.address.city,
          advocate_state: state.address.state,
          advocate_zip: state.address.zip,
          advocate_district: official.district || undefined,
          legislator_name: official.name,
          legislator_id: official.id,
          legislator_party: official.party,
          legislator_level: official.level,
          legislator_chamber: official.chamber,
          issue_area: state.issueCategory || state.issue,
          issue_subtopic: state.issue,
          message_body: msg.body,
          user_id: userId || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (data?.shareId) dispatch({ type: 'SET_SHARE_ID', payload: data.shareId });
      if (res.ok || res.status === 202) {
        trackEvent('message_sent', { method: 'cwc', issue: state.issueCategory || 'unknown' });
      }
      return { status: res.status, ...data };
    } catch (err) {
      console.error('[deliver] Failed:', err);
      return { status: 0, error: 'Network error.' };
    }
  };

  const handleDone = () => {
    dispatch({ type: 'GO_TO_STEP', payload: 'success' });
  };

  return (
    <div className="p-6 sm:p-8">
      {/* Header */}
      <div className="text-center mb-6">
        <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${
          contactMethod === 'phone' && completedCalls.size === selectedReps.length
            ? 'bg-green-100 dark:bg-green-900'
            : contactMethod === 'phone'
            ? 'bg-purple-100 dark:bg-purple-900'
            : 'bg-green-100 dark:bg-green-900'
        }`}>
          {contactMethod === 'phone' ? (
            completedCalls.size === selectedReps.length ? (
              <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ) : (
              <PhoneIcon className="w-7 h-7 text-purple-600 dark:text-purple-400" />
            )
          ) : (
            <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          )}
        </div>
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
          {contactMethod === 'phone'
            ? completedCalls.size === selectedReps.length
              ? 'All Calls Complete!'
              : 'Call Your Officials'
            : selectedReps.length === 1
            ? 'Your Message is Ready!'
            : `${selectedReps.length} Messages Ready!`}
        </h3>
        <p className="text-gray-500 dark:text-gray-400 mt-1 text-sm">
          {contactMethod === 'phone'
            ? completedCalls.size > 0
              ? `${completedCalls.size} of ${selectedReps.length} calls complete`
              : 'Call each official and use your script'
            : deliverySummary.emailCount > 0 && deliverySummary.formCount > 0
            ? `${deliverySummary.emailCount} via email, ${deliverySummary.formCount} via contact form`
            : deliverySummary.emailCount > 0
            ? 'Click "Send with Your Email" to open your email app with the message ready to send'
            : 'Send each message using the options below'}
        </p>
      </div>

      {/* Per-official cards */}
      <div className="space-y-4 mb-6">
        {selectedReps.map(official => {
          const msg = messages[official.name];
          const deliveryInfo = deliveryInfoMap.get(official.id);

          if (!msg || !deliveryInfo) return null;

          return (
            <OfficialCard
              key={official.id}
              official={official}
              message={msg}
              deliveryInfo={deliveryInfo}
              contactMethod={contactMethod}
              isCallComplete={completedCalls.has(official.id)}
              onMarkCallComplete={() => markCallComplete(official.id)}
              onSend={(status) => trackSend(official, status)}
              cwcEligible={canDeliverCWC(official)}
              onDeliverCWC={() => deliverViaCWC(official)}
            />
          );
        })}
      </div>

      {/* Phone tips (phone only) */}
      {contactMethod === 'phone' && (
        <div className="mb-6 p-3 bg-purple-50 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-700 rounded-xl">
          <p className="text-xs font-medium text-purple-700 dark:text-purple-300 mb-2">Phone Call Tips</p>
          <ul className="text-xs text-purple-700 dark:text-purple-300 space-y-1">
            {PHONE_TIPS.map((tip, i) => (
              <li key={i} className="flex gap-2">
                <span className="flex-shrink-0">&bull;</span>
                {tip}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Note about bounces (email only) */}
      {contactMethod === 'email' && deliverySummary.emailCount > 0 && (
        <div className="mb-6 p-3 bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-700 rounded-xl">
          <p className="text-xs text-yellow-700 dark:text-yellow-300">
            Note: Some congressional emails may bounce. If that happens, use the official&apos;s contact form on their website.
          </p>
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400 text-center mb-4">
        Your message will be saved to your history. See our{' '}
        <Link href="/privacy" className="text-purple-600 dark:text-purple-400 hover:underline">Privacy Policy</Link>{' '}
        for details.
      </p>

      <div className="flex gap-3">
        <Button variant="secondary" onClick={onBack} className="flex-1">
          Back to Edit
        </Button>
        <Button onClick={handleDone} className="flex-1">
          Done
        </Button>
      </div>
    </div>
  );
}
