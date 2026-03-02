import { ImageResponse } from 'next/og';
import { createAdminClient } from '@/lib/supabase';

export const runtime = 'edge';
export const alt = 'A citizen contacted their representative on My Democracy';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default async function Image({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  let repName = 'their Representative';
  let issue = 'an important issue';
  let location = '';

  try {
    const supabase = createAdminClient();
    const { data } = await supabase
      .from('messages')
      .select('legislator_name, issue_area, issue_subtopic, advocate_city, advocate_state')
      .eq('id', id)
      .single();

    if (data) {
      repName = data.legislator_name;
      issue = data.issue_subtopic || data.issue_area;
      location = `${data.advocate_city}, ${data.advocate_state}`;
    }
  } catch {
    // Use defaults
  }

  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#f5f0ff',
          fontFamily: 'system-ui, sans-serif',
        }}
      >
        {/* Purple accent bar */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: 8,
            background: 'linear-gradient(to right, #6A39C9, #9b5de5)',
          }}
        />

        {/* Checkmark icon */}
        <div
          style={{
            width: 80,
            height: 80,
            borderRadius: 40,
            backgroundColor: '#dcfce7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 24,
          }}
        >
          <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <div
          style={{
            fontSize: 48,
            fontWeight: 700,
            color: '#111827',
            textAlign: 'center',
            maxWidth: 900,
            lineHeight: 1.2,
            marginBottom: 16,
          }}
        >
          A citizen contacted {repName}
        </div>

        <div
          style={{
            fontSize: 28,
            color: '#6b7280',
            textAlign: 'center',
            maxWidth: 800,
            marginBottom: 8,
          }}
        >
          about {issue}
        </div>

        {location && (
          <div
            style={{
              fontSize: 22,
              color: '#9ca3af',
              marginBottom: 32,
            }}
          >
            from {location}
          </div>
        )}

        <div
          style={{
            fontSize: 20,
            color: '#6A39C9',
            fontWeight: 600,
          }}
        >
          mydemocracy.app
        </div>
      </div>
    ),
    { ...size }
  );
}
