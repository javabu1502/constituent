/**
 * Campaign issue_area -> <LibraryOfCongressTopic> normalization.
 *
 * The campaigns table carries three generations of vocabulary: exact LoC
 * policy-area names (the issue picker's categories), lowercase batch names
 * ('economy', 'guns'), and free-text ('Families & Children'). The XML layer
 * validates against the 32 LoC values and rejects everything else — this is
 * the layer that guarantees it always receives a valid one.
 */
import { LOC_TOPIC_SET, type LocTopic } from './constants';

const NORMALIZE: Record<string, LocTopic> = {
  'families & children': 'Families',
  families: 'Families',
  'civil rights': 'Civil Rights and Liberties, Minority Issues',
  healthcare: 'Health',
  health: 'Health',
  education: 'Education',
  labor: 'Labor and Employment',
  economy: 'Economics and Public Finance',
  'foreign policy': 'International Affairs',
  guns: 'Crime and Law Enforcement',
  technology: 'Science, Technology, Communications',
  'technology and online safety': 'Science, Technology, Communications',
  environment: 'Environmental Protection',
  'elections and voting': 'Government Operations and Politics',
  taxation: 'Taxation',
  infrastructure: 'Transportation and Public Works',
  veterans: 'Armed Forces and National Security',
  housing: 'Housing and Community Development',
  immigration: 'Immigration',
  energy: 'Energy',
  agriculture: 'Agriculture and Food',
  other: 'Government Operations and Politics',
};

const KEYWORD_FALLBACKS: [RegExp, LocTopic][] = [
  [/health|medic|hospital|drug/i, 'Health'],
  [/school|educat|student|teacher/i, 'Education'],
  [/climate|environment|energy|pollut/i, 'Environmental Protection'],
  [/tax/i, 'Taxation'],
  [/immigra|border/i, 'Immigration'],
  [/vote|voting|election|democra/i, 'Government Operations and Politics'],
  [/crime|police|gun|justice/i, 'Crime and Law Enforcement'],
  [/job|worker|wage|labor|union/i, 'Labor and Employment'],
  [/famil|child/i, 'Families'],
  [/hous|rent/i, 'Housing and Community Development'],
  [/tech|internet|privacy|\bai\b/i, 'Science, Technology, Communications'],
  [/veteran|military|defense/i, 'Armed Forces and National Security'],
  [/farm|food|agricultur/i, 'Agriculture and Food'],
  [/econom|inflation|business/i, 'Economics and Public Finance'],
];

/**
 * Always returns a non-empty array of VALID LoC topics — the schema requires
 * at least one, and a wrong-but-plausible topic beats a rejected message.
 */
export function locTopicsForIssueArea(raw: string | null | undefined, headline?: string): LocTopic[] {
  const t = (raw || '').trim();
  if (t && LOC_TOPIC_SET.has(t)) return [t as LocTopic];
  const mapped = NORMALIZE[t.toLowerCase()];
  if (mapped) return [mapped];
  const haystack = `${t} ${headline || ''}`;
  for (const [pattern, topic] of KEYWORD_FALLBACKS) {
    if (pattern.test(haystack)) return [topic];
  }
  return ['Government Operations and Politics'];
}
