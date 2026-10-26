/**
 * Closing a campaign: the non-destructive off-switch.
 *
 * `campaigns.status` was never written anywhere in the app, so the only way
 * to stop a campaign was to delete it and lose every story, consent record
 * and whip position with it. A closed campaign keeps all of that. It stops
 * collecting participation, and the public page and the embed say so.
 *
 * 'paused' is the closed state. The status column also accepts 'archived',
 * but nothing in the product gives 'archived' a separate meaning, and closing
 * has to be reversible, which is what 'paused' reads as. Anything that is not
 * 'active' is treated as closed on the way out, so a row that somehow carries
 * 'archived' renders as closed too.
 */

export const CLOSED_STATUS = 'paused';
export const OPEN_STATUS = 'active';

export type CampaignOpenState = typeof OPEN_STATUS | typeof CLOSED_STATUS;

/** Only 'active' collects participation. Everything else is closed. */
export function isCampaignClosed(status: string | null | undefined): boolean {
  return (status ?? OPEN_STATUS) !== OPEN_STATUS;
}

/**
 * Client-side write. Throws with the server's own message so the caller can
 * show it; a failed close must never look like a successful one.
 */
export async function setCampaignOpenState(slug: string, status: CampaignOpenState): Promise<{ steps_closed: number }> {
  let res: Response;
  try {
    res = await fetch(`/api/campaigns/${slug}/status`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    });
  } catch {
    throw new Error('Could not reach the server. Check your connection and try again.');
  }
  let body: { error?: string; steps_closed?: number } = {};
  try {
    body = await res.json();
  } catch {
    // Fall through to the status-code message below.
  }
  if (!res.ok) {
    throw new Error(body.error || (status === CLOSED_STATUS ? 'Could not close this campaign. Try again.' : 'Could not reopen this campaign. Try again.'));
  }
  return { steps_closed: body.steps_closed ?? 0 };
}
