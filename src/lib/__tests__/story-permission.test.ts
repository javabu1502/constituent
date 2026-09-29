import { describe, expect, it, beforeAll } from 'vitest';

beforeAll(() => {
  process.env.STORY_REVOKE_SECRET = 'test-secret';
});

describe('story permission tokens', () => {
  it('binds the token to the request id and the answer', async () => {
    const { storyPermissionToken, verifyStoryPermissionToken } = await import('../story-permission');
    const yes = storyPermissionToken('use-1', 'approve');
    expect(verifyStoryPermissionToken('use-1', 'approve', yes)).toBe(true);
    // A yes link can never be replayed as a no, or against another request.
    expect(verifyStoryPermissionToken('use-1', 'decline', yes)).toBe(false);
    expect(verifyStoryPermissionToken('use-2', 'approve', yes)).toBe(false);
    expect(verifyStoryPermissionToken('use-1', 'approve', '')).toBe(false);
  });

  it('builds an email with both links, the use, the note, and no dashes', async () => {
    const { permissionRequestEmail } = await import('../story-permission');
    const { subject, html } = permissionRequestEmail({
      orgName: 'Nevada Children First',
      campaignName: 'Child care stories',
      useLabel: 'Shared with the press',
      note: 'Quoted in a Reno Gazette Journal story on Oct 3 <script>',
      storyExcerpt: 'My daughter waited a year for a spot.',
      useId: 'use-9',
    });
    expect(subject).toBe('Nevada Children First is asking to use your story');
    expect(html).toContain('answer=approve');
    expect(html).toContain('answer=decline');
    expect(html).toContain('Shared with the press');
    expect(html).toContain('&lt;script&gt;');
    expect(html).not.toMatch(/[—–]/);
  });
});
