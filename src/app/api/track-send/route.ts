import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { trackSendSchema, parseBody } from '@/lib/schemas';

/**
 * POST /api/track-send
 * Log a message send event to Supabase
 */
export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  const parsed = parseBody(trackSendSchema, raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error },
      { status: 400 }
    );
  }

  const body = parsed.data;

  try {
    const supabase = createAdminClient();

    const { data, error } = await supabase.from('messages').insert({
      advocate_name: body.advocate_name,
      advocate_email: body.advocate_email || null,
      advocate_city: body.advocate_city,
      advocate_state: body.advocate_state,
      advocate_district: body.advocate_district || null,
      legislator_name: body.legislator_name,
      legislator_id: body.legislator_id,
      legislator_party: body.legislator_party,
      legislator_level: body.legislator_level,
      legislator_chamber: body.legislator_chamber,
      issue_area: body.issue_area,
      issue_subtopic: body.issue_subtopic,
      message_body: body.message_body,
      delivery_method: body.delivery_method,
      delivery_status: body.delivery_status,
      user_id: body.user_id || null,
      campaign_id: body.campaign_id || null,
    }).select('id').single();

    if (error) {
      console.error('[track-send] Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to log message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, shareId: data?.id });
  } catch (err) {
    console.error('[track-send] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
