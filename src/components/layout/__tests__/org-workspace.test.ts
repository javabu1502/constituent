import { describe, it, expect } from 'vitest';
import { isOrgWorkspacePath } from '../org-workspace';

/**
 * The org nav used to replace the site nav on every page for an organization
 * account, so the home page carried Campaigns / Reports / Settings / New
 * campaign above a hero reading "Your voice matters. Make it heard", with no
 * way to write to an official anywhere in the header.
 */
describe('where an organization sees its campaign tools', () => {
  it('shows them in the organization workspace', () => {
    for (const p of [
      '/dashboard',
      '/dashboard/report',
      '/dashboard/settings',
      '/dashboard/legislator/N000001',
      '/campaign/create',
      '/campaign/child-care-now/manage',
      '/campaign/child-care-now/analytics',
      '/campaign/child-care-now/edit',
      '/campaign/child-care-now/report',
    ]) {
      expect(isOrgWorkspacePath(p), p).toBe(true);
    }
  });

  it('leaves the public site alone', () => {
    for (const p of [
      '/',
      '/issues',
      '/campaigns',
      '/contact',
      '/about',
      '/guides',
      '/news',
      '/vote',
      '/legislators',
      '/states/nv',
      // The public campaign page a constituent opens from a link. An
      // organization viewing it sees what a supporter sees.
      '/campaign/child-care-now',
    ]) {
      expect(isOrgWorkspacePath(p), p).toBe(false);
    }
  });

  it('is not fooled by a path that merely starts with the same letters', () => {
    expect(isOrgWorkspacePath('/dashboards')).toBe(false);
    expect(isOrgWorkspacePath('/campaigns')).toBe(false);
    expect(isOrgWorkspacePath('/campaign/create-a-thing')).toBe(false);
  });
});
