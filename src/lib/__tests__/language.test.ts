import { describe, it, expect } from 'vitest';
import { detectLanguage, formatOriginalWordsBlock } from '../language';
import { buildEnvelope } from '../envelope';
import { stripSignatureBlock, containsSignatureBlock } from '../cwc/content';
import type { Official } from '../types';

describe('detectLanguage', () => {
  it('flags plain Spanish testimony', () => {
    expect(detectLanguage('Mi hija tiene tres años y no podemos pagar la guardería. Trabajo dos empleos y aún no alcanza.')).toBe('es');
    expect(detectLanguage('Somos una familia de cinco en Reno y el costo de la vivienda nos está ahogando.')).toBe('es');
  });
  it('keeps English as English, including English with Spanish names', () => {
    expect(detectLanguage('My daughter is three and we cannot afford child care. I work two jobs and it is still not enough.')).toBe('en');
    expect(detectLanguage('We live near the Rio Grande and the San Jose plant is a problem for our family.')).toBe('en');
  });
  it('treats short or empty text as English', () => {
    expect(detectLanguage('')).toBe('en');
    expect(detectLanguage(null)).toBe('en');
    expect(detectLanguage('la casa')).toBe('en');
  });
});

const rep: Official = {
  id: 'S000001', name: 'Jacky Rosen', lastName: 'Rosen', title: 'Senator', level: 'federal', chamber: 'senate',
  party: 'D', state: 'NV',
};
const original = { language: 'es' as const, text: 'Mi hija tiene tres años y no podemos pagar la guardería.\nGracias por su atención.' };

describe('buildEnvelope with original words', () => {
  const base = {
    committeeName: null, verb: null, billRef: null, stageGoal: undefined, headline: 'Child care',
    senderName: 'María López', city: 'Reno', stateCode: 'NV', zip: '89506',
    coreOpening: 'I am a mother in Reno.', coreAsk: 'Please fund child care.',
  };
  it('appends the Spanish original after the ask and before the signature', () => {
    const { body } = buildEnvelope('Child care costs more than rent.', rep, { ...base, originalWords: original });
    const askAt = body.indexOf('Please fund child care.');
    const origAt = body.indexOf('En mis propias palabras (original en español):');
    const sigAt = body.indexOf('Sincerely,');
    expect(askAt).toBeGreaterThan(-1);
    expect(origAt).toBeGreaterThan(askAt);
    expect(sigAt).toBeGreaterThan(origAt);
    expect(body).toContain('Mi hija tiene tres años');
  });
  it('ends with the original when there is no signature (CWC)', () => {
    const { body } = buildEnvelope('Child care costs more than rent.', rep, { ...base, originalWords: original, signature: false });
    expect(body.trimEnd().endsWith('Gracias por su atención.')).toBe(true);
    expect(body).not.toContain('Sincerely');
  });
  it('is unchanged without original words', () => {
    const a = buildEnvelope('Core.', rep, base).body;
    const b = buildEnvelope('Core.', rep, { ...base, originalWords: null }).body;
    expect(a).toBe(b);
    expect(a).not.toContain('propias palabras');
  });
});

describe('CWC content rules on the appended Spanish block', () => {
  it('does not strip the Spanish original as a signature block', () => {
    const { body } = buildEnvelope('Child care costs more than rent.', rep, {
      committeeName: null, verb: null, billRef: null, stageGoal: undefined, headline: 'Child care',
      senderName: 'María López', city: 'Reno', stateCode: 'NV', zip: '89506', signature: false,
      originalWords: original,
    });
    expect(stripSignatureBlock(body)).toBe(body.trim());
    expect(containsSignatureBlock(body)).toBe(false);
  });
  it('formats the block with the heading and verbatim text', () => {
    expect(formatOriginalWordsBlock({ language: 'es', text: '  Hola.  ' })).toBe('En mis propias palabras (original en español):\nHola.');
  });
});
