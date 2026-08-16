/**
 * Best-practice quality gate for constituent messages.
 *
 * The standard (Congressional Management Foundation guidance + congressional
 * staff surveys): identify as a constituent, ONE issue per message, a
 * specific ask, personal experience over form-letter talking points, roughly
 * 150-300 words, respectful tone (no threats — staffers discount vote-threat
 * messages), and nothing fabricated.
 *
 * Structure (greeting, constituent identification, signature, single ask) is
 * guaranteed by the envelope; this module checks the parts that vary — AI
 * drafts before they reach the user, and user-edited text before send.
 *
 * BLOCK = never send (directed threats, AI leakage, placeholders).
 * WARN = show the user, let them decide — it's their message.
 */

export interface QualityIssue {
  level: 'block' | 'warn';
  code: string;
  detail: string;
}

// Narrow on purpose: "gun violence kills people" is policy speech, not a
// threat. Only second-person-directed harm blocks.
const THREAT_PATTERNS = [
  /\b(?:kill|shoot|hurt|hang|beat|destroy)\s+(?:you|your family)\b/i,
  /\byou(?:'ll| will)\s+(?:regret|pay|suffer)\b/i,
  /\bwatch your back\b/i,
];

const AI_LEAK_PATTERNS = [
  /\bas an ai\b/i,
  /\blanguage model\b/i,
  /\bi cannot (?:help|assist|write|generate)\b/i,
  /\bi'?m (?:sorry|unable to)(?:,| )\s*(?:but\s+)?i can(?:'|no)t\b/i,
];

const PLACEHOLDER_PATTERN = /\[(?:CITY|STATE|NAME|BILL|X+|insert[^\]]*|your[^\]]*)\]/i;

const PROFANITY = /\b(?:fuck\w*|(?:bull|horse|dog)?shit\w*|bastard|asshole|bitch|goddamn)\b/i;

const VOTE_THREAT = /\b(?:or (?:you(?:'ll| will)? )?lose my vote|i(?:'ll| will) vote you out|remember (?:this )?(?:at|come) (?:the )?election|primary you)\b/i;

const UNSOURCED_RESEARCH = /\b(?:studies|research|data|experts?) (?:show|shows|proves?|says?|agree|back)\b/i;

const ASK_SIGNAL = /\b(?:ask|urge|please|support|oppose|vote|cosponsor|request|need you to|call on you|count on you|hope you)\b/i;

export function auditMessageQuality(
  text: string,
  opts: { source: 'ai' | 'user' } = { source: 'user' }
): QualityIssue[] {
  const t = (text || '').trim();
  if (!t) return [{ level: 'block', code: 'empty', detail: 'The message is empty.' }];
  const issues: QualityIssue[] = [];

  for (const p of THREAT_PATTERNS) {
    if (p.test(t)) {
      issues.push({ level: 'block', code: 'threat', detail: 'The message contains language that reads as a threat. Officials’ offices forward these to security — rewrite it as what you want them to DO.' });
      break;
    }
  }
  for (const p of AI_LEAK_PATTERNS) {
    if (p.test(t)) {
      issues.push({ level: 'block', code: 'ai_leak', detail: 'The draft contains AI-assistant language that must never reach an office.' });
      break;
    }
  }
  if (PLACEHOLDER_PATTERN.test(t)) {
    issues.push({ level: 'block', code: 'placeholder', detail: 'The message still contains unfilled placeholder text.' });
  }

  if (PROFANITY.test(t)) {
    issues.push({ level: 'warn', code: 'profanity', detail: 'Profanity gets messages discarded unread. Consider rewording — anger lands harder in plain language.' });
  }
  if (VOTE_THREAT.test(t)) {
    issues.push({ level: 'warn', code: 'vote_threat', detail: 'Staffers discount "or lose my vote" messages. Your story and a clear ask carry more weight.' });
  }

  const words = t.split(/\s+/).length;
  if (words < 50) {
    issues.push({ level: 'warn', code: 'too_short', detail: 'Very short messages read as drive-by clicks. A few sentences about why this matters to you makes it count.' });
  } else if (words > 400) {
    issues.push({ level: 'warn', code: 'too_long', detail: 'Past ~300 words, staffers skim. Tightening this will get it read.' });
  }

  const letters = t.replace(/[^a-zA-Z]/g, '');
  const capsRun = /\b[A-Z]{4,}(?:\s+[A-Z]{2,}){1,}\b/.test(t);
  const capsRatio = letters.length > 40 ? (t.replace(/[^A-Z]/g, '').length / letters.length) : 0;
  if (capsRun || capsRatio > 0.3) {
    issues.push({ level: 'warn', code: 'all_caps', detail: 'ALL-CAPS passages read as shouting and hurt credibility.' });
  }
  if ((t.match(/!/g) || []).length > 3) {
    issues.push({ level: 'warn', code: 'exclamations', detail: 'Multiple exclamation points weaken the message’s seriousness.' });
  }

  // AI drafts must not invent authority; a user citing research is their call.
  if (opts.source === 'ai' && UNSOURCED_RESEARCH.test(t) && !/https?:\/\//i.test(t)) {
    issues.push({ level: 'warn', code: 'unsourced_claim', detail: 'Draft leans on unnamed "studies" or "research" — argue from experience instead.' });
  }

  if (!ASK_SIGNAL.test(t.slice(-400))) {
    issues.push({ level: 'warn', code: 'no_ask', detail: 'The message never clearly asks for anything. Staffers tally specific asks.' });
  }

  return issues;
}

export function hasBlockingIssue(issues: QualityIssue[]): boolean {
  return issues.some((i) => i.level === 'block');
}
