/**
 * The ask: the one sentence that says what the official should DO.
 *
 * It used to be derived entirely from stage_goal and the bill number, which
 * meant a cosponsor action could only ever produce "cosponsor it". An
 * organization that has been working a bill for a year usually has a sharper
 * ask than that: sign on as an ORIGINAL cosponsor before Friday, or cosponsor
 * AND request a hearing. They can now write it themselves.
 *
 * stage_goal stays, and stays required. It is the machine-readable intent:
 * it drives committee targeting, the bill-track position, the whip-count
 * framing, and whether every talking point is forced (generate-core-message
 * uses it for that). A free-text ask gives none of those, so it supplements
 * the goal rather than replacing it.
 */

export interface AskInput {
  /** The organization's own sentence, when they wrote one. */
  ask?: string | null;
  billRef?: string | null;
  stageGoal?: string | null;
  /** Resolved stance for this campaign, where there is one. */
  stance?: 'support' | 'oppose' | null;
}

/** One sentence, no line breaks, bounded. Longer than this is talking points. */
export const MAX_ASK_LENGTH = 300;

/** Trim an organization's ask to something that can sit in a prompt. */
export function normalizeAsk(raw: string | null | undefined): string | null {
  const v = String(raw ?? '').replace(/\s+/g, ' ').trim();
  if (!v) return null;
  return v.slice(0, MAX_ASK_LENGTH);
}

/**
 * The ASK instruction handed to the model. An organization's own words win;
 * otherwise this falls back to the sentence the goal implies, which is what
 * every campaign got before.
 */
export function buildAskInstruction(input: AskInput): string {
  const own = normalizeAsk(input.ask);
  if (own) {
    // Quoted so the model treats it as the request to convey, and told not to
    // soften it: an organization that wrote "before Friday" means Friday.
    return `THE ASK SENTENCE MUST make this request, in the constituent's own voice: "${own}". Keep what is being asked for exactly, including any deadline or condition. Do not broaden or soften it.`;
  }

  const ref = String(input.billRef ?? '').trim();
  if (!ref) return '';

  const verb =
    input.stageGoal === 'cosponsor'
      ? 'cosponsor it'
      : input.stance === 'oppose'
        ? 'oppose it / vote no'
        : 'support it / vote yes';
  return `THE ASK SENTENCE MUST: name ${ref} and ask them to ${verb}.`;
}
