import { describe, it, expect, vi, beforeEach } from 'vitest';

/**
 * POST /api/stories/compose: the draft check, the "Rather not say" exclusion,
 * localized refusals, and the notes a storyteller gets when a problem
 * survives the corrective retry (10-23 audit).
 */

vi.mock('@/lib/rate-limit', () => ({
  chatLimiter: { check: vi.fn(() => ({ success: true })) },
  getClientIp: vi.fn(() => '127.0.0.1'),
}));
vi.mock('@/lib/turnstile', () => ({ verifyTurnstile: vi.fn(() => Promise.resolve(true)) }));
vi.mock('@/lib/usage-quota', () => ({
  enforceDailyQuota: vi.fn(async () => ({ allowed: true, remaining: 10 })),
  resolveUsageIdentity: vi.fn(async () => ({ userId: null, ipHash: 'h' })),
}));

const mockCampaign = vi.fn(async () => ({ data: { language: 'en', org_name: 'Children\'s Cabinet', headline: 'Child care stories' } as { language: string; org_name: string | null; headline: string } | null }));
vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({ select: () => ({ eq: () => ({ single: mockCampaign }) }) })),
  })),
}));

const mockCallClaude = vi.fn();
vi.mock('@/lib/claude', () => ({
  callClaude: (...a: unknown[]) => mockCallClaude(...a),
  extractJSON: (t: string) => JSON.parse(t),
  deDash: (s: string) => s,
}));

const words = (n: number, w = 'word') => new Array(n).fill(w).join(' ');
const teller = `I run a small child care program in reno. ${words(30, 'care')} Rent went up and I pay 1200 now. I want help with the cost.`;
const draftOf = (body: string, notes: string[] = []) => JSON.stringify({ title: 'Child care costs', body, notes });

function req(body: unknown) {
  return new Request('http://localhost/api/stories/compose', { method: 'POST', body: JSON.stringify(body), headers: { 'Content-Type': 'application/json' } });
}

describe('POST /api/stories/compose', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.ANTHROPIC_API_KEY = 'test-key';
    delete process.env.TURNSTILE_SECRET_KEY;
    mockCampaign.mockResolvedValue({ data: { language: 'en', org_name: "Children's Cabinet", headline: 'Child care stories' } });
  });

  it('returns a clean draft with the model notes only', async () => {
    const clean = `${words(160, 'care')} I pay 1200 and I want help with the cost. The Children's Cabinet listened.`;
    mockCallClaude.mockResolvedValue(draftOf(clean, ['I left out the line about the bus.']));
    const { POST } = await import('../stories/compose/route');
    const res = await POST(req({ campaignSlug: 'cc', messages: [{ role: 'user', content: teller }] }));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(mockCallClaude).toHaveBeenCalledTimes(1);
    expect(data.notes).toEqual(['I left out the line about the bus.']);
  });

  it('retries once with the problems, then ships the draft with a note per surviving problem', async () => {
    const bad = `${words(160, 'care')}. My daughter Maria pays 1500 every day in Carson City.`;
    mockCallClaude.mockResolvedValue(draftOf(bad));
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
    const { POST } = await import('../stories/compose/route');
    const res = await POST(req({ campaignSlug: 'cc', messages: [{ role: 'user', content: teller }] }));
    expect(res.status).toBe(200);
    expect(mockCallClaude).toHaveBeenCalledTimes(2);
    expect(String(mockCallClaude.mock.calls[1][0])).toMatch(/YOUR PREVIOUS DRAFT HAD THESE PROBLEMS/);
    const data = await res.json();
    expect(data.body).toBe(bad);
    expect(data.notes.join(' ')).toMatch(/Check these numbers; you did not write them in the interview: 1500/);
    expect(data.notes.join(' ')).toMatch(/Check these words about how often; you did not use them: every day/);
    expect(data.notes.join(' ')).toMatch(/Check these names or places; you did not mention them: Maria, Carson, City/);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it('writes the notes and the refusal in Spanish for a Spanish campaign', async () => {
    mockCampaign.mockResolvedValue({ data: { language: 'es', org_name: null, headline: 'Historias' } });
    const { POST } = await import('../stories/compose/route');
    const short = await POST(req({ campaignSlug: 'cc', messages: [{ role: 'user', content: 'Pago mucho por el cuidado.' }] }));
    expect(short.status).toBe(422);
    expect((await short.json()).error).toMatch(/Comparta un poco más primero/);

    const tellerEs = `Tengo una hija y pago 900 al mes por el cuidado. ${words(30, 'cuidado')} Quiero ayuda con el costo.`;
    mockCallClaude.mockResolvedValue(draftOf(`${words(160, 'cuidado')} Mi hijo necesita cuidado y pago 900.`));
    const res = await POST(req({ campaignSlug: 'cc', messages: [{ role: 'user', content: tellerEs }] }));
    const data = await res.json();
    expect(data.notes.join(' ')).toMatch(/Revise estas palabras de familia; no coinciden con lo que usted dijo: hijo/);
  });

  it('does not count "Rather not say" toward the 30 teller words', async () => {
    const { POST } = await import('../stories/compose/route');
    const messages = new Array(10).fill(null).flatMap((_, i) => [
      { role: 'assistant', content: `Question ${i}?` },
      { role: 'user', content: 'I’d rather not say.' },
    ]);
    const res = await POST(req({ campaignSlug: 'cc', messages }));
    expect(res.status).toBe(422);
    expect(mockCallClaude).not.toHaveBeenCalled();
  });

  it('still composes when the campaign lookup fails', async () => {
    mockCampaign.mockRejectedValueOnce(new Error('db down'));
    mockCallClaude.mockResolvedValue(draftOf(`${words(170, 'care')} I pay 1200.`));
    const { POST } = await import('../stories/compose/route');
    const res = await POST(req({ campaignSlug: 'cc', messages: [{ role: 'user', content: teller }] }));
    expect(res.status).toBe(200);
  });
});
