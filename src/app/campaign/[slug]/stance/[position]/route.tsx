import { ImageResponse } from 'next/og';
import { NextRequest } from 'next/server';

export const runtime = 'nodejs';

const SIZE = { width: 1200, height: 630 };
const POSITIONS = new Set(['support', 'oppose', 'undecided']);

interface CampaignRow {
  headline?: string;
  issue_area?: string;
}

// Distinguishes "the query worked and there is no such campaign" from
// "the lookup failed" — a deleted campaign must 404, but a transient
// Supabase error should NOT 404 the share card of a live campaign.
type CampaignLookup = { ok: true; campaign: CampaignRow | null } | { ok: false };

async function fetchCampaign(slug: string): Promise<CampaignLookup> {
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!base || !key) return { ok: false };
    const res = await fetch(
      `${base}/rest/v1/campaigns?slug=eq.${encodeURIComponent(slug)}&approval_status=eq.approved&select=headline,issue_area&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    if (!res.ok) return { ok: false };
    const rows = (await res.json()) as CampaignRow[];
    return { ok: true, campaign: rows?.[0] ?? null };
  } catch {
    return { ok: false };
  }
}

function ScaleIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#DDD6FE" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3v18" />
      <path d="M5 21h14" />
      <path d="M4 7h16" />
      <path d="M7 7l-3 6a3.5 3.5 0 0 0 6 0l-3-6z" />
      <path d="M17 7l-3 6a3.5 3.5 0 0 0 6 0l-3-6z" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 6L9 17l-5-5" />
    </svg>
  );
}

/**
 * GET /campaign/[slug]/stance/[position]
 * Personalized share card: the neutral both-sides OG design with the sharer's
 * side lit up. Position only — never a name. The other side stays visible so
 * the card reads as an invitation, not a lecture.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ slug: string; position: string }> }
) {
  const { slug, position } = await params;
  const pos = POSITIONS.has(position) ? (position as 'support' | 'oppose' | 'undecided') : 'undecided';

  const lookup = await fetchCampaign(slug);
  // Confirmed-missing campaign -> 404, matching the page (and the plain OG
  // route); lookup errors keep the generic-card fallback.
  if (lookup.ok && !lookup.campaign) {
    return new Response('Not found', { status: 404 });
  }
  const campaign = lookup.ok ? lookup.campaign : null;
  const headline = campaign?.headline ?? 'Make your voice heard';

  const kicker =
    pos === 'support'
      ? 'I STAND WITH THE CASE FOR — WEIGH IN'
      : pos === 'oppose'
        ? 'I STAND WITH THE CASE AGAINST — WEIGH IN'
        : "I'M STILL DECIDING — WEIGH IN";

  const panel = (side: 'for' | 'against') => {
    const chosen = (pos === 'support' && side === 'for') || (pos === 'oppose' && side === 'against');
    return (
      <div
        style={{
          display: 'flex',
          flex: 1,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 12,
          background: chosen ? 'rgba(255,255,255,0.30)' : 'rgba(255,255,255,0.10)',
          border: chosen ? '2px solid rgba(255,255,255,0.9)' : '1px solid rgba(255,255,255,0.22)',
          borderRadius: 14,
          padding: '16px 0',
          color: chosen ? '#FFFFFF' : 'rgba(245,243,255,0.75)',
          fontSize: 24,
          fontWeight: 700,
          letterSpacing: 3,
        }}
      >
        {chosen ? <CheckIcon /> : <div style={{ display: 'flex' }} />}
        {side === 'for' ? 'THE CASE FOR' : 'THE CASE AGAINST'}
      </div>
    );
  };

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #3B1D74 0%, #6A39C9 60%, #7C3AED 100%)',
          padding: '56px 64px 48px',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                background: 'rgba(255,255,255,0.95)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#6A39C9',
                fontSize: 26,
                fontWeight: 800,
              }}
            >
              M
            </div>
            <div style={{ display: 'flex', color: 'rgba(255,255,255,0.95)', fontSize: 30, fontWeight: 700 }}>
              My Democracy
            </div>
          </div>
          {campaign?.issue_area ? (
            <div
              style={{
                display: 'flex',
                color: '#EDE9FE',
                background: 'rgba(255,255,255,0.14)',
                borderRadius: 999,
                padding: '8px 22px',
                fontSize: 22,
              }}
            >
              {campaign.issue_area}
            </div>
          ) : (
            <div style={{ display: 'flex' }} />
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ScaleIcon />
            <div style={{ display: 'flex', color: '#DDD6FE', fontSize: 24, fontWeight: 600, letterSpacing: 3 }}>
              {kicker}
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              color: 'white',
              fontSize: headline.length > 60 ? 52 : 62,
              fontWeight: 800,
              lineHeight: 1.12,
              maxWidth: 1060,
            }}
          >
            {headline}
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          {panel('for')}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: 64,
              height: 64,
              borderRadius: 32,
              background: pos === 'undecided' ? '#FFFFFF' : 'rgba(255,255,255,0.85)',
              border: pos === 'undecided' ? '3px solid #DDD6FE' : 'none',
              color: '#6A39C9',
              fontSize: 24,
              fontWeight: 800,
            }}
          >
            vs
          </div>
          {panel('against')}
        </div>
      </div>
    ),
    {
      ...SIZE,
      headers: {
        // Fresh-ish for scrapers without hammering the DB; utm params on the
        // landing URL handle cache-busting for X.
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=86400',
      },
    }
  );
}
