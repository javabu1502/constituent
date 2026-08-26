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
import { searchPosts, listNotifications, like, follow, getFollowing, getPostTexts, type BlueskySession, type FoundPost } from './bluesky';
import { replyShouldSkip, runGuardrails, isNearDuplicate } from './guardrails';
import { graphemeLength, BLUESKY_MAX_GRAPHEMES } from './bluesky';

// Narrow, high-intent listening queries per lane. Kept curated on purpose:
// wider coverage than launch, but still only posts where pointing someone at
// their reps (or answering a civic how-do-I question) is a genuine favor.
// NOTE: '"someone should do something"' was removed 2026-08-25 — on Bluesky
// that exact phrase is overwhelmingly sarcasm about a quoted post or image the
// searcher can't see (we replied earnestly to a joke about Canadian Tire hats
// and one about doing cardio). Don't re-add bare deictic phrases; queries must
// contain the TOPIC, not just the impulse.
export const LANE_QUERIES: Array<{ lane: string; q: string }> = [
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

// Per-run engagement caps. Kept modest so the account reads as an attentive
// participant, not a spray-and-pray bot (aggressive liking/following trips
// platform spam heuristics and looks untrustworthy). The 2h cron makes these
// the daily ceiling only in the unlikely event every run saturates them.
const LIKE_CAP = 15;
const FOLLOW_CAP = 10;

const REPLY_INSTRUCTIONS = `
You are the Engager stage of the My Democracy Social Desk. Obey the brand brain
above, especially the reply doctrine and the four non-negotiables.

Write ONE reply to the post below. Rules:
- Meet them where they are: if they stated a view, help them tell their reps
  THAT view. Never adopt their framing as fact, never blame a party or figure.
- Confirm the feeling briefly, point to the fast way to act. Vary the closer.
- No em dashes. No AI tells. No narrating their emotions. Sound like the
  approved examples.
- 280 graphemes max. Include the provided ACTION LINK inline, exactly as given.
- INVENT NOTHING. Only reference details the post literally states. Do not
  assume family members, jobs, locations, or specifics they did not write.
- The app connects people ONLY to their own elected officials. NEVER name a
  specific person as someone they can message through the app. Say "your
  representatives" / "your senators", never "put it in [Name]'s inbox".
- RELEVANCE: only reply if this is clearly (a) a person venting a real
  pocketbook or policy frustration you can redirect to their officials, or
  (b) a person genuinely asking a civic how-do-I question (who represents me,
  how to contact reps, does contacting them matter) you can plainly answer.
  If the post is a joke, quote, lyric, slogan, meme, news headline, or neither
  of those, return {"skip": true}.
- CONTEXT: the post may come with THREAD CONTEXT (the post it replies to) or
  EMBED CONTEXT (what it quotes, links, or shows in an image). Read them first;
  they are what "this"/"that" refers to. If the context shows the post is
  sarcasm, a joke, or about something no US official controls, skip. If the
  post's meaning depends on something you were NOT given (it says "this"/"that"
  or reacts to something invisible), skip — never guess the referent.
- US ONLY: the app connects US constituents to US officials. If anything in the
  post or context suggests the person is outside the US (non-US places,
  currencies, parties, spellings like "labour"), skip.
- TONE: never mock the poster, their effort, or their post. No snark about
  "less effort than the post" or similar — we are a helpful civic neighbor,
  not a reply guy.

Return ONLY JSON: {"text": "<reply>"} or {"skip": true}.
`;

// --- Deep links: reply with the RELEVANT weigh-in, not the homepage --------
// A person venting about insulin costs should land on the drug-pricing
// weigh-in, not on the front door. Deterministic keyword overlap against
// active FEDERAL official weigh-ins (state ones are excluded — we don't know
// the poster's state). Falls back to /issues when nothing matches confidently.

export interface LinkableCampaign {
  slug: string;
  headline: string;
  issue_subtopic: string | null;
}

const MATCH_STOPWORDS = new Set(['should', 'would', 'could', 'about', 'their', 'there', 'these', 'those', 'congress', 'federal', 'government', 'people', 'right', 'rights', 'every', 'other', 'still', 'because', 'being', 'have', 'that', 'this', 'with', 'from', 'they', 'them', 'your', 'will', 'what', 'when', 'make', 'more', 'need']);

function matchTokens(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z\s]/g, ' ')
      .split(/\s+/)
      .filter((w) => w.length > 3 && !MATCH_STOPWORDS.has(w))
  );
}

