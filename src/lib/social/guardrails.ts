/**
 * Guardrail gate. Deterministic, pure checks that every draft post/reply must
 * clear before it can be queued. This is the code enforcement of the brand
 * brain's four non-negotiables plus the hard operational guardrails — it is
 * NOT a substitute for the Writer following the brand brain, it's the backstop.
 *
 * A check has severity 'block' (fails the gate) or 'warn' (recorded, doesn't
 * block). The full report is stored on the post row for audit.
 */

export type Severity = 'block' | 'warn';

export interface GateCheck {
  name: string;
  passed: boolean;
  severity: Severity;
  reason?: string;
}

export interface GateReport {
  passed: boolean;
  checks: GateCheck[];
}

// States where local officials are loaded, so a local-action CTA can be
// delivered. Federal + state are covered everywhere. Keep in sync with the
// brand brain's coverage-match rule.
export const LOCAL_COVERAGE = new Set(['DE', 'RI', 'NV', 'CA']);

// Partisan tells: telling people how to vote, or praising/attacking a party or
// figure. The account never does this — neutrality is "act, whatever side."
const PARTISAN_PATTERNS: RegExp[] = [
  /\bvote (for|against|yes|no|to (pass|kill|block))\b/i,
  /\b(support|oppose|reject|kill|pass) (this|the) bill\b/i,
  /\b(republicans?|democrats?|gop|maga|the left|the right|liberals?|conservatives?)\s+(are|want|keep|always|never|need to|should)\b/i,
  /\b(vote them out|throw them out|the other side)\b/i,
  /\byou should (support|oppose|back|reject)\b/i,
];

