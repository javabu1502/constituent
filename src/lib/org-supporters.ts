/**
 * Who counts as an organization's supporter.
 *
 * Three things make someone a supporter, and the org should see one number,
 * not three: they filled in the join form, they took an action on one of the
 * org's campaigns, or they shared their story with it. A person who did all
 * three is one supporter.
 *
 * Identity is the lowercased email, because that is the only identifier all
 * three sources share. Rows with no email are real actions by real people,
 * but nothing ties them to a person or to each other, so they are reported
 * separately as anonymous rather than guessed into the headcount.
 */
import type { SupabaseClient } from '@supabase/supabase-js';

/** Where a supporter came to us from. One person can have several. */
export type SupporterSource = 'joined' | 'acted' | 'shared';

export interface Supporter {
  email: string;
  name: string | null;
  city: string | null;
  state: string | null;
  sources: Set<SupporterSource>;
  /** Only the join form collects a street address, so only it can place a district. */
  upperDistrict: string | null;
  lowerDistrict: string | null;
}

/**
 * RFC 2606 / 6761 reserve these for documentation and testing, so no real
 * supporter can hold one. The seeded demo data is almost entirely
 * @example.com, and without this filter it would be indistinguishable from
 * signups in the org's own headcount.
 */
const RESERVED_EMAIL = /@(?:[^@]*\.)?(?:example\.(?:com|net|org)|test|example|invalid|localhost)$/i;

export function isCountableEmail(email: string | null | undefined): email is string {
  if (!email) return false;
  const e = email.trim().toLowerCase();
  if (!e.includes('@') || e.endsWith('@')) return false;
  return !RESERVED_EMAIL.test(e);
}

/** First non-empty value wins: the join form is richer than an action row. */
function better<T>(current: T | null, incoming: T | null): T | null {
  if (current !== null && current !== undefined && String(current).trim() !== '') return current;
  return incoming !== null && incoming !== undefined && String(incoming).trim() !== '' ? incoming : current;
}

export interface SupporterRollup {
  supporters: Supporter[];
  /** Action and story rows with no usable email, so not attributable to a person. */
  anonymousActions: number;
  anonymousStories: number;
}

/**
 * Collect every supporter of one organization across the three sources.
 *
 * `orgUserId` owns the campaigns; actions and stories reach the org through
 * `campaigns.creator_id`, not through a column of their own.
 */
export async function collectSupporters(
  admin: SupabaseClient,
  orgUserId: string,
): Promise<SupporterRollup> {
  const byEmail = new Map<string, Supporter>();
  const add = (
    source: SupporterSource,
    email: string | null,
    name: string | null,
    city: string | null,
    state: string | null,
    upper: string | null = null,
    lower: string | null = null,
  ) => {
    if (!isCountableEmail(email)) return false;
    const key = email.trim().toLowerCase();
    const existing = byEmail.get(key);
    if (existing) {
      existing.sources.add(source);
      existing.name = better(existing.name, name);
      existing.city = better(existing.city, city);
      existing.state = better(existing.state, state);
      existing.upperDistrict = better(existing.upperDistrict, upper);
      existing.lowerDistrict = better(existing.lowerDistrict, lower);
    } else {
      byEmail.set(key, {
        email: key,
        name: name?.trim() || null,
        city: city?.trim() || null,
        state: state?.trim()?.toUpperCase() || null,
        sources: new Set([source]),
        upperDistrict: upper,
        lowerDistrict: lower,
      });
    }
    return true;
  };

  // 1. The join form. The only source with a geocoded district.
  const { data: joined } = await admin
    .from('org_supporters')
    .select('email, name, city, state, state_upper_district, state_lower_district, district_resolved')
    .eq('org_user_id', orgUserId)
    .is('unsubscribed_at', null);

  for (const r of joined ?? []) {
    add(
      'joined',
      r.email as string | null,
      r.name as string | null,
      r.city as string | null,
      r.state as string | null,
      r.district_resolved ? ((r.state_upper_district as string | null) ?? null) : null,
      r.district_resolved ? ((r.state_lower_district as string | null) ?? null) : null,
    );
  }

  // 2 and 3 both hang off the org's campaigns.
  const { data: campaigns } = await admin.from('campaigns').select('id').eq('creator_id', orgUserId);
  const campaignIds = (campaigns ?? []).map((c) => c.id as string);

  let anonymousActions = 0;
  let anonymousStories = 0;

  if (campaignIds.length > 0) {
    const [{ data: actions }, { data: stories }] = await Promise.all([
      admin
        .from('campaign_actions')
        .select('participant_email, participant_name, participant_city, participant_state')
        .in('campaign_id', campaignIds),
      // A revoked story is withdrawn consent, so the storyteller stops counting
      // as a supporter the moment they pull it.
      admin
        .from('stories')
        .select('storyteller_email, storyteller_name, city, state, status, revoked_at')
        .in('campaign_id', campaignIds)
        .is('revoked_at', null),
    ]);

    for (const a of actions ?? []) {
      const counted = add(
        'acted',
        a.participant_email as string | null,
        a.participant_name as string | null,
        a.participant_city as string | null,
        a.participant_state as string | null,
      );
      if (!counted && !a.participant_email) anonymousActions++;
    }

    for (const s of stories ?? []) {
      if (s.status && !['active', 'published', 'approved'].includes(String(s.status))) continue;
      const counted = add(
        'shared',
        s.storyteller_email as string | null,
        s.storyteller_name as string | null,
        s.city as string | null,
        s.state as string | null,
      );
      if (!counted && !s.storyteller_email) anonymousStories++;
    }
  }

  return { supporters: [...byEmail.values()], anonymousActions, anonymousStories };
}
