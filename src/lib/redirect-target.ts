/**
 * Where a campaign may send a supporter after they act.
 *
 * An organization asks for this so their own analytics record the conversion:
 * the supporter lands on the organization's thank-you page and that page's
 * tracking fires, on the organization's domain, under the organization's
 * privacy policy. We run no third-party analytics on campaign pages and this
 * is what makes that possible to keep.
 *
 * An unchecked redirect target would turn every campaign page into an open
 * redirect: a link that reads as mydemocracy.app but lands anywhere, which is
 * the shape of a phishing link. So a target is only accepted when its host is
 * the organization's own, taken from the campaign's `org_url` or its
 * `custom_domain`. Both are already stored on the campaign.
 */

export interface RedirectOwner {
  /** The organization's website, as stored on the campaign. */
  orgUrl?: string | null;
  /** A domain the organization serves this campaign from, if any. */
  customDomain?: string | null;
}

export type RedirectCheck =
  | { ok: true; url: string; host: string }
  | { ok: false; reason: string };

/** example.org and www.example.org are the same organization. */
function bareHost(host: string): string {
  const h = host.trim().toLowerCase();
  return h.startsWith('www.') ? h.slice(4) : h;
}

/** Hosts the campaign's owner has already told us are theirs. */
export function allowedHosts(owner: RedirectOwner): string[] {
  const out: string[] = [];

  const custom = (owner.customDomain ?? '').trim();
  if (custom) {
    // custom_domain is stored bare ("act.example.org"), not as a URL.
    const h = custom.replace(/^https?:\/\//i, '').split('/')[0];
    if (h) out.push(bareHost(h));
  }

  const org = (owner.orgUrl ?? '').trim();
  if (org) {
    try {
      // A bare domain in org_url is common; give it a scheme so URL accepts it.
      const u = new URL(/^https?:\/\//i.test(org) ? org : `https://${org}`);
      if (u.hostname) out.push(bareHost(u.hostname));
    } catch {
      // An org_url we cannot parse grants nothing.
    }
  }

  return [...new Set(out)];
}

/**
 * True when `host` is one of `allowed`, or a subdomain of one. A subdomain is
 * allowed because an organization often serves its thank-you page from one
 * (act.example.org) while org_url is the bare site. Matching is on labels, so
 * "notexample.org" never matches "example.org".
 */
function hostIsOwned(host: string, allowed: string[]): boolean {
  const h = bareHost(host);
  return allowed.some((a) => h === a || h.endsWith(`.${a}`));
}

/**
 * Check a redirect target an organization has entered.
 * Returns the normalized URL to store, or why it was refused.
 */
export function checkRedirectTarget(raw: string, owner: RedirectOwner): RedirectCheck {
  const value = (raw ?? '').trim();
  if (!value) return { ok: false, reason: 'Enter a web address, or leave this empty.' };

  let url: URL;
  try {
    url = new URL(value);
  } catch {
    return { ok: false, reason: 'That is not a complete web address. Include https://' };
  }

  // Only https. http would downgrade a supporter mid-flow, and every other
  // scheme (javascript:, data:, vbscript:) is a script-injection vector.
  if (url.protocol !== 'https:') {
    return { ok: false, reason: 'The address must start with https://' };
  }

  // user:pass@host hides the real host from anyone reading the link.
  if (url.username || url.password) {
    return { ok: false, reason: 'Remove the username and password from the address.' };
  }

  const allowed = allowedHosts(owner);
  if (allowed.length === 0) {
    return {
      ok: false,
      reason: 'Add your organization website before setting a redirect, so we can confirm the address is yours.',
    };
  }

  if (!hostIsOwned(url.hostname, allowed)) {
    return {
      ok: false,
      reason: `The address must be on ${allowed.join(' or ')}. A campaign cannot send supporters to another site.`,
    };
  }

  url.hash = '';
  return { ok: true, url: url.toString(), host: url.hostname };
}

export interface RedirectContext {
  /** The initiative campaign, e.g. "hr-2184". */
  campaignSlug: string;
  /** The advocacy action within it, when the send came from one. */
  actionSlug?: string | null;
}

/**
 * The address a supporter is actually sent to: the organization's page plus
 * the parameters their analytics needs to attribute the visit. Parameters the
 * organization already put on the URL are kept; ours never overwrite one they
 * set themselves.
 */
export function buildRedirectUrl(target: string, ctx: RedirectContext): string {
  const url = new URL(target);
  const params: Array<[string, string]> = [
    ['utm_source', 'mydemocracy'],
    ['utm_medium', 'advocacy'],
    ['utm_campaign', ctx.campaignSlug],
  ];
  if (ctx.actionSlug) params.push(['md_action', ctx.actionSlug]);

  for (const [k, v] of params) {
    if (!url.searchParams.has(k)) url.searchParams.set(k, v);
  }
  return url.toString();
}
