import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  buildCwcXml, buildCampaignId, checkEgressIp,
  validateHouse, sendHouse, sendSenate,
  type CwcDelivery,
} from '@/lib/cwc';

// Must run in the Node runtime so the undici proxy (static-IP egress) works.
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;

function isAdmin(user: { id: string; email?: string }): boolean {
  const ids = process.env.ADMIN_USER_IDS?.split(',').map((s) => s.trim()).filter(Boolean) ?? [];
  if (ids.includes(user.id)) return true;
  const emails = process.env.ADMIN_EMAILS?.split(',').map((s) => s.trim().toLowerCase()).filter(Boolean) ?? [];
  return !!user.email && emails.includes(user.email.toLowerCase());
}

// A clearly-labeled TEST delivery. UAT/sandbox never reaches a real office.
function sampleDelivery(chamber: 'house' | 'senate'): CwcDelivery {
  const isHouse = chamber === 'house';
  return {
    chamber,
    officeCode: isHouse ? 'HNY12' : 'SNY01',
    campaignId: buildCampaignId({ topicKey: 'CWC connectivity test', stance: 'pro' }),
    constituent: {
      prefix: 'Ms.', firstName: 'Test', lastName: 'Constituent',
      address1: '350 5th Ave', city: 'New York', state: 'NY', zip: '10118-0110',
      email: 'test.constituent@example.com',
    },
    message: {
      subject: 'Connectivity test message',
      topics: ['Government Operations and Politics'],
      stance: 'pro',
      constituentMessage: 'This is a My Democracy connectivity test to the CWC test environment. Please disregard.',
    },
  };
}

/**
 * GET /api/admin/cwc-test?chamber=house|senate&action=preview|validate|send
 * Admin-only. `preview` (default) builds the XML and checks the egress IP but
 * makes NO CWC call. `validate` runs House /v2/validate (sends nothing).
 * `send` posts to the UAT/test sandbox. Nothing here touches a live office.
 */
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdmin(user)) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  const sp = request.nextUrl.searchParams;
  const chamber = sp.get('chamber') === 'senate' ? 'senate' : 'house';
  const action = (sp.get('action') ?? 'preview') as 'preview' | 'validate' | 'send';

  let xml: string;
  try {
    xml = buildCwcXml(sampleDelivery(chamber));
  } catch (e) {
    return NextResponse.json({ error: 'XML build failed', detail: (e as Error).message }, { status: 400 });
  }

  // Egress IP is always safe to check and confirms the QuotaGuard static IPs.
  let egressIp: string | null = null;
  try { egressIp = await checkEgressIp(); } catch (e) { egressIp = `error: ${(e as Error).message}`; }

  if (action === 'preview') {
    return NextResponse.json({ chamber, action, egressIp, xml });
  }

  try {
    let result;
    if (action === 'validate') {
      if (chamber !== 'house') return NextResponse.json({ error: 'validate is House-only; Senate test env is send-only' }, { status: 400 });
      result = await validateHouse(sampleDelivery(chamber), 'uat');
    } else {
      result = chamber === 'house' ? await sendHouse(sampleDelivery(chamber), 'uat') : await sendSenate(sampleDelivery(chamber), 'uat');
    }
    return NextResponse.json({ chamber, action, egressIp, result, xml });
  } catch (e) {
    return NextResponse.json({ chamber, action, egressIp, error: (e as Error).message, xml }, { status: 502 });
  }
}
