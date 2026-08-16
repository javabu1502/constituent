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

export type GovLevel = 'federal' | 'state' | 'local';

export interface JurisdictionGuidance {
  weights: Record<GovLevel, 0 | 1 | 2>;
  /** One-line, plain-language reason per level, shown under section headers. */
  why: Partial<Record<GovLevel, string>>;
}

interface JurisdictionRule {
  pattern: RegExp;
  guidance: JurisdictionGuidance;
}

const RULES: JurisdictionRule[] = [
  {
    pattern: /immigra|border|asylum|visa|daca|refugee|deport|citizenship/i,
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
  },
  {
    pattern: /health|medicaid|insurance|prescription|drug price|mental health|reproductive|abortion|hospital/i,
    guidance: {
      weights: { federal: 2, state: 2, local: 0 },
      why: {
        federal: 'Congress sets national health programs and drug pricing policy.',
        state: 'States run Medicaid, regulate insurers and hospitals, and set many care access laws.',
      },
    },
  },
  {
    pattern: /education|school|student loan|teacher|tuition|college|curriculum|book ban/i,
    guidance: {
      weights: { federal: 1, state: 2, local: 2 },
      why: {
        state: 'States set school funding, standards, and teacher policy — the biggest levers in education.',
        local: 'School boards and local officials decide budgets, curriculum details, and district policy.',
        federal: 'Congress handles student loans and federal education funding.',
      },
    },
  },
  {
    pattern: /climate|environment|clean energy|emission|pollution|epa|renewable|drilling|wildfire/i,
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
    pattern: /gun|firearm|second amendment|shooting|red flag/i,
    guidance: {
      weights: { federal: 1, state: 2, local: 0 },
      why: {
        state: 'Most gun laws (permits, red-flag laws, carry rules) are set at the state level.',
        federal: 'Congress sets background-check and interstate rules.',
      },
    },
  },
  {
    pattern: /housing|rent|homeless|zoning|eviction|mortgage|affordable hous/i,
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
    pattern: /(?<!property )\btax(?!i)|\birs\b|tariff|budget|spending|deficit/i,
    guidance: {
      weights: { federal: 2, state: 2, local: 1 },
      why: {
        federal: 'Federal taxes and the national budget are Congress’s job.',
        state: 'State income and sales tax rules are set by your state legislature.',
      },
    },
  },
  {
    pattern: /veteran|\bva\b|military famil|servicemember/i,
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
    pattern: /police|crime|criminal justice|prison|sentencing|bail|public safety|drug traffick|drug deal|drug abuse|drug overdose|drug epidemic|illegal drug|fentanyl|opioid/i,
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
    pattern: /road|bridge|transit|infrastructure|broadband|highway|rail|traffic|pothole/i,
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
    pattern: /economy|jobs|wage|inflation|worker|labor|union|small business|employment/i,
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
    pattern: /foreign|ukraine|israel|china|nato|war|sanction|trade deal/i,
    guidance: {
      weights: { federal: 2, state: 0, local: 0 },
      why: {
        federal: 'Foreign policy is entirely federal — only your members of Congress have a vote here.',
      },
    },
  },
  {
    pattern: /child care|childcare|family leave|foster|adoption/i,
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
    pattern: /social security|\bssi\b|\bssdi\b|\busps\b|postal service|post office/i,
    guidance: {
      weights: { federal: 2, state: 0, local: 0 },
      why: { federal: 'Social Security and the Postal Service are entirely federal — only Congress can act.' },
    },
  },
  {
    pattern: /property tax/i,
    guidance: {
      weights: { federal: 0, state: 2, local: 2 },
      why: {
        local: 'Property tax rates are set by counties, cities, and school districts.',
        state: 'States set the rules those local rates operate under.',
      },
    },
  },
  {
    pattern: /\bai\b|artificial intelligence|social media|data privacy|big tech|crypto|online safety|deepfake/i,
    guidance: {
      weights: { federal: 2, state: 2, local: 0 },
      why: {
        federal: 'National tech, privacy, and platform rules run through Congress.',
        state: 'States are actively passing their own privacy and online-safety laws.',
      },
    },
  },
  {
    pattern: /farm|agricultur|\bsnap\b|food stamp|food assist|school meal|school breakfast|school lunch|nutrition/i,
    guidance: {
      weights: { federal: 2, state: 2, local: 0 },
      why: {
        federal: 'The Farm Bill, SNAP, and school-meal funding are federal.',
        state: 'States administer the programs and set their own supplements.',
      },
    },
  },
  {
    pattern: /marijuana|cannabis/i,
    guidance: {
      weights: { federal: 1, state: 2, local: 1 },
      why: {
        state: 'Legalization, licensing, and taxation are state decisions.',
        federal: 'Congress controls federal scheduling and banking access.',
      },
    },
  },
  {
    pattern: /utilit|electric bill|power compan|energy bill|water bill|rate hike/i,
    guidance: {
      weights: { federal: 1, state: 2, local: 1 },
      why: { state: 'State utility commissions approve rates and regulate providers.' },
    },
  },
  {
    pattern: /\bdmv\b|driver'?s? licen|professional licen|occupational licen|barber licen|nursing licen/i,
    guidance: {
      weights: { federal: 0, state: 2, local: 0 },
      why: { state: 'Licensing — from driving to professions — is purely state-run.' },
    },
  },
  {
    // The purely local layer: if it involves a truck, a sidewalk, or a park,
    // a US senator cannot help.
    pattern: /trash|garbage|sewer|sidewalk|streetlight|street light|noise complaint|\bparks?\b|library|snow removal|code enforcement|animal control|zoning permit|building permit/i,
    guidance: {
      weights: { federal: 0, state: 1, local: 2 },
      why: {
        local: 'City and county government runs these services directly.',
        state: 'State law sets the framework local governments operate under.',
      },
    },
  },
  {
    pattern: /supreme court|federal judge|judicial nominee|court packing/i,
    guidance: {
      weights: { federal: 2, state: 1, local: 0 },
      why: { federal: 'Federal judges are nominated and confirmed in Washington.' },
    },
  },
  {
    pattern: /senior|aging|nursing home|elder abuse|retirement/i,
    guidance: {
      weights: { federal: 2, state: 2, local: 0 },
      why: {
        federal: 'Social Security and Medicare are federal.',
        state: 'States license and inspect nursing homes and run aging services.',
      },
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
    pattern: /hunting|fishing|wildlife|\bdeer\b|game commission/i,
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
const DEFAULT_GUIDANCE: JurisdictionGuidance = {
  weights: { federal: 1, state: 1, local: 0 },
  why: {},
};

/**
 * Best-effort mapping from a free-text issue to the levels of government that
 * handle it. Falls back to "all levels somewhat relevant" for unknown issues.
 */
export function getJurisdiction(issueText: string): JurisdictionGuidance {
  const text = (issueText || '').trim();
  if (!text) return DEFAULT_GUIDANCE;
  // Merge EVERY matching rule (max weight per level) instead of stopping at
  // the first hit: "drug costs" is healthcare even though a policing rule
  // also mentions drugs, and "school shooting" is guns AND education. With
  // first-match, rule ORDER silently decided who got the message.
  const matched = RULES.filter((rule) => rule.pattern.test(text));
  if (matched.length === 0) return DEFAULT_GUIDANCE;
  const merged: JurisdictionGuidance = { weights: { federal: 0, state: 0, local: 0 }, why: {} };
  for (const rule of matched) {
    for (const level of ['federal', 'state', 'local'] as GovLevel[]) {
      if (rule.guidance.weights[level] > merged.weights[level]) {
        merged.weights[level] = rule.guidance.weights[level];
        if (rule.guidance.why[level]) merged.why[level] = rule.guidance.why[level];
      }
    }
  }
  return merged;
}

/** Did any hand-audited rule match? When true, rules are authoritative and
 * AI classification is ignored — the deterministic table is the guardrail. */
export function hasJurisdictionRule(issueText: string): boolean {
  const text = (issueText || '').trim();
  if (!text) return false;
  return RULES.some((rule) => rule.pattern.test(text));
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
