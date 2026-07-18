/**
 * Runtime control for the Social Desk: the kill switch and circuit breaker,
 * both single rows in social_config so they can be flipped without a deploy.
 */
import { createAdminClient } from '@/lib/supabase';

export interface KillSwitch {
  is_paused: boolean;
  reason?: string;
}

/** Reads the kill switch. Fails CLOSED: any error is treated as paused. */
export async function getKillSwitch(): Promise<KillSwitch> {
  try {
    const admin = createAdminClient();
    const { data, error } = await admin
      .from('social_config')
      .select('value')
      .eq('key', 'killswitch')
      .maybeSingle();
    if (error || !data) return { is_paused: true, reason: 'killswitch row unreadable' };
    const v = data.value as KillSwitch;
    return { is_paused: v.is_paused !== false, reason: v.reason };
  } catch {
    return { is_paused: true, reason: 'killswitch read threw' };
  }
}

export async function setKillSwitch(isPaused: boolean, reason?: string): Promise<void> {
  const admin = createAdminClient();
  await admin
    .from('social_config')
    .update({ value: { is_paused: isPaused, reason: reason ?? null }, updated_at: new Date().toISOString() })
    .eq('key', 'killswitch');
}
