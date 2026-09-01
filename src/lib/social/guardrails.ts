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

/**
 * True if the text carries partisan/directive phrasing. Exposed for the
 * reposter: we only amplify content from trusted sources that reads neutral,
 * so a trusted account's occasional pointed post is never reposted under our
 * brand. This is the nonpartisan check alone — not the full draft guardrails
 * (which also gate length, em dashes, coverage), none of which should apply to
 * someone else's post we're merely resharing.
 */
export function isPartisan(text: string): boolean {
  return PARTISAN_PATTERNS.some((re) => re.test(text));
}

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

// Writer meta/refusal output. The writer sometimes answers with an internal
// note ("SKIP, INPUT MISMATCH: ...") instead of a post; that text must never
// publish. The writer now returns a structured skip, this is the backstop.
const META_OUTPUT_PATTERNS: Array<{ re: RegExp; reason: string }> = [
  { re: /^\s*skip\b/i, reason: 'starts with a SKIP directive' },
  { re: /\binput mismatch\b/i, reason: 'writer mismatch note' },
  { re: /\bflagged for human review\b/i, reason: 'review-hold note' },
  // NOTE: "guardrails" alone is legit civic vocabulary (AI policy posts) — only
  // block pipeline-specific internals.
  { re: /\b(brand brain|writer stage|social desk|requeue)\b/i, reason: 'references pipeline internals' },
  { re: /\b(cannot|can't) (write|post|draft)\b/i, reason: 'refusal phrasing' },
  { re: /\bas an ai\b/i, reason: 'assistant self-reference' },
  { re: /\bwe do not post\b/i, reason: 'policy note, not a post' },
  { re: /\bdoes(n't| not) meet the (factual|sourcing|editorial) standard\b/i, reason: 'editorial-standard note' },
];

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

// --- Named contact targets -------------------------------------------------
// The app connects people to THEIR OWN elected officials, so a post may only
// name a specific person as a contact target if that person is a covered
// legislator. "Put it in Pete Buttigieg's inbox via mydemocracy.app" is a
// promise the product cannot keep (2026-08-12 incident) — block it.
import { getAllFederalLegislators } from '@/lib/legislators';
import { getStateLegislators } from '@/lib/state-legislators';
import { US_STATES } from '@/lib/constants';

let coveredNamesCache: { full: string[]; last: Set<string> } | null = null;
function coveredOfficialNames(): { full: string[]; last: Set<string> } {
  if (coveredNamesCache) return coveredNamesCache;
  const full: string[] = [];
  const last = new Set<string>();
  const add = (name: string) => {
    const n = name.toLowerCase();
    full.push(n);
    const parts = n.replace(/,.*$/, '').split(/\s+/);
    if (parts.length) last.add(parts[parts.length - 1]);
  };
  try {
    for (const l of getAllFederalLegislators()) add(l.name);
    for (const st of US_STATES) {
      try {
        for (const l of getStateLegislators(st.code)) add(l.name);
      } catch { /* missing state file */ }
    }
  } catch { /* data unavailable: check degrades to pass-through below */ }
  coveredNamesCache = { full, last };
  return coveredNamesCache;
}

const CONTACT_CONTEXT = /(message|email|write(?:\s+to)?|contact|tell|reach|inbox(?:es)?\s+of)\s+((?:[A-Z][a-z]+[’']?s?\s*){1,3})|((?:[A-Z][a-z]+[’']?s?\s*){1,3})(?:'s|’s)\s+(?:inbox|office|desk)/g;
const NAME_STOPWORDS = new Set(['My', 'Democracy', 'Your', 'The', 'Their', 'Congress', 'Senate', 'House', 'Washington', 'America', 'Us', 'United', 'States']);

/** Names used as contact targets that aren't covered legislators. */
export function uncoveredContactTargets(text: string): string[] {
  const covered = coveredOfficialNames();
  if (covered.full.length === 0) return [];
  const bad: string[] = [];
  for (const m of text.matchAll(CONTACT_CONTEXT)) {
    const raw = (m[2] || m[3] || '').replace(/[’']s/g, '').trim();
    if (!raw) continue;
    const words = raw.split(/\s+/).filter((w) => /^[A-Z][a-z]+$/.test(w) && !NAME_STOPWORDS.has(w));
    if (words.length === 0) continue;
    const candidate = words.join(' ').toLowerCase();
    // Generic references are fine ("tell your Representative").
    if (/^(senator|senators|representative|representatives|rep|reps|lawmakers?|officials?|legislators?)$/.test(candidate)) continue;
    // Full-name containment, or a last-name hit ("Chuck Schumer" vs the
    // dataset's "Charles E. Schumer") — posts use nicknames constantly.
    const lastWord = words[words.length - 1].toLowerCase();
    const matched = covered.full.some((n) => n.includes(candidate) || candidate.includes(n)) || covered.last.has(lastWord);
    if (!matched) bad.push(words.join(' '));
  }
  return [...new Set(bad)];
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
  /** Escalate the accuracy-traceability check from warn to block (news lane). */
  strictAccuracy?: boolean;
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

  // 1b. Named contact targets (block): never promise the app can reach a
  //     specific person unless they're a covered legislator.
  const badTargets = uncoveredContactTargets(text);
  checks.push({
    name: 'named_contact_target',
    passed: badTargets.length === 0,
    severity: 'block',
    reason: badTargets.length ? `directs contact to non-covered figure: ${badTargets.join(', ')}` : undefined,
  });

  // 2. Meta output (block): internal writer notes are never publishable copy.
  const metaHit = META_OUTPUT_PATTERNS.find((p) => p.re.test(text));
  checks.push({
    name: 'no_meta_output',
    passed: !metaHit,
    severity: 'block',
    reason: metaHit ? `writer meta/refusal text: ${metaHit.reason}` : undefined,
  });

  // 3. No em dashes (block) — hard brand rule; pipeline de-dashes first, so a
  //    hit here means something slipped through.
  const hasEmDash = /[—–]/.test(text);
  checks.push({
    name: 'no_em_dash',
    passed: !hasEmDash,
    severity: 'block',
    reason: hasEmDash ? 'contains an em/en dash' : undefined,
  });

  // 4. Voice tells (warn)
  const voiceHit = VOICE_TELLS.find((v) => v.re.test(text));
  checks.push({
    name: 'voice_tells',
    passed: !voiceHit,
    severity: 'warn',
    reason: voiceHit?.reason,
  });

  // 5. Accuracy: any bill number in the post must appear in the source (warn —
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
    checks.push({
      name: 'accuracy_traceable',
      passed: !problem,
      severity: input.strictAccuracy ? 'block' : 'warn',
      reason: problem,
    });
  }

  // 6. Coverage-match (block): a local-action CTA needs a covered state.
  if (input.localAction || LOCAL_ACTION_CUES.test(text)) {
    const covered = input.targetState ? LOCAL_COVERAGE.has(input.targetState.toUpperCase()) : false;
    checks.push({
      name: 'coverage_match',
      passed: covered,
      severity: 'block',
      reason: covered ? undefined : `local action but state ${input.targetState ?? '(none)'} not in coverage`,
    });
  }

  // 7. Length (block)
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

// The "someone should do something (about this/that)" meme: on Bluesky this
// phrasing is overwhelmingly sarcasm about a quoted post, image, or vibe the
// account can't see. The lane query was removed 2026-08-25 and the model is
// instructed to skip invisible referents — and it still recurred (08-28,
// after a rollback deploy re-ran the old code). Model judgment is not a
// reliable sole defense against this meme, so it is now a DETERMINISTIC skip:
// the phrase with a bare deictic referent (or none) can never be replied to.
// A post that names an actual topic after the phrase ("someone should do
// something about insulin prices") still passes to the model's judgment.
const DEICTIC_MEME_RE =
  /\bsomeone (really |seriously )?(should|needs? to|ought to|has to|had better) do something\b(?!,? about (?!(this|that|it)\b)\w)/i;

export function replyShouldSkip(targetText: string): { skip: boolean; reason?: string } {
  if (DEICTIC_MEME_RE.test(targetText)) {
    return { skip: true, reason: 'deictic "someone should do something" meme — referent invisible, near-certain sarcasm' };
  }
  const hit = REPLY_SKIP_PATTERNS.find((p) => p.re.test(targetText));
  return hit ? { skip: true, reason: hit.reason } : { skip: false };
}

/**
 * Catchphrase-reuse check: the 2026-09-01 audit found the reply writer had
 * quietly built a template farm ("you can be the someone" ×25, "if this is
 * you" ×15, "less effort than the post" ×21 live) — each reply passed the
 * near-dup Jaccard check because only the QUIP repeats, not the whole body.
 * This blocks the THIRD use of any distinctive 4-gram within the recent
 * window: one echo is coincidence, two is a template forming.
 */
export function sharesCatchphrase(text: string, recent: string[]): { shared: boolean; phrase?: string } {
  const grams = (s: string) => {
    const toks = normalize(s.replace(/https?:\/\/\S+/g, ' ')).split(' ').filter(Boolean);
    const out = new Set<string>();
    for (let i = 0; i + 4 <= toks.length; i++) out.add(toks.slice(i, i + 4).join(' '));
    return out;
  };
  const mine = grams(text);
  if (mine.size === 0) return { shared: false };
  const counts = new Map<string, number>();
  for (const r of recent) {
    for (const g of grams(r)) {
      if (mine.has(g)) counts.set(g, (counts.get(g) ?? 0) + 1);
    }
  }
  for (const [g, n] of counts) if (n >= 2) return { shared: true, phrase: g };
  return { shared: false };
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
