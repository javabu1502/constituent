import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('@/lib/claude', async (importOriginal) => {
  const mod = await importOriginal<typeof import('@/lib/claude')>();
  return { ...mod, callClaude: vi.fn() };
});

import { callClaude } from '@/lib/claude';
import { writePost } from '../writer';
import type { Signal } from '../scout';

const mockCall = vi.mocked(callClaude);

const SIGNAL = {
  id: 'sig-1',
  title: 'A bill is moving',
  summary: 'H.R. 139 passed the House',
  url: 'https://www.mydemocracy.app/campaign/example',
  issue_area: 'Health',
  classification: 'actionable',
  source: 'campaign',
  campaign_slug: 'example',
} as unknown as Signal;

describe('writer: refusals become skips, never post bodies', () => {
  beforeEach(() => mockCall.mockReset());

  it('turns a prose refusal into a skip (the leaked-post bug)', async () => {
    mockCall.mockResolvedValue(
      'SKIP, INPUT MISMATCH: The news item does not connect to the linked campaign.',
    );
    const out = await writePost('brand brain', SIGNAL);
    expect('skip' in out && out.skip).toBe(true);
  });

  it('honors a structured skip and keeps its reason', async () => {
    mockCall.mockResolvedValue('{"skip": true, "reason": "partisan-only framing"}');
    const out = await writePost('brand brain', SIGNAL);
    expect(out).toMatchObject({ skip: true, reason: 'partisan-only framing' });
  });

  it('skips on empty text', async () => {
    mockCall.mockResolvedValue('{"text": "   ", "lane": "news drop"}');
    const out = await writePost('brand brain', SIGNAL);
    expect('skip' in out && out.skip).toBe(true);
  });

  it('still returns a normal draft for clean JSON', async () => {
    mockCall.mockResolvedValue('{"text": "H.R. 139 is moving. weigh in: link", "lane": "bill on the move"}');
    const out = await writePost('brand brain', SIGNAL);
    expect(out).toMatchObject({ text: 'H.R. 139 is moving. weigh in: link', lane: 'bill on the move' });
  });
});

describe('writer: dash handling restructures, never comma-splices (FY27 word-salad bug)', () => {
  beforeEach(() => mockCall.mockReset());

  it('sends a dashed draft back for grammatical restructuring', async () => {
    mockCall
      .mockResolvedValueOnce('{"text": "13 unresolved issues — troop pay, procurement, and more — before a final bill lands. link", "lane": "news drop"}')
      .mockResolvedValueOnce('{"text": "13 issues are still unresolved before a final bill lands, including troop pay and procurement. link"}')
      .mockResolvedValue('{"ok": true}');
    const out = await writePost('brand brain', SIGNAL);
    expect('text' in out).toBe(true);
    if ('text' in out) {
      expect(out.text).toBe('13 issues are still unresolved before a final bill lands, including troop pay and procurement. link');
      expect(out.text).not.toMatch(/[—–]/);
    }
    // second call was the rewrite pass
    expect(mockCall.mock.calls[1][0]).toContain('RESTRUCTURE');
  });

  it('falls back to mechanical deDash only when the rewrite still has dashes', async () => {
    mockCall
      .mockResolvedValueOnce('{"text": "A — B. link", "lane": "news drop"}')
      .mockResolvedValueOnce('{"text": "A — B. link"}')
      .mockResolvedValue('{"ok": true}');
    const out = await writePost('brand brain', SIGNAL);
    if ('text' in out) expect(out.text).toBe('A, B. link');
  });
});

