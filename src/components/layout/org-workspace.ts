/**
 * Where an organization's own navigation belongs.
 *
 * The org nav replaced the site nav everywhere, so an organization account
 * landed on the home page, under a hero reading "Your voice matters. Make it
 * heard", and found Campaigns / Reports / Settings / New campaign in the
 * header instead of any way to write to their own representatives. An
 * organization account is still a person on the public site; the campaign
 * tools belong in the place they run campaigns, not on the front door.
 *
 * `/campaign/<slug>` on its own is deliberately NOT here. That is the public
 * campaign page a constituent opens from a link.
 */
const ORG_CAMPAIGN_SUBROUTES = new Set(['analytics', 'edit', 'manage', 'report']);

export function isOrgWorkspacePath(pathname: string): boolean {
  if (pathname === '/dashboard' || pathname.startsWith('/dashboard/')) return true;
  if (pathname === '/campaign/create') return true;
  const sub = pathname.match(/^\/campaign\/[^/]+\/([^/]+)/)?.[1];
  return !!sub && ORG_CAMPAIGN_SUBROUTES.has(sub);
}
