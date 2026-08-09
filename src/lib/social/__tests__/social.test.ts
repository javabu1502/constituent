import { describe, it, expect, vi, afterEach } from 'vitest';
import { runGuardrails, isNearDuplicate, LOCAL_COVERAGE, replyShouldSkip } from '../guardrails';
import { isLikelyElectedOfficial, looksLikeOrgOrBot, hasFirstPersonVoice } from '../engager';
import { linkFacets, graphemeLength, buildPostRecord, BLUESKY_MAX_GRAPHEMES, listNotifications } from '../bluesky';
import { canPost, MAX_POSTS_PER_DAY, MIN_GAP_MINUTES } from '../cadence';
import { nextStateOnError, CONSECUTIVE_FAIL_LIMIT } from '../circuit-breaker';

describe('guardrails: nonpartisan gate', () => {
  it('blocks "vote no on the bill"', () => {
    const r = runGuardrails({ text: 'Call your rep and vote no on the bill today.' });
    expect(r.passed).toBe(false);
    expect(r.checks.find((c) => c.name === 'nonpartisan')?.passed).toBe(false);
  });

  it('blocks party-attack phrasing', () => {
    const r = runGuardrails({ text: 'Republicans are lying to you about this.' });
    expect(r.passed).toBe(false);
  });

  it('passes neutral "tell your reps where you stand"', () => {
    const r = runGuardrails({ text: 'H.R. 139 is moving. tell your reps where you stand: link' });
    expect(r.passed).toBe(true);
    expect(r.checks.find((c) => c.name === 'nonpartisan')?.passed).toBe(true);
  });
});

describe('guardrails: em dash + voice tells', () => {
  it('blocks an em dash', () => {
    const r = runGuardrails({ text: 'this bill is moving — here is the fast way to weigh in' });
    expect(r.passed).toBe(false);
    expect(r.checks.find((c) => c.name === 'no_em_dash')?.passed).toBe(false);
  });

  it('warns (not blocks) on "you clearly feel"', () => {
    const r = runGuardrails({ text: 'you clearly feel strongly about this. here is the link' });
    expect(r.checks.find((c) => c.name === 'voice_tells')?.passed).toBe(false);
    expect(r.passed).toBe(true); // warn only
  });
});

describe('guardrails: coverage match', () => {
  it('blocks a local-action CTA in an uncovered state', () => {
    const r = runGuardrails({ text: 'tell your city council to fix this', targetState: 'TX' });
    expect(r.passed).toBe(false);
    expect(r.checks.find((c) => c.name === 'coverage_match')?.passed).toBe(false);
  });

  it('allows a local-action CTA in a covered state', () => {
    const r = runGuardrails({ text: 'tell your city council to fix this', targetState: 'NV' });
    expect(r.checks.find((c) => c.name === 'coverage_match')?.passed).toBe(true);
  });

  it('coverage set is DE/RI/NV/CA', () => {
    expect([...LOCAL_COVERAGE].sort()).toEqual(['CA', 'DE', 'NV', 'RI']);
  });
});

describe('guardrails: accuracy traceability', () => {
  it('warns when a bill number is not in the source', () => {
    const r = runGuardrails({ text: 'H.R. 999 just passed', sourceText: 'H.R. 139 passed the House' });
    expect(r.checks.find((c) => c.name === 'accuracy_traceable')?.passed).toBe(false);
    expect(r.passed).toBe(true); // warn severity
  });

  it('passes when the bill number matches the source', () => {
    const r = runGuardrails({ text: 'H.R. 139 just passed', sourceText: 'H.R. 139 passed the House 308-117' });
    expect(r.checks.find((c) => c.name === 'accuracy_traceable')?.passed).toBe(true);
  });

  it('BLOCKS an unsourced figure under strictAccuracy (news lane)', () => {
    const r = runGuardrails({
      text: 'H.R. 999 just passed',
      sourceText: 'H.R. 139 passed the House',
      strictAccuracy: true,
    });
    expect(r.passed).toBe(false);
    expect(r.checks.find((c) => c.name === 'accuracy_traceable')?.severity).toBe('block');
  });
});

