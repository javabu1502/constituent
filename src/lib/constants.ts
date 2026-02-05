/**
 * Application constants for Constituent
 */

import type { Topic } from './types';

// Brand configuration
export const BRAND = {
  name: 'My Democracy',
  tagline: 'Contact Your Elected Officials',
  description: 'Use AI to write personalized messages to your representatives in minutes.',
  colors: {
    primary: '#6A39C9',
    primaryHover: '#5A2EB0',
    primaryLight: '#F5F0FF',
  },
} as const;

// Pre-defined topics for contacting representatives
export const TOPICS: Topic[] = [
  {
    id: 'healthcare',
    label: 'Healthcare',
    description: 'Insurance, Medicare, prescription drug costs, public health',
    icon: '🏥',
  },
  {
    id: 'economy',
    label: 'Economy & Jobs',
    description: 'Employment, wages, small business, inflation',
    icon: '💼',
  },
  {
    id: 'education',
    label: 'Education',
    description: 'Schools, student loans, higher education funding',
    icon: '📚',
  },
  {
    id: 'environment',
    label: 'Environment & Climate',
    description: 'Climate change, clean energy, conservation, pollution',
    icon: '🌍',
  },
  {
    id: 'immigration',
    label: 'Immigration',
    description: 'Border policy, visa programs, citizenship pathways',
    icon: '🛂',
  },
  {
    id: 'infrastructure',
    label: 'Infrastructure',
    description: 'Roads, bridges, public transit, broadband access',
    icon: '🏗️',
  },
  {
    id: 'civil-rights',
    label: 'Civil Rights',
    description: 'Voting rights, equality, discrimination, justice reform',
    icon: '⚖️',
  },
  {
    id: 'housing',
    label: 'Housing',
    description: 'Affordable housing, rent, homelessness, mortgages',
    icon: '🏠',
  },
  {
    id: 'veterans',
    label: 'Veterans Affairs',
    description: 'VA benefits, healthcare, employment support',
    icon: '🎖️',
  },
  {
    id: 'other',
    label: 'Other Issue',
    description: 'Describe your own topic',
    icon: '📝',
  },
];

// US States for address validation
export const US_STATES = [
  { code: 'AL', name: 'Alabama' },
  { code: 'AK', name: 'Alaska' },
  { code: 'AZ', name: 'Arizona' },
  { code: 'AR', name: 'Arkansas' },
  { code: 'CA', name: 'California' },
  { code: 'CO', name: 'Colorado' },
  { code: 'CT', name: 'Connecticut' },
  { code: 'DE', name: 'Delaware' },
  { code: 'DC', name: 'District of Columbia' },
  { code: 'FL', name: 'Florida' },
  { code: 'GA', name: 'Georgia' },
  { code: 'HI', name: 'Hawaii' },
  { code: 'ID', name: 'Idaho' },
  { code: 'IL', name: 'Illinois' },
  { code: 'IN', name: 'Indiana' },
  { code: 'IA', name: 'Iowa' },
  { code: 'KS', name: 'Kansas' },
  { code: 'KY', name: 'Kentucky' },
  { code: 'LA', name: 'Louisiana' },
  { code: 'ME', name: 'Maine' },
  { code: 'MD', name: 'Maryland' },
  { code: 'MA', name: 'Massachusetts' },
  { code: 'MI', name: 'Michigan' },
  { code: 'MN', name: 'Minnesota' },
  { code: 'MS', name: 'Mississippi' },
  { code: 'MO', name: 'Missouri' },
  { code: 'MT', name: 'Montana' },
  { code: 'NE', name: 'Nebraska' },
  { code: 'NV', name: 'Nevada' },
  { code: 'NH', name: 'New Hampshire' },
  { code: 'NJ', name: 'New Jersey' },
  { code: 'NM', name: 'New Mexico' },
  { code: 'NY', name: 'New York' },
  { code: 'NC', name: 'North Carolina' },
  { code: 'ND', name: 'North Dakota' },
  { code: 'OH', name: 'Ohio' },
  { code: 'OK', name: 'Oklahoma' },
  { code: 'OR', name: 'Oregon' },
  { code: 'PA', name: 'Pennsylvania' },
  { code: 'RI', name: 'Rhode Island' },
  { code: 'SC', name: 'South Carolina' },
  { code: 'SD', name: 'South Dakota' },
  { code: 'TN', name: 'Tennessee' },
  { code: 'TX', name: 'Texas' },
  { code: 'UT', name: 'Utah' },
  { code: 'VT', name: 'Vermont' },
  { code: 'VA', name: 'Virginia' },
  { code: 'WA', name: 'Washington' },
  { code: 'WV', name: 'West Virginia' },
  { code: 'WI', name: 'Wisconsin' },
  { code: 'WY', name: 'Wyoming' },
] as const;

// Party colors for badges
export const PARTY_COLORS: Record<string, { bg: string; text: string }> = {
  Democratic: { bg: 'bg-blue-100', text: 'text-blue-800' },
  Democrat: { bg: 'bg-blue-100', text: 'text-blue-800' },
  Republican: { bg: 'bg-red-100', text: 'text-red-800' },
  Independent: { bg: 'bg-gray-100', text: 'text-gray-800' },
  Libertarian: { bg: 'bg-yellow-100', text: 'text-yellow-800' },
  Green: { bg: 'bg-green-100', text: 'text-green-800' },
};

// Default party color for unknown parties
export const DEFAULT_PARTY_COLOR = { bg: 'bg-gray-100', text: 'text-gray-800' };
