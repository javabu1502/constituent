import { describe, it, expect } from 'vitest';

/**
 * The public trends page carried one constituent's full sentence about a
 * local demolition beside the number 10 on 2026-11-13. She had written it
 * once and sent it to ten offices, and the page counted messages. Her words
 * are not repeated here: this repository is public too.
 *
 * These are the rules that stop that. The aggregation itself lives in the
 * route; this pins the behaviour it has to keep.
 */
const MIN_PEOPLE = 3;
const MAX_LEN = 48;

type Row = { issue_area: string; issue_subtopic: string | null; advocate_name?: string | null; advocate_city?: string | null; advocate_state?: string | null };

const sender = (m: Row) => [m.advocate_name, m.advocate_city, m.advocate_state].map((p) => (p ?? '').trim().toLowerCase()).join('|');

function aggregate(messages: Row[]) {
  const issuePeople: Record<string, Set<string>> = {};
  const subPeople: Record<string, Record<string, Set<string>>> = {};
  for (const m of messages) {
    if (!m.issue_area) continue;
    const who = sender(m);
    (issuePeople[m.issue_area] ??= new Set()).add(who);
    const sub = (m.issue_subtopic ?? '').trim();
    if (!sub || sub.length > MAX_LEN) continue;
    ((subPeople[m.issue_area] ??= {})[sub] ??= new Set()).add(who);
  }
  return Object.entries(issuePeople).map(([issue_area, people]) => ({
    issue_area,
    count: people.size,
    subtopics: Object.entries(subPeople[issue_area] ?? {})
      .map(([name, w]) => ({ name, count: w.size }))
      .filter((s) => s.count >= MIN_PEOPLE),
  }));
}

// One resident, writing to each of her officials in turn.
const resident = (sub: string): Row => ({
  issue_area: 'Local Government', issue_subtopic: sub,
  advocate_name: 'A Resident', advocate_city: 'Somewhere', advocate_state: 'IL',
});

describe('what the public trends page may say', () => {
  // Shaped like the real one, not the real one.
  const sentence = 'A long free text description of a specific local matter that someone typed themselves';

  it('counts the person once, not the five officials she wrote to', () => {
    const rows = [1, 2, 3, 4, 5].map(() => resident('Historic preservation'));
    expect(aggregate(rows)[0].count).toBe(1);
  });

  it('never publishes a subtopic only one person used', () => {
    const rows = [1, 2, 3].map(() => resident('Historic preservation'));
    expect(aggregate(rows)[0].subtopics).toEqual([]);
  });

  it('publishes one that enough separate people used', () => {
    const rows = ['Ann', 'Ben', 'Cal'].map((name) => ({
      issue_area: 'Local Government', issue_subtopic: 'Historic preservation',
      advocate_name: name, advocate_city: 'Somewhere', advocate_state: 'IL',
    }));
    expect(aggregate(rows)[0].subtopics).toEqual([{ name: 'Historic preservation', count: 3 }]);
  });

  // A sentence is somebody's message, not a category, however many share it.
  it('never publishes a whole sentence as a label', () => {
    const rows = ['Ann', 'Ben', 'Cal', 'Dee'].map((name) => ({
      issue_area: 'Local Government', issue_subtopic: sentence,
      advocate_name: name, advocate_city: 'Somewhere', advocate_state: 'IL',
    }));
    expect(sentence.length).toBeGreaterThan(MAX_LEN);
    expect(aggregate(rows)[0].subtopics).toEqual([]);
  });

  it('keeps an ordinary short topic', () => {
    expect('Land use and zoning'.length).toBeLessThanOrEqual(MAX_LEN);
  });
});
