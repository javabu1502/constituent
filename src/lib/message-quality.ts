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

const PLACEHOLDER_PATTERN = /\[(?:CITY|STATE|NAME|BILL|X+|insert[^\]]*|your[^\]]*|Add [^\]]+)\]|\[[^\]]{25,}\]/i;

const PROFANITY = /\b(?:fuck\w*|(?:bull|horse|dog)?shit\w*|bastard|asshole|bitch|goddamn)\b/i;

const VOTE_THREAT = /\b(?:or (?:you(?:'ll| will)? )?lose my vote|i(?:'ll| will) vote you out|remember (?:this )?(?:at|come) (?:the )?election|primary you)\b/i;

const UNSOURCED_RESEARCH = /\b(?:studies|research|data|experts?) (?:show|shows|proves?|says?|agree|back)\b/i;

// A number plus an authority attribution, invented by the model: "an average\n// of 17 veterans a day... that number comes from the VA itself".
const INVENTED_STAT = /\b\d[\d,]*(?:\.\d+)?\s*(?:percent|%|(?:americans|people|veterans|children|families|deaths|seniors)\s+(?:a|per|every)\s+(?:day|year|week))\b/i;
const STAT_ATTRIBUTION = /\bthat (?:number|figure) comes from\b|\baccording to (?:the|a)\b/i;

// The shapes that mark a draft as machine-written even when every word is
// plain: "this is not abstract", "not X, it is Y", and the dash used as a
// hinge. Checked on the raw draft before deDash (which turns a dash into a
// comma splice, a second tell).
const AI_CADENCE = /\bthis is not (?:an? )?abstract\b|\b(?:is|are|was) not (?:a |an |just |simply |only )?[^.,;:]{1,30}, (?:it is|it's|they are|they're|this is)\b|[\u2014\u2013]|\bnot (?:asking for|looking for) a handout\b|\bevery single day\b/i;

/** Returns the AI-cadence tells in `text` (empty when clean). */
export function detectAiCadence(text: string): string[] {
  const out: string[] = [];
  const re = new RegExp(AI_CADENCE.source, 'gi');
  for (const m of (text || '').match(re) || []) out.push(m === '\u2014' || m === '\u2013' ? 'dash' : m.trim());
  return out;
}

/** Prose that is a refusal or a note to the operator, not a draft. */
export function looksLikeRefusal(text: string): boolean {
  return /\bi need to (?:pause|stop|flag|point out)\b|\bi can(?:'t|not) (?:draft|write|do) (?:this|that)\b|\bi(?:'m| am) not (?:able|comfortable|going) to\b|\bbefore i (?:draft|write)\b/i.test(text || '');
}

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
  if (opts.source === 'ai' && detectAiCadence(t).length > 0) {
    issues.push({ level: 'warn', code: 'ai_cadence', detail: 'Draft uses machine-writing shapes ("this is not abstract", "not X, it is Y").' });
  }
  if (opts.source === 'ai' && INVENTED_STAT.test(t) && STAT_ATTRIBUTION.test(t)) {
    issues.push({ level: 'block', code: 'invented_stat', detail: 'Draft asserts a specific statistic with an attribution the constituent never provided.' });
  }

  if (!ASK_SIGNAL.test(t.slice(-400))) {
    issues.push({ level: 'warn', code: 'no_ask', detail: 'The message never clearly asks for anything. Staffers tally specific asks.' });
  }

  return issues;
}

export function hasBlockingIssue(issues: QualityIssue[]): boolean {
  return issues.some((i) => i.level === 'block');
}

/**
 * Identity fabrication check: an AI draft must never claim the constituent
 * IS someone — a veteran, a parent, a nurse — unless the constituent's own
 * words support it. "Support VA healthcare" as an issue does not make the
 * sender a veteran; a draft that says "I served this country" for someone
 * who didn't is the single worst thing this system can produce.
 *
 * Each entry pairs the claim pattern (tested against the DRAFT) with a
 * support pattern (tested against the USER's own text). Claim without
 * support = fabrication.
 */
