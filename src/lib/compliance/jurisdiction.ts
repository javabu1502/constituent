import { detectBillReferences } from '@/lib/bills';
import { getJurisdiction } from '@/lib/issue-jurisdiction';

/**
 * Deterministic topic-jurisdiction rules for CWC delivery (Jared, 2026-09-28:
 * "Topic jurisdiction needs to be enforced, not guided"). Congressional
 * offices should only receive messages about matters Congress can act on.
 * A message that is ONLY about a state or local matter is HELD for human
 * review before it can reach the queue; it is never delivered unattended.
 *
 * These rules are conservative and deterministic (no model involved); the
 * LLM screener adds a judgment layer on top (category `jurisdiction`).
 * Hold, never block: a false positive costs a human look, a false negative
 * costs office trust.
 */
export interface JurisdictionAssessment {
  /** True when the message appears to be exclusively a state/local matter. */
  outsideFederal: boolean;
  reasons: string[];
}

// State-legislature bill prefixes that never denote a federal bill. "HR"/"SR"
// are deliberately excluded: people write the federal "H.R. 1" as "HR 1".
const STATE_BILL_PATTERN = /\b(AB|SB|HB|HF|SF|LB|LD|SCR|HCR|SJR|HJR|ACR|AJR)\s*-?\s*(\d{1,5})\b/g;

const STATE_LEGISLATURE_PATTERN =
  /\b(state (?:legislature|assembly|senate|senator|assemblymember|assemblywoman|assemblyman|representative|house)|(?:nevada|california|texas|florida|new york|arizona|utah|oregon|washington|idaho) (?:legislature|assembly|state senate)|legislative session in carson city|carson city)\b/i;

