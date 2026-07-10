import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'Where do you stand? | My Democracy';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface CampaignRow {
  headline?: string;
  issue_area?: string;
  campaign_type?: string;
}

async function fetchCampaign(slug: string): Promise<CampaignRow | null> {
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!base || !key) return null;
    const res = await fetch(
      `${base}/rest/v1/campaigns?slug=eq.${encodeURIComponent(slug)}&approval_status=eq.approved&select=headline,issue_area,campaign_type&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` } }
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as CampaignRow[];
    return rows?.[0] ?? null;
  } catch {
    return null;
  }
}

// Simple balance scale, inline SVG (Satori-safe: no emoji, no external assets)
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

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaign = await fetchCampaign(slug);
  const headline = campaign?.headline ?? 'Make your voice heard';
  const isStory = campaign?.campaign_type === 'storytelling';

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
        {/* Brand header */}
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

        {/* Kicker + question headline */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <ScaleIcon />
            <div style={{ display: 'flex', color: '#DDD6FE', fontSize: 26, fontWeight: 600, letterSpacing: 4 }}>
              {isStory ? 'SHARE YOUR STORY' : 'WHERE DO YOU STAND?'}
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

        {/* Balanced footer strip: THE CASE FOR / vs / THE CASE AGAINST */}
        {isStory ? (
          <div style={{ display: 'flex', color: 'rgba(255,255,255,0.65)', fontSize: 22 }}>mydemocracy.app</div>
        ) : (
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div
              style={{
                display: 'flex',
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 14,
                padding: '16px 0',
                color: '#F5F3FF',
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 3,
              }}
            >
              THE CASE FOR
            </div>
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                width: 64,
                height: 64,
                borderRadius: 32,
                background: 'rgba(255,255,255,0.95)',
                color: '#6A39C9',
                fontSize: 24,
                fontWeight: 800,
              }}
            >
              vs
            </div>
            <div
              style={{
                display: 'flex',
                flex: 1,
                alignItems: 'center',
                justifyContent: 'center',
                background: 'rgba(255,255,255,0.12)',
                border: '1px solid rgba(255,255,255,0.25)',
                borderRadius: 14,
                padding: '16px 0',
                color: '#F5F3FF',
                fontSize: 24,
                fontWeight: 700,
                letterSpacing: 3,
              }}
            >
              THE CASE AGAINST
            </div>
          </div>
        )}
      </div>
    ),
    { ...size }
  );
}
