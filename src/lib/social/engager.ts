/**
 * Engager — stage 7. Listens on Bluesky for posts worth joining, drafts a
 * mission-aligned reply in the brand brain's reply doctrine, and routes it:
 * elected-official replies always go to the human-approval queue; citizen
 * replies go autonomous (if reply mode allows) or to approval (if gated).
 *
 * Design bias: precision over volume. We search narrow, high-intent queries
 * (people already wanting to act, or clear pocketbook grievances) and skip
 * anything near grief or rage-bait. "When in doubt, sit it out."
 */
import { createAdminClient } from '@/lib/supabase';
import { callClaude, deDash, extractJSON } from '@/lib/claude';
import { searchPosts, type BlueskySession, type FoundPost } from './bluesky';
import { replyShouldSkip, runGuardrails } from './guardrails';
import { graphemeLength, BLUESKY_MAX_GRAPHEMES } from './bluesky';

// Narrow, high-intent listening queries per lane. Kept curated on purpose.
export const LANE_QUERIES: Array<{ lane: string; q: string }> = [
  { lane: 'act-now', q: '"someone should do something"' },
  { lane: 'act-now', q: '"call your representative"' },
  { lane: 'act-now', q: '"contact your reps"' },
  { lane: 'grievance', q: 'gas prices brutal' },
  { lane: 'grievance', q: 'rent too expensive' },
  { lane: 'grievance', q: 'groceries so expensive' },
];

const OWN_HANDLE = process.env.BLUESKY_HANDLE ?? '';

// Heuristic: does this author look like an elected official / office? If so we
// never reply autonomously — it goes to the human queue. Conservative: any
// match gates.
export function isLikelyElectedOfficial(handle: string, display: string): boolean {
  const s = `${handle} ${display}`.toLowerCase();
  return (
    /\b(rep|congress(man|woman|member)|sen|senator|governor|gov|assembly(man|woman|member)|councilmember|mayor|delegate|legislator)\b/.test(s) ||
    /\.gov\b/.test(handle) ||
    /\bofficial\b/.test(s)
  );
}

// News outlets, bots, orgs, and aggregators: skip entirely. We reply to people
// venting, not to headlines. (Also filters the "empty text = a headline card"
// case that produced nonsense replies.)
export function looksLikeOrgOrBot(handle: string, display: string): boolean {
  const s = `${handle} ${display}`.toLowerCase();
  return /(news|bot\b|\bdata|media|press|daily|report|\.ai\b|wire|times|gazette|tribune|magazine|podcast|newsletter|feed|official|weather|rally|coalition|\baction\b|\bpac\b|\bmarch\b|protest|standup|forscience|resist|indivisible|\.org\b|caucus|committee|campaign\b|foundation|institute|nonprofit|alliance|network)/.test(s);
}

// First-person voice: someone talking about their own life, which is what we
// can legitimately redirect to their reps. Filters news headlines and slogans.
export function hasFirstPersonVoice(text: string): boolean {
  return /\b(i|i'm|im|i've|ive|my|me|myself|we|we're|were|our|us|can't afford|cant afford|paying|paycheck)\b/i.test(text);
}

const MIN_TARGET_LEN = 20;

const REPLY_INSTRUCTIONS = `
You are the Engager stage of the My Democracy Social Desk. Obey the brand brain
above, especially the reply doctrine and the four non-negotiables.

Write ONE reply to the post below. Rules:
- Meet them where they are: if they stated a view, help them tell their reps
  THAT view. Never adopt their framing as fact, never blame a party or figure.
- Confirm the feeling briefly, point to the fast way to act. Vary the closer.
- No em dashes. No AI tells. No narrating their emotions. Sound like the
  approved examples.
- 280 graphemes max. Include the action link inline: https://mydemocracy.app
- INVENT NOTHING. Only reference details the post literally states. Do not
  assume family members, jobs, locations, or specifics they did not write.
- RELEVANCE: only reply if this is clearly a person venting a real pocketbook
  or policy frustration you can redirect to their officials. If the post is a
  joke, quote, lyric, slogan, meme, news headline, or not actually about a
  civic grievance, return {"skip": true}.

Return ONLY JSON: {"text": "<reply>"} or {"skip": true}.
`;

