import { createHmac, timingSafeEqual } from 'crypto';

/**
 * Signed token for a storyteller to answer a permission request without an
 * account. Bound to the request id and the answer, so a "yes" link can never
 * be replayed as a "no" or vice versa.
 */
export type PermissionAnswer = 'approve' | 'decline';

function secret(): string {
  return process.env.STORY_REVOKE_SECRET || process.env.UNSUBSCRIBE_SECRET || process.env.IP_HASH_SALT || '';
}

export function storyPermissionToken(useId: string, answer: PermissionAnswer): string {
  return createHmac('sha256', secret()).update(`story-use:${useId}:${answer}`).digest('hex');
}

export function verifyStoryPermissionToken(useId: string, answer: PermissionAnswer, token: string): boolean {
  const expected = storyPermissionToken(useId, answer);
  if (!token || token.length !== expected.length) return false;
  return timingSafeEqual(Buffer.from(token), Buffer.from(expected));
}

export function permissionLink(useId: string, answer: PermissionAnswer): string {
  const base = process.env.NEXT_PUBLIC_SITE_URL || 'https://www.mydemocracy.app';
  return `${base}/stories/permission?id=${encodeURIComponent(useId)}&answer=${answer}&token=${storyPermissionToken(useId, answer)}`;
}

function escapeHtml(s: string): string {
  return s.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);
}

/** The email a storyteller receives when an organization asks to use their
 * story in a way they did not allow at consent. Plain, factual, one decision. */
export function permissionRequestEmail(args: {
  orgName: string;
  campaignName: string;
  useLabel: string;
  note: string;
  storyExcerpt: string;
  useId: string;
}): { subject: string; html: string } {
  const yes = permissionLink(args.useId, 'approve');
  const no = permissionLink(args.useId, 'decline');
  const subject = `${args.orgName} is asking to use your story`;
  const html = `
<div style="font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;max-width:560px;margin:0 auto;padding:24px;color:#111827;font-size:15px;line-height:1.55">
  <p>You shared a story with the campaign <strong>${escapeHtml(args.campaignName)}</strong>, run by ${escapeHtml(args.orgName)}.</p>
  <p>They are asking for permission to use it in a way you did not select when you shared it:</p>
  <p style="margin:16px 0;padding:12px 16px;background:#f3f4f6;border-radius:8px"><strong>${escapeHtml(args.useLabel)}</strong><br>${escapeHtml(args.note)}</p>
  <p>Your story begins: <em>${escapeHtml(args.storyExcerpt)}</em></p>
  <p>This decision covers only the use described above. Saying no changes nothing else about your story.</p>
  <p style="margin:24px 0">
    <a href="${yes}" style="display:inline-block;padding:10px 20px;background:#7c3aed;color:#fff;text-decoration:none;border-radius:8px;font-weight:500">Yes, they may use it this way</a>
    &nbsp;&nbsp;
    <a href="${no}" style="display:inline-block;padding:10px 20px;background:#e5e7eb;color:#111827;text-decoration:none;border-radius:8px;font-weight:500">No</a>
  </p>
  <p style="color:#6b7280;font-size:13px">If you do not answer, the organization may not use your story this way. You can withdraw your story at any time from your dashboard or with the withdraw link you received when you shared it.</p>
  <p style="color:#6b7280;font-size:13px">My Democracy sent this on the organization's behalf. Your email address was not shared beyond what you allowed.</p>
</div>`;
  return { subject, html };
}