/** Best weigh-in for a post's text, or null when the match isn't confident. */
export function bestCampaignFor(postText: string, campaigns: LinkableCampaign[]): LinkableCampaign | null {
  const post = matchTokens(postText);
  if (post.size === 0) return null;
  let best: LinkableCampaign | null = null;
  let bestScore = 0;
  for (const c of campaigns) {
    const target = matchTokens(`${c.headline} ${c.issue_subtopic ?? ''}`);
    let score = 0;
    for (const t of target) if (post.has(t)) score += 1;
    if (score > bestScore) {
      bestScore = score;
      best = c;
    }
  }
  return bestScore >= 2 ? best : null;
}

async function loadLinkableCampaigns(): Promise<LinkableCampaign[]> {
  const admin = createAdminClient();
  const { data } = await admin
    .from('campaigns')
    .select('slug, headline, issue_subtopic')
    .eq('is_official', true)
    .eq('status', 'active')
    .eq('approval_status', 'approved')
    .is('bill_state', null)
    .limit(200);
  return (data ?? []) as LinkableCampaign[];
}

function actionLinkFor(postText: string, campaigns: LinkableCampaign[]): string {
  const match = bestCampaignFor(postText, campaigns);
  return match
    ? `https://mydemocracy.app/campaign/${match.slug}?utm_source=bsky-reply`
    : 'https://mydemocracy.app/issues?utm_source=bsky-reply';
}

export interface EngagerResult {
  scanned: number;
  drafted: number;
  gated: number;
  skipped: number;
  liked: number;
  followed: number;
}

// Reply instructions for INBOUND conversation — someone replied to, mentioned,
// or quoted us. Unlike the search lanes, this person is already talking to us,
// so we answer the substance instead of forcing a grievance/civic frame. Same
// non-negotiables: nonpartisan, invent nothing, no AI tells.
const INBOUND_INSTRUCTIONS = `
You are the Engager stage of the My Democracy Social Desk, handling INBOUND
replies/mentions — someone is talking TO us on Bluesky. Obey the brand brain
above, especially the reply doctrine and the four non-negotiables.

Write ONE reply to the message below. DEFAULT TO REPLYING — this person chose
to talk to us, and silence reads as a bot that broadcasts and never listens.
Rules:
- ALWAYS reply (never skip) when they: ask a question about the app or how to
  use it; report a problem or bug ("couldn't send", "got an error" — thank
  them plainly and say the team is looking at it, never promise a fix or a
  timeline); ask a civic how-do-I question; or continue the conversation with
  real substance.
- If they are CORRECTING something we posted (a date, a fact, "get your facts
  straight"), draft a gracious reply that thanks them and takes the flag
  seriously. Do NOT argue, do NOT confirm or deny the correction (you cannot
  verify it), and set "flag": "correction" in your JSON so a human reviews it
  before it posts.
- If they share a hard personal situation in response to our prompt, a short,
  warm, human acknowledgment is the reply — no link, no call to action, no
  advice. One or two plain sentences.
- Stay strictly nonpartisan. Never adopt their framing as fact, never blame a
  party or figure, never take a side on a bill. We inform; the citizen decides.
- No em dashes. No AI tells. Do not narrate their emotions.
- 280 graphemes max. When pointing them to act, include the provided ACTION LINK exactly as given.
- INVENT NOTHING. Only reference what the message literally says.
- If OUR POST they're responding to is provided, read it first — their message
  only makes sense in that context. If their message reacts to something you
  were not given, skip rather than guess what they mean.
- SKIP (return {"skip": true}) ONLY for: a bare thanks/emoji/ack with nothing
  to answer, spam or fundraising links, trolling or abuse, someone clearly
  outside the US, or anything you cannot answer nonpartisanly and truthfully.

Return ONLY JSON: {"text": "<reply>", "flag": "correction" | null} or {"skip": true}.
`;

