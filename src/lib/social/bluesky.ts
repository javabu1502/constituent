/**
 * Bluesky publisher — raw AT Protocol XRPC (no SDK dependency).
 *
 * Credentials come from env only: BLUESKY_HANDLE + BLUESKY_APP_PASSWORD.
 * post() honours a dry-run flag: in dry-run it builds and returns the exact
 * record it WOULD send, and sends nothing. That lets us test the whole
 * construction path (facets, length, reply refs) against no live account.
 */

const PDS = 'https://bsky.social/xrpc';
export const BLUESKY_MAX_GRAPHEMES = 300;

export interface BlueskySession {
  accessJwt: string;
  refreshJwt: string;
  did: string;
  handle: string;
}

interface Facet {
  index: { byteStart: number; byteEnd: number };
  features: Array<{ $type: string; uri: string }>;
}

export interface PostRecord {
  $type: 'app.bsky.feed.post';
  text: string;
  createdAt: string;
  langs: string[];
  facets?: Facet[];
  reply?: {
    root: { uri: string; cid: string };
    parent: { uri: string; cid: string };
  };
}

export interface PostResult {
  dryRun: boolean;
  record: PostRecord;
  graphemes: number;
  uri?: string;
  cid?: string;
}

export function getBlueskyCreds(): { handle: string; appPassword: string } | null {
  const handle = process.env.BLUESKY_HANDLE;
  const appPassword = process.env.BLUESKY_APP_PASSWORD;
  if (!handle || !appPassword) return null;
  return { handle, appPassword };
}

/** True grapheme count (what Bluesky's 300 limit measures), with a fallback. */
export function graphemeLength(s: string): number {
  try {
    const seg = new Intl.Segmenter('en', { granularity: 'grapheme' });
    let n = 0;
    for (const _ of seg.segment(s)) n++;
    return n;
  } catch {
    return [...s].length;
  }
}

/** Build link facets (UTF-8 byte ranges) so URLs in the text are clickable. */
export function linkFacets(text: string): Facet[] {
  const enc = new TextEncoder();
  const facets: Facet[] = [];
  const re = /https?:\/\/[^\s\]）)]+/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    const url = m[0].replace(/[.,;:!?'"]+$/, ''); // don't swallow trailing punctuation
    const byteStart = enc.encode(text.slice(0, m.index)).length;
    const byteEnd = byteStart + enc.encode(url).length;
    facets.push({
      index: { byteStart, byteEnd },
      features: [{ $type: 'app.bsky.richtext.facet#link', uri: url }],
    });
  }
  return facets;
}

async function xrpcGet<T>(method: string, params: Record<string, string> | URLSearchParams, token?: string): Promise<T> {
  const qs = (params instanceof URLSearchParams ? params : new URLSearchParams(params)).toString();
  const res = await fetch(`${PDS}/${method}?${qs}`, {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });
  const json = await res.json();
  if (!res.ok) throw new Error(`Bluesky ${method} failed (${res.status}): ${json.error} ${json.message ?? ''}`.trim());
  return json as T;
}

export interface FoundPost {
  uri: string;
  cid: string;
  authorHandle: string;
  authorDisplay: string;
  text: string;
  /** Thread root ref if this post is itself a reply (else the post is root). */
  root?: { uri: string; cid: string };
  likeCount: number;
}

/** Search recent posts by keyword (for the Engager's listening layer). */
export async function searchPosts(session: BlueskySession, q: string, limit = 15): Promise<FoundPost[]> {
  const data = await xrpcGet<{ posts: Array<Record<string, unknown>> }>(
    'app.bsky.feed.searchPosts',
    { q, limit: String(limit), sort: 'latest' },
    session.accessJwt,
  );
  return (data.posts ?? []).map((p) => {
    const author = (p.author as Record<string, unknown>) ?? {};
    const record = (p.record as Record<string, unknown>) ?? {};
    const reply = record.reply as { root?: { uri: string; cid: string } } | undefined;
    return {
      uri: p.uri as string,
      cid: p.cid as string,
      authorHandle: (author.handle as string) ?? '',
      authorDisplay: (author.displayName as string) ?? '',
      text: (record.text as string) ?? '',
      root: reply?.root,
      likeCount: (p.likeCount as number) ?? 0,
    };
  });
}

/** Fetch engagement counts for a set of post URIs (Analyst). */
export async function getPostMetrics(
  session: BlueskySession,
  uris: string[],
): Promise<Record<string, { likeCount: number; repostCount: number; replyCount: number }>> {
  if (!uris.length) return {};
  const out: Record<string, { likeCount: number; repostCount: number; replyCount: number }> = {};
  // getPosts takes up to 25 uris per call
  for (let i = 0; i < uris.length; i += 25) {
    const batch = uris.slice(i, i + 25);
    const params = new URLSearchParams();
    batch.forEach((u) => params.append('uris', u));
    const data = await xrpcGet<{ posts: Array<Record<string, unknown>> }>(
      'app.bsky.feed.getPosts',
      params,
      session.accessJwt,
    ).catch(() => ({ posts: [] as Array<Record<string, unknown>> }));
    for (const p of data.posts ?? []) {
      out[p.uri as string] = {
        likeCount: (p.likeCount as number) ?? 0,
        repostCount: (p.repostCount as number) ?? 0,
        replyCount: (p.replyCount as number) ?? 0,
      };
    }
  }
  return out;
}

