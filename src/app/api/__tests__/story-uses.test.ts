import { describe, expect, it, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const state = vi.hoisted(() => ({
  user: { id: 'org-1' } as { id: string } | null,
  story: null as Record<string, unknown> | null,
  openRows: [] as Array<Record<string, unknown>>,
  inserted: [] as Array<Record<string, unknown>>,
  sent: [] as Array<{ to: string; subject: string }>,
  emailConfigured: true,
  deleted: [] as string[],
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({ auth: { getUser: async () => ({ data: { user: state.user } }) } }),
}));
vi.mock('@/lib/resend', () => ({
  isEmailConfigured: () => state.emailConfigured,
  sendDigestEmail: async (to: string, subject: string) => { state.sent.push({ to, subject }); },
}));
vi.mock('@/lib/supabase', () => ({
  createAdminClient: () => ({
    from: (table: string) => {
      if (table === 'stories') {
        return { select: () => ({ eq: () => ({ single: async () => ({ data: state.story }) }) }) };
      }
      // story_uses
      return {
        select: () => ({
          eq: () => ({ eq: () => ({ in: () => ({ order: () => ({ limit: async () => ({ data: state.openRows }) }) }) }) }),
        }),
        insert: (row: Record<string, unknown>) => {
          const full = { id: `use-${state.inserted.length + 1}`, created_at: '2026-09-29T00:00:00Z', responded_at: null, ...row };
          state.inserted.push(full);
          return { select: () => ({ single: async () => ({ data: full, error: null }) }) };
        },
        delete: () => ({ eq: async (_k: string, id: string) => { state.deleted.push(id); } }),
      };
    },
  }),
}));

function post(body: unknown) {
  return new NextRequest('http://localhost/api/stories/story-1/uses', {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(body),
  });
}
const params = { params: Promise.resolve({ id: 'story-1' }) };

function baseStory(over: Partial<Record<string, unknown>> = {}) {
  return {
    id: 'story-1',
    campaign_id: 'camp-1',
    status: 'active',
    storyteller_email: 'teller@example.com',
    body: 'My daughter waited a year for a child care spot.',
    consent_usage_snapshot: { granted_uses: ['included_in_reports'] },
    campaigns: { creator_id: 'org-1', headline: 'Child care stories', org_name: 'Nevada Children First', slug: 'cc' },
    ...over,
  };
}

beforeEach(() => {
  state.user = { id: 'org-1' };
  state.story = baseStory();
  state.openRows = [];
  state.inserted = [];
  state.sent = [];
  state.emailConfigured = true;
  state.deleted = [];
});

describe('POST /api/stories/[id]/uses', () => {
  it('logs a granted use without emailing the storyteller', async () => {
    const { POST } = await import('../stories/[id]/uses/route');
    const res = await POST(post({ use_type: 'included_in_reports', note: 'Quoted in our annual report, page 4' }), params);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.use.status).toBe('logged');
    expect(state.sent).toEqual([]);
  });

  it('turns an ungranted use into a request and emails the storyteller', async () => {
    const { POST } = await import('../stories/[id]/uses/route');
    const res = await POST(post({ use_type: 'shared_with_media', note: 'Quoted in a Reno Gazette Journal story on Oct 3' }), params);
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.use.status).toBe('requested');
    expect(state.sent).toHaveLength(1);
    expect(state.sent[0].to).toBe('teller@example.com');
  });

  it('refuses an ungranted use when the storyteller left no email', async () => {
    state.story = baseStory({ storyteller_email: null });
    const { POST } = await import('../stories/[id]/uses/route');
    const res = await POST(post({ use_type: 'shared_with_media', note: 'Quoted in a newspaper story next week' }), params);
    expect(res.status).toBe(409);
    expect(state.inserted).toEqual([]);
    expect(state.sent).toEqual([]);
  });

  it('refuses a second request while one is waiting', async () => {
    state.openRows = [{ id: 'use-0', status: 'requested', created_at: '2026-09-28T00:00:00Z' }];
    const { POST } = await import('../stories/[id]/uses/route');
    const res = await POST(post({ use_type: 'shared_with_media', note: 'Quoted in a newspaper story next week' }), params);
    expect(res.status).toBe(409);
    expect(state.inserted).toEqual([]);
  });

  it('refuses when email is not configured rather than recording a request nobody receives', async () => {
    state.emailConfigured = false;
    const { POST } = await import('../stories/[id]/uses/route');
    const res = await POST(post({ use_type: 'shared_with_media', note: 'Quoted in a newspaper story next week' }), params);
    expect(res.status).toBe(503);
    expect(state.inserted).toEqual([]);
  });

  it('only the campaign owner may record uses, and never on a withdrawn story', async () => {
    const { POST } = await import('../stories/[id]/uses/route');
    state.user = { id: 'someone-else' };
    expect((await POST(post({ use_type: 'included_in_reports', note: 'Quoted in our annual report' }), params)).status).toBe(403);
    state.user = { id: 'org-1' };
    state.story = baseStory({ status: 'revoked' });
    expect((await POST(post({ use_type: 'included_in_reports', note: 'Quoted in our annual report' }), params)).status).toBe(409);
  });
});