describe('writer: coherence gate', () => {
  beforeEach(() => mockCall.mockReset());

  it('skips a draft the copy-edit judge explicitly rejects', async () => {
    mockCall
      .mockResolvedValueOnce('{"text": "13 unresolved issues, troop pay, procurement, and more, before a final bill lands. link", "lane": "news drop"}')
      .mockResolvedValueOnce('{"ok": false, "reason": "sentence has no verb"}');
    const out = await writePost('brand brain', SIGNAL);
    expect(out).toMatchObject({ skip: true, reason: 'incoherent draft: sentence has no verb' });
  });

  it('fails open when the judge returns junk (structural guardrails still gate downstream)', async () => {
    mockCall
      .mockResolvedValueOnce('{"text": "A clean coherent post. link", "lane": "news drop"}')
      .mockResolvedValueOnce('not json at all');
    const out = await writePost('brand brain', SIGNAL);
    expect('text' in out).toBe(true);
  });
});

describe('writer: campaign link fit context', () => {
  beforeEach(() => mockCall.mockReset());

  it('shows the writer the campaign TITLE, not just the slug', async () => {
    mockCall.mockResolvedValue('{"text": "ok. link", "lane": "news drop"}');
    await writePost('brand brain', {
      ...SIGNAL,
      metadata: { campaign_title: 'Support expanded veterans healthcare' },
    } as unknown as Signal);
    expect(mockCall.mock.calls[0][1]).toContain('CAMPAIGN PAGE: Support expanded veterans healthcare');
  });

  it('flags an unknown title so the writer judges cautiously', async () => {
    mockCall.mockResolvedValue('{"text": "ok. link", "lane": "news drop"}');
    await writePost('brand brain', SIGNAL);
    expect(mockCall.mock.calls[0][1]).toContain('title unknown');
    expect(mockCall.mock.calls[0][1]).toContain('prefer genericLink');
  });
});

describe('normalizeLane (analytics fragmentation fix)', () => {
  it('clamps free-texted variants to the canonical set', async () => {
    const { normalizeLane } = await import('../writer');
    expect(normalizeLane('real-time civic news drops')).toBe('news drop');
    expect(normalizeLane('Rolling Civic Brief')).toBe('rolling brief');
    expect(normalizeLane('bill on the move')).toBe('bill on the move');
    expect(normalizeLane('election-reminder')).toBe('election reminder');
    expect(normalizeLane('something weird')).toBe('news drop');
  });
});

describe('claim-support gate for factual signals (2026-09-01 fact-check)', () => {
  beforeEach(() => mockCall.mockReset());
  const newsSignal = { ...SIGNAL, source: 'news', summary: "Fed's preferred inflation gauge shows core prices rose 3.3% annually in July (via CNBC)" } as unknown as Signal;

  it('news signals get the source-alignment judge; a mislabeled number is skipped', async () => {
    mockCall
      .mockResolvedValueOnce('{"text": "the Fed\'s preferred gauge held at 3.7% in July. link", "lane": "by-the-numbers"}')
      .mockResolvedValueOnce('{"ok": false, "reason": "3.7% is headline PCE; the source attaches 3.3% to the preferred (core) gauge"}');
    const out = await writePost('brand brain', newsSignal);
    expect(out).toMatchObject({ skip: true });
    if ('skip' in out) expect(out.reason).toContain('headline PCE');
    // The judge saw the source item
    expect(mockCall.mock.calls[1][0]).toContain('SOURCE ITEM');
    expect(mockCall.mock.calls[1][0]).toContain('DIRECTION');
  });

  it('non-factual signals keep the coherence-only judge (no source block)', async () => {
    mockCall
      .mockResolvedValueOnce('{"text": "clean post. link", "lane": "news drop"}')
      .mockResolvedValueOnce('{"ok": true}');
    await writePost('brand brain', SIGNAL); // source: 'campaign'
    expect(mockCall.mock.calls[1][0]).not.toContain('SOURCE ITEM');
  });

  it('a supported factual post passes', async () => {
    mockCall
      .mockResolvedValueOnce('{"text": "core prices rose 3.3% annually in July, via CNBC. link", "lane": "by-the-numbers"}')
      .mockResolvedValueOnce('{"ok": true}');
    const out = await writePost('brand brain', newsSignal);
    expect('text' in out).toBe(true);
  });
});
