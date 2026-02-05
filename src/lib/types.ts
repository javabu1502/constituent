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
