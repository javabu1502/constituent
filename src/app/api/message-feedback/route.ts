import { NextRequest, NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { messageFeedbackSchema, parseBody } from '@/lib/schemas';

export async function POST(request: NextRequest) {
  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 });
  }

  const parsed = parseBody(messageFeedbackSchema, raw);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error }, { status: 400 });
  }

  const body = parsed.data;

  try {
    const supabase = createAdminClient();
    const { error } = await supabase.from('message_feedback').insert({
      message_hash: body.messageHash,
      official_name: body.officialName,
      official_party: body.officialParty || null,
      issue_category: body.issueCategory || null,
      tone: body.tone || null,
      contact_method: body.contactMethod || null,
      rating: body.rating,
    });

    if (error) {
      console.error('[message-feedback] Supabase insert error:', error);
      return NextResponse.json({ error: 'Failed to save feedback' }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[message-feedback] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
