/**
 * Core TypeScript interfaces for Constituent
 */

// Address types
export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
}

// Geocoded address with district info
export interface GeocodedAddress extends Address {
  stateCode: string;
  congressionalDistrict: string;
  stateUpperDistrict?: string;
  stateLowerDistrict?: string;
}

// Official - supports federal and state legislators
export interface Official {
  id: string;
  name: string;
  lastName?: string;
  stafferFirstName?: string;
  stafferLastName?: string;
  title: string;
  level: 'federal' | 'state';
  chamber: 'senate' | 'house' | 'upper' | 'lower';
  party: string;
  state: string;
  district?: string;
  phone?: string;
  email?: string;
  website?: string;
  contactForm?: string;
  photoUrl?: string;
  office?: string;
  socialMedia?: {
    twitter?: string;
    facebook?: string;
    instagram?: string;
  };
}

// Lookup result with officials
export interface LookupResult {
  officials: Official[];
  address: GeocodedAddress;
  warning?: string;
}

// Topic types (for predefined topic grid - kept for backwards compatibility)
export interface Topic {
  id: string;
  label: string;
  description: string;
  icon?: string;
}

// Message generation types
export interface GenerateMessageRequest {
  official: {
    name: string;
    lastName?: string;
    title: string;
    party: string;
    state: string;
    district?: string | null;
    stafferFirstName?: string;
    stafferLastName?: string;
  };
  userName: string;
  issue: string;
  ask: string;
  personalWhy?: string;
}

export interface GeneratedMessage {
  subject: string;
  body: string;
}

export interface GenerateMessageResponse {
  message: GeneratedMessage;
}

// API response types
export interface RepresentativesResponse {
  officials: Official[];
  address: GeocodedAddress;
  warning?: string;
}

export interface ApiError {
  error: string;
  code?: string;
}

// Contact flow types
export type ContactStep =
  | 'address'
  | 'representative'
  | 'topic'
  | 'message'
  | 'send';

export interface ContactFlowState {
  step: ContactStep;
  address?: Address;
  officials?: Official[];
  selectedReps?: Official[];
  userName?: string;
  issue?: string;
  ask?: string;
  personalWhy?: string;
  messages?: Record<string, GeneratedMessage>;
}

// User profile with saved address and cached representatives
export interface Profile {
  id: string;
  user_id: string;
  name: string | null;
  street: string | null;
  city: string | null;
  state: string | null;
  zip: string | null;
  representatives: Official[] | null;
  created_at: string;
  updated_at: string;
}

// Feed types
export interface FeedArticle {
  title: string;
  link: string;
  source: string;
  pubDate: string;
  subtopic: string;
}

export interface FeedBill {
  type: 'bill';
  bill_number: string;
  title: string;
  description: string;
  sponsor_name: string;
  sponsors: string[];
  date: string;
  status: string;
  last_action: string;
  last_action_date: string;
  policy_area: string;
  committee: string;
  bill_url: string;
  rep_id: string;
  level: 'federal' | 'state';
}

export interface RepNewsArticle {
  type: 'news';
  title: string;
  link: string;
  source: string;
  pubDate: string;
  rep_name: string;
  rep_id: string;
  level: 'federal' | 'state';
}

export interface RepSocialPost {
  type: 'social';
  text: string;
  link: string;
  pubDate: string;
  platform: 'twitter';
  handle: string;
  rep_name: string;
  rep_id: string;
  level: 'federal' | 'state';
}

export type RepFeedItem = FeedBill | RepNewsArticle | RepSocialPost;

export interface RepFeedResponse {
  items: RepFeedItem[];
  reps: { id: string; name: string; level: 'federal' | 'state'; party: string; title: string; twitter?: string }[];
  userIssues: string[];
}

// Campaign types
export interface Campaign {
  id: string;
  creator_id: string;
  slug: string;
  headline: string;
  description: string;
  issue_area: string;
  issue_subtopic: string | null;
  target_level: 'federal' | 'state' | 'both';
  message_template: string | null;
  status: 'active' | 'paused' | 'archived';
  action_count: number;
  created_at: string;
  updated_at: string;
}

export interface CampaignAction {
  id: string;
  campaign_id: string;
  participant_name: string;
  participant_state: string;
  participant_city: string;
  messages_sent: number;
  created_at: string;
}

// Track send event
export interface TrackSendRequest {
  recipientName: string;
  recipientOffice: string;
  topic: string;
  method: 'email' | 'phone' | 'web_form';
}

export interface TrackSendResponse {
  success: boolean;
  eventId: string;
}
