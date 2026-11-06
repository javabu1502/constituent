import { NextResponse } from 'next/server';
import { createAdminClient } from '@/lib/supabase';
import { verifyTurnstile } from '@/lib/turnstile';
import { rateLimit, getClientIp } from '@/lib/rate-limit';
import { Resend } from 'resend';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * Send a sign-in code, through Resend rather than Supabase's mailer.
 *
 * Supabase's built-in mailer allows a couple of messages an hour across the
 * whole project. With no password, every sign-in needs an email, so that cap
 * is the number of people who can get into the app in an hour. Pointing
 * Supabase at SMTP would also fix it, but this keeps the sending on the
 * domain the app already verified and removes the dependency entirely.
 *
 * The code itself still comes from Supabase: generate_link mints the same
 * six digits verifyOtp expects, and creates the account when there is none,
 * so one call covers signing in and signing up. The code is never returned
 * to the browser.
 */

// Per IP. A household or an office shares one, so this is not tight.
const ipLimiter = rateLimit({ windowMs: 60 * 60_000, maxRequests: 12 });
// Per address, which is what stops one inbox being used to mail-bomb someone.
const emailLimiter = rateLimit({ windowMs: 60 * 60_000, maxRequests: 5 });

function codeEmail(code: string): { subject: string; html: string; text: string } {
  return {
    subject: `${code} is your My Democracy sign-in code`,
    text: `Your sign-in code is ${code}. It expires in one hour. If you did not ask for it, you can ignore this message.`,
    html: `<!doctype html><html><body style="margin:0;padding:24px;background:#F8F6F1;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;color:#1a1a1a">
  <div style="max-width:480px;margin:0 auto;background:#FFFEFB;border:1px solid #DCD7CA;padding:32px">
    <p style="margin:0 0 24px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:#6B5B3E">My Democracy</p>
    <p style="margin:0 0 8px;font-size:15px">Your sign-in code</p>
    <p style="margin:0 0 24px;font-size:36px;font-weight:700;letter-spacing:.12em;font-family:ui-monospace,SFMono-Regular,Menlo,monospace">${code}</p>
    <p style="margin:0 0 8px;font-size:14px;color:#444">It expires in one hour.</p>
    <p style="margin:0;font-size:13px;color:#777">If you did not ask for this, you can ignore it. Nobody can sign in without the code.</p>
  </div>
</body></html>`,
  };
}

export async function POST(req: Request) {
  let payload: {
    email?: string;
    name?: string;
    captchaToken?: string;
    address?: { street?: string; city?: string; state?: string; zip?: string };
  };
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ error: 'Bad request' }, { status: 400 });
  }

  const email = (payload.email || '').trim().toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: 'Enter a valid email address.' }, { status: 400 });
  }

  const ip = getClientIp(req);
  const byIp = ipLimiter.check(ip);
  if (!byIp.success) {
    return NextResponse.json(
      { error: 'Too many codes requested. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(byIp.retryAfter ?? 600) } },
    );
  }
  const byEmail = emailLimiter.check(email);
  if (!byEmail.success) {
    return NextResponse.json(
      { error: 'Too many codes sent to that address. Try again shortly.' },
      { status: 429, headers: { 'Retry-After': String(byEmail.retryAfter ?? 600) } },
    );
  }

  // Anonymous request, so a missing token is a refusal rather than a pass.
  const ok = await verifyTurnstile(payload.captchaToken || '', { strict: true });
  if (!ok) {
    return NextResponse.json({ error: 'Could not verify you are human. Reload and try again.' }, { status: 403 });
  }

  if (!process.env.RESEND_API_KEY) {
    console.error('[send-code] RESEND_API_KEY missing, cannot send sign-in codes');
    return NextResponse.json({ error: 'Sign-in email is not configured.' }, { status: 500 });
  }

  const admin = createAdminClient();
  // magiclink mints the six digits verifyOtp checks, and creates the account
  // when the address has none, so signing up and signing in are one path.
  const { data, error } = await admin.auth.admin.generateLink({ type: 'magiclink', email });
  if (error || !data?.properties?.email_otp) {
    console.error('[send-code] could not mint a code:', error?.message);
    return NextResponse.json({ error: 'Could not send a code to that address.' }, { status: 502 });
  }

  // Name and address arrive from the signup form only, and matter the first
  // time. signInWithOtp carried these as `data`; they still have to land in
  // user_metadata, because the profile is built from them later.
  const name = (payload.name || '').trim();
  const addr = payload.address;
  const hasAddress = !!(addr?.street && addr?.city && addr?.state && addr?.zip);
  const userId = data.user?.id;
  const existing = data.user?.user_metadata ?? {};
  const fresh: Record<string, string> = {};
  if (name && !existing.full_name) fresh.full_name = name;
  if (hasAddress && !existing.street) {
    fresh.street = addr!.street!;
    fresh.city = addr!.city!;
    fresh.state = addr!.state!;
    fresh.zip = addr!.zip!;
  }
  if (userId && Object.keys(fresh).length > 0) {
    const { error: metaError } = await admin.auth.admin.updateUserById(userId, {
      user_metadata: { ...existing, ...fresh },
    });
    if (metaError) console.error('[send-code] could not store signup details:', metaError.message);
  }

  const mail = codeEmail(data.properties.email_otp);
  try {
    const { error: sendError } = await new Resend(process.env.RESEND_API_KEY).emails.send({
      from: process.env.AUTH_FROM_EMAIL || 'My Democracy <login@mydemocracy.app>',
      to: email,
      subject: mail.subject,
      html: mail.html,
      text: mail.text,
    });
    if (sendError) {
      console.error('[send-code] Resend refused the message:', sendError);
      return NextResponse.json({ error: 'Could not send a code to that address.' }, { status: 502 });
    }
  } catch (e) {
    console.error('[send-code] send threw:', (e as Error).message);
    return NextResponse.json({ error: 'Could not send a code to that address.' }, { status: 502 });
  }

  // Never the code, and never whether the address already had an account.
  return NextResponse.json({ ok: true });
}