const IDENTITY_CLAIMS: { label: string; claim: RegExp; support: RegExp }[] = [
  {
    label: 'veteran / military service',
    claim: /\bi(?:'m| am) (?:a |an )?(?:proud |disabled )?veteran\b|\bi served\b(?! time)|\bwhen (?:the country|america) needed (?:us|me)\b|\bmy (?:deployment|unit|time in uniform|service to this country)\b|\bwe (?:wore|earned) the uniform\b|\bwhen we come home\b/i,
    support: /(?:\bi\b|\bmy\b|\bwe\b)[^.!?\n]{0,40}\b(?:veteran|served?|military|army|navy|air force|marines?|coast guard|deploy\w*|enlist\w*|uniform)\b|\bas a veteran\b/i,
  },
  {
    label: 'parent',
    claim: /\bmy (?:kids?|children|son|daughter|baby)\b|\bas a (?:mom|dad|mother|father|parent)\b|\bi(?:'m| am) (?:a |an )?(?:single )?(?:mom|dad|mother|father|parent)\b/i,
    support: /(?:\bmy\b|\bour\b)[^.!?\n]{0,25}\b(?:kids?|children|son|daughter|baby|famil\w*)\b|\b(?:i|we) (?:have|raise|am raising|are raising)[^.!?\n]{0,20}\b(?:kids?|children|a son|a daughter|a baby|(?:one|two|three|four|five|\d+) (?:kids?|children|boys?|girls?))\b|\bi(?:'m| am)[^.!?\n]{0,15}\b(?:pregnant|a (?:mom|dad|mother|father|parent))\b|\bas a (?:mom|dad|mother|father|parent)|\b(?:mi|nuestr[oa])s?[^.!?\n]{0,20}\b(?:hij[oa]s?|niñ[oa]s?|bebé|familia)\b/i,
  },
  {
    label: 'teacher',
    claim: /\bi(?:'m| am) a (?:school ?)?teacher\b|\bmy (?:students|classroom)\b|\bi teach\b/i,
    support: /(?:\bi\b|\bmy\b)[^.!?\n]{0,30}\b(?:teach\w*|classroom|students)\b|\bas a teacher\b/i,
  },
  {
    label: 'healthcare worker',
    claim: /\bi(?:'m| am) a (?:nurse|doctor|physician|paramedic|caregiver)\b|\bmy patients\b/i,
    support: /(?:\bi\b|\bmy\b)[^.!?\n]{0,30}\b(?:nurse|doctor|physician|paramedic|caregiver|patients)\b/i,
  },
  {
    label: 'business owner',
    claim: /\bi (?:own|run|operate) (?:a|my) (?:small )?(?:business|shop|store|restaurant|farm|bakery|cafe|salon|bar|garage|company)\b|\bmy (?:employees|business|storefront|bakery|cafe|salon)\b/i,
    support: /(?:\bi\b|\bmy\b)[^.!?\n]{0,30}\b(?:business|shop|store|restaurant|bakery|cafe|salon|employees|self.?employed|own\w*)\b/i,
  },
  {
    label: 'farmer / rancher',
    claim: /\bi(?:'m| am) a (?:farmer|rancher|grower)\b|\bmy (?:farm|ranch|crops|herd|acres)\b/i,
    support: /(?:\bi\b|\bmy\b)[^.!?\n]{0,30}\b(?:farm\w*|ranch\w*|crops|cattle|herd|acres)\b/i,
  },
  {
    label: 'immigrant',
    claim: /\bi(?:'m| am) an immigrant\b|\bwhen i (?:came|moved|immigrated) to (?:this country|america|the us)\b|\bi became a citizen\b/i,
    support: /(?:\bi\b|\bmy\b|\bwe\b)[^.!?\n]{0,40}\b(?:immigra\w*|refugee|visa|green card|naturaliz\w*|citizen\w*)\b|\bi came to (?:this country|america)\b/i,
  },
  {
    label: 'disability',
    claim: /\bi(?:'m| am) disabled\b|\bi use a wheelchair\b|\bi(?:'m| am) in a wheelchair\b|\bmy (?:disability|wheelchair|chronic (?:illness|condition))\b|\bi live with a disability\b/i,
    support: /(?:\bi\b|\bmy\b)[^.!?\n]{0,30}\b(?:disab\w*|wheelchair|chronic)\b/i,
  },
  {
    label: 'senior / retiree',
    claim: /\bi(?:'m| am) (?:a senior|retired|an? (?:older|elderly))\b|\bmy retirement\b|\bon a fixed income\b/i,
    support: /(?:\bi\b|\bmy\b)[^.!?\n]{0,30}\b(?:retir\w*|senior|fixed income)\b|\bi(?:'m| am) \d{2}\b/i,
  },
  {
    label: 'patient / chronic illness',
    claim: /\bi(?:'m| am) (?:a )?diabetic\b|\bi have (?:type [12] (?:or type [12] )?)?diabetes\b|\bmy (?:insulin|diagnosis|chemo\w*|prescriptions?)\b|\bi was diagnosed\b|\bi(?:'m| am) (?:a cancer survivor|in remission)\b|\bmedication (?:that keeps|keeping) me alive\b/i,
    support: /(?:\bi\b|\bmy\b)[^.!?\n]{0,40}\b(?:diabet\w*|insulin|diagnos\w*|cancer|chemo\w*|chronic|condition|prescri\w*|medication|patient|remission|covid)|\bmi[^.!?\n]{0,20}\b(?:salud|enfermedad|medicina|diabetes)\b/i,
  },
  {
    label: 'bereaved / lost a loved one',
    claim: /\bi (?:lost|buried) my (?:son|daughter|child|kids?|husband|wife|brother|sister|mother|father|mom|dad|nephew|niece|grand\w+)\b|\bmy (?:son|daughter|child|husband|wife|brother|sister|nephew|niece|grand\w+)[^.!?\n]{0,30}\b(?:died|passed away|was killed|overdosed|took (?:his|her|their) (?:own )?life)\b/i,
    support: /(?:\bi\b|\bmy\b|\bwe\b|\bour\b)[^.!?\n]{0,40}\b(?:died|death|passed away|killed|overdos\w*|suicide|funeral|buried|lost (?:him|her|them|my|our))\b/i,
  },
  {
    label: 'crime victim',
    claim: /\bi was (?:robbed|assaulted|attacked|mugged|raped|shot|carjacked)\b|\bmy (?:house|home|car|apartment) was (?:broken into|robbed|burglarized|stolen)\b|\bas a (?:crime victim|survivor of (?:violence|assault|abuse))\b/i,
    support: /(?:\bi\b|\bmy\b|\bwe\b)[^.!?\n]{0,40}\b(?:robbed|assault\w*|attack\w*|mugg\w*|rape\w*|shot|stolen|burglar\w*|carjack\w*|victim|broken? into)\b/i,
  },
  {
    label: 'religious identity',
    claim: /\bmy (?:faith|church|congregation|synagogue|mosque|temple|pastor|parish)\b|\bas a (?:christian|catholic|jew|muslim|person of faith|believer)\b|\bi(?:'m| am) (?:a )?(?:christian|catholic|jewish|muslim|religious|a believer)\b/i,
    support: /(?:\bi\b|\bmy\b|\bour\b|\bwe\b)[^.!?\n]{0,40}\b(?:faith|church|christian|catholic|jewish|muslim|synagogue|mosque|temple|congregation|worship|pray\w*|religio\w*)\b/i,
  },
  {
    label: 'union member',
    claim: /\bmy (?:union|local|pension)\b|\bi(?:'m| am) a (?:proud )?union (?:member|worker)\b|\bi carry a union card\b|\bmy union brothers and sisters\b/i,
    support: /(?:\bi\b|\bmy\b|\bour\b|\bwe\b)[^.!?\n]{0,40}\b(?:union\w*|local \d+|organiz\w*|picket\w*|pension|steward)\b/i,
  },
  {
    label: 'renter / homeowner',
    claim: /\bmy (?:landlord|lease|mortgage|property tax(?:es)?|hoa)\b|\bmy rent (?:went up|jumped|doubled|increase)\b|\bi(?:'m| am) a (?:renter|tenant|homeowner)\b|\bi (?:own|rent) (?:my|an?) (?:apartment|home|house|place)\b/i,
    support: /(?:\bi\b|\bmy\b|\bour\b)[^.!?\n]{0,40}\b(?:rent\w*|lease|landlord|tenant|mortgage|homeowner|property tax\w*|evict\w*)|\b(?:mi|nuestra)[^.!?\n]{0,20}\b(?:renta|alquiler|casero|casa|apartamento)\b/i,
  },
  {
    label: 'student loan borrower',
    claim: /\bmy student (?:loans?|debt)\b|\bi(?:'m| am) (?:still )?paying (?:off|back) (?:my )?student loans?\b|\bmy monthly loan payments?\b/i,
    support: /(?:\bi\b|\bmy\b|\bour\b)[^.!?\n]{0,40}\b(?:student loans?|student debt|borrow\w*|tuition|college debt)\b/i,
  },
  {
    label: 'LGBTQ identity',
    claim: /\bi(?:'m| am) (?:gay|lesbian|bisexual|transgender|trans|queer|nonbinary|non-binary)\b|\bas a (?:gay|lesbian|bisexual|transgender|trans|queer|nonbinary|non-binary) (?:person|man|woman|american)\b|\bmy (?:transition|coming out)\b/i,
    support: /(?:\bi\b|\bmy\b|\bwe\b)[^.!?\n]{0,40}\b(?:gay|lesbian|bisexual|trans\w*|queer|nonbinary|non-binary|lgbtq\w*|coming out|transition\w*)\b/i,
  },
  {
    label: 'personal connection / anecdote',
    claim: /\bpeople i know\b|\bsomeone i (?:know|love)\b|\bmy (?:friends?|neighbors?|coworkers?)\b[^.!?\n]{0,40}\b(?:died|lost|struggl\w*|can(?:'|no)t afford|was)\b|\bhappened to (?:me|us|my family)\b|\bmy (?:heat|power|water|electricity) was (?:shut|cut|turned) off\b/i,
    support: /(?:\bi\b|\bmy\b|\bwe\b)[^.!?\n]{0,50}\b(?:friends?|neighbors?|coworkers?|know|someone|happened|shut ?off|cut ?off)\b/i,
  },
  {
    label: 'formerly incarcerated',
    claim: /\bi (?:was|got) (?:incarcerated|locked up|convicted)\b|\bwhen i was (?:in prison|inside|incarcerated)\b|\bas a felon\b|\bmy (?:conviction|parole|probation)\b|\bi served time\b/i,
    support: /(?:\bi\b|\bmy\b)[^.!?\n]{0,40}\b(?:incarcerat\w*|prison|felon\w*|convict\w*|parole|probation|record|served time|locked up)\b/i,
  },
  {
    label: 'tribal identity',
    claim: /\bmy (?:tribe|reservation)\b|\bas a (?:native|tribal|indigenous) (?:american|person|member|citizen)\b|\bon my reservation\b/i,
    support: /(?:\bi\b|\bmy\b|\bour\b|\bwe\b)[^.!?\n]{0,40}\b(?:tribe|tribal|reservation|indigenous|native american)\b/i,
  },
  {
    label: 'addiction recovery',
    claim: /\bin my recovery\b|\bi(?:'ve| have) been (?:sober|clean)\b|\bmy (?:sobriety|addiction|sponsor)\b|\bi(?:'m| am) in recovery\b/i,
    support: /(?:\bi\b|\bmy\b)[^.!?\n]{0,40}\b(?:recover\w*|sober\w*|clean|addict\w*|rehab|sponsor)\b/i,
  },
  {
    label: 'foster care alum',
    claim: /\bwhen i aged out of foster care\b|\bi grew up in (?:foster care|the system)\b|\bmy foster (?:parents|family|home)\b/i,
    support: /(?:\bi\b|\bmy\b)[^.!?\n]{0,40}\b(?:foster|aged out|group home|the system)\b/i,
  },
  {
    label: 'grandparent caregiver',
    claim: /\bmy grand(?:kids?|children|son|daughter)\b|\bi(?:'m| am) raising my grand\w+\b/i,
    support: /(?:\bmy\b|\bour\b)[^.!?\n]{0,30}\bgrand(?:kids?|children|son|daughter)\b/i,
  },
  {
    label: 'gig worker',
    claim: /\bi drive for (?:a )?(?:rideshare|uber|lyft|doordash|delivery)\b|\bmy (?:rideshare|delivery) (?:app|gig|shifts?)\b|\bas a gig worker\b/i,
    support: /(?:\bi\b|\bmy\b)[^.!?\n]{0,40}\b(?:gig|rideshare|uber|lyft|doordash|deliver\w*|driving)\b/i,
  },
];

/** Returns the labels of identity claims in `draft` that the constituent's
 * own words (`userText`) do not support. Any result should block an AI
 * draft and trigger a corrective retry. */
export function detectUnsupportedIdentityClaims(draft: string, userText: string): string[] {
  const d = (draft || '').trim();
  const u = (userText || '').trim();
  if (!d) return [];
  const out: string[] = [];
  for (const { label, claim, support } of IDENTITY_CLAIMS) {
    if (claim.test(d) && !support.test(u)) out.push(label);
  }
  return out;
}


/** Deterministic scrub for ungated/legacy paths: drop any sentence carrying
 * an unsupported identity claim. Used where a corrective retry isn't
 * available — losing a sentence beats shipping a fabricated identity. */
export function scrubUnsupportedIdentityClaims(text: string, userText: string): string {
  if (detectUnsupportedIdentityClaims(text, userText).length === 0) return text;
  return dropSentences(text, (s) => detectUnsupportedIdentityClaims(s, userText).length > 0);
}

// A sentence that leans on the one before it ("That promise was never kept.")
// is meaningless once its antecedent is gone.
const LEANS_ON_PREVIOUS = /^(?:that|this|it|those|these|such|they|he|she)\b/i;

/** Drops every sentence `bad` flags, plus any sentence right after it that
 * opens with a pronoun pointing back at it. Paragraph breaks are kept: the
 * text is processed one paragraph at a time and rejoined with blank lines,
 * so a long letter never collapses into a single block. Returns '' if
 * nothing survives. */
export function dropSentences(text: string, bad: (sentence: string) => boolean): string {
  const paragraphs = (text || '').split(/\n\s*\n/);
  const outParas: string[] = [];
  for (const para of paragraphs) {
    const sentences = para.trim().split(/(?<=[.!?])\s+/).filter(Boolean);
    const kept: string[] = [];
    let dropped = false;
    for (const sentence of sentences) {
      if (bad(sentence) || (dropped && LEANS_ON_PREVIOUS.test(sentence))) {
        dropped = true;
        continue;
      }
      dropped = false;
      kept.push(sentence);
    }
    if (kept.length > 0) outParas.push(kept.join(' '));
  }
  return outParas.join('\n\n').trim();
}

// A statistic-shaped claim: a percentage, a dollar amount, or a count scaled
// by thousand/million/billion/trillion. Bare small numbers ("three kids",
// "District 12", "H.R. 1234") deliberately don't match.
// Distances and durations are included: "80 miles away" or "waited 47 days"
// in a constituent's name is a fact about their life, and one the model has
// been caught inventing (audit 2026-09-29, "1 hour 20 minutes" became "80
// miles").
const STAT_SHAPE =
  /\$\s?\d[\d,]*(?:\.\d+)?\s*(?:trillion|billion|million|thousand)?|\d[\d,]*(?:\.\d+)?\s*%|\d[\d,]*(?:\.\d+)?\s*percent\b|\d[\d,]*(?:\.\d+)?\s*(?:trillion|billion|million)\b|\d[\d,]*(?:\.\d+)?\s*(?:miles?|hours?|minutes?|days?|weeks?|months?|years?)\b/gi;

const WORD_NUMBERS: Record<string, number> = {
  one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10,
  eleven: 11, twelve: 12, thirteen: 13, fourteen: 14, fifteen: 15, sixteen: 16, seventeen: 17,
  eighteen: 18, nineteen: 19, twenty: 20, thirty: 30, forty: 40, fifty: 50, sixty: 60,
  seventy: 70, eighty: 80, ninety: 90, hundred: 100, thousand: 1000,
  half: 0.5, dozen: 12,
};

/** Every number in `text`, digits and spelled-out ("twelve years" licenses
 * "12 years"; "forty-seven" licenses 47). */
function numbersIn(text: string): Set<string> {
  const out = new Set(
    ((text || '').match(/\d[\d,]*(?:\.\d+)?/g) || []).map((s) => s.replace(/,/g, ''))
  );
  const words = (text || '').toLowerCase().match(/[a-z]+(?:-[a-z]+)?/g) || [];
  for (const w of words) {
    if (w in WORD_NUMBERS) out.add(String(WORD_NUMBERS[w]));
    const [tens, ones] = w.split('-');
    if (tens && ones && tens in WORD_NUMBERS && ones in WORD_NUMBERS && WORD_NUMBERS[tens] >= 20 && WORD_NUMBERS[ones] < 10) {
      out.add(String(WORD_NUMBERS[tens] + WORD_NUMBERS[ones]));
    }
  }
  return out;
}

/** Returns the statistic-shaped claims in `draft` whose numbers do not appear
 * anywhere in `allowedSource` (the data we supplied plus the constituent's own
 * words). Any result means the model recalled or invented a figure. */
export function detectUnsourcedStats(draft: string, allowedSource: string): string[] {
  const allowed = numbersIn(allowedSource);
  const out: string[] = [];
  for (const m of (draft || '').match(STAT_SHAPE) || []) {
    const digits = m.replace(/[^\d.]/g, '');
    if (digits.length === 0 || !allowed.has(digits)) out.push(m.trim());
  }
  return out;
}

/** Backstop against hallucinated figures: drop any sentence containing a
 * statistic whose number does not appear in `allowedSource`. The prompt is the
 * primary guard; this guarantees an unsourced number never reaches an office.
 * Falls back to the original text rather than returning nothing. */
export function stripUnsourcedStats(text: string, allowedSource: string): string {
  if (detectUnsourcedStats(text, allowedSource).length === 0) return text;
  return dropSentences(text, (s) => detectUnsourcedStats(s, allowedSource).length > 0) || text;
}

/** The sentences in `text` that carry an unsourced statistic, for naming in
 * a corrective retry ("remove this sentence"), which the model follows far
 * better than "rewrite without those figures". */
export function sentencesWithUnsourcedStats(text: string, allowedSource: string): string[] {
  return (text || '')
    .split(/(?<=[.!?])\s+/)
    .filter((s) => detectUnsourcedStats(s, allowedSource).length > 0)
    .map((s) => s.trim());
}

/** True when the draft copies a long verbatim run from the campaign's
 * talking points. Weaving is fine; a shared run of `minWords` consecutive
 * words means the model pasted, and identical paragraphs across a
 * campaign's participants are the exact form-letter fingerprint
 * congressional offices dedupe on. Word-level compare, punctuation and
 * case ignored. */
export function sharesVerbatimRun(template: string, draft: string, minWords = 18): boolean {
  const norm = (s: string) =>
    (s || '')
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
  const t = norm(template);
  const d = norm(draft);
  if (t.length < minWords || d.length < minWords) return false;
  const positions = new Map<string, number[]>();
  d.forEach((w, i) => {
    const arr = positions.get(w);
    if (arr) arr.push(i);
    else positions.set(w, [i]);
  });
  for (let i = 0; i + minWords <= t.length; i++) {
    for (const j of positions.get(t[i]) ?? []) {
      let k = 0;
      while (i + k < t.length && j + k < d.length && t[i + k] === d[j + k]) k++;
      if (k >= minWords) return true;
    }
  }
  return false;
}


/**
 * The closing ask must ask the OFFICIAL to act. A constituent goal like
 * "Urge HHS to rescind the rule" must become "Please urge HHS to rescind the
 * rule" in the email, never "I urge HHS to..." addressed to a third party
 * the official is not (Jared's Head Start letter, 2026-09-28).
 */
export function askAddressesOfficial(ask: string): boolean {
  const a = (ask || '').trim();
  if (!a) return false;
  const secondPerson = /\b(you|your|your office|your vote|your support|please)\b/i.test(a);
  // "I urge HHS to…", "We ask the Department to…", "Congress must…" with no
  // second person = addressed past the reader.
  const thirdPartyImperative = /^(i|we)\s+(urge|ask|call on|implore|encourage)\s+(?!you\b)/i.test(a) && !/\b(you|your)\b/i.test(a);
  return secondPerson && !thirdPartyImperative;
}

/** The opening line and the body must not restate each other (the same
 *  credentials sentence twice is the loudest template tell). */
export function openingRepeatsBody(opening: string, body: string): boolean {
  if (sharesVerbatimRun(opening, body, 8)) return true;
  // Same credentials restated in new words ("I am a renter in Reno" then
  // "I have rented the same apartment in Reno for six years"): the opening
  // and the body's first sentence share most of their content words.
  const firstSentence = (body || '').trim().split(/(?<=[.!?])\s+/)[0] || '';
  const shared = contentWords(opening).filter((w) => contentWords(firstSentence).includes(w));
  return shared.length >= 4;
}

const STOPWORDS = new Set(
  'a an the and or but so because that this these those with without from for of to in on at by as is are was were be been being have has had do does did not no yes it its i my me we our you your they their them he she his her who what when where which while about into over under again more most very just than then there here also only same such can could will would should may might must'.split(' ')
);

function contentWords(text: string): string[] {
  return Array.from(
    new Set(
      (text || '')
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, ' ')
        .split(/\s+/)
        .filter((w) => w.length >= 4 && !STOPWORDS.has(w))
        // Light stemming so "renter"/"rented" and "work"/"working" match.
        .map((w) => (w.length > 5 ? w.replace(/(?:ing|ed|er|s)$/, '') : w.replace(/s$/, '')))
    )
  );
}

/** True when a closing ask argues the wrong side for an org campaign whose
 * direction is fixed. Only explicit direction verbs count; "protect" or
 * "preserve" can sit on either side of a question and are left alone. */
export function askContradictsStance(ask: string, verb: 'support' | 'oppose' | null): boolean {
  if (!verb) return false;
  const a = ask || '';
  const opposes = /\b(?:oppose|vote no|vote against|reject|block|defeat)\b/i.test(a);
  const supports = /\b(?:support|vote yes|vote for|pass|cosponsor|co-sponsor|approve)\b/i.test(a);
  if (verb === 'oppose') return supports && !opposes;
  return opposes && !supports;
}
