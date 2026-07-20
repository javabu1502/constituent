import { NextRequest, NextResponse } from 'next/server';
import { createSession, getBlueskyCreds } from '@/lib/social/bluesky';
import { runAnalyst } from '@/lib/social/analyst';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/cron/social-analyst
 * Nightly: pull engagement metrics onto posted rows and record findings
 * (issue-area diet, best lane) to the playbook. Read/measure only — never
 * posts, so it runs regardless of the kill switch.
 */
export async function GET(request: NextRequest) {
  const auth = request.headers.get('authorization');
  if (!process.env.CRON_SECRET || auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const creds = getBlueskyCreds();
  if (!creds) return NextResponse.json({ ok: false, error: 'BLUESKY creds not set' }, { status: 500 });

  const session = await createSession(creds.handle, creds.appPassword);
  const result = await runAnalyst(session);
  return NextResponse.json({ ok: true, ...result });
}
