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
import { searchPosts, listNotifications, type BlueskySession, type FoundPost } from './bluesky';
import { replyShouldSkip, runGuardrails } from './guardrails';
import { graphemeLength, BLUESKY_MAX_GRAPHEMES } from './bluesky';

// Narrow, high-intent listening queries per lane. Kept curated on purpose:
// wider coverage than launch, but still only posts where pointing someone at
// their reps (or answering a civic how-do-I question) is a genuine favor.
export const LANE_QUERIES: Array<{ lane: string; q: string }> = [
  { lane: 'act-now', q: '"someone should do something"' },
  { lane: 'act-now', q: '"call your representative"' },
  { lane: 'act-now', q: '"call your senators"' },
  { lane: 'act-now', q: '"contact your reps"' },
  { lane: 'act-now', q: '"email your representative"' },
  { lane: 'grievance', q: 'gas prices brutal' },
  { lane: 'grievance', q: 'rent too expensive' },
  { lane: 'grievance', q: 'groceries so expensive' },
  { lane: 'grievance', q: "can't afford rent" },
  { lane: 'grievance', q: 'health insurance premium up' },
  { lane: 'grievance', q: 'childcare costs insane' },
  { lane: 'grievance', q: 'electric bill doubled' },
  { lane: 'grievance', q: 'student loan payment brutal' },
  { lane: 'civic-question', q: '"who is my representative"' },
  { lane: 'civic-question', q: '"who represents me"' },
  { lane: 'civic-question', q: '"how to contact your representative"' },
  { lane: 'civic-question', q: '"does calling your representative"' },
  // Widened 2026-08 for growth — more phrasings and pocketbook topics so the
  // engager actually finds real people to help (it was drafting ~0/run).
  { lane: 'act-now', q: '"how do I contact my senator"' },
  { lane: 'act-now', q: '"wish I could do something about"' },
  { lane: 'act-now', q: '"we need to call our reps"' },
  { lane: 'grievance', q: 'insurance denied my claim' },
  { lane: 'grievance', q: 'prescription too expensive' },
  { lane: 'grievance', q: 'medical bills bankrupt' },
  { lane: 'grievance', q: 'housing so unaffordable' },
  { lane: 'grievance', q: 'wages not keeping up' },
  { lane: 'grievance', q: 'property taxes crushing' },
  { lane: 'grievance', q: 'daycare waitlist' },
  { lane: 'grievance', q: 'social security worried' },
  { lane: 'civic-question', q: '"does contacting congress"' },
  { lane: 'civic-question', q: '"how do bills become law"' },
  { lane: 'civic-question', q: '"is my vote worth"' },
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
  // Tuned 2026-08: keep the HARD org/news/bot signals, but drop terms that
  // over-matched real people (data, daily, report, official, action, march,
  // rally, coalition, alliance, network, campaign, resist, indivisible, feed,
  // weather, standup, forscience). The engager was drafting ~0 because this
  // filter was too broad; growth needs it to actually reach humans.
  return /(\bnews\b|bot\b|media\b|\bpress\b|\.ai\b|wire\b|times\b|gazette|tribune|magazine|podcast|newsletter|\.gov\b|\bpac\b|caucus|committee|foundation|institute|nonprofit|\.org\b|newspaper|headlines)/.test(s);
}

// First-person voice: someone talking about their own life, which is what we
// can legitimately redirect to their reps. Filters news headlines and slogans.
export function hasFirstPersonVoice(text: string): boolean {
  return /\b(i|i'm|im|i've|ive|my|me|myself|we|we're|were|our|us|can't afford|cant afford|paying|paycheck)\b/i.test(text);
}

const MIN_TARGET_LEN = 12;

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
- RELEVANCE: only reply if this is clearly (a) a person venting a real
  pocketbook or policy frustration you can redirect to their officials, or
  (b) a person genuinely asking a civic how-do-I question (who represents me,
  how to contact reps, does contacting them matter) you can plainly answer.
  If the post is a joke, quote, lyric, slogan, meme, news headline, or neither
  of those, return {"skip": true}.

Return ONLY JSON: {"text": "<reply>"} or {"skip": true}.
`;

export interface EngagerResult {
  scanned: number;
  drafted: number;
  gated: number;
  skipped: number;
}

// Reply instructions for INBOUND conversation — someone replied to, mentioned,
// or quoted us. Unlike the search lanes, this person is already talking to us,
// so we answer the substance instead of forcing a grievance/civic frame. Same
// non-negotiables: nonpartisan, invent nothing, no AI tells.
const INBOUND_INSTRUCTIONS = `
You are the Engager stage of the My Democracy Social Desk, handling INBOUND
replies/mentions — someone is talking TO us on Bluesky. Obey the brand brain
above, especially the reply doctrine and the four non-negotiables.

Write ONE reply to the message below. Rules:
- They engaged with us, so respond to what they actually said. Be warm, plain,
  and useful. If they ask something, answer it; if they share a frustration,
  point to the fast way to act.
- Stay strictly nonpartisan. Never adopt their framing as fact, never blame a
  party or figure, never take a side on a bill. We inform; the citizen decides.
- No em dashes. No AI tells. Do not narrate their emotions.
- 280 graphemes max. Include https://mydemocracy.app when pointing them to act.
- INVENT NOTHING. Only reference what the message literally says.
- SKIP (return {"skip": true}) if a reply adds nothing or would be unwise: a
  bare thanks/emoji/ack, spam, trolling, abuse, or anything you cannot answer
  nonpartisanly and truthfully.

