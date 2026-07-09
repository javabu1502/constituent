import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'Where do you stand? | My Democracy';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

interface CampaignRow {
  headline?: string;
  issue_area?: string;
  campaign_type?: string;
  org_name?: string | null;
}

async function fetchCampaign(slug: string): Promise<CampaignRow | null> {
  try {
    const base = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.SUPABASE_SECRET_KEY;
    if (!base || !key) return null;
    const res = await fetch(
      `${base}/rest/v1/campaigns?slug=eq.${encodeURIComponent(slug)}&approval_status=eq.approved&select=headline,issue_area,campaign_type,org_name&limit=1`,
      { headers: { apikey: key, Authorization: `Bearer ${key}` }, next: { revalidate: 3600 } }
    );
    if (!res.ok) return null;
    const rows = (await res.json()) as CampaignRow[];
    return rows?.[0] ?? null;
  } catch {
    return null;
  }
}

export default async function OgImage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const campaign = await fetchCampaign(slug);
  const headline = campaign?.headline ?? 'Make your voice heard';
  const isStory = campaign?.campaign_type === 'storytelling';
  const tagline = isStory ? 'Share your story' : 'Where do you stand?';

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'linear-gradient(135deg, #4C1D95 0%, #6A39C9 55%, #7C3AED 100%)',
          padding: 64,
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
            <div style={{ color: 'rgba(255,255,255,0.95)', fontSize: 30, fontWeight: 700 }}>My Democracy</div>
          </div>
          {campaign?.issue_area && (
            <div
              style={{
                color: '#EDE9FE',
                background: 'rgba(255,255,255,0.14)',
                borderRadius: 999,
                padding: '10px 24px',
                fontSize: 24,
              }}
            >
              {campaign.issue_area}
            </div>
          )}
        </div>

        <div
          style={{
            color: 'white',
            fontSize: headline.length > 60 ? 56 : 66,
            fontWeight: 800,
            lineHeight: 1.15,
            letterSpacing: -1,
            maxWidth: 1040,
          }}
        >
          {headline}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ color: '#DDD6FE', fontSize: 34, fontWeight: 600 }}>{tagline} →</div>
          <div style={{ color: 'rgba(255,255,255,0.65)', fontSize: 24 }}>mydemocracy.app</div>
        </div>
      </div>
    ),
    { ...size }
  );
}
