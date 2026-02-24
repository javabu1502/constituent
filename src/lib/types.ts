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

// Bill action timeline
export interface BillAction {
  description: string;
  date: string;
  classification: string[];
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
  sponsorship_type?: 'sponsored' | 'cosponsored';
  actions?: BillAction[];
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

export interface RepVote {
  type: 'vote';
  roll_number: string;
  question: string;
  description: string;
  result: string;
  date: string;
  rep_position: 'Yea' | 'Nay' | 'Not Voting' | 'Present' | string;
  bill_number?: string;
  bill_title?: string;
  congress: number;
  chamber: 'Senate' | 'House';
  vote_url: string;
  rep_id: string;
  rep_name: string;
  level: 'federal' | 'state';
  // Vote count fields (when available from detail endpoints)
  yea_count?: number;
  nay_count?: number;
  not_voting_count?: number;
  present_count?: number;
}

export type RepFeedItem = FeedBill | RepNewsArticle | RepVote;

export interface RepFeedResponse {
  items: RepFeedItem[];
  votes: RepVote[];
  reps: { id: string; name: string; level: 'federal' | 'state'; party: string; title: string; state?: string }[];
  userIssues: string[];
}

export interface IssueFeedItem {
  type: 'issue-news' | 'issue-bill';
  title: string;
  link: string;
  source?: string;
  pubDate?: string;
  date?: string;
  bill_number?: string;
  status?: string;
  policy_area: string;
  level: 'federal' | 'state';
  related_rep_names?: string[];
}

export interface IssueFeedResponse {
  issues: Record<string, IssueFeedItem[]>;
  userIssues: string[];
}

// FEC campaign finance types
export interface FecContributor {
  name: string;
  total: number;
  count: number;
}

export interface RepFinance {
  candidate_id: string;
  candidate_name: string;
  cycle: number;
  total_raised: number;
  individual_contributions: number;
  pac_contributions: number;
  total_disbursements: number;
  cash_on_hand: number;
  debt: number;
  top_contributors: FecContributor[];
  rep_id: string;
  rep_name: string;
  fec_url: string;
}

export interface RepFinanceResponse {
  finance: Record<string, RepFinance>; // keyed by rep_id
}

// Voting record types
export interface VotingSummary {
  total_votes: number;
  yea_votes: number;
  nay_votes: number;
  not_voting: number;
  present_votes: number;
  participation_rate: number;
}

export interface VotingRecordResponse {
  votes: RepVote[];
  summary: VotingSummary;
  total_available: number;
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
