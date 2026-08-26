import { describe, it, expect } from 'vitest';
import { ogTag, extractEmbedText } from '../bluesky';

describe('bluesky: og tag parsing (link cards)', () => {
  const html = `
    <html><head>
      <title>Fallback Title</title>
      <meta property="og:title" content="Weigh in on data centers" />
      <meta content="Tell your reps where you stand." property="og:description" />
      <meta property="og:image" content="https://mydemocracy.app/og.png" />
    </head></html>`;

  it('reads property-first and content-first meta orderings', () => {
    expect(ogTag(html, 'og:title')).toBe('Weigh in on data centers');
    expect(ogTag(html, 'og:description')).toBe('Tell your reps where you stand.');
    expect(ogTag(html, 'og:image')).toBe('https://mydemocracy.app/og.png');
  });

  it('returns empty string when the tag is absent', () => {
    expect(ogTag(html, 'og:video')).toBe('');
  });
});

describe('bluesky: embed context extraction (reply grounding)', () => {
  it('surfaces quoted-post text so deictic posts are intelligible', () => {
    const embed = {
      $type: 'app.bsky.embed.record#view',
      record: { author: { handle: 'someone.bsky.social' }, value: { text: 'City votes to close the last library' } },
    };
    expect(extractEmbedText(embed)).toBe('quotes @someone.bsky.social: City votes to close the last library');
  });

  it('surfaces image alts, and flags undescribed images', () => {
    expect(
      extractEmbedText({ $type: 'app.bsky.embed.images#view', images: [{ alt: 'Rack of patriotic hats' }] }),
    ).toBe('image: Rack of patriotic hats');
    expect(extractEmbedText({ $type: 'app.bsky.embed.images#view', images: [{}] })).toBe('image (no description)');
  });

  it('returns empty for no embed', () => {
    expect(extractEmbedText(undefined)).toBe('');
  });
});
