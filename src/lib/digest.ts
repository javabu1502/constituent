import { congressFetch } from '@/lib/congress-api';
import { createAdminClient } from '@/lib/supabase';
import { createHmac } from 'crypto';

interface Vote {
  bill: string;
  position: string;
  result: string;
  date: string;
}

interface Bill {
  title: string;
  number: string;
  status: string;
  url: string;
}

interface RepDigest {
  repName: string;
  repTitle: string;
  votes: Vote[];
  bills: Bill[];
}

export interface DigestData {
  reps: RepDigest[];
  userName: string;
}

/**
 * Builds the weekly digest data for a user by fetching recent votes and bills
 * for each of their saved representatives.
 */
export async function buildWeeklyDigest(userId: string): Promise<DigestData | null> {
  const admin = createAdminClient();

  const { data: profile } = await admin
    .from('profiles')
    .select('name, representatives')
    .eq('user_id', userId)
    .single();

  if (!profile?.representatives || !Array.isArray(profile.representatives)) {
    return null;
  }

  const reps = profile.representatives as Array<{
    name: string;
    title: string;
    id?: string;
    bioguideId?: string;
    level?: string;
  }>;

  const oneWeekAgo = new Date();
  oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
  const sinceDate = oneWeekAgo.toISOString().split('T')[0];

  const repDigests: RepDigest[] = [];

  for (const rep of reps) {
    const bioguideId = rep.bioguideId || rep.id;
    if (!bioguideId || rep.level === 'local') continue;

    const digest: RepDigest = {
      repName: rep.name,
      repTitle: rep.title,
      votes: [],
      bills: [],
    };

    // Fetch recent votes for federal reps
    if (rep.level !== 'state') {
      try {
        const apiKey = process.env.CONGRESS_API_KEY;
        if (apiKey) {
          // Fetch sponsored bills
          const billsRes = await congressFetch(
            `https://api.congress.gov/v3/member/${bioguideId}/sponsored-legislation?limit=5&sort=updateDate+desc&api_key=${apiKey}`
          );
          if (billsRes.ok) {
            const billsData = await billsRes.json();
            const sponsoredBills = billsData.sponsoredLegislation ?? [];
            for (const b of sponsoredBills.slice(0, 3)) {
              const updateDate = b.latestAction?.actionDate;
              if (updateDate && updateDate >= sinceDate) {
                digest.bills.push({
                  title: b.title || 'Untitled',
                  number: `${(b.type || '').toUpperCase()} ${b.number || ''}`.trim(),
                  status: b.latestAction?.text || 'Unknown',
                  url: `https://www.congress.gov/bill/${b.congress || 119}th-congress/${getSlug(b.type)}/${b.number}`,
                });
              }
            }
          }
        }
      } catch (err) {
        console.warn(`[digest] Failed to fetch data for ${rep.name}:`, err);
      }
    }

    // Only include reps with activity
    if (digest.votes.length > 0 || digest.bills.length > 0) {
      repDigests.push(digest);
    }
  }

  if (repDigests.length === 0) return null;

  return {
    reps: repDigests,
    userName: profile.name || 'there',
  };
}

const TYPE_TO_SLUG: Record<string, string> = {
  hr: 'house-bill',
  s: 'senate-bill',
  hjres: 'house-joint-resolution',
  sjres: 'senate-joint-resolution',
  hconres: 'house-concurrent-resolution',
  sconres: 'senate-concurrent-resolution',
  hres: 'house-resolution',
  sres: 'senate-resolution',
};

function getSlug(type?: string): string {
  return TYPE_TO_SLUG[(type || '').toLowerCase()] || 'house-bill';
}

/**
 * Generates an unsubscribe token (HMAC of userId).
 */
export function generateUnsubscribeToken(userId: string): string {
  const secret = process.env.CRON_SECRET || 'default-secret';
  return createHmac('sha256', secret).update(`${userId}:unsubscribe`).digest('hex');
}

/**
 * Verifies an unsubscribe token.
 */
export function verifyUnsubscribeToken(userId: string, token: string): boolean {
  const expected = generateUnsubscribeToken(userId);
  return token === expected;
}

/**
 * Renders digest data as an HTML email.
 */
export function renderDigestHtml(data: DigestData, unsubscribeUrl: string): string {
  const repSections = data.reps.map((rep) => {
    let votesHtml = '';
    if (rep.votes.length > 0) {
      const voteRows = rep.votes
        .map(
          (v) =>
            `<tr>
              <td style="padding:4px 8px;border-bottom:1px solid #eee;">${v.bill}</td>
              <td style="padding:4px 8px;border-bottom:1px solid #eee;">${v.position}</td>
              <td style="padding:4px 8px;border-bottom:1px solid #eee;">${v.result}</td>
              <td style="padding:4px 8px;border-bottom:1px solid #eee;">${v.date}</td>
            </tr>`
        )
        .join('');
      votesHtml = `
        <h4 style="margin:12px 0 6px;color:#6b21a8;">Recent Votes</h4>
        <table style="width:100%;border-collapse:collapse;font-size:13px;">
          <tr style="background:#f5f3ff;">
            <th style="padding:4px 8px;text-align:left;">Bill</th>
            <th style="padding:4px 8px;text-align:left;">Position</th>
            <th style="padding:4px 8px;text-align:left;">Result</th>
            <th style="padding:4px 8px;text-align:left;">Date</th>
          </tr>
          ${voteRows}
        </table>`;
    }

    let billsHtml = '';
    if (rep.bills.length > 0) {
      const billItems = rep.bills
        .map(
          (b) =>
            `<li style="margin-bottom:6px;">
              <a href="${b.url}" style="color:#7c3aed;text-decoration:none;font-weight:500;">${b.number}: ${b.title}</a>
              <br><span style="font-size:12px;color:#6b7280;">${b.status}</span>
            </li>`
        )
        .join('');
      billsHtml = `
        <h4 style="margin:12px 0 6px;color:#6b21a8;">Sponsored Bills</h4>
        <ul style="padding-left:20px;margin:0;">${billItems}</ul>`;
    }

    return `
      <div style="margin-bottom:24px;padding:16px;border:1px solid #e5e7eb;border-radius:8px;">
        <h3 style="margin:0 0 4px;color:#111827;">${rep.repName}</h3>
        <p style="margin:0 0 8px;color:#6b7280;font-size:13px;">${rep.repTitle}</p>
        ${votesHtml}
        ${billsHtml}
      </div>`;
  }).join('');

  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;padding:20px;color:#374151;">
  <div style="text-align:center;margin-bottom:24px;">
    <h1 style="color:#7c3aed;font-size:22px;margin:0;">My Democracy</h1>
    <p style="color:#6b7280;font-size:14px;margin:4px 0 0;">Weekly Activity Digest</p>
  </div>

  <p style="font-size:15px;">Hi ${data.userName},</p>
  <p style="font-size:14px;color:#4b5563;">Here's what your officials have been up to this week:</p>

  ${repSections}

  <div style="text-align:center;margin:24px 0;">
    <a href="https://mydemocracy.app/dashboard" style="display:inline-block;padding:10px 24px;background:#7c3aed;color:white;text-decoration:none;border-radius:8px;font-weight:500;font-size:14px;">
      View Your Dashboard
    </a>
  </div>

  <hr style="border:none;border-top:1px solid #e5e7eb;margin:24px 0;">

  <p style="font-size:11px;color:#9ca3af;text-align:center;">
    You're receiving this because you opted in to weekly digests on My Democracy.<br>
    <a href="${unsubscribeUrl}" style="color:#7c3aed;">Unsubscribe</a>
  </p>
</body>
</html>`;
}
