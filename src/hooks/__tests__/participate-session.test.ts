import { describe, it, expect } from 'vitest';
import { readParticipateSession, writeParticipateSession, clearParticipateSession } from '../useAutoSave';

/** Minimal Storage for node tests. */
function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() { return map.size; },
    clear: () => map.clear(),
    getItem: (k: string) => (map.has(k) ? (map.get(k) as string) : null),
    key: (i: number) => Array.from(map.keys())[i] ?? null,
    removeItem: (k: string) => { map.delete(k); },
    setItem: (k: string, v: string) => { map.set(k, v); },
  };
}

const session = {
  step: 'review',
  stance: 'support' as const,
  sentStatus: { W000805: 'cwc_submitted', K000384: 'email_opened' },
  actionId: '3b7d3c7e-2b2f-4f2a-9a9a-5d7c0b7c1a11',
  sentCount: 2,
};

describe('campaign participation session (sessionStorage)', () => {
  it('round-trips the sent markers, action id, count, step and stance', () => {
    const store = memoryStorage();
    writeParticipateSession('weigh-in-1', session, store, 1000);
    const back = readParticipateSession('weigh-in-1', store, 2000);
    expect(back).toMatchObject(session);
    expect(back?.savedAt).toBe(1000);
  });

  it('is keyed by slug', () => {
    const store = memoryStorage();
    writeParticipateSession('a', session, store, 1000);
    expect(readParticipateSession('b', store, 1000)).toBeNull();
  });

  it('expires after 24 hours and removes the stale record', () => {
    const store = memoryStorage();
    writeParticipateSession('a', session, store, 0);
    expect(readParticipateSession('a', store, 24 * 60 * 60 * 1000 + 1)).toBeNull();
    expect(store.getItem('mydemocracy:participate:a')).toBeNull();
  });

  it('clears on Done', () => {
    const store = memoryStorage();
    writeParticipateSession('a', session, store, 1000);
    clearParticipateSession('a', store);
    expect(readParticipateSession('a', store, 1000)).toBeNull();
  });

  it('tolerates garbage and a missing storage', () => {
    const store = memoryStorage();
    store.setItem('mydemocracy:participate:a', '{not json');
    expect(readParticipateSession('a', store)).toBeNull();
    expect(readParticipateSession('a', null)).toBeNull();
    expect(() => writeParticipateSession('a', session, null)).not.toThrow();
    expect(() => clearParticipateSession('a', null)).not.toThrow();
  });
});
