import { z } from 'zod';

// --- Shared sub-schemas ---

const officialSchema = z.object({
  name: z.string().min(1).max(200),
  lastName: z.string().max(100).optional(),
  stafferFirstName: z.string().max(100).optional(),
  bioguideId: z.string().max(20).optional(),
  title: z.string().min(1).max(200),
  party: z.string().min(1).max(50),
  state: z.string().min(1).max(50),
  level: z.enum(['federal', 'state']).optional(),
  district: z.string().max(20).optional(),
});

const addressSchema = z.object({
  street: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(50),
  zip: z.string().regex(/^\d{5}(-\d{4})?$/),
});

// --- Route schemas ---

export const generateMessageSchema = z.object({
  officials: z.array(officialSchema).min(1).max(20),
  issue: z.string().min(1).max(500),
  issueCategory: z.string().max(200).optional(),
  ask: z.string().min(1).max(1000),
  personalWhy: z.string().max(2000).optional(),
  senderName: z.string().min(1).max(200),
  address: addressSchema.optional(),
  contactMethod: z.enum(['email', 'phone']).optional(),
  tone: z.enum(['professional', 'personal', 'passionate']).optional(),
  turnstileToken: z.string().optional(),
});

export const chatRequestSchema = z.object({
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(2000),
      })
    )
    .min(1)
    .max(50),
  turnstileToken: z.string().optional(),
});

export const trackSendSchema = z.object({
  advocate_name: z.string().min(1).max(200),
  advocate_email: z.string().max(254).optional(),
  advocate_city: z.string().min(1).max(100),
  advocate_state: z.string().min(1).max(50),
  advocate_district: z.string().max(20).optional(),
  legislator_name: z.string().min(1).max(200),
  legislator_id: z.string().min(1).max(20),
  legislator_party: z.string().min(1).max(50),
  legislator_level: z.string().min(1).max(20),
  legislator_chamber: z.string().min(1).max(20),
  issue_area: z.string().min(1).max(200),
  issue_subtopic: z.string().min(1).max(200),
  message_body: z.string().min(1).max(10000),
  delivery_method: z.enum(['email', 'phone', 'webform']),
  delivery_status: z.enum(['drafted', 'sent', 'opened', 'copied']),
  user_id: z.string().uuid().optional(),
  campaign_id: z.string().uuid().optional(),
});

export const createCampaignSchema = z.object({
  headline: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  issue_area: z.string().min(1).max(200),
  issue_subtopic: z.string().max(200).optional(),
  target_level: z.enum(['federal', 'state', 'both']),
  message_template: z.string().max(2000).optional(),
  distribution_plan: z.string().min(10).max(1000),
});

export const generateCommentSchema = z.object({
  regulationTitle: z.string().min(1).max(500),
  agency: z.string().min(1).max(200),
  abstract: z.string().max(2000).nullable().optional(),
  position: z.enum(['support', 'oppose', 'concerns']),
  personalStory: z.string().max(2000).optional(),
  keyPoints: z.string().max(2000).optional(),
  senderName: z.string().min(1).max(200),
  turnstileToken: z.string().optional(),
});

export const messageFeedbackSchema = z.object({
  messageHash: z.string().min(1).max(100),
  officialName: z.string().min(1).max(200),
  officialParty: z.string().max(50).optional(),
  issueCategory: z.string().max(200).optional(),
  tone: z.string().max(50).optional(),
  contactMethod: z.string().max(20).optional(),
  rating: z.enum(['positive', 'negative']),
});

export const generateFollowUpSchema = z.object({
  originalMessageId: z.string().uuid(),
  followUpType: z.enum(['no_response', 'thank_you']),
  senderName: z.string().min(1).max(200),
  additionalContext: z.string().max(1000).optional(),
  turnstileToken: z.string().optional(),
});

export const profileUpdateSchema = z
  .object({
    street: z.string().min(1).max(200).optional(),
    city: z.string().min(1).max(100).optional(),
    state: z.string().min(1).max(50).optional(),
    zip: z.string().regex(/^\d{5}(-\d{4})?$/).optional(),
    representatives: z.unknown().optional(),
    local_officials: z.unknown().optional(),
  })
  .refine((data) => Object.values(data).some((v) => v !== undefined), {
    message: 'At least one field is required',
  });

export const campaignParticipateSchema = z.object({
  participant_name: z.string().min(1).max(200),
  participant_city: z.string().min(1).max(100),
  participant_state: z.string().min(1).max(50),
  messages_sent: z.number().int().min(0).max(1000).optional(),
});

// --- Helper ---

type ParseSuccess<T> = { success: true; data: T };
type ParseError = { success: false; error: string };

export function parseBody<T>(
  schema: z.ZodType<T>,
  data: unknown
): ParseSuccess<T> | ParseError {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const message = result.error.issues
    .map((i) => `${i.path.join('.')}: ${i.message}`)
    .join('; ');
  return { success: false, error: message };
}