export interface EngagerResult {
  scanned: number;
  drafted: number;
  gated: number;
  skipped: number;
}

export async function runEngager(brandBrain: string, session: BlueskySession, perQuery = 5): Promise<EngagerResult> {
  const admin = createAdminClient();
  const result: EngagerResult = { scanned: 0, drafted: 0, gated: 0, skipped: 0 };

  // Candidates across all lane queries, de-duplicated by uri.
  const seen = new Set<string>();
  const candidates: Array<FoundPost & { lane: string }> = [];
  for (const { lane, q } of LANE_QUERIES) {
    let found: FoundPost[] = [];
    try {
      found = await searchPosts(session, q, perQuery);
    } catch {
      continue;
    }
    for (const p of found) {
      if (seen.has(p.uri)) continue;
      seen.add(p.uri);
      candidates.push({ ...p, lane });
    }
  }
  result.scanned = candidates.length;
  if (!candidates.length) return result;

  // Skip anything we've already queued/replied to (unique on target_uri).
  const uris = candidates.map((c) => c.uri);
  const { data: existing } = await admin.from('social_replies').select('target_uri').in('target_uri', uris);
  const have = new Set((existing ?? []).map((r) => r.target_uri));

  // Per-author cap: at most one reply per account per day, so we never stack
  // multiple replies on the same person or org.
  const since24h = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const { data: recentAuthors } = await admin
    .from('social_replies')
    .select('target_author')
    .neq('status', 'skipped')
    .gte('created_at', since24h);
  const authorsHandled = new Set((recentAuthors ?? []).map((r) => r.target_author));

  for (const c of candidates) {
    if (have.has(c.uri)) continue;
    if (c.authorHandle === OWN_HANDLE) continue; // never reply to ourselves

    // Precision filters: real people, real posts, in their own voice.
    if (c.text.trim().length < MIN_TARGET_LEN) {
      result.skipped++;
      continue;
    }
    if (looksLikeOrgOrBot(c.authorHandle, c.authorDisplay)) {
      result.skipped++;
      continue;
    }
    if (c.lane === 'grievance' && !hasFirstPersonVoice(c.text)) {
      result.skipped++;
      continue;
    }
    if (authorsHandled.has(c.authorHandle)) {
      result.skipped++;
      continue;
    }

    const skip = replyShouldSkip(c.text);
    if (skip.skip) {
      result.skipped++;
      continue;
    }

    // Draft the reply.
    let text = '';
    try {
      const raw = await callClaude(`${brandBrain}\n\n---\n${REPLY_INSTRUCTIONS}`, `POST by @${c.authorHandle}: ${c.text}`, 300);
      const parsed = extractJSON(raw) as { text?: string; skip?: boolean } | null;
      if (parsed?.skip || !parsed?.text) {
        result.skipped++;
        continue;
      }
      text = deDash(parsed.text).trim();
    } catch {
      result.skipped++;
      continue;
    }

    // Guardrail the draft before it's ever stored as postable.
    const gate = runGuardrails({ text, maxLength: BLUESKY_MAX_GRAPHEMES, graphemeLength });
    if (!gate.passed) {
      result.skipped++;
      continue;
    }

    const requiresHuman = isLikelyElectedOfficial(c.authorHandle, c.authorDisplay);
    // pending_approval -> waits for a human; pending_post -> eligible for the
    // autonomous poster (citizen replies when reply mode is autonomous).
    const status = requiresHuman ? 'pending_approval' : 'pending_post';
    const replyRef = {
      root: c.root ?? { uri: c.uri, cid: c.cid },
      parent: { uri: c.uri, cid: c.cid },
    };

    const { error } = await admin.from('social_replies').insert({
      platform: 'bluesky',
      lane: c.lane,
      target_uri: c.uri,
      target_author: c.authorHandle,
      target_text: c.text,
      draft_body: text,
      requires_human: requiresHuman,
      status,
      guardrail_report: { ...gate, replyRef },
    });
    if (error) {
      result.skipped++;
      continue;
    }
    authorsHandled.add(c.authorHandle);
    result.drafted++;
    if (requiresHuman) result.gated++;
  }

  return result;
}