/**
 * Inbound engager — reply to people who reply to, mention, or quote US.
 * Reuses the search engager's guardrails, official-gating, per-author cap, and
 * de-dup (social_replies.target_uri), so inbound replies get the same safety
 * pipeline. Runs alongside runEngager on the social-engager cron.
 */
export async function runInboundEngager(brandBrain: string, session: BlueskySession): Promise<EngagerResult> {
  const admin = createAdminClient();
  const result: EngagerResult = { scanned: 0, drafted: 0, gated: 0, skipped: 0, liked: 0, followed: 0 };
  const linkableCampaigns = await loadLinkableCampaigns();

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

  // Inbound is a CONVERSATION, so it gets its own per-author allowance instead
  // of the search path's one-per-day cap (which made holding any 2-turn
  // exchange impossible — every follow-up from the same person was dropped).
  // Cap 3 inbound replies per author per day so bot loops can't run away.
  const INBOUND_PER_AUTHOR_CAP = 3;
  const since24h = new Date(Date.now() - 24 * 60 * 60_000).toISOString();
  const { data: recentInbound } = await admin
    .from('social_replies')
    .select('target_author')
    .like('lane', 'inbound-%')
    .neq('status', 'skipped')
    .gte('created_at', since24h);
  const inboundCount = new Map<string, number>();
  for (const r of recentInbound ?? []) {
    inboundCount.set(r.target_author, (inboundCount.get(r.target_author) ?? 0) + 1);
  }

  // For replies, fetch the post of OURS they're responding to — answering
  // "what they actually said" requires knowing what it was said in response to.
  const inboundParentUris = [...new Set(candidates.filter((c) => c.parent?.uri && !have.has(c.uri)).map((c) => c.parent!.uri))];
  const inboundParents = await getPostTexts(session, inboundParentUris).catch(
    () => ({}) as Record<string, { authorHandle: string; text: string }>,
  );

  for (const c of candidates) {
    if (have.has(c.uri)) continue;
    if ((inboundCount.get(c.authorHandle) ?? 0) >= INBOUND_PER_AUTHOR_CAP) {
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

    const ourPost = c.parent ? inboundParents[c.parent.uri] : undefined;
    let text = '';
    let isCorrection = false;
    try {
      const raw = await callClaude(
        `${brandBrain}\n\n---\n${INBOUND_INSTRUCTIONS}`,
        `Someone ${c.reason === 'reply' ? 'replied to us' : c.reason === 'quote' ? 'quoted us' : 'mentioned us'} — @${c.authorHandle}: ${c.text}\n${ourPost?.text ? `\nTHEY ARE RESPONDING TO OUR POST: ${ourPost.text}\n` : ''}\nACTION LINK: ${actionLinkFor(c.text, linkableCampaigns)}`,
        300,
      );
      const parsed = extractJSON(raw) as { text?: string; skip?: boolean; flag?: string | null } | null;
      if (parsed?.skip || !parsed?.text) {
        await recordSkip('writer skip: nothing useful to add');
        result.skipped++;
        continue;
      }
      text = deDash(parsed.text).trim();
      isCorrection = parsed.flag === 'correction';
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

    // Officials and org/press accounts that engage us go to the human queue,
    // as do accuracy corrections (the writer can't verify them, and a wrong
    // gracious-acknowledgment is worse than a slow right one); clear
    // individuals get an autonomous reply (when reply mode allows).
    const requiresHuman =
      isLikelyElectedOfficial(c.authorHandle, c.authorDisplay) ||
      looksLikeOrgOrBot(c.authorHandle, c.authorDisplay) ||
      isCorrection;
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
    inboundCount.set(c.authorHandle, (inboundCount.get(c.authorHandle) ?? 0) + 1);
    result.drafted++;
    if (requiresHuman) result.gated++;
  }

  return result;
}

export async function runEngager(brandBrain: string, session: BlueskySession, perQuery = 8): Promise<EngagerResult> {
  const admin = createAdminClient();
  const result: EngagerResult = { scanned: 0, drafted: 0, gated: 0, skipped: 0, liked: 0, followed: 0 };
  const linkableCampaigns = await loadLinkableCampaigns();

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

  // Accounts we already follow, so proactive follows never double-follow.
  // Best-effort: if this fails we just skip follows this run.
  const following = await getFollowing(session).catch(() => new Set<string>());

  // Recent reply bodies for near-duplicate suppression: the writer converges
  // on the same phrasing for similar posts, and identical replies sprayed at
  // different people read as bot spam.
  const since7d = new Date(Date.now() - 7 * 24 * 60 * 60_000).toISOString();
  const { data: recentReplies } = await admin
    .from('social_replies')
    .select('draft_body')
    .neq('status', 'skipped')
    .neq('draft_body', '')
    .gte('created_at', since7d)
    .limit(100);
  const recentBodies = (recentReplies ?? []).map((r) => r.draft_body as string);

  // Thread context: many search hits are themselves replies mid-conversation.
  // Fetch every candidate's parent post in one batch so the writer can see
  // what "this" refers to instead of guessing.
  const parentUris = [...new Set(candidates.filter((c) => c.parent?.uri && !have.has(c.uri)).map((c) => c.parent!.uri))];
  const parentTexts = await getPostTexts(session, parentUris).catch(
    () => ({}) as Record<string, { authorHandle: string; text: string }>,
  );

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

    // Assemble the conversation the post actually lives in. A mid-thread reply
    // or bare quote-post is meaningless without this; if the referent is
    // invisible even to us, no reply can be safely drafted.
    const parentCtx = c.parent ? parentTexts[c.parent.uri] : undefined;
    if (c.parent && !parentCtx?.text) {
      await recordSkip('context: mid-thread reply with unfetchable parent');
      result.skipped++;
      continue;
    }
    const contextLines: string[] = [];
    if (parentCtx?.text) contextLines.push(`THREAD CONTEXT — they are replying to @${parentCtx.authorHandle}: ${parentCtx.text}`);
    if (c.embedText) contextLines.push(`EMBED CONTEXT — their post ${c.embedText}`);

    // Draft the reply.
    let text = '';
    try {
      const raw = await callClaude(
        `${brandBrain}\n\n---\n${REPLY_INSTRUCTIONS}`,
        `POST by @${c.authorHandle}: ${c.text}\n${contextLines.length ? `\n${contextLines.join('\n')}\n` : ''}\nACTION LINK: ${actionLinkFor(c.text, linkableCampaigns)}`,
        300,
      );
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

    // Template suppression: near-identical replies to different people read as
    // spam (three users got "you can be the someone" verbatim before this).
    if (isNearDuplicate(text, recentBodies)) {
      await recordSkip('near-duplicate of a recent reply');
      result.skipped++;
      continue;
    }

    // The draft survived every gate — THIS is a post worth engaging. Like it
    // (visibility + notifies them) and, for individuals, follow. Doing this
    // only after the writer accepts keeps us from liking sarcasm and jokes.
    if (result.liked < LIKE_CAP) {
      try {
        await like(session, { uri: c.uri, cid: c.cid });
        result.liked++;
      } catch {
        /* non-fatal — a missed like is nothing */
      }
    }
    if (
      result.followed < FOLLOW_CAP &&
      c.authorDid &&
      !following.has(c.authorDid) &&
      !isLikelyElectedOfficial(c.authorHandle, c.authorDisplay)
    ) {
      try {
        await follow(session, c.authorDid);
        following.add(c.authorDid);
        result.followed++;
      } catch {
        /* non-fatal */
      }
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
    recentBodies.push(text); // same-run drafts count toward near-dup too
    result.drafted++;
    if (requiresHuman) result.gated++;
  }

  return result;
}
