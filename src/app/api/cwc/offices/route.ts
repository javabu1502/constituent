import { NextResponse } from 'next/server';
import { getActiveOfficeCodesCached } from '@/lib/cwc/send';
import { webformAutomatableSenatorIds } from '@/lib/webform/queue';

// Node runtime: the office lists are fetched through the static-IP proxy.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/cwc/offices — the congressional offices currently accepting
 * Communicating With Congress delivery, as seat codes (HNV02, SNV01…).
 *
 * The client uses this to decide, per official, whether to show "Send to
 * Congress" (office participates → delivered through CWC) or the existing
 * email / contact-form actions (office does not participate, e.g. the 47
 * senators who opted out). Both source lists are public; this route only
 * adds our cache and the fail-safe: any error, or delivery being switched
 * off, returns EMPTY lists so every office falls back to the email path.
 */
export async function GET() {
  const enabled = process.env.CWC_DELIVERY_ENABLED === 'true';
  let house: string[] = [];
  let senate: string[] = [];
  // Bioguide ids of senators NOT on CWC whose CAPTCHA-free contact form we
  // file for them (WEBFORM_DELIVERY_ENABLED). Empty when off or on failure.
  let webform: string[] = [];
  if (enabled) {
    try {
      const [h, s] = await Promise.all([
        getActiveOfficeCodesCached('house', { mode: 'production' }),
        getActiveOfficeCodesCached('senate', { mode: 'production' }),
      ]);
      house = [...h];
      senate = [...s];
      try { webform = await webformAutomatableSenatorIds(s); } catch (e) { console.error('[cwc/offices] webform list failed:', (e as Error).message); }
    } catch (e) {
      console.error('[cwc/offices] active-offices fetch failed; reporting none:', (e as Error).message);
      house = [];
      senate = [];
    }
  }
  return NextResponse.json(
    { enabled, house, senate, webform, fetchedAt: new Date().toISOString() },
    { headers: { 'Cache-Control': 'public, s-maxage=900, stale-while-revalidate=3600' } },
  );
}
