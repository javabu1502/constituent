import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';

interface LogMessageBody {
  advocate_name: string;
  advocate_email?: string;
  advocate_city: string;
  advocate_state: string;
  advocate_district?: string;
  legislator_name: string;
  legislator_id: string;
  legislator_party: string;
  legislator_level: string;
  legislator_chamber: string;
  issue_area: string;
  issue_subtopic: string;
  message_body: string;
  delivery_method: string;
  delivery_status: string;
  user_id?: string;
  campaign_id?: string;
}

/**
 * POST /api/track-send
 * Log a message send event to Supabase
 */
export async function POST(request: NextRequest) {
  let body: LogMessageBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body' },
      { status: 400 }
    );
  }

  const {
    advocate_name,
    legislator_name,
    legislator_id,
    issue_area,
    delivery_method,
    delivery_status,
    advocate_city,
    advocate_state,
    message_body,
  } = body;

  if (!advocate_name || !legislator_name || !legislator_id || !issue_area || !delivery_method || !delivery_status || !advocate_city || !advocate_state || !message_body) {
    return NextResponse.json(
      { error: 'Missing required fields' },
      { status: 400 }
    );
  }

  try {
    const supabase = createAdminClient();

    const { error } = await supabase.from('messages').insert({
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
    });

    if (error) {
      console.error('[track-send] Supabase insert error:', error);
      return NextResponse.json(
        { error: 'Failed to log message' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[track-send] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
