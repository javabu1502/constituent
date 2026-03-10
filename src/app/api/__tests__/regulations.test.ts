import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NextRequest } from 'next/server';

vi.mock('@/lib/supabase', () => ({
  createAdminClient: vi.fn(() => ({
    from: vi.fn(() => ({ insert: vi.fn() })),
  })),
}));

vi.mock('@/lib/env', () => ({
  env: () => ({
    ANTHROPIC_API_KEY: 'test-key',
    CLAUDE_MODEL: 'test-model',
    CONGRESS_API_KEY: 'test-key',
    SUPABASE_SECRET_KEY: 'test-key',
    NEXT_PUBLIC_SUPABASE_URL: 'https://test.supabase.co',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: 'test-anon',
    NEXT_PUBLIC_GOOGLE_MAPS_API_KEY: 'test-maps',
  }),
}));

const mockFederalRegisterResponse = {
  count: 2,
  total_pages: 1,
  results: [
    {
      document_number: 'FR-2026-001',
      title: 'Proposed Rule on Clean Air Standards',
      type: 'PRORULE',
      abstract: 'Proposed updates to clean air standards.',
      html_url: 'https://www.federalregister.gov/documents/2026/01/01/FR-2026-001',
      pdf_url: 'https://www.federalregister.gov/documents/2026/01/01/FR-2026-001.pdf',
      publication_date: '2026-01-01',
      agencies: [{ name: 'Environmental Protection Agency', id: 145, slug: 'environmental-protection-agency' }],
      comment_url: 'https://www.regulations.gov/comment/EPA-2026-001',
      comments_close_on: '2026-12-31',
      docket_ids: ['EPA-2026-001'],
      regulation_id_numbers: ['2060-AV01'],
      subtype: null,
    },
    {
      document_number: 'FR-2026-002',
      title: 'Final Rule on Water Quality',
      type: 'RULE',
      abstract: 'Final rule for water quality standards.',
      html_url: 'https://www.federalregister.gov/documents/2026/01/15/FR-2026-002',
      pdf_url: 'https://www.federalregister.gov/documents/2026/01/15/FR-2026-002.pdf',
      publication_date: '2026-01-15',
      agencies: [{ name: 'Environmental Protection Agency', id: 145, slug: 'environmental-protection-agency' }],
      comment_url: null,
      comments_close_on: null,
      docket_ids: [],
      regulation_id_numbers: [],
      subtype: null,
    },
  ],
};

describe('GET /api/regulations', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockFederalRegisterResponse),
        })
      )
    );
  });

  it('returns 200 with regulations array for default query', async () => {
    const { GET } = await import('../regulations/route');
    const req = new NextRequest('http://localhost/api/regulations');

    const res = await GET(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.regulations).toBeDefined();
    expect(data.regulations.length).toBe(2);
    expect(data.totalCount).toBe(2);
    expect(data.totalPages).toBe(1);
    expect(data.currentPage).toBe(1);
    expect(data.regulations[0].id).toBe('FR-2026-001');
    expect(data.regulations[0].agency).toBe('Environmental Protection Agency');
  });

  it('returns 200 and passes agency filter in query string', async () => {
    const { GET } = await import('../regulations/route');
    const req = new NextRequest('http://localhost/api/regulations?agency=environmental-protection-agency');

    const res = await GET(req);
    expect(res.status).toBe(200);

    const fetchMock = vi.mocked(global.fetch);
    const calledUrl = fetchMock.mock.calls[0][0] as string;
    expect(calledUrl).toContain('environmental-protection-agency');
  });

  it('returns 502 when Federal Register API returns an error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 500,
          text: () => Promise.resolve('Internal Server Error'),
        })
      )
    );

    const { GET } = await import('../regulations/route');
    const req = new NextRequest('http://localhost/api/regulations');

    const res = await GET(req);
    expect(res.status).toBe(502);
  });

  it('returns 500 when fetch throws a network error', async () => {
    vi.stubGlobal(
      'fetch',
      vi.fn(() => Promise.reject(new Error('Network error')))
    );

    const { GET } = await import('../regulations/route');
    const req = new NextRequest('http://localhost/api/regulations');

    const res = await GET(req);
    expect(res.status).toBe(500);
  });
});
