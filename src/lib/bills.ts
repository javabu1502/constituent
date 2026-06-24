/**
 * Pure bill-reference parsing — no server dependencies, safe to import in
 * client components. The data-fetching helpers live in @/lib/bill-detection,
 * which re-exports detectBillReferences from here to keep a single source of truth.
 */

export interface BillReference {
  raw: string;
  level: 'federal' | 'state';
  type: string;
  number: string;
}

// Federal bill prefixes → Congress.gov type codes
const FEDERAL_TYPE_MAP: Record<string, string> = {
  'H.R.': 'hr',
  'S.': 's',
  'H.Res.': 'hres',
  'S.Res.': 'sres',
  'H.J.Res.': 'hjres',
  'S.J.Res.': 'sjres',
  'H.Con.Res.': 'hconres',
  'S.Con.Res.': 'sconres',
};

// Build federal regex: match prefixes followed by optional space and digits.
// Sort by length descending so longer prefixes match first (e.g. "H.J.Res." before "H.R.").
const federalPrefixes = Object.keys(FEDERAL_TYPE_MAP).sort((a, b) => b.length - a.length);
const federalPattern = new RegExp(
  `(${federalPrefixes.map(p => p.replace(/\./g, '\\.')).join('|')})\\s*(\\d+)`,
  'gi'
);

// State bill pattern
const statePattern = /\b(HB|SB|AB|HF|SF|HJR|SJR|HR|SR|SCR|HCR)\s*(\d+)\b/gi;

export function detectBillReferences(text: string): BillReference[] {
  const refs: BillReference[] = [];
  const seen = new Set<string>();

  // Federal
  let match: RegExpExecArray | null;
  federalPattern.lastIndex = 0;
  while ((match = federalPattern.exec(text)) !== null) {
    const prefix = match[1];
    const num = match[2];
    // Normalize prefix to canonical form
    const canonical = federalPrefixes.find(p => p.toLowerCase() === prefix.toLowerCase()) || prefix;
    const key = `federal-${canonical}-${num}`;
    if (!seen.has(key)) {
      seen.add(key);
      refs.push({
        raw: `${canonical} ${num}`,
        level: 'federal',
        type: FEDERAL_TYPE_MAP[canonical] || 'hr',
        number: num,
      });
    }
  }

  // State
  statePattern.lastIndex = 0;
  while ((match = statePattern.exec(text)) !== null) {
    const prefix = match[1].toUpperCase();
    const num = match[2];
    const key = `state-${prefix}-${num}`;
    if (!seen.has(key)) {
      seen.add(key);
      refs.push({
        raw: `${prefix} ${num}`,
        level: 'state',
        type: prefix,
        number: num,
      });
    }
  }

  return refs;
}
