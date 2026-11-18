import { describe, it, expect, afterEach, vi } from 'vitest';
import { mapEmbedToken, verifyMapEmbedToken } from '../org-embed-token';
import { updatesUnsubscribeToken, verifyUpdatesUnsubscribeToken } from '../campaign-updates';
import { signingSecret, acceptedSecrets } from '../signing-secrets';

afterEach(() => vi.unstubAllEnvs());

/**
 * The point of the dual-secret arrangement is that rotating a borrowed key
 * does not reach into mail already delivered or into an embed snippet
 * already pasted on somebody's site. These assert exactly that.
 */
describe('signing secrets', () => {
  it('signs with the dedicated secret when it is set', () => {
    vi.stubEnv('SUPABASE_SECRET_KEY', 'legacy-db-key');
    vi.stubEnv('EMBED_SIGNING_SECRET', 'dedicated-embed-key');
    expect(signingSecret('embed')).toBe('dedicated-embed-key');
  });

  it('falls back to the legacy secret until the dedicated one is deployed', () => {
    vi.stubEnv('SUPABASE_SECRET_KEY', 'legacy-db-key');
    vi.stubEnv('EMBED_SIGNING_SECRET', '');
    expect(signingSecret('embed')).toBe('legacy-db-key');
  });

  it('throws rather than signing with nothing', () => {
    vi.stubEnv('SUPABASE_SECRET_KEY', '');
    vi.stubEnv('EMBED_SIGNING_SECRET', '');
    expect(() => signingSecret('embed')).toThrow(/No signing secret/);
  });

  it('does not list the same value twice when both names hold it', () => {
    vi.stubEnv('EMBED_SIGNING_SECRET', 'same');
    vi.stubEnv('SUPABASE_SECRET_KEY', 'same');
    expect(acceptedSecrets('embed')).toEqual(['same']);
  });
});

describe('an embed token issued before the migration', () => {
  it('still verifies after the dedicated secret is introduced', () => {
    vi.stubEnv('SUPABASE_SECRET_KEY', 'legacy-db-key');
    vi.stubEnv('EMBED_SIGNING_SECRET', '');
    const pasted = mapEmbedToken('childrens-cabinet');

    // The org set a dedicated secret. The snippet on their site is unchanged.
    vi.stubEnv('EMBED_SIGNING_SECRET', 'dedicated-embed-key');
    expect(verifyMapEmbedToken('childrens-cabinet', pasted)).toBe(true);

    // And a token minted now also verifies.
    expect(verifyMapEmbedToken('childrens-cabinet', mapEmbedToken('childrens-cabinet'))).toBe(true);
  });

  it('stops verifying once the legacy secret is removed, which is the point of removing it', () => {
    vi.stubEnv('SUPABASE_SECRET_KEY', 'legacy-db-key');
    vi.stubEnv('EMBED_SIGNING_SECRET', '');
    const pasted = mapEmbedToken('childrens-cabinet');

    vi.stubEnv('EMBED_SIGNING_SECRET', 'dedicated-embed-key');
    vi.stubEnv('SUPABASE_SECRET_KEY', 'rotated-db-key');
    expect(verifyMapEmbedToken('childrens-cabinet', pasted)).toBe(false);
  });

  it('never accepts a token for another org', () => {
    vi.stubEnv('EMBED_SIGNING_SECRET', 'dedicated-embed-key');
    expect(verifyMapEmbedToken('geears', mapEmbedToken('childrens-cabinet'))).toBe(false);
    expect(verifyMapEmbedToken('geears', null)).toBe(false);
    expect(verifyMapEmbedToken('geears', 'nonsense')).toBe(false);
  });
});

describe('an unsubscribe link in mail already delivered', () => {
  it('survives the cron secret being rotated, as long as it is still listed', () => {
    vi.stubEnv('CRON_SECRET', 'old-cron');
    vi.stubEnv('CAMPAIGN_UPDATES_SECRET', '');
    const inTheirInbox = updatesUnsubscribeToken('Supporter@Example.org');

    vi.stubEnv('CAMPAIGN_UPDATES_SECRET', 'dedicated-updates-key');
    expect(verifyUpdatesUnsubscribeToken('supporter@example.org', inTheirInbox)).toBe(true);
  });

  it('is case-insensitive on the address, as the sender is', () => {
    vi.stubEnv('CAMPAIGN_UPDATES_SECRET', 'dedicated-updates-key');
    const t = updatesUnsubscribeToken('supporter@example.org');
    expect(verifyUpdatesUnsubscribeToken('SUPPORTER@EXAMPLE.ORG', t)).toBe(true);
  });

  it('refuses another address and a garbage token', () => {
    vi.stubEnv('CAMPAIGN_UPDATES_SECRET', 'dedicated-updates-key');
    const t = updatesUnsubscribeToken('supporter@example.org');
    expect(verifyUpdatesUnsubscribeToken('someone@else.org', t)).toBe(false);
    expect(verifyUpdatesUnsubscribeToken('supporter@example.org', 'deadbeef')).toBe(false);
  });
});