export interface InboundNotification {
  /** The reply/mention/quote post itself (what we thread our response onto). */
  uri: string;
  cid: string;
  authorHandle: string;
  authorDisplay: string;
  text: string;
  reason: 'reply' | 'mention' | 'quote';
  /** Thread root, if their post carries one; else their post is the root. */
  root?: { uri: string; cid: string };
  isRead: boolean;
  indexedAt: string;
}

/**
 * Fetch notifications and keep only the ones that are people ENGAGING WITH US —
 * replies, mentions, and quote-posts. This is how the Social Desk sees inbound
 * conversation on our own posts (search only ever surfaces strangers' posts).
 * Likes/reposts/follows are dropped (nothing to reply to).
 */
export async function listNotifications(session: BlueskySession, limit = 50): Promise<InboundNotification[]> {
  const data = await xrpcGet<{ notifications: Array<Record<string, unknown>> }>(
    'app.bsky.notification.listNotifications',
    { limit: String(limit) },
    session.accessJwt,
  );
  const kept = new Set(['reply', 'mention', 'quote']);
  return (data.notifications ?? [])
    .filter((n) => kept.has(n.reason as string))
    .map((n) => {
      const author = (n.author as Record<string, unknown>) ?? {};
      const record = (n.record as Record<string, unknown>) ?? {};
      const reply = record.reply as { root?: { uri: string; cid: string } } | undefined;
      return {
        uri: n.uri as string,
        cid: n.cid as string,
        authorHandle: (author.handle as string) ?? '',
        authorDisplay: (author.displayName as string) ?? '',
        text: (record.text as string) ?? '',
        reason: n.reason as InboundNotification['reason'],
        root: reply?.root,
        isRead: (n.isRead as boolean) ?? false,
        indexedAt: (n.indexedAt as string) ?? '',
      };
    });
}

async function xrpc<T>(method: string, body: unknown, token?: string): Promise<T> {
  const res = await fetch(`${PDS}/${method}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(`Bluesky ${method} failed (${res.status}): ${json.error} ${json.message ?? ''}`.trim());
  }
  return json as T;
}

export async function createSession(handle: string, appPassword: string): Promise<BlueskySession> {
  return xrpc<BlueskySession>('com.atproto.server.createSession', {
    identifier: handle,
    password: appPassword,
  });
}

/**
 * Build a post record from text (+ optional reply ref). Adds link facets and
 * computes the grapheme count. Throws if it exceeds the platform limit — the
 * caller (guardrail/writer) should keep posts short, this is the hard backstop.
 */
export function buildPostRecord(
  text: string,
  opts: { langs?: string[]; reply?: PostRecord['reply']; createdAt?: string } = {},
): { record: PostRecord; graphemes: number } {
  const graphemes = graphemeLength(text);
  if (graphemes > BLUESKY_MAX_GRAPHEMES) {
    throw new Error(`Post is ${graphemes} graphemes, over the ${BLUESKY_MAX_GRAPHEMES} limit`);
  }
  const facets = linkFacets(text);
  const record: PostRecord = {
    $type: 'app.bsky.feed.post',
    text,
    createdAt: opts.createdAt ?? new Date().toISOString(),
    langs: opts.langs ?? ['en'],
    ...(facets.length ? { facets } : {}),
    ...(opts.reply ? { reply: opts.reply } : {}),
  };
  return { record, graphemes };
}

/**
 * Post to Bluesky. In dry-run, returns the built record without sending.
 * Live, it authenticates and creates the record, returning its uri/cid.
 */
export async function post(
  text: string,
  opts: { dryRun?: boolean; reply?: PostRecord['reply']; session?: BlueskySession } = {},
): Promise<PostResult> {
  const { record, graphemes } = buildPostRecord(text, { reply: opts.reply });

  if (opts.dryRun) {
    return { dryRun: true, record, graphemes };
  }

  let session = opts.session;
  if (!session) {
    const creds = getBlueskyCreds();
    if (!creds) throw new Error('BLUESKY_HANDLE / BLUESKY_APP_PASSWORD not set');
    session = await createSession(creds.handle, creds.appPassword);
  }

  const result = await xrpc<{ uri: string; cid: string }>(
    'com.atproto.repo.createRecord',
    { repo: session.did, collection: 'app.bsky.feed.post', record },
    session.accessJwt,
  );
  return { dryRun: false, record, graphemes, uri: result.uri, cid: result.cid };
}
