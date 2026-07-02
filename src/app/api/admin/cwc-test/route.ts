import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';
import { isAdmin } from '@/lib/admin';
import { env } from '@/lib/env';
import { submitToCWC, isCWCConfigured } from '@/lib/delivery/cwc';

/**
 * Admin-only CWC diagnostics. GET reports whether delivery is configured for
 * this environment (masking secrets). POST fires a single CWC submission and
 * echoes the exact request XML + raw response — bypassing the compliance gate
 * and the full user flow — so the wire format can be validated against the
 * test endpoint. Never wire this to non-admins; it sends to the office code
 * given (use the CWC TEST env, which routes to a test harness).
 */
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const e = env();
  return NextResponse.json({
    configured: isCWCConfigured(),
    baseUrl: e.CWC_API_BASE_URL ?? null,
    deliveryAgentId: e.CWC_DELIVERY_AGENT_ID ?? null,
    apiKeyPresent: Boolean(e.CWC_API_KEY),
  });
}

const testSchema = z.object({
  office: z.string().min(1).max(20),
  name: z.string().min(1).max(200),
  email: z.string().email().max(254),
  street: z.string().min(1).max(200),
  city: z.string().min(1).max(100),
  state: z.string().min(1).max(50),
  zip: z.string().min(1).max(20),
  phone: z.string().max(30).optional(),
  topic: z.string().min(1).max(200),
  messageBody: z.string().min(1).max(10000),
});

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!isCWCConfigured()) {
    return NextResponse.json(
      { error: 'CWC is not configured in this environment (set CWC_API_KEY / CWC_API_BASE_URL / CWC_DELIVERY_AGENT_ID).' },
      { status: 503 },
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  const parsed = testSchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues.map((i) => `${i.path.join('.')}: ${i.message}`).join('; ') },
      { status: 400 },
    );
  }
  const b = parsed.data;

  const result = await submitToCWC({
    office: b.office,
    sender: {
      name: b.name,
      email: b.email,
      street: b.street,
      city: b.city,
      state: b.state,
      zip: b.zip,
      phone: b.phone,
    },
    topic: b.topic,
    messageBody: b.messageBody,
  });

  return NextResponse.json({
    ok: result.ok,
    status: result.status,
    cwcMessageId: result.cwcMessageId ?? null,
    errorCode: result.errorCode ?? null,
    errorMessage: result.errorMessage ?? null,
    requestXml: result.requestXml ?? null,
    rawResponse: result.rawResponse ?? null,
  });
}
