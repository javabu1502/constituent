/**
 * Detect casework — a personal case with a government agency, as opposed to a
 * policy opinion. "My social security check is three months late" is not a
 * position on Social Security policy; it's a case a congressional office's
 * caseworkers can actually take up (with a signed privacy release).
 *
 * Level matters: congressional offices do casework ONLY with federal agencies
 * (SSA, VA, IRS, USCIS, Medicare, State Dept); state legislators handle state
 * agencies (DMV, unemployment insurance, state benefit offices, licensing).
 */

export interface CaseworkSignal {
  isCasework: boolean;
  level: 'federal' | 'state' | null;
}

// A personal stake in a specific case, not a general opinion.
const PERSONAL = [
  /\b(?:my|our|his|her|husband'?s?|wife'?s?|son'?s?|daughter'?s?|mother'?s?|father'?s?|mom'?s?|dad'?s?|grandmother'?s?|grandfather'?s?|grandma'?s?|grandpa'?s?)\b[^.!?]{0,60}\b(?:claim|case|application|benefits?|check|refund|paperwork|status|appeal|approval|renewal)\b/i,
  /\b(?:i|we)\s+(?:applied|filed|was denied|were denied|got denied|have been waiting|am waiting|can'?t get|cannot get|haven'?t (?:received|gotten|heard))\b/i,
  /\bhelp (?:me|us|my|our)\b/i,
  /\bno one (?:answers|responds|calls back|will help)\b/i,
];

const FEDERAL_AGENCY =
  /social security|\bssa\b|\bssdi\b|\bssi\b|medicare|(?<!\bin )(?<!\bto )(?<!\bfrom )(?<!near )\bva\b(?! beach)|veterans affairs|\birs\b|(?<!state )(?<!property )tax refund|internal revenue|uscis|green card|immigration case|naturalization|passport|state department|customs (?:agents?|officers?|enforcement|seiz\w*)|\bcbp\b|military records|discharge upgrade|federal student aid|\bfafsa\b|\bpslf\b|public service loan forgiveness|loan servicer|\bhud\b|\bsba\b|\bfema\b|disaster assistance|\busps\b|postal|mail delivery/i;

const STATE_AGENCY =
  /\bdmv\b|driver'?s? licen|vehicle registration|unemployment|workers'? comp|state medicaid|food stamps|\bsnap\b|\bwic\b|welfare office|licensing board|professional licen|child support enforcement|state tax|state benefits/i;

export function detectCasework(text: string): CaseworkSignal {
  const t = (text || '').trim();
  if (!t) return { isCasework: false, level: null };
  const personal = PERSONAL.some((p) => p.test(t));
  if (!personal) return { isCasework: false, level: null };
  // Federal wins ties: "my unemployment and my social security" is rare, and
  // a congressional office can at least redirect.
  if (FEDERAL_AGENCY.test(t)) return { isCasework: true, level: 'federal' };
  if (STATE_AGENCY.test(t)) return { isCasework: true, level: 'state' };
  return { isCasework: false, level: null };
}