describe('guardrails: length + dedup', () => {
  it('blocks over-length posts', () => {
    const r = runGuardrails({ text: 'x'.repeat(400), maxLength: BLUESKY_MAX_GRAPHEMES, graphemeLength });
    expect(r.passed).toBe(false);
  });

  it('detects near-duplicates', () => {
    const a = 'reps read their inbox way more than their mentions. here is the fast way to tell them';
    const b = 'reps read their inbox way more than their mentions. here is the fast way to tell them now';
    expect(isNearDuplicate(a, [b])).toBe(true);
    expect(isNearDuplicate(a, ['a totally different post about eggs and rent'])).toBe(false);
  });
});

describe('bluesky: link facets + record building', () => {
  it('computes a UTF-8 byte range facet for a URL', () => {
    const text = 'weigh in here https://mydemocracy.app/issues';
    const facets = linkFacets(text);
    expect(facets).toHaveLength(1);
    const enc = new TextEncoder();
    expect(facets[0].index.byteStart).toBe(enc.encode('weigh in here ').length);
    expect(facets[0].features[0].uri).toBe('https://mydemocracy.app/issues');
  });

  it('computes correct byte offsets past a multi-byte emoji', () => {
    const text = 'the latest 🇺🇸 https://mydemocracy.app';
    const facets = linkFacets(text);
    const enc = new TextEncoder();
    const sliced = new TextDecoder().decode(
      enc.encode(text).slice(facets[0].index.byteStart, facets[0].index.byteEnd),
    );
    expect(sliced).toBe('https://mydemocracy.app');
  });

  it('builds a post record with facets and default lang', () => {
    const { record, graphemes } = buildPostRecord('weigh in https://mydemocracy.app', {
      createdAt: '2026-07-17T00:00:00.000Z',
    });
    expect(record.$type).toBe('app.bsky.feed.post');
    expect(record.langs).toEqual(['en']);
    expect(record.facets).toHaveLength(1);
    expect(graphemes).toBeGreaterThan(0);
  });

  it('throws on over-limit posts', () => {
    expect(() => buildPostRecord('x'.repeat(BLUESKY_MAX_GRAPHEMES + 1))).toThrow(/over the/);
  });
});

describe('bluesky: listNotifications (inbound engagement)', () => {
  const session = { accessJwt: 'jwt', refreshJwt: 'r', did: 'did:x', handle: 'us.bsky.social' };
  afterEach(() => vi.restoreAllMocks());

  const notif = (reason: string, extra: Record<string, unknown> = {}) => ({
    uri: `at://post/${reason}`,
    cid: `cid-${reason}`,
    reason,
    isRead: false,
    indexedAt: '2026-08-09T00:00:00Z',
    author: { handle: `${reason}.bsky.social`, displayName: reason },
    record: { text: `a ${reason}`, ...(extra.record as object) },
    ...extra,
  });

  it('keeps only reply/mention/quote and drops like/repost/follow', async () => {
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        notifications: [
          notif('reply'), notif('mention'), notif('quote'),
          notif('like'), notif('repost'), notif('follow'),
        ],
      }), { status: 200 }),
    );
    const got = await listNotifications(session);
    expect(got.map((n) => n.reason).sort()).toEqual(['mention', 'quote', 'reply']);
    expect(got.every((n) => n.text.startsWith('a '))).toBe(true);
    expect(got[0].authorHandle).toContain('.bsky.social');
  });

  it('surfaces the thread root when the inbound post carries one', async () => {
    const root = { uri: 'at://root', cid: 'cid-root' };
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      new Response(JSON.stringify({
        notifications: [notif('reply', { record: { text: 'hi', reply: { root } } })],
      }), { status: 200 }),
    );
    const [n] = await listNotifications(session);
    expect(n.root).toEqual(root);
  });
});

describe('cadence', () => {
  const now = 1_800_000_000_000;
  const min = 60_000;

  it('allows a first post', () => {
    expect(canPost([], now).allowed).toBe(true);
  });

  it('blocks when the daily cap is hit', () => {
    const times = Array.from({ length: MAX_POSTS_PER_DAY }, (_, i) => now - i * 60 * min);
    expect(canPost(times, now).allowed).toBe(false);
  });

  it('blocks when the last post is too recent', () => {
    const r = canPost([now - (MIN_GAP_MINUTES - 5) * min], now);
    expect(r.allowed).toBe(false);
    expect(r.reason).toMatch(/too soon/);
  });

  it('allows once the min gap has passed', () => {
    expect(canPost([now - (MIN_GAP_MINUTES + 5) * min], now).allowed).toBe(true);
  });

  it('ignores posts older than 24h for the daily cap', () => {
    const old = Array.from({ length: MAX_POSTS_PER_DAY }, (_, i) => now - (25 * 60 + i) * min);
    expect(canPost(old, now).allowed).toBe(true);
  });
});

