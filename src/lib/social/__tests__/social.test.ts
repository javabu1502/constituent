import { describe, it, expect } from 'vitest';
import { runGuardrails, isNearDuplicate, LOCAL_COVERAGE } from '../guardrails';
import { linkFacets, graphemeLength, buildPostRecord, BLUESKY_MAX_GRAPHEMES } from '../bluesky';

describe('guardrails: nonpartisan gate', () => {
  it('blocks "vote no on the bill"', () => {
    const r = runGuardrails({ text: 'Call your rep and vote no on the bill today.' });
    expect(r.passed).toBe(false);
    expect(r.checks.find((c) => c.name === 'nonpartisan')?.passed).toBe(false);
  });

  it('blocks party-attack phrasing', () => {
    const r = runGuardrails({ text: 'Republicans are lying to you about this.' });
    expect(r.passed).toBe(false);
  });

  it('passes neutral "tell your reps where you stand"', () => {
    const r = runGuardrails({ text: 'H.R. 139 is moving. tell your reps where you stand: link' });
    expect(r.passed).toBe(true);
    expect(r.checks.find((c) => c.name === 'nonpartisan')?.passed).toBe(true);
  });
});

describe('guardrails: em dash + voice tells', () => {
  it('blocks an em dash', () => {
    const r = runGuardrails({ text: 'this bill is moving — here is the fast way to weigh in' });
    expect(r.passed).toBe(false);
    expect(r.checks.find((c) => c.name === 'no_em_dash')?.passed).toBe(false);
  });

  it('warns (not blocks) on "you clearly feel"', () => {
    const r = runGuardrails({ text: 'you clearly feel strongly about this. here is the link' });
    expect(r.checks.find((c) => c.name === 'voice_tells')?.passed).toBe(false);
    expect(r.passed).toBe(true); // warn only
  });
});

describe('guardrails: coverage match', () => {
  it('blocks a local-action CTA in an uncovered state', () => {
    const r = runGuardrails({ text: 'tell your city council to fix this', targetState: 'TX' });
    expect(r.passed).toBe(false);
    expect(r.checks.find((c) => c.name === 'coverage_match')?.passed).toBe(false);
  });

  it('allows a local-action CTA in a covered state', () => {
    const r = runGuardrails({ text: 'tell your city council to fix this', targetState: 'NV' });
    expect(r.checks.find((c) => c.name === 'coverage_match')?.passed).toBe(true);
  });

  it('coverage set is DE/RI/NV/CA', () => {
    expect([...LOCAL_COVERAGE].sort()).toEqual(['CA', 'DE', 'NV', 'RI']);
  });
});

describe('guardrails: accuracy traceability', () => {
  it('warns when a bill number is not in the source', () => {
    const r = runGuardrails({ text: 'H.R. 999 just passed', sourceText: 'H.R. 139 passed the House' });
    expect(r.checks.find((c) => c.name === 'accuracy_traceable')?.passed).toBe(false);
    expect(r.passed).toBe(true); // warn severity
  });

  it('passes when the bill number matches the source', () => {
    const r = runGuardrails({ text: 'H.R. 139 just passed', sourceText: 'H.R. 139 passed the House 308-117' });
    expect(r.checks.find((c) => c.name === 'accuracy_traceable')?.passed).toBe(true);
  });
});

describe('guardrails: length + dedup', () => {
  it('blocks over-length posts', () => {
    const r = runGuardrails({ text: 'x'.repeat(400), maxLength: BLUESKY_MAX_GRAPHEMES, graphemeLength });
    expect(r.passed).toBe(false);
  });

  it('detects near-duplicates', () => {
    const a = 'reps read their inbox way more than their mentions. here is the fast way to tell them';
    const b = 'reps read their inbox way more than their mentions. here is the fast way to tell them now';
    expect(isNearDuplicate(a, [b])).toBe(true);
    expect(isNearDuplicate(a, ['a totally different post about eggs and rent'])).toBe(false);
  });
});

describe('bluesky: link facets + record building', () => {
  it('computes a UTF-8 byte range facet for a URL', () => {
    const text = 'weigh in here https://mydemocracy.app/issues';
    const facets = linkFacets(text);
    expect(facets).toHaveLength(1);
    const enc = new TextEncoder();
    expect(facets[0].index.byteStart).toBe(enc.encode('weigh in here ').length);
    expect(facets[0].features[0].uri).toBe('https://mydemocracy.app/issues');
  });

  it('computes correct byte offsets past a multi-byte emoji', () => {
    const text = 'the latest 🇺🇸 https://mydemocracy.app';
    const facets = linkFacets(text);
    const enc = new TextEncoder();
    const sliced = new TextDecoder().decode(
      enc.encode(text).slice(facets[0].index.byteStart, facets[0].index.byteEnd),
    );
    expect(sliced).toBe('https://mydemocracy.app');
  });

  it('builds a post record with facets and default lang', () => {
    const { record, graphemes } = buildPostRecord('weigh in https://mydemocracy.app', {
      createdAt: '2026-07-17T00:00:00.000Z',
    });
    expect(record.$type).toBe('app.bsky.feed.post');
    expect(record.langs).toEqual(['en']);
    expect(record.facets).toHaveLength(1);
    expect(graphemes).toBeGreaterThan(0);
  });

  it('throws on over-limit posts', () => {
    expect(() => buildPostRecord('x'.repeat(BLUESKY_MAX_GRAPHEMES + 1))).toThrow(/over the/);
  });
});
