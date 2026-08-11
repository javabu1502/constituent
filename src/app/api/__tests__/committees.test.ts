import { describe, it, expect } from 'vitest';
import { NextRequest } from 'next/server';
import { listCommittees, getCommitteeMembers } from '@/lib/committees';

describe('GET /api/committees', () => {
  it('lists committees, filterable by chamber', async () => {
    const { GET } = await import('../committees/route');
    const res = await GET(new NextRequest('http://localhost/api/committees?chamber=senate'));
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.committees.length).toBeGreaterThan(10);
    for (const c of data.committees) expect(c.chamber).toBe('senate');
  });
});

describe('GET /api/committees/[id]/members', () => {
  it('returns the bioguide roster for a real committee', async () => {
    const { GET } = await import('../committees/[id]/members/route');
    const committee = listCommittees('house')[0];
    const res = await GET(new NextRequest(`http://localhost/api/committees/${committee.id}/members`), {
      params: Promise.resolve({ id: committee.id }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.committee.id).toBe(committee.id);
    expect(data.memberIds.length).toBe(getCommitteeMembers(committee.id).length);
    for (const b of data.memberIds) expect(b).toMatch(/^[A-Z]\d{6}$/);
  });

  it('returns ocd-person ids for a state committee', async () => {
    const { GET } = await import('../committees/[id]/members/route');
    const { listStateCommittees } = await import('@/lib/state-committees');
    const committee = listStateCommittees('NV')[0];
    const res = await GET(new NextRequest(`http://localhost/api/committees/${committee.id}/members?state=NV`), {
      params: Promise.resolve({ id: committee.id }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.committee.name).toBe(committee.name);
    for (const id of data.memberIds) expect(id).toMatch(/^ocd-person\//);
  });

  it('404s on an unknown committee', async () => {
    const { GET } = await import('../committees/[id]/members/route');
    const res = await GET(new NextRequest('http://localhost/api/committees/ZZZZ/members'), {
      params: Promise.resolve({ id: 'ZZZZ' }),
    });
    expect(res.status).toBe(404);
  });
});