describe('circuit breaker', () => {
  it('trips after N consecutive failures', () => {
    let s = { tripped: false, consecutive_failures: 0, error_count: 0 };
    for (let i = 0; i < CONSECUTIVE_FAIL_LIMIT - 1; i++) s = nextStateOnError(s, 'boom');
    expect(s.tripped).toBe(false);
    s = nextStateOnError(s, 'boom');
    expect(s.tripped).toBe(true);
    expect(s.error_count).toBe(CONSECUTIVE_FAIL_LIMIT);
  });
});

describe('engager: reply skip discipline', () => {
  it('skips grief/tragedy posts', () => {
    expect(replyShouldSkip('my neighbor died in the shooting yesterday').skip).toBe(true);
  });
  it('skips rage-bait', () => {
    expect(replyShouldSkip('they should be arrested and thrown in jail').skip).toBe(true);
  });
  it('does not skip an ordinary grievance', () => {
    expect(replyShouldSkip('gas is $90 a tank and rent went up again').skip).toBe(false);
  });
});

describe('engager: elected-official gating', () => {
  it('flags obvious officials', () => {
    expect(isLikelyElectedOfficial('senjohndoe.bsky.social', 'Sen. John Doe')).toBe(true);
    expect(isLikelyElectedOfficial('repjane', 'Rep. Jane Smith')).toBe(true);
    expect(isLikelyElectedOfficial('governor.wv.gov', 'WV Governor')).toBe(true);
  });
  it('does not flag ordinary citizens', () => {
    expect(isLikelyElectedOfficial('coffee_lover_92', 'Dana')).toBe(false);
  });
});

describe('engager: precision filters', () => {
  it('skips news/bot/org accounts', () => {
    expect(looksLikeOrgOrBot('bigearthdata.ai', 'Big Earth Data')).toBe(true);
    expect(looksLikeOrgOrBot('kera.news', 'KERA News')).toBe(true);
    expect(looksLikeOrgOrBot('weatherbot', 'Weather Bot')).toBe(true);
    expect(looksLikeOrgOrBot('dana_smith', 'Dana')).toBe(false);
  });
  it('requires first-person voice for grievances', () => {
    expect(hasFirstPersonVoice('my rent went up again and I can barely cover it')).toBe(true);
    expect(hasFirstPersonVoice('North Texas temperatures rise, so do prices')).toBe(false);
  });
});

describe('guardrails: no meta/refusal output', () => {
  it('blocks a leaked SKIP note', () => {
    const r = runGuardrails({ text: 'SKIP, INPUT MISMATCH: The news item does not connect to the linked campaign.' });
    const c = r.checks.find((x) => x.name === 'no_meta_output');
    expect(r.passed).toBe(false);
    expect(c?.passed).toBe(false);
  });
  it('blocks a review-hold note', () => {
    const r = runGuardrails({ text: "Flagged for human review, sourcing doesn't meet the factual standard for a news-drop post." });
    expect(r.passed).toBe(false);
  });
  it('blocks pipeline-internals references', () => {
    const r = runGuardrails({ text: 'brand brain prohibits all bluesky activity. platform is parked. requeue if policy changes.' });
    expect(r.passed).toBe(false);
  });
  it('still allows a real post about AI guardrails', () => {
    const r = runGuardrails({ text: 'Congress is weighing guardrails for AI systems. tell your reps where you stand: link' });
    const c = r.checks.find((x) => x.name === 'no_meta_output');
    expect(c?.passed).toBe(true);
  });
  it('does not block a post that merely contains the word skip mid-sentence', () => {
    const r = runGuardrails({ text: 'lawmakers may skip the August recess to finish the funding bill. here is what that means: link' });
    const c = r.checks.find((x) => x.name === 'no_meta_output');
    expect(c?.passed).toBe(true);
  });
});
