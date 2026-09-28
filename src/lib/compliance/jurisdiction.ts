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

const FEDERAL_ASK_PATTERN =
  /\b(congress|federal|u\.?s\.? (?:senate|house|representative|senator)|senator|representative|congress(?:man|woman|member)|appropriat|\bbill\b.*\b(?:h\.?r\.?|s\.)\s*\d|medicare|medicaid|social security|\bva\b|veterans affairs|\birs\b|\bepa\b|\bfda\b|\bhhs\b|head start|\bsnap\b|\bwic\b|department of (?:education|health|labor|agriculture|defense|justice|homeland|state|transportation|energy|interior)|federal funding|federal grant|federal rule|proposed rule|regulation|national|nationwide|immigration|border|tariff|foreign|military|nato|ukraine|israel)\b/i;

// Municipal services: nobody in Congress fixes these; a message that is only
// about them (with no federal ask) belongs to city hall.
const LOCAL_SERVICE_PATTERN =
  /\b(potholes?|street ?lights?|sidewalks?|trash (?:pickup|collection)|garbage (?:pickup|collection|service)|recycling pickup|snow ?plow\w*|water bill|sewer bill|parking (?:tickets?|meters?|enforcement)|noise ordinance|leash law|code enforcement|building permit|property tax(?:es)?|the city does nothing|the county does nothing)\b/i;

export function assessFederalJurisdiction(input: { message: string; subject?: string }): JurisdictionAssessment {
  const text = `${input.subject ?? ''}\n${input.message}`;
  const reasons: string[] = [];

  const refs = detectBillReferences(text);
  const federalRefs = refs.filter((r) => r.level === 'federal');
  const stateBillHits = [...text.matchAll(STATE_BILL_PATTERN)].map((m) => `${m[1]} ${m[2]}`);
  const federalAsk = FEDERAL_ASK_PATTERN.test(text);

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
