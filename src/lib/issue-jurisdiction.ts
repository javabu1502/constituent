/**
 * Which level of government actually handles an issue.
 *
 * Used to guide people to the RIGHT officials before they pick who to write —
 * a letter about immigration to a city council member, or about trash pickup
 * to a US senator, goes nowhere. Weights: 2 = primary authority (best match),
 * 1 = shares authority (also worth contacting), 0 = little direct authority.
 *
 * Client-safe: pure data + string matching, no server deps.
 */

import { detectBillRefs } from './bill-refs';
import { detectCasework } from './casework';

export type GovLevel = 'federal' | 'state' | 'local';

export interface JurisdictionGuidance {
  weights: Record<GovLevel, 0 | 1 | 2>;
  /** One-line, plain-language reason per level, shown under section headers. */
  why: Partial<Record<GovLevel, string>>;
}

interface JurisdictionRule {
  pattern: RegExp;
  guidance: JurisdictionGuidance;
  /** Federal-exclusive topics: competing rules need MULTIPLE distinct token
   * hits to add state/local weight when one of these matches. */
  exclusive?: boolean;
}

const RULES: JurisdictionRule[] = [
  {
    // Federal agencies and services — casework territory. A state legislator
    // cannot chase an IRS refund or expedite a passport.
    pattern: /\birs\b|(?<!state )(?<!property )tax refund|internal revenue|passport|state department(?! of )|\btsa\b|air traffic|\bfaa\b|airline|amtrak|federal student aid|\bfafsa\b|uscis|green card|customs (?:agents?|officers?|enforcement|seiz\w*)|\bcbp\b/i,
    guidance: {
      weights: { federal: 2, state: 0, local: 0 },
      why: { federal: 'These are federal agencies — congressional offices have caseworkers who deal with them directly.' },
    },
  },
  {
    // Congress regulating itself.
    pattern: /members? of congress|congressional (?:stock|ethics|term|pay)|term limits? (?:for|on) congress|stock trading ban|insider trading by congress|filibuster|electoral college/i,
    guidance: {
      weights: { federal: 2, state: 0, local: 0 },
      why: { federal: 'Only Congress can set rules for Congress.' },
    },
    exclusive: true,
  },
  {
    // Unemployment INSURANCE is state-administered; \bemployment\b in the
    // economy rule no longer swallows this word.
    pattern: /unemployment/i,
    guidance: {
      weights: { federal: 1, state: 2, local: 0 },
      why: {
        state: 'Unemployment insurance is run by your state — benefits, eligibility, and the offices that pay claims.',
        federal: 'Congress sets the federal framework and funds extensions.',
      },
    },
  },
  {
    pattern: /data center/i,
    guidance: {
      weights: { federal: 1, state: 2, local: 2 },
      why: {
        state: 'State utility commissions decide who pays for the grid demand.',
        local: 'Siting and zoning approvals happen at the county and city level.',
      },
    },
  },
  {
    pattern: /tap water|agua (?:de la llave|del grifo|potable)|out of (?:our|my|the) taps?\b|faucet|drinking water|water quality|lead pipe/i,
    guidance: {
      weights: { federal: 1, state: 2, local: 2 },
      why: {
        local: 'Your water utility answers to local government.',
        state: 'State environmental agencies enforce drinking-water standards.',
        federal: 'The EPA sets the national standards.',
      },
    },
  },
  {
    pattern: /immigra|\bborders?\b(?! ?collie)|asylum|\bvisa\b(?! ?(?:card|bill|statement|debit|credit|gift|rewards?|points?))|daca|refugee|deport|citizenship|\bice\b (?:raids?|agents?|detain\w*|arrest\w*)|\bice took (?:my|our|his|her|him|them)\b|la migra/i,
    guidance: {
      weights: { federal: 2, state: 1, local: 0 },
      why: {
        federal: 'Immigration law is set by Congress — your US senators and representative are the decision-makers here.',
        state: 'States decide some related policies (licenses, in-state tuition, local enforcement cooperation).',
      },
    },
  },
  {
    // Purely federal health programs. Medicare deliberately lives here and
    // NOT in the shared healthcare rule below: a state legislator can no more
    // change Medicare or ACA subsidies than fix Social Security. (Merge takes
    // the max per level, so it must not appear in both.)
    pattern: /medicare|\baca\b|obamacare|affordable care act|premium tax credit|marketplace subsid/i,
    guidance: {
      weights: { federal: 2, state: 0, local: 0 },
      why: {
        federal: 'Medicare and the ACA are federal programs — only Congress can change their funding, subsidies, or rules.',
      },
    },
    exclusive: true,
  },
  {
    // Lookbehinds: "VA healthcare" and "VA hospital" are federal-agency
    // matters (Congress funds VA construction; states only run their own
    // veterans homes) — they must not inherit this rule's state weight.
    pattern: /(?<!\bva )health|medicaid|(?<!car )(?<!auto )(?<!home )(?<!homeowners )(?<!renters )(?<!life )(?<!pet )(?<!flood )(?<!travel )(?<!title )insurance|prescription|insulin|epipen|copay|drug price|mental health|reproductive|abortion|(?<!\bva )hospital|seguro m[eé]dico|\bsalud\b/i,
    guidance: {
      weights: { federal: 2, state: 2, local: 0 },
      why: {
        federal: 'Congress sets national health programs and drug pricing policy.',
        state: 'States run Medicaid, regulate insurers and hospitals, and set many care access laws.',
      },
    },
  },
  {
    // K-12: school boards genuinely decide things here.
    pattern: /k-?12|(?<!old )\bschools?\b(?! of hard knocks)|escuelas?|teacher|curriculum|book ban|early childhood education|classroom|school board/i,
    guidance: {
      weights: { federal: 1, state: 2, local: 2 },
      why: {
        state: 'States set school funding, standards, and teacher policy — the biggest levers in education.',
        local: 'School boards and local officials decide budgets, curriculum details, and district policy.',
        federal: 'Congress handles federal education funding.',
      },
    },
  },
  {
    // Higher ed and student loans: the loan system is federal; the school
    // board has nothing to do with it, so this is a separate rule from K-12.
    pattern: /student loan|student debt|loan forgiveness|pell grant|tuition|(?<!electoral )college(?! football| basketball| sports)|higher education|universit/i,
    guidance: {
      weights: { federal: 2, state: 2, local: 0 },
      why: {
        federal: 'Student loans, Pell grants, and loan forgiveness are federal programs.',
        state: 'States fund public universities and set in-state tuition policy.',
      },
    },
  },
  {
    // Bare "education" (often just the category word): shared, but local only
    // when a K-12 phrasing above says so.
    pattern: /education/i,
    guidance: {
      weights: { federal: 1, state: 2, local: 1 },
      why: {
        state: 'States hold the biggest levers in education policy.',
        federal: 'Congress handles federal education funding.',
      },
    },
  },
  {
    // Broadband buildout money is federal (with state programs); removed
    // from the infrastructure rule so the school board isn't cc'd.
    pattern: /broadband|rural internet/i,
    guidance: {
      weights: { federal: 2, state: 2, local: 1 },
      why: {
        federal: 'Congress funds the broadband buildout programs.',
        state: 'States run the broadband offices that award that money.',
      },
    },
  },
  {
    // \bepa\b: the bare token matched "S-epa-ration" and pulled immigration
    // family-separation stories into environmental routing.
    pattern: /(?<!political )climate|(?<!learning )(?<!work )(?<!home )environment(?!\s+(?:at|in|around)\b)|clean energy|\bemissions?\b(?! test| inspection)|pollution|\bepa\b|renewable|(?:oil|gas|offshore|arctic) drilling|drilling (?:permits?|leases?|rigs?)|wildfire|\benergy\b(?! drinks?)|global warming|greenhouse gas|greenhouse emission/i,
    guidance: {
      weights: { federal: 2, state: 2, local: 1 },
      why: {
        federal: 'The EPA, national emissions rules, and energy policy run through Congress.',
        state: 'States regulate utilities, set renewable targets, and issue permits.',
        local: 'Cities decide building codes, transit, and local resilience projects.',
      },
    },
  },
  {
    pattern: /\bguns?\b|firearm|second amendment|shooting|school shooter|gun violence|(?:was|got|been) shot\b(?! down)|red[- ]flag (?:law|order)s?/i,
    guidance: {
      weights: { federal: 1, state: 2, local: 0 },
      why: {
        state: 'Most gun laws (permits, red-flag laws, carry rules) are set at the state level.',
        federal: 'Congress sets background-check and interstate rules.',
      },
    },
  },
  {
    // \brent\b with suffixes: the bare token matched "diffe-rent".
    pattern: /housing|\brent(?:s|al|ers?|ing)?\b|\brenta\b|alquiler|homeless|zoning|eviction|mortgage|affordable hous|landlord|tenant|security deposit|apartment|section 8\b(?! discharge)|housing voucher|public housing|housing authority/i,
    guidance: {
      weights: { federal: 1, state: 2, local: 2 },
      why: {
        local: 'Zoning, permitting, and most housing decisions happen at city and county level.',
        state: 'States set landlord-tenant law and fund housing programs.',
        federal: 'Congress funds HUD, Section 8, and tax credits for affordable housing.',
      },
    },
  },
  {
    // Two lookbehinds: "Property Tax" followed by its own category word
    // "Taxation" must not re-trigger federal weight. Bare "spending" pulled
    // Defense Spending toward state legislators — only fiscal-process
    // phrasings belong here.
    pattern: /(?<!property )(?<!property tax )\btax(?!i)(?!payer)(?!es on (?:my|our|the) (?:property|house|home))|\birs\b|budget|government spending|federal spending|spending bill|(?<!attention )(?<!hearing )(?<!sleep )deficit|impuestos/i,
    guidance: {
      weights: { federal: 2, state: 2, local: 1 },
      why: {
        federal: 'Federal taxes and the national budget are Congress’s job.',
        state: 'State income and sales tax rules are set by your state legislature.',
      },
    },
  },
  {
    pattern: /veterans?\b(?! (?:teacher|educator|reporter|lawmaker|officer)s?\b)|\bnavy\b|\barmy\b|\bmarines?\b|coast guard|survivor benefits|discharge upgrade|(?<!\bin )(?<!\bto )(?<!\bfrom )(?<!near )\bva\b(?! beach)|military famil|servicemember/i,
    guidance: {
      weights: { federal: 2, state: 1, local: 0 },
      why: {
        federal: 'VA benefits and military policy are federal — your members of Congress can also cut through VA red tape for you directly.',
        state: 'States run veterans homes and some benefit programs.',
      },
    },
  },
  {
    // Bare "drug" is too greedy — it pulled Medicare drug coverage into
    // city-council territory. Only drug-CRIME phrasings belong here; pricing
    // and coverage phrasings are handled by the health rules above.
    pattern: /police|polic[ií]as?\b|\bcops?\b(?![- ]out)|policing|public defender|(?<!it's a )(?<!it is a )\bcrimes?\b|criminal justice|law enforcement|prison|sentencing|\bbail\b(?! ?out| on)|public safety|drug traffick|drug deal|drug abuse|drug overdose|drug epidemic|illegal drug|fentanyl|opioid|human traffick/i,
    guidance: {
      weights: { federal: 1, state: 2, local: 2 },
      why: {
        state: 'Criminal law, sentencing, and prisons are mostly state-level.',
        local: 'Police departments answer to city and county officials.',
        federal: 'Congress sets federal crimes and funds local programs.',
      },
    },
  },
  {
    // \b on road/rail/traffic: bare tokens matched "abroad", "trail", and
    // "trafficking".
    pattern: /(?<!down the )(?<!middle of the )\broads?\b|bridge|\btransit\b|infrastructure|highway(?! robbery)|(?<!off the )\brails?\b|railroad|(?<!air )\btraffic\b|pothole|transportation/i,
    guidance: {
      weights: { federal: 1, state: 2, local: 2 },
      why: {
        state: 'State DOTs decide which roads and transit projects get built.',
        local: 'Cities and counties maintain local streets and approve projects.',
        federal: 'Congress funds the big infrastructure programs.',
      },
    },
  },
  {
    pattern: /voting|election|ballot|gerrymander|redistrict|voter/i,
    guidance: {
      weights: { federal: 1, state: 2, local: 1 },
      why: {
        state: 'States run elections — registration, ballots, and district maps.',
        federal: 'Congress sets baseline voting-rights protections.',
        local: 'County officials administer polling places and counts.',
      },
    },
  },
  {
    pattern: /econom|jobs|wage|desempleo|salario|sueldo|inflation|worker|labor|union|small business|\bemployment\b|cost of living|recession|debt ceiling|national debt|government shutdown|public finance|gas prices|price of gas/i,
    guidance: {
      weights: { federal: 2, state: 2, local: 1 },
      why: {
        federal: 'Congress shapes national economic policy, labor law, and the minimum wage floor.',
        state: 'States set their own minimum wage, worker protections, and business rules.',
      },
    },
  },
  {
    pattern: /civil rights|discrimination|lgbtq|equality|disability rights/i,
    guidance: {
      weights: { federal: 2, state: 2, local: 1 },
      why: {
        federal: 'Federal civil-rights law sets the national floor.',
        state: 'States can extend protections further than federal law.',
      },
    },
  },
  {
    // \bwar\b: bare "war" matched "global warming". The country list mirrors
    // the issue picker — Iran and Russia were missing and fell to the default.
    pattern: /foreign|ukraine|israel|palestin|(?<!'s )(?<!fine )(?<!bone )\bchina\b(?!town)|\bchinese\b|\brussia\b|\brussians?\b(?! roulette)|\biran\b|taiwan|venezuela|north korea|\bnato\b|\bwar (?:in|with|against)\b|go(?:ing)? to war|\bwarfare\b|world war|war on terror|forever wars?|trade wars?|foreign wars?|\bsanctions?\b(?!ed)|war on terror|trade deal|tariff|international affairs/i,
    guidance: {
      weights: { federal: 2, state: 0, local: 0 },
      why: {
        federal: 'Foreign policy is entirely federal — only your members of Congress have a vote here.',
      },
    },
    exclusive: true,
  },
  {
    // Defense and national security are federal-only — a state legislator
    // has no vote on the Pentagon budget. Veterans issues stay in their own
    // rule (states run veterans homes), and the merge keeps that state weight.
    pattern: /(?<!self )(?<!self-)defense(?! attorney| lawyer| counsel)|\bmilitary\b|armed forces|national security|pentagon/i,
    guidance: {
      weights: { federal: 2, state: 0, local: 0 },
      why: { federal: 'Defense and national security run entirely through Congress.' },
    },
    exclusive: true,
  },
  {
    pattern: /social welfare|safety net|\bwic\b|\btanf\b|universal basic income|disability benefit|welfare program/i,
    guidance: {
      weights: { federal: 2, state: 2, local: 0 },
      why: {
        federal: 'Congress funds and sets the rules for the big safety-net programs.',
        state: 'States administer them and decide eligibility details and supplements.',
      },
    },
  },
  {
    pattern: /child care|childcare|family leave|foster (?:care|child\w*|kids?|youth|famil\w*|parents?|homes?|system)|\badoption\b(?! of )|\bfamilies\b|fertility|screen time/i,
    guidance: {
      weights: { federal: 1, state: 2, local: 1 },
      why: {
        state: 'States license child care and run family-support programs.',
        federal: 'Congress decides child tax credits and national family-leave policy.',
      },
    },
  },
  {
    // States have ZERO Social Security authority — this must never route to
    // a state legislator (it previously lived inside the tax rule, wrongly).
    pattern: /social security|\bssi\b|\bssdi\b|\busps\b|postal service|post office|mail carrier|mail delivery|mailman/i,
    guidance: {
      weights: { federal: 2, state: 0, local: 0 },
      why: { federal: 'Social Security and the Postal Service are entirely federal — only Congress can act.' },
    },
    exclusive: true,
  },
  {
    pattern: /property tax|taxes on (?:my|our|the) (?:property|house|home)/i,
    guidance: {
      weights: { federal: 0, state: 2, local: 2 },
      why: {
        local: 'Property tax rates are set by counties, cities, and school districts.',
        state: 'States set the rules those local rates operate under.',
      },
    },
  },
  {
    pattern: /\bai\b|artificial intelligence|social media|data privacy|big tech|crypto|online safety|child safety|deepfake|\btechnology\b|telecommunication|cybersecurit|net neutrality|age verif|autonomous vehicle|semiconductor/i,
    guidance: {
      weights: { federal: 2, state: 2, local: 0 },
      why: {
        federal: 'National tech, privacy, and platform rules run through Congress.',
        state: 'States are actively passing their own privacy and online-safety laws.',
      },
    },
  },
  {
    pattern: /\bfarms?\b|\bfarming\b|\bfarmers?\b(?! market)|agricultur|(?<!cold )\bsnap\b(?! out| decision)|food stamp|food assist|school meal|school breakfast|school lunch|nutrition/i,
    guidance: {
      weights: { federal: 2, state: 2, local: 0 },
      why: {
        federal: 'The Farm Bill, SNAP, and school-meal funding are federal.',
        state: 'States administer the programs and set their own supplements.',
      },
    },
  },
  {
    pattern: /marijuana|cannabis|\bweed\b(?!s\b| out| ?(?:killer|whack))/i,
    guidance: {
      weights: { federal: 1, state: 2, local: 1 },
      why: {
        state: 'Legalization, licensing, and taxation are state decisions.',
        federal: 'Congress controls federal scheduling and banking access.',
      },
    },
  },
  {
    pattern: /utilit|electric bill|power compan|energy bill|water bill|power bill|(?<!interest )rate hike/i,
    guidance: {
      weights: { federal: 1, state: 2, local: 1 },
      why: { state: 'State utility commissions approve rates and regulate providers.' },
    },
  },
  {
    pattern: /\bdmv\b|driver'?s? licen|vehicle registration|car registration|professional licen|occupational licen|barber licen|nursing licen/i,
    guidance: {
      weights: { federal: 0, state: 2, local: 0 },
      why: { state: 'Licensing — from driving to professions — is purely state-run.' },
    },
  },
  {
    // The purely local layer: if it involves a truck, a sidewalk, or a park,
    // a US senator cannot help.
    pattern: /trash|\bbasura\b|garbage (?:pickup|collection|truck|service|cans?|day)|sewer|sidewalk|streetlight|street light|noise complaint|(?<!national )(?<!rosa )\bparks?\b|\btrails?\b|library|snow removal|code enforcement|animal control|zoning permit|building permit|speed bump|crosswalk|stop sign/i,
    guidance: {
      weights: { federal: 0, state: 1, local: 2 },
      why: {
        local: 'City and county government runs these services directly.',
        state: 'State law sets the framework local governments operate under.',
      },
    },
  },
  {
    pattern: /(?<!state )supreme court|federal judge|judicial nominee|court packing/i,
    guidance: {
      weights: { federal: 2, state: 1, local: 0 },
      why: { federal: 'Federal judges are nominated and confirmed in Washington.' },
    },
  },
  {
    pattern: /nursing home|elder abuse|aging services|assisted living/i,
    guidance: {
      weights: { federal: 2, state: 2, local: 0 },
      why: {
        federal: 'Federal law sets nursing-home standards and funding.',
        state: 'States license and inspect nursing homes and run aging services.',
      },
    },
  },
  {
    // Seniors' income issues (Social Security, retirement) are federal-led;
    // state weight here mailed pension complaints to state legislators.
    pattern: /senior|\baging\b(?! (?:water|pipes?|mains?|infrastructure|bridges?|roads?|grid))|retirement/i,
    guidance: {
      weights: { federal: 2, state: 1, local: 0 },
      why: { federal: 'Social Security, Medicare, and retirement policy are federal.' },
    },
  },
  {
    pattern: /marriage|divorce|custody|family court|child support/i,
    guidance: {
      weights: { federal: 0, state: 2, local: 0 },
      why: { state: 'Family law is state law.' },
    },
  },
  {
    pattern: /hunting|fishing(?! for (?:excuses|compliments|votes))|wildlife|\bdeer\b|game commission/i,
    guidance: {
      weights: { federal: 1, state: 2, local: 0 },
      why: { state: 'Fish and wildlife rules are set by state agencies and legislatures.' },
    },
  },
  {
    pattern: /daylight saving/i,
    guidance: {
      weights: { federal: 2, state: 1, local: 0 },
      why: {
        federal: 'Permanent daylight saving time requires an act of Congress.',
        state: 'States can opt out to permanent standard time.',
      },
    },
  },
];

// Safe default: unknown issues go to federal + state — never local. With
// auto-routing, a false local match means a city council member gets a
// message about something they cannot touch; the reverse costs nothing.
RULES.push({
  // Disasters: FEMA is federal, states run emergency management.
  pattern: /\bfema\b|flood(?:ing|s)?\b|hurricane|tornado|earthquake|disaster (?:relief|aid|assistance|declaration)|wildfire recovery/i,
  guidance: {
    weights: { federal: 2, state: 1, local: 0 },
    why: { federal: 'FEMA and federal disaster declarations run through Washington.', state: 'State emergency management coordinates response and some aid.' },
  },
});

RULES.push({
  // Monetary policy: nobody's state legislator moves interest rates.
  pattern: /federal reserve|\bthe fed\b|interest rates?|rate hikes? by the fed|monetary policy/i,
  guidance: {
    weights: { federal: 2, state: 0, local: 0 },
    why: { federal: 'Monetary policy is the Federal Reserve, overseen by Congress.' },
  },
  exclusive: true,
});

RULES.push({
  // Fire and EMS are local services under state frameworks.
  pattern: /fire department|firefighters?|fire station|\bambulances?\b|\bems\b|paramedics?\b/i,
  guidance: {
    weights: { federal: 0, state: 1, local: 2 },
    why: { local: 'Fire departments and EMS answer to city and county government.' },
  },
});

RULES.push({
  // Naming the local government IS the routing signal.
  pattern: /\bmayor\b|city hall|city council|county commission|town council|board of supervisors|\balderman\b/i,
  guidance: {
    weights: { federal: 0, state: 0, local: 2 },
    why: { local: 'You named your local government — that is who decides this.' },
  },
});

RULES.push({
  // Heating assistance: federal LIHEAP dollars, state-administered.
  pattern: /heating assistance|\bliheap\b|energy assistance program|utility assistance/i,
  guidance: {
    weights: { federal: 2, state: 2, local: 0 },
    why: { federal: 'Congress funds LIHEAP.', state: 'States run the program and set eligibility.' },
  },
});

RULES.push({
  // The drug-policy debate spans federal scheduling and state enforcement.
  pattern: /war on drugs|drug polic(?:y|ies)|decriminaliz/i,
  guidance: {
    weights: { federal: 2, state: 2, local: 0 },
    why: {
      federal: 'Congress controls federal scheduling and sentencing law.',
      state: 'States set their own drug enforcement and treatment policy.',
    },
  },
});

RULES.push({
  // Property/casualty and life insurance lines are regulated by STATE
  // insurance commissioners — Congress has no lever on your car insurance.
  pattern: /car insurance|auto insurance|homeowners? insurance|renters insurance|life insurance/i,
  guidance: {
    weights: { federal: 0, state: 2, local: 0 },
    why: { state: 'State insurance commissioners regulate these insurance lines and their rates.' },
  },
});

RULES.push({
  // National parks are federal land — the city council cannot help.
  pattern: /national parks?|national forest|national monument|public lands|\bnps\b/i,
  guidance: {
    weights: { federal: 2, state: 1, local: 0 },
    why: { federal: 'National parks and public lands are managed by federal agencies Congress funds and oversees.' },
  },
});

const DEFAULT_GUIDANCE: JurisdictionGuidance = {
  weights: { federal: 1, state: 1, local: 0 },
  why: {},
};

/**
 * Best-effort mapping from a free-text issue to the levels of government that
 * handle it. Signal priority: an explicit bill reference beats casework
 * detection beats topic rules beats the default — naming "AB 156" or "my VA
 * claim" says more about the right recipient than any topic word.
 */
export function getJurisdiction(issueText: string): JurisdictionGuidance {
  const text = (issueText || '').trim();
  if (!text) return DEFAULT_GUIDANCE;

  // 1. Explicit bill references: the strongest signal there is. Exclusive —
  // "support AB 156" must not also email Congress, whatever topic words say.
  const refs = detectBillRefs(text);
  if (refs.federal.length > 0 || refs.state.length > 0) {
    return {
      weights: {
        federal: refs.federal.length > 0 ? 2 : 0,
        state: refs.state.length > 0 ? 2 : 0,
        local: 0,
      },
      why: {
        ...(refs.federal.length > 0 ? { federal: `You named a federal bill (${refs.federal[0]}) — that goes to Congress.` } : {}),
        ...(refs.state.length > 0 ? { state: `You named a state bill (${refs.state[0]}) — that goes to your state legislature.` } : {}),
      },
    };
  }

  // 2. Casework: a personal case with an agency routes to the ONE level whose
  // offices actually have caseworkers for it.
  const casework = detectCasework(text);
  if (casework.isCasework && casework.level) {
    return {
      weights: { federal: casework.level === 'federal' ? 2 : 0, state: casework.level === 'state' ? 2 : 0, local: 0 },
      why:
        casework.level === 'federal'
          ? { federal: 'This reads like a personal case with a federal agency — congressional caseworkers handle exactly this.' }
          : { state: 'This reads like a personal case with a state agency — your state legislator’s office can intervene.' },
    };
  }

  // 3. Topic rules: merge EVERY matching rule (max weight per level) instead
  // of stopping at the first hit: "drug costs" is healthcare even though a
  // policing rule also mentions drugs, and "school shooting" is guns AND
  // education. With first-match, rule ORDER silently decided who got the
  // message.
  const matched = RULES.filter((rule) => rule.pattern.test(text));
  if (matched.length === 0) return DEFAULT_GUIDANCE;
  // Idiom-contamination guard: when a federal-exclusive topic matched, other
  // rules may only add state/local weight on MULTIPLE distinct hits — one
  // stray token ("bail on seniors") is noise, two are a real second topic.
  // A "strong" hit means a real second topic, not idiom noise: two distinct
  // word STEMS (farm+farmers is one), an unambiguous topic word from the
  // whitelist, or a federal-program acronym. Bare length was a hole — one
  // 8-char word ("mortgage", "retirement") defeated the exclusive gate.
  const STRONG_TOKENS = /medicaid|insurance|unemployment|student (?:loans?|debt)|child ?care|prescription|property tax/i;
  const STRONG_ACRONYMS = /\b(?:ssi|ssdi|usps|aca|irs|nato|fema|tariffs?)\b/i;
  const hasStrongHit = (re: RegExp, forExclusive = false): boolean => {
    const g = new RegExp(re.source, re.flags.includes('g') ? re.flags : re.flags + 'g');
    const stems = new Set<string>();
    for (const m of text.matchAll(g)) {
      const tok = m[0].trim().toLowerCase();
      if (STRONG_TOKENS.test(tok) || STRONG_ACRONYMS.test(tok)) return true;
      // Long single words ("medicare", "obamacare") activate the exclusive
      // gate, but do NOT let a competing rule punch through it — that
      // asymmetry is the point ("mortgage" must not defeat the Fed rule).
      if (forExclusive && tok.length >= 8) return true;
      if (tok.length >= 5) stems.add(tok.slice(0, 5));
    }
    return stems.size >= 2;
  };

  const hasExclusive = matched.some((r) => r.exclusive && hasStrongHit(r.pattern, true));
  const merged: JurisdictionGuidance = { weights: { federal: 0, state: 0, local: 0 }, why: {} };
  for (const rule of matched) {
    const gated = hasExclusive && !rule.exclusive && !hasStrongHit(rule.pattern);
    for (const level of ['federal', 'state', 'local'] as GovLevel[]) {
      if (gated && level !== 'federal') continue;
      if (rule.guidance.weights[level] > merged.weights[level]) {
        merged.weights[level] = rule.guidance.weights[level];
        if (rule.guidance.why[level]) merged.why[level] = rule.guidance.why[level];
      }
    }
  }
  return merged;
}

/** Did any deterministic signal match (bill ref, casework, or topic rule)?
 * When true, the table is authoritative and AI classification is ignored. */
export function hasJurisdictionRule(issueText: string): boolean {
  const text = (issueText || '').trim();
  if (!text) return false;
  const refs = detectBillRefs(text);
  if (refs.federal.length > 0 || refs.state.length > 0) return true;
  if (detectCasework(text).isCasework) return true;
  return RULES.some((rule) => rule.pattern.test(text));
}

/**
 * The SELECTION policy: which levels actually receive the message. Primary
 * (weight 2) levels only; weight 1 means "shares authority" and is context
 * for the why-lines, NOT a mailing list. This is what put an open-borders
 * message in a state senator's inbox — immigration carries state weight 1
 * for licenses and tuition, and the old policy mailed every level >= 1.
 * Fallback: if nothing is primary, weight-1 levels are better than nobody.
 */
export function selectLevels(guidance: JurisdictionGuidance): GovLevel[] {
  const levels: GovLevel[] = ['federal', 'state', 'local'];
  const primary = levels.filter((l) => guidance.weights[l] === 2);
  if (primary.length > 0) return primary;
  return levels.filter((l) => guidance.weights[l] === 1);
}

/** Clamp an AI-proposed jurisdiction into a valid guidance object, or null
 * if the shape is unusable. Used ONLY when no deterministic rule matched. */
export function sanitizeAiJurisdiction(raw: unknown): JurisdictionGuidance | null {
  const o = raw as Record<string, unknown> | null;
  if (!o || typeof o !== 'object') return null;
  const clamp = (v: unknown): 0 | 1 | 2 => {
    const n = Number(v);
    return n >= 2 ? 2 : n >= 1 ? 1 : 0;
  };
  const weights = { federal: clamp(o.federal), state: clamp(o.state), local: clamp(o.local) };
  if (weights.federal + weights.state + weights.local === 0) return null;
  return { weights, why: {} };
}

export function matchLabelForLevel(guidance: JurisdictionGuidance, level: GovLevel): 'best' | 'also' | 'low' {
  const w = guidance.weights[level];
  return w === 2 ? 'best' : w === 1 ? 'also' : 'low';
}
