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
  revisionNote: z.string().max(500).optional(),
  existingMessage: z.string().max(10000).optional(),
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
  campaign_type: z.enum(['advocacy', 'storytelling']).default('advocacy'),
  visibility: z.enum(['public', 'unlisted']).optional(),
  headline: z.string().min(3).max(100),
  description: z.string().min(10).max(500),
  // Required for advocacy (enforced in superRefine); storytelling omits it and the
  // story prompt defines the topic, so an empty string is accepted here.
  issue_area: z.string().max(200),
  issue_subtopic: z.string().max(200).nullish(),
  // Advocacy fields
  target_level: z.enum(['federal', 'state', 'both']).optional(),
  message_template: z.string().max(2000).nullish(),
  distribution_plan: z.string().max(1000).nullish(),
  // Optional related bill (federal or state) — all-or-nothing, resolved client-side
  bill_level: z.enum(['federal', 'state']).optional(),
  bill_state: z.string().length(2).optional(),
  bill_ref: z.string().max(60).optional(),
  bill_title: z.string().max(500).optional(),
  bill_url: z.string().max(1000).optional(),
  // Storytelling fields
  story_prompt: z.string().max(2000).nullish(),
  usage_statement: z.string().max(3000).optional(),
  usage_tags: z.array(z.string().max(60)).max(20).optional(),
  attribution_options: z.array(z.enum(['named', 'first_name_only', 'anonymous'])).optional(),
  edit_revoke_policy: z.string().max(2000).optional(),
  recipient_email: z.string().email().max(200).nullish(),
}).superRefine((data, ctx) => {
  if (data.campaign_type === 'storytelling') {
    if (!data.usage_tags || data.usage_tags.length < 1) {
      ctx.addIssue({ code: 'custom', path: ['usage_tags'], message: 'Select at least one way you’d like to use these stories' });
    }
  } else {
    if (!data.issue_area || data.issue_area.trim().length < 1) {
      ctx.addIssue({ code: 'custom', path: ['issue_area'], message: 'Issue area is required' });
    }
    if (!data.target_level) {
      ctx.addIssue({ code: 'custom', path: ['target_level'], message: 'Target level is required' });
    }
    if (!data.distribution_plan || data.distribution_plan.trim().length < 10) {
      ctx.addIssue({ code: 'custom', path: ['distribution_plan'], message: 'Distribution plan must be at least 10 characters' });
    }
  }
});

export const storyChatSchema = z.object({
  campaignSlug: z.string().min(1).max(120),
  messages: z
    .array(
      z.object({
        role: z.enum(['user', 'assistant']),
        content: z.string().min(1).max(4000),
      })
    )
    .min(1)
    .max(60),
  turnstileToken: z.string().optional(),
});

export const submitStorySchema = z.object({
  campaignSlug: z.string().min(1).max(120),
  title: z.string().max(120).nullish(),
  body: z.string().min(20).max(8000),
  attribution_level: z.enum(['named', 'first_name_only', 'anonymous']),
  storyteller_name: z.string().max(200).nullish(),
  // Which uses the storyteller is OK with (their choice, not the creator's).
  granted_uses: z.array(z.string().max(60)).min(1).max(20),
  consent_usage: z.literal(true),
  consent_truthful: z.literal(true),
  // Storytelling persistence: the story is saved to the campaign organizer's
  // dashboard by default; `store: false` is the storyteller's opt-out. City/
  // state are sent only when location sharing is on; email is optional contact.
  store: z.boolean().default(true),
  city: z.string().max(100).nullish(),
  state: z.string().max(50).nullish(),
  storyteller_email: z.string().email().max(254).nullish(),
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
