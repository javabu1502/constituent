import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

const mockUpsert = vi.fn();
vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(() => ({ from: vi.fn(() => ({ upsert: mockUpsert })) })),
}));
vi.mock('@/lib/usage-quota', () => ({
  resolveUsageIdentity: vi.fn(async () => ({ userId: null, ipHash: 'hash' })),
}));
vi.mock('@/lib/turnstile', () => ({ verifyTurnstile: vi.fn(() => Promise.resolve(true)) }));
vi.mock('@/lib/rate-limit', () => ({
  writeLimiter: { check: vi.fn(() => ({ success: true })) },
  getClientIp: vi.fn(() => '127.0.0.1'),
}));

const valid = {
  senator_id: 'C001113', senator_name: 'Catherine Cortez Masto', state: 'nv', office_code: 'SNV03',
  name: 'Jared Busker', email: 'Jared@MyDemocracy.app', city: 'Reno', zip: '89506', source: 'contact',
};
const post = async (body: unknown) => {
  const { POST } = await import('../cwc/adoption-signature/route');
  return POST(new NextRequest('http://localhost/api/cwc/adoption-signature', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } }));
};

describe('POST /api/cwc/adoption-signature', () => {
  beforeEach(() => { mockUpsert.mockReset(); mockUpsert.mockResolvedValue({ error: null }); process.env.TURNSTILE_SECRET_KEY = ''; });

  it('records one signature per person per senator, email lowercased, state upper', async () => {
    const res = await post(valid);
    expect(res.status).toBe(200);
    const [row, opts] = mockUpsert.mock.calls[0];
    expect(row).toMatchObject({ senator_id: 'C001113', signer_email: 'jared@mydemocracy.app', state: 'NV', source: 'contact', ip_hash: 'hash' });
    expect(opts).toMatchObject({ onConflict: 'senator_id,signer_email', ignoreDuplicates: true });
  });

  it('rejects a bad office code, source, or email', async () => {
    expect((await post({ ...valid, office_code: 'HNV02' })).status).toBe(400);
    expect((await post({ ...valid, source: 'newsletter' })).status).toBe(400);
    expect((await post({ ...valid, email: 'nope' })).status).toBe(400);
  });

  it('returns 500 when the insert fails', async () => {
    mockUpsert.mockResolvedValue({ error: { message: 'boom' } });
    expect((await post(valid)).status).toBe(500);
  });
});
