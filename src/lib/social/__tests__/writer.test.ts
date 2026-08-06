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
