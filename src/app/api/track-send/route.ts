import { NextRequest, NextResponse } from 'next/server';
import type { TrackSendRequest, TrackSendResponse, ApiError } from '@/lib/types';

/**
 * POST /api/track-send
 * Track anonymous send events for analytics
 *
 * This is a lightweight endpoint that logs send events without storing PII.
 * Implement your own analytics backend (Mixpanel, Amplitude, PostHog, etc.) as needed.
 */
export async function POST(request: NextRequest): Promise<NextResponse<TrackSendResponse | ApiError>> {
  // Parse request body
  let body: TrackSendRequest;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'Invalid JSON in request body', code: 'INVALID_JSON' },
      { status: 400 }
    );
  }

  // Validate required fields
  const { recipientName, recipientOffice, topic, method } = body;

  if (!recipientName || !recipientOffice || !topic || !method) {
    return NextResponse.json(
      { error: 'Missing required fields: recipientName, recipientOffice, topic, method', code: 'MISSING_FIELDS' },
      { status: 400 }
    );
  }

  // Validate method
  const validMethods = ['email', 'phone', 'web_form'];
  if (!validMethods.includes(method)) {
    return NextResponse.json(
      { error: `Invalid method. Must be one of: ${validMethods.join(', ')}`, code: 'INVALID_METHOD' },
      { status: 400 }
    );
  }

  // Generate event ID
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
  const timestamp = new Date().toISOString();

  // Log the event (this is where you'd send to your analytics service)
  const event = {
    eventId,
    timestamp,
    recipientOffice,  // "U.S. Senator" or "U.S. Representative"
    topic,
    method,
    // Note: We intentionally don't log recipientName to avoid storing PII
    // If you need to track by representative, use a hashed/anonymized ID
  };

  console.log('[TrackSend]', JSON.stringify(event));

  // TODO: Implement your analytics tracking here
  // Examples:
  //
  // Mixpanel:
  // await mixpanel.track('message_sent', event);
  //
  // PostHog:
  // posthog.capture('message_sent', event);
  //
  // Custom webhook:
  // await fetch(process.env.ANALYTICS_WEBHOOK_URL, {
  //   method: 'POST',
  //   body: JSON.stringify(event),
  // });
  //
  // Database:
  // await db.insert('send_events', event);

  return NextResponse.json({
    success: true,
    eventId,
  });
}
