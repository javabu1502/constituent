/**
 * Unified Delivery Module
 *
 * Determines the best delivery method for each representative and provides
 * appropriate UI actions. Uses a fallback chain:
 *
 * 1. Form automation (future - currently disabled)
 * 2. Staffer email (mailto: to known staffer)
 * 3. Official contact form (manual copy + link)
 * 4. Official website (fallback)
 */

import type { Official } from '@/lib/types';

/**
 * Delivery method types in priority order
 */
export type DeliveryMethod =
  | 'form_automation'  // Future: AI-powered form filling
  | 'staffer_email'    // Direct email to staffer
  | 'contact_form'     // Manual: open form, paste message
  | 'website'          // Fallback: generic website
  | 'phone'            // Phone call
  | 'none';            // No method available

/**
 * Result of determining delivery method for an official
 */
export interface DeliveryInfo {
  /** The best available delivery method */
  method: DeliveryMethod;
  /** Human-readable description of the method */
  methodLabel: string;
  /** The primary action URL (mailto:, form URL, or website) */
  actionUrl: string | null;
  /** Email address if available */
  email: string | null;
  /** Phone number if available */
  phone: string | null;
  /** Contact form URL if available */
  contactFormUrl: string | null;
  /** Website URL if available */
  websiteUrl: string | null;
  /** Name of staffer if known */
  stafferName: string | null;
  /** Whether form automation was attempted and blocked by CAPTCHA */
  captchaBlocked: boolean;
  /** Note to show user about delivery method */
  note: string | null;
}

/**
 * Generate a mailto: link with proper encoding
 */
export function generateMailtoLink(
  email: string,
  subject: string,
  body: string
): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * Determine the best delivery method for an official
 *
 * Priority chain (for email contact method):
 * 1. Staffer email (if known) - most reliable
 * 2. Contact form (if known) - official channel
 * 3. Website (fallback)
 *
 * For phone contact method:
 * 1. Phone number (if available)
 */
export function determineDeliveryMethod(
  official: Official,
  contactMethod: 'email' | 'phone',
  captchaBlockedBioguideIds?: Set<string>
): DeliveryInfo {
  const captchaBlocked = captchaBlockedBioguideIds?.has(official.id) || false;

  // Phone method
  if (contactMethod === 'phone') {
    return {
      method: official.phone ? 'phone' : 'none',
      methodLabel: official.phone ? 'Phone call' : 'No phone available',
      actionUrl: official.phone ? `tel:${official.phone.replace(/[^\d+]/g, '')}` : null,
      email: official.email || null,
      phone: official.phone || null,
      contactFormUrl: official.contactForm || null,
      websiteUrl: official.website || null,
      stafferName: official.stafferFirstName || null,
      captchaBlocked: false,
      note: null,
    };
  }

  // Email method - use fallback chain

  // Priority 1: Staffer email
  if (official.email) {
    return {
      method: 'staffer_email',
      methodLabel: official.stafferFirstName
        ? `Email to ${official.stafferFirstName} (staffer)`
        : 'Direct email',
      actionUrl: null, // Will be generated with message content
      email: official.email,
      phone: official.phone || null,
      contactFormUrl: official.contactForm || null,
      websiteUrl: official.website || null,
      stafferName: official.stafferFirstName || null,
      captchaBlocked,
      note: captchaBlocked
        ? 'Automated form delivery unavailable — using email instead'
        : null,
    };
  }

  // Priority 2: Contact form
  if (official.contactForm) {
    return {
      method: 'contact_form',
      methodLabel: 'Contact form',
      actionUrl: official.contactForm,
      email: null,
      phone: official.phone || null,
      contactFormUrl: official.contactForm,
      websiteUrl: official.website || null,
      stafferName: null,
      captchaBlocked,
      note: captchaBlocked
        ? 'Automated form delivery unavailable — please fill manually'
        : 'Copy your message and paste into the contact form',
    };
  }

  // Priority 3: Website
  if (official.website) {
    // Try to construct contact URL
    const contactUrl = official.website.replace(/\/$/, '') + '/contact';

    return {
      method: 'website',
      methodLabel: 'Official website',
      actionUrl: contactUrl,
      email: null,
      phone: official.phone || null,
      contactFormUrl: contactUrl,
      websiteUrl: official.website,
      stafferName: null,
      captchaBlocked,
      note: 'Look for a contact form on the website',
    };
  }

  // No method available
  return {
    method: 'none',
    methodLabel: 'No contact method',
    actionUrl: null,
    email: null,
    phone: official.phone || null,
    contactFormUrl: null,
    websiteUrl: null,
    stafferName: null,
    captchaBlocked: false,
    note: 'No email or contact form available for this official',
  };
}

/**
 * Get delivery info for multiple officials
 */
export function getDeliveryInfoForOfficials(
  officials: Official[],
  contactMethod: 'email' | 'phone',
  captchaBlockedBioguideIds?: Set<string>
): Map<string, DeliveryInfo> {
  const result = new Map<string, DeliveryInfo>();

  for (const official of officials) {
    result.set(
      official.id,
      determineDeliveryMethod(official, contactMethod, captchaBlockedBioguideIds)
    );
  }

  return result;
}

/**
 * Summary of delivery methods for a set of officials
 */
export interface DeliverySummary {
  total: number;
  byMethod: {
    staffer_email: number;
    contact_form: number;
    website: number;
    phone: number;
    none: number;
  };
  captchaBlocked: number;
}

/**
 * Get a summary of delivery methods
 */
export function getDeliverySummary(
  deliveryInfos: Map<string, DeliveryInfo>
): DeliverySummary {
  const summary: DeliverySummary = {
    total: deliveryInfos.size,
    byMethod: {
      staffer_email: 0,
      contact_form: 0,
      website: 0,
      phone: 0,
      none: 0,
    },
    captchaBlocked: 0,
  };

  for (const info of deliveryInfos.values()) {
    if (info.method === 'staffer_email') summary.byMethod.staffer_email++;
    else if (info.method === 'contact_form') summary.byMethod.contact_form++;
    else if (info.method === 'website') summary.byMethod.website++;
    else if (info.method === 'phone') summary.byMethod.phone++;
    else summary.byMethod.none++;

    if (info.captchaBlocked) summary.captchaBlocked++;
  }

  return summary;
}