const LOCAL_BODY_PATTERN =
  /\b(city council|county commission(?:ers)?|board of supervisors|school board|planning commission|zoning board|mayor'?s office|our mayor|the mayor|city manager|county manager|homeowners? association|\bhoa\b)\b/i;

// A FEDERAL ACTOR OR INSTRUMENT, never a bare topic, and never a bare title.
//
// "Senator" and "Representative" alone are not evidence either: every state
// has those too, and writing "Dear Representative," at the top of a letter
// about potholes used to switch this whole check off.
//
// Bare topic nouns are not evidence of a request to Congress, and because
// those nouns are not politically neutral the effect was asymmetric: a purely
// local message about an immigration ordinance was waved straight through
// while the structurally identical local message about a firearm ordinance
// was held. The bare word "national" also switched the whole check off, so
// "the potholes on my street are a national disgrace" read as federal.
//
// Removing them outright went too far the other way and held ordinary
// federal letters: a message asking Congress to stop arming a foreign
// government, to end an immigration raid, or to vote against a tariff had no
// federal signal left once it also mentioned a mayor or a city council. So
// they are back as ACTORS AND INSTRUMENTS, which are the forms a request of
// Congress actually takes, and not as the bare nouns.
const FEDERAL_ASK_PATTERN =
  /\b(congress|federal|u\.?s\.? (?:senate|house|representative|senator)|congress(?:man|woman|member)|house of representatives|appropriat|\bbill\b.*\b(?:h\.?r\.?|s\.)\s*\d|medicare|medicaid|social security|veterans affairs|head start|department of (?:education|health|labor|agriculture|defense|justice|homeland|state|transportation|energy|interior)|state department|national guard|foreign aid|military aid|foreign policy|defense authorization|tariffs?|immigration (?:law|policy|enforcement|raids?|reform|court)|border (?:policy|patrol|wall|security)|federal funding|federal grant|federal rule|federal law|federal immigration|proposed rule|act of congress|treaty|federal court|supreme court|nationwide ban|national ban)\b/i;

// The same check for words that are only federal actors in capitals. Matched
// case-SENSITIVELY, because the lowercase forms are ordinary English and
// matching them case-insensitively made this check fail OPEN:
//
//   "There is ice on the sidewalk and the city does nothing"  -> read federal
//   "Potholes everywhere. Jane Doe, 123 Main St, Arlington, VA 22201"
//
// That second one is the expensive one. Every constituent with a Virginia
// address in their signature block bypassed the jurisdiction check entirely,
// because the body carried "VA".
const FEDERAL_ACRONYM_PATTERN =
  /\b(ICE|DHS|FBI|CBP|IRS|EPA|FDA|HHS|SNAP|WIC|USDA|FEMA|NATO|CMS|SSA|HUD)\b/;

// Two-letter and otherwise ambiguous acronyms need to say what they are
// about. "VA" is a state as often as it is the department.
const AMBIGUOUS_ACRONYM_PATTERN =
  /\bVA\b\s*(?:benefits?|claim|hospital|clinic|disability|loan|health|care|appeals?|backlog)|(?:department|secretary|office)\s+of\s+veterans|\bthe\s+VA\b/i;

// Municipal services: nobody in Congress fixes these; a message that is only
// about them (with no federal ask) belongs to city hall.
const LOCAL_SERVICE_PATTERN =
  /\b(potholes?|street ?lights?|sidewalks?|trash (?:pickup|collection)|garbage (?:pickup|collection|service)|recycling pickup|snow ?plow\w*|water bill|sewer bill|parking (?:tickets?|meters?|enforcement)|noise ordinance|leash law|code enforcement|building permit|property tax(?:es)?|the city does nothing|the county does nothing)\b/i;

/**
 * The greeting at the top of a letter, as a prefix: "Dear Senator Rosen,".
 * Shared with the CWC compliance gate, which strips the same thing before
 * screening, so the two cannot drift apart about what a salutation is.
 */
export const SALUTATION_WORDS = 'dear|to|hello|hi|greetings';
const SALUTATION_OPENING = new RegExp(`^\\s*(?:${SALUTATION_WORDS})\\b[^,:\\n]{0,60}[,:]\\s*`, 'i');

/**
 * Drop a leading salutation. It names the recipient, which tells us nothing
 * about whether the request belongs to that office.
 *
 * Only the greeting goes, not the whole first line. Deleting the line took
 * the ask with it whenever the salutation ran inline: "Dear Senator Rosen,
 * please vote no on H.R. 1234." lost the bill reference before the detector
 * ever saw it, and the message was held.
 */
export function withoutSalutation(message: string): string {
  return message.replace(SALUTATION_OPENING, '');
}

/** Any federal actor or instrument in the text. */
function hasFederalAsk(text: string): boolean {
  return (
    FEDERAL_ASK_PATTERN.test(text) ||
    FEDERAL_ACRONYM_PATTERN.test(text) ||
    AMBIGUOUS_ACRONYM_PATTERN.test(text)
  );
}

export function assessFederalJurisdiction(input: { message: string; subject?: string }): JurisdictionAssessment {
  const text = `${input.subject ?? ''}\n${withoutSalutation(input.message)}`;
  const reasons: string[] = [];

  const refs = detectBillReferences(text);
  const federalRefs = refs.filter((r) => r.level === 'federal');
  const stateBillHits = [...text.matchAll(STATE_BILL_PATTERN)].map((m) => `${m[1]} ${m[2]}`);
  const federalAsk = hasFederalAsk(text);

  // 1. A state bill number with no federal bill and no federal ask: this is
  //    a message for the state legislature, not Congress.
  if (stateBillHits.length > 0 && federalRefs.length === 0 && !federalAsk) {
    reasons.push(`References a state bill (${[...new Set(stateBillHits)].slice(0, 3).join(', ')}) with no federal bill or federal request.`);
  }

  // 2. The ask is addressed to a state legislature or a local body and there
  //    is no federal ask anywhere in the text.
  if (!federalAsk && federalRefs.length === 0) {
    if (STATE_LEGISLATURE_PATTERN.test(text)) reasons.push('Addresses a state legislature matter with no federal request.');
    if (LOCAL_BODY_PATTERN.test(text)) reasons.push('Addresses a city, county, or school-board matter with no federal request.');
    if (LOCAL_SERVICE_PATTERN.test(text)) reasons.push('Concerns a municipal service (streets, trash, permits, local taxes) with no federal request.');
  }

  // 3. The curated issue-jurisdiction rules say this topic is purely
  //    state/local (federal weight 0, another level primary).
  const guidance = getJurisdiction(text);
  if (guidance.weights.federal === 0 && (guidance.weights.state === 2 || guidance.weights.local === 2) && !federalAsk && federalRefs.length === 0) {
    reasons.push('Topic is handled at the state or local level, not by Congress.');
  }

  return { outsideFederal: reasons.length > 0, reasons };
}
