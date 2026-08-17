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
    support: /(?:\bmy\b|\bour\b)[^.!?\n]{0,25}\b(?:kids?|children|son|daughter|baby|famil\w*)\b|\bi (?:have|raise|am raising)[^.!?\n]{0,20}\b(?:kids?|children|a son|a daughter|a baby)\b|\bi(?:'m| am)[^.!?\n]{0,15}\b(?:pregnant|a (?:mom|dad|mother|father|parent))\b|\bas a (?:mom|dad|mother|father|parent)\|\b(?:mi|nuestr[oa])s?[^.!?\n]{0,20}\b(?:hij[oa]s?|niñ[oa]s?|bebé|familia)\b/i,
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
    support: /(?:\bi\b|\bmy\b)[^.!?\n]{0,40}\b(?:diabet\w*|insulin|diagnos\w*|cancer|chemo\w*|chronic|condition|prescri\w*|medication|patient|remission|covid)\|\bmi[^.!?\n]{0,20}\b(?:salud|enfermedad|medicina|diabetes)\b/i,
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
    support: /(?:\bi\b|\bmy\b|\bour\b)[^.!?\n]{0,40}\b(?:rent\w*|lease|landlord|tenant|mortgage|homeowner|property tax\w*|evict\w*)\|\b(?:mi|nuestra)[^.!?\n]{0,20}\b(?:renta|alquiler|casero|casa|apartamento)\b/i,
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
  const sentences = text.split(/(?<=[.!?])\s+/);
  const kept = sentences.filter((s) => detectUnsupportedIdentityClaims(s, userText).length === 0);
  return kept.join(' ').trim();
}