Return ONLY JSON: {"text": "<reply>"} or {"skip": true}.
`;

/**
 * Inbound engager — reply to people who reply to, mention, or quote US.
 * Reuses the search engager's guardrails, official-gating, per-author cap, and
 * de-dup (social_replies.target_uri), so inbound replies get the same safety
 * pipeline. Runs alongside runEngager on the social-engager cron.
 */
export async function runInboundEngager(brandBrain: string, session: BlueskySession): Promise<EngagerResult> {
  const admin = createAdminClient();
  const result: EngagerResult = { scanned: 0, drafted: 0, gated: 0, skipped: 0 };

  let notifications;
  try {
    notifications = await listNotifications(session, 50);
  } catch {
    return result; // transient API failure — try again next run
  }
  // People engaging with us; never react to our own posts.
  const candidates = notifications.filter((n) => n.authorHandle && n.authorHandle !== OWN_HANDLE);
  result.scanned = candidates.length;
  if (!candidates.length) return result;

  // Skip anything we've already handled (dedup on the inbound post uri).
  const uris = candidates.map((c) => c.uri);
  const { data: existing } = await admin.from('social_replies').select('target_uri').in('target_uri', uris);
  const have = new Set((existing ?? []).map((r) => r.target_uri));

  // Same per-author daily cap as the search path (shared social_replies table).
  const since24h = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const { data: recentAuthors } = await admin
    .from('social_replies')
    .select('target_author')
    .neq('status', 'skipped')
    .gte('created_at', since24h);
  const authorsHandled = new Set((recentAuthors ?? []).map((r) => r.target_author));

  for (const c of candidates) {
    if (have.has(c.uri)) continue;
    if (authorsHandled.has(c.authorHandle)) {
      result.skipped++;
      continue;
    }

    const recordSkip = async (skipReason: string) => {
      await admin.from('social_replies').insert({
        platform: 'bluesky',
        lane: `inbound-${c.reason}`,
        target_uri: c.uri,
        target_author: c.authorHandle,
        target_text: c.text,
        draft_body: '',
        requires_human: false,
        status: 'skipped',
        guardrail_report: { skipReason },
      });
    };

    // Fast local skips before spending a Claude call.
    const skip = replyShouldSkip(c.text);
    if (skip.skip) {
      await recordSkip(`inbound skip: ${skip.reason ?? 'skip discipline'}`);
      result.skipped++;
      continue;
    }

    let text = '';
    try {
      const raw = await callClaude(
        `${brandBrain}\n\n---\n${INBOUND_INSTRUCTIONS}`,
        `Someone ${c.reason === 'reply' ? 'replied to us' : c.reason === 'quote' ? 'quoted us' : 'mentioned us'} — @${c.authorHandle}: ${c.text}`,
        300,
      );
      const parsed = extractJSON(raw) as { text?: string; skip?: boolean } | null;
      if (parsed?.skip || !parsed?.text) {
        await recordSkip('writer skip: nothing useful to add');
        result.skipped++;
        continue;
      }
      text = deDash(parsed.text).trim();
    } catch {
      result.skipped++; // transient — leave unrecorded to retry
      continue;
    }

    const gate = runGuardrails({ text, maxLength: BLUESKY_MAX_GRAPHEMES, graphemeLength });
    if (!gate.passed) {
      const reasons = gate.checks.filter((ch) => !ch.passed).map((ch) => ch.reason).join('; ');
      await recordSkip(`guardrail: ${reasons}`);
      result.skipped++;
      continue;
    }

    // Officials and org/press accounts that engage us go to the human queue;
    // clear individuals get an autonomous reply (when reply mode allows).
    const requiresHuman =
      isLikelyElectedOfficial(c.authorHandle, c.authorDisplay) ||
      looksLikeOrgOrBot(c.authorHandle, c.authorDisplay);
    const status = requiresHuman ? 'pending_approval' : 'pending_post';
    // Thread onto their post: parent is their reply; root is the thread root
    // (theirs if they carry one, else their post starts the thread with us).
    const replyRef = {
      root: c.root ?? { uri: c.uri, cid: c.cid },
      parent: { uri: c.uri, cid: c.cid },
    };

    const { error } = await admin.from('social_replies').insert({
      platform: 'bluesky',
      lane: `inbound-${c.reason}`,
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

export async function runEngager(brandBrain: string, session: BlueskySession, perQuery = 8): Promise<EngagerResult> {
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

    // Record a target we decided against so later runs don't re-scan it and
    // pay another Claude call for the same post. Skipped rows don't count
    // toward the per-author cap.
    const recordSkip = async (skipReason: string) => {
      await admin.from('social_replies').insert({
        platform: 'bluesky',
        lane: c.lane,
        target_uri: c.uri,
        target_author: c.authorHandle,
        target_text: c.text,
        draft_body: '',
        requires_human: false,
        status: 'skipped',
        guardrail_report: { skipReason },
      });
    };

    // Draft the reply.
    let text = '';
    try {
      const raw = await callClaude(`${brandBrain}\n\n---\n${REPLY_INSTRUCTIONS}`, `POST by @${c.authorHandle}: ${c.text}`, 300);
      const parsed = extractJSON(raw) as { text?: string; skip?: boolean } | null;
      if (parsed?.skip || !parsed?.text) {
        await recordSkip('writer skip: not a real grievance or civic question');
        result.skipped++;
        continue;
      }
      text = deDash(parsed.text).trim();
    } catch {
      result.skipped++; // transient API failure: leave unrecorded so we retry
      continue;
    }

    // Guardrail the draft before it's ever stored as postable.
    const gate = runGuardrails({ text, maxLength: BLUESKY_MAX_GRAPHEMES, graphemeLength });
    if (!gate.passed) {
      const reasons = gate.checks.filter((ch) => !ch.passed).map((ch) => ch.reason).join('; ');
      await recordSkip(`guardrail: ${reasons}`);
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
