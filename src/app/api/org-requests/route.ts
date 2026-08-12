import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { createAdminClient } from '@/lib/supabase';
import { profileLimiter, getClientIp } from '@/lib/rate-limit';
import { sendAdminNotification } from '@/lib/resend';

export const runtime = 'nodejs';

/** Pilot application from an advocacy org (public form on /campaigns). */
const orgRequestSchema = z.object({
  org_name: z.string().min(2).max(200),
  website: z.string().max(300).optional(),
  contact_name: z.string().min(2).max(200),
  email: z.string().email().max(254),
  role: z.string().max(120).optional(),
  working_on: z.string().max(2000).optional(),
});

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  const { success, retryAfter } = profileLimiter.check(ip);
  if (!success) {
    return NextResponse.json({ error: 'Too many requests' }, { status: 429, headers: { 'Retry-After': String(retryAfter) } });
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  const parsed = orgRequestSchema.safeParse(raw);
  if (!parsed.success) return NextResponse.json({ error: 'Please fill in the required fields' }, { status: 400 });

  const admin = createAdminClient();
  const { error } = await admin.from('org_requests').insert({
    org_name: parsed.data.org_name.trim(),
    website: parsed.data.website?.trim() || null,
    contact_name: parsed.data.contact_name.trim(),
    email: parsed.data.email.trim().toLowerCase(),
    role: parsed.data.role?.trim() || null,
    working_on: parsed.data.working_on?.trim() || null,
  });
  if (error) {
    console.error('[org-requests] insert failed:', error);
    return NextResponse.json({ error: 'Something went wrong — please try again' }, { status: 500 });
  }

  const esc = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  void sendAdminNotification(
    `Pilot application: ${parsed.data.org_name}`,
    `<h2>Advocacy platform pilot application</h2>
     <ul>
       <li><strong>Org:</strong> ${esc(parsed.data.org_name)}</li>
       <li><strong>Website:</strong> ${esc(parsed.data.website ?? '—')}</li>
       <li><strong>Contact:</strong> ${esc(parsed.data.contact_name)} (${esc(parsed.data.email)})${parsed.data.role ? `, ${esc(parsed.data.role)}` : ''}</li>
       <li><strong>Working on:</strong> ${esc(parsed.data.working_on ?? '—')}</li>
     </ul>
     <p>Approve by setting their profile's account_type to <code>organization</code> once they have an account.</p>`
  );

  return NextResponse.json({ ok: true });
}