// AI/voice tells the brand brain bans outright.
const VOICE_TELLS: Array<{ re: RegExp; reason: string }> = [
  { re: /\byou (clearly|obviously) (feel|care)\b/i, reason: 'narrates the reader\'s emotions' },
  { re: /\bsounds like you(?:'re| are)\b/i, reason: 'narrates the reader\'s emotions' },
  { re: /\bit'?s not [^.,]{1,40}?,?\s*it'?s\b/i, reason: '"it\'s not X, it\'s Y" seesaw' },
  { re: /\bdon'?t just (post|tweet|vent|watch)\b/i, reason: 'scold construction' },
];

// Local-action cues: if a post pushes a LOCAL action, we can only deliver it
// in covered states.
const LOCAL_ACTION_CUES = /\b(city council|town council|mayor|your (city|town)|local officials?|school board|county (board|commission))\b/i;

function normalize(s: string): string {
  return s
    .toLowerCase()
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[^a-z0-9\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Bill references in a body, e.g. "H.R. 139", "S. 4825", "HR139". */
function billRefs(s: string): string[] {
  const out = new Set<string>();
  const re = /\b(h\.?\s?r\.?|s\.?)\s?(\d{1,5})\b/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) {
    const chamber = m[1].replace(/[.\s]/g, '').toLowerCase();
    out.add(`${chamber}${m[2]}`);
  }
  return [...out];
}

export interface GuardrailInput {
  text: string;
  /** The source signal text the claim must trace to (accuracy check). */
  sourceText?: string;
  /** 2-letter state this action targets, if any. */
  targetState?: string;
  /** Whether the post/CTA points at a local-level action. */
  localAction?: boolean;
  /** Hard length limit for the platform (graphemes). */
  maxLength?: number;
  graphemeLength?: (s: string) => number;
}

export function runGuardrails(input: GuardrailInput): GateReport {
  const checks: GateCheck[] = [];
  const { text } = input;

  // 1. Nonpartisan (block)
  const partisanHit = PARTISAN_PATTERNS.find((re) => re.test(text));
  checks.push({
    name: 'nonpartisan',
    passed: !partisanHit,
    severity: 'block',
    reason: partisanHit ? `partisan/directive phrasing: ${partisanHit}` : undefined,
  });

  // 2. No em dashes (block) — hard brand rule; pipeline de-dashes first, so a
  //    hit here means something slipped through.
  const hasEmDash = /[—–]/.test(text);
  checks.push({
    name: 'no_em_dash',
    passed: !hasEmDash,
    severity: 'block',
    reason: hasEmDash ? 'contains an em/en dash' : undefined,
  });

  // 3. Voice tells (warn)
  const voiceHit = VOICE_TELLS.find((v) => v.re.test(text));
  checks.push({
    name: 'voice_tells',
    passed: !voiceHit,
    severity: 'warn',
    reason: voiceHit?.reason,
  });

  // 4. Accuracy: any bill number in the post must appear in the source (warn —
  //    heuristic can miss paraphrase, so it flags for review rather than blocks).
  if (input.sourceText) {
    const src = normalize(input.sourceText);
    const srcBills = new Set(billRefs(input.sourceText));
    const postBills = billRefs(text);
    const unsourcedBill = postBills.find((b) => !srcBills.has(b));
    // crude number check: 4+ digit figures or $-amounts not present in source
    const postNums = (text.match(/\$?\d[\d,]{2,}/g) || []).map((n) => n.replace(/[^0-9]/g, ''));
    const unsourcedNum = postNums.find((n) => !src.replace(/[^0-9]/g, ' ').includes(n));
    const problem = unsourcedBill
      ? `bill ${unsourcedBill} not in source`
      : unsourcedNum
        ? `figure ${unsourcedNum} not in source`
        : undefined;
    checks.push({ name: 'accuracy_traceable', passed: !problem, severity: 'warn', reason: problem });
  }

  // 5. Coverage-match (block): a local-action CTA needs a covered state.
  if (input.localAction || LOCAL_ACTION_CUES.test(text)) {
    const covered = input.targetState ? LOCAL_COVERAGE.has(input.targetState.toUpperCase()) : false;
    checks.push({
      name: 'coverage_match',
      passed: covered,
      severity: 'block',
      reason: covered ? undefined : `local action but state ${input.targetState ?? '(none)'} not in coverage`,
    });
  }

  // 6. Length (block)
  if (input.maxLength) {
    const len = (input.graphemeLength ?? ((s: string) => [...s].length))(text);
    checks.push({
      name: 'length',
      passed: len <= input.maxLength,
      severity: 'block',
      reason: len <= input.maxLength ? undefined : `${len} > ${input.maxLength}`,
    });
  }

  const passed = checks.every((c) => c.passed || c.severity !== 'block');
  return { passed, checks };
}

// Skip discipline for REPLIES: never reply into grief pile-ups on tragedies or
// pure rage-bait. "When in doubt, sit it out."
const REPLY_SKIP_PATTERNS: Array<{ re: RegExp; reason: string }> = [
  { re: /\b(died|dead|killed|death|passed away|rip|shooting|shooter|massacre|murdered?|suicide|funeral)\b/i, reason: 'grief/tragedy' },
  { re: /\b(should be (arrested|jailed|executed|shot|hanged)|throw them in jail|lock (him|her|them) up)\b/i, reason: 'rage-bait' },
  { re: /\b(f[u*]ck|c[u*]nt|retard|sl[u*]t)\b/i, reason: 'abusive language' },
];

export function replyShouldSkip(targetText: string): { skip: boolean; reason?: string } {
  const hit = REPLY_SKIP_PATTERNS.find((p) => p.re.test(targetText));
  return hit ? { skip: true, reason: hit.reason } : { skip: false };
}

/** Token-Jaccard near-duplicate check against recently posted bodies. */
export function isNearDuplicate(text: string, recent: string[], threshold = 0.8): boolean {
  const toks = (s: string) => new Set(normalize(s).split(' ').filter(Boolean));
  const a = toks(text);
  if (a.size === 0) return false;
  for (const r of recent) {
    const b = toks(r);
    if (b.size === 0) continue;
    let inter = 0;
    for (const t of a) if (b.has(t)) inter++;
    const jaccard = inter / (a.size + b.size - inter);
    if (jaccard >= threshold) return true;
  }
  return false;
}
